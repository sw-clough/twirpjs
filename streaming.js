import utf8 from '@protobufjs/utf8'
import { Reader } from 'protobufjs/minimal'
import {
	ToHex,
	ToHexArray,
	TwirpError,
	IntermediateError,
	TwirpErrorFromXHR,
	STREAMING_TAGS,
	XHR_READYSTATE,
} from './helpers'
const { MESSAGE, TRAILER, MAX_LEN } = STREAMING_TAGS

/**
 * @param {Uint8Array} aa
 * @param {Uint8Array} bb
 * @returns {Uint8Array}
 */
export function concatByteArrays(aa, bb) {
	if (!aa || !aa.length) { return bb }
	if (!bb || !bb.length) { return aa }
	const cc = new Uint8Array(aa.length + bb.length)
	cc.set(aa, 0)
	cc.set(bb, aa.length)
	return cc
}

log = (...args) => console.log('[twirpjs/decode]', ...args)

/*
function _next(arrayBuf) {
	const abort = false
	const extractor = extractMessages(arrayBuf)
	while (true) {
		if (abort) { extractor.return(); break }
		let extraction
		try { extraction = extractor.next(abort) }
		catch (err) { return handleError(err) }
		if (extraction.done) { break }
		const protoMsg = extraction.value
		// NB: Separate paths for incomplete vs complete buffers
		if (protoMsg.isIncomplete) { return handleIncomplete(protoMsg.buffer) }
		handleMessage(protoMsg.buffer)
	}
	// // // Shorter, non-abortable version...
	// // try {
	// for (const message [in/of?!] extractMessages(arrayBuf) {
	// 	if (message.isIncomplete) {
	// 		leftover = message.buffer
	// 		break
	// 	}
	// 	// decode message.buffer
	// }
	// // } catch (err) {}
}
*/

/**
 * Creates a proto message with a buffer, length, and incompleteness status
 * @param {Uint8Array} msgBytes
 * @param {bool} isIncomplete
 */
function ProtoMsg(msgBytes, isIncomplete) {
	this.msgBytes = msgBytes
	this.isIncomplete = isIncomplete
}

// /**
//  * Note:
//  *   The extractor uses ArrayBuffers for input and output instead
//  *   of Uint8Array because multiple data views (Uint8Arrays) can
//  *   be created efficiently from an ArrayBuffer, but not from a
//  *   Uint8Array
//  */
export function* extractMessages(byteArray) {
	const arrayBuf = byteArray.buffer
	const rr = new Reader(byteArray)
	rr.pos = byteArray.byteOffset // Reader doesn't check byteOffset so we set pos manually
	while (true) {
		// Process field tag
		const tagStartPos = rr.pos
		const msgTag = rr.int32()
		if (msgTag !== MESSAGE && msgTag !== TRAILER) {
			// Not a valid twirp stream response! Any number of things could be going wrong
			// We'this.log try decoding to a string (because what else are we going to do?)
			const errStr = utf8.read(rr.buffer, rr.pos, rr.length - rr.pos)
			throw IntermediateError(null, {
				message: 'received data that appears to not be part of a twirp stream',
				responseText: errStr,
				buffer: bb,
			})
		}
		if (rr.pos >= rr.len) {
			// Dangling tag, yield it as an incomplete message and return
			// TODO: Test this!
			yield new ProtoMsg(new Uint8Array([ msgTag ]), true /* isIncomplete */)
			return
		}
		// const delimStartPos = rr.pos

		// Read message length
		const msgLen = rr.int32()
		const msgStartPos = rr.pos
		if (msgLen > MAX_LEN) {
			throw IntermediateError(null, {
				message: `received a message that is way too huge (>1GiB): ${msgLen}`,
			})
		}
		const msgEndPos = rr.pos + msgLen
		const leftInBuffer = rr.len - rr.pos

		// Check for incomplete message
		if (msgLen > leftInBuffer) { // Message is incomplete, yield it and return
			yield new ProtoMsg(
				new Uint8Array(arrayBuf, tagStartPos), // everything since the start of this message
				true, // isIncomplete
			)
			return
		}

		if (msgTag === TRAILER) {
			// Trailers are either "EOF" or a json-encoded twirp error
			// const errStr = utf8.read(bb.slice(msgStartPos), 0, msgLen)
			const bb = new Uint8Array(arrayBuf, msgStartPos)
			const errStr = utf8.read(bb, 0, bb.length)
			this.log('Got a trailer:', errStr, ToHexArray(bb), { msgStartPos, msgLen, bbLen: bb.length })
			if (errStr.match(/^EOF$/)) {
				return // We're all done
			}
			// Received a (twirp) error. Decode it, throw it downstream, and shut everything down
			let err
			try {
				err = TwirpError(JSON.parse(errStr))
			} catch (decodeErr) {
				err = IntermediateError(null, {
					message: `unable to parse trailer: ${decodeErr.message}`,
					trailer: errStr,
					cause: decodeErr,
				})
			}
			throw err
		}

		try {
			// Decode the message and send it downstream
			yield new ProtoMsg(new Uint8Array(arrayBuf, msgStartPos, msgLen))
			rr.pos = msgEndPos // update reader position
		} catch (err) {
			// this.log('Decode failed', err, { aa }, ToHexArray(aa), {
			// 	msgLen, leftInBuffer, msgEndPos, readerLen: rr.len, readerPos: rr.pos,
			// 	bbLength: bb.length, bb: ToHexArray(bb),
			// })
			throw IntermediateError(null, {
				message: `unable to parse message: ${err.message}`,
				cause: err,
			})
		}

		if (rr.pos >= rr.len) { // that was the last message
			return
		}

		// There's some bits leftover so we're going for another loop
	}
}


// class StreamingTwirpMessageExtractor {
// 	constructor() {
// 		this.leftover = null // ArrayBuffer
// 		this.log = (...args) => log('{StreamingTwirpMessageExtractor}', ...args)
// 	}
//
// 	/**
// 	 * Extracts a single protobuf message from a twirp stream (note: does not decode it)
// 	 * @function
// 	 * @param {ArrayBuffer} buf A source for the binary protobuf message to decode
// 	 // * @returns { {leftover} }
// 	 // * @throws {Error} If `source` is not a valid type
// 	 */
// 	ExtractMessageFromBuffer(buf) {
// 		const ll = (lggr, ...args) => this.log('(ExtractMessageFromBuffer)', ...args)
// 		if (!buf || !buf.length) {
// 			const errMsg = 'received an empty buffer'
// 			ll('ERROR': errMsg)
// 			throw new Error(errMsg)
// 		}
//
// 		const bb = concatBuffers(this.leftover, buf)
// 	}
//
// }
//
//
// // /**
// //  * @classdesc Container a message extracted from a twirp stream, plus a Reader for any bits leftover
// //  * @param {Uint8Array} Message The extracted proto message
// //  * @param {Reader|null} Reader A protobuf.js reader pointing to any leftover data from the stream
// //  */
// // class StreamingProtoMessages {
// // 	/**
// // 	 * Constructs a new StreamingProtoMessage
// // 	 * @constructor
// // 	 * @param {Uint8Array} message The extracted proto message
// // 	 * @param {Reader|null} leftover A protobuf.js reader pointing to any leftover data from the stream
// // 	 */
// // 	constructor(message, leftover) {
// // 		this.Message = message
// // 		this.Reader = leftover
// // 	}
// //
// // 	/**
// // 	 * Returns the leftover data as a Uint8Array
// // 	 * @function
// // 	 * @returns {Uint8Array|null} An array of leftover data, or null if there are no leftovers
// // 	 */
// // 	Leftovers() {
// // 		if (!this.Reader) { return null }
// // 		if (this.Reader.pos >= this.Reader.len) { return null }
// // 		return new Uint8Array(
// // 			this.Reader.buffer.slice(
// // 				this.Reader.pos,
// // 				this.Reader.len - this.Reader.pos,
// // 			)
// // 		)
// // 	}
// // }
// //
// // /**
// //  * Extracts a single protobuf message from a twirp stream (note: does not decode it)
// //  * @function
// //  * @param {Reader|Uint8Array|ArrayBuffer} source A source for the binary protobuf message to decode
// //  * @returns {StreamingProtoMessage}
// //  * @throws {Error} If `source` is not a valid type
// //  */
// // export function ExtractProtoMessage(source) {
// // 	if (source instanceof Reader) {
// // 		return decodeWithReader(source)
// // 	}
// // 	if (source instanceof Uint8Array) {
// // 		return decodeWithBuffer(source)
// // 	}
// // 	if (source instanceof TypedArray) {
// // 		return decodeWithBuffer(new Uint8Array(source))
// // 	}
// // 	throw new Error('message source must be a protobuf.js Reader, a Uint8Array, or a TypedArray')
// // }
// //
// // function decodeWithReader(rr) {
// // }
// //
// // function decodeWithBuffer(buffer) {
// // 	// TODO: check if buffer has a byteOffset, and if Reader respects it
// // 	return decodeWithReader(new Reader(buffer))
// // }
