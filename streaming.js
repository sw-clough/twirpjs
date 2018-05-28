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

export const EOF = 'EOF'

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

export function parseTwirpError(byteArray) {
	const errStr = utf8.read(byteArray, 0, byteArray.length)
	if (errStr.match(/^EOF$/)) {
		return EOF
	}
	// Received a (twirp) error. Decode it, throw it downstream, and shut everything down
	let err
	try {
		err = TwirpError(JSON.parse(errStr))
	} catch (decodeErr) {
		err = IntermediateError(null, {
			message: `unable to parse error string "${errStr}": ${decodeErr.message}`,
			errorString: errStr,
			cause: decodeErr,
		})
	}
	return err
}

/**
 * Creates a proto message with a buffer, length, and incompleteness status
 * @param {Uint8Array} msgBytes
 * @param {bool} isIncomplete
 */
function ProtoMsg(msgBytes, isIncomplete) {
	this.msgBytes = msgBytes
	this.isIncomplete = isIncomplete
}

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
				// buffer: new Uint8Array(arrayBuf, rr.pos, rr.length - rr.pos),
			})
		}
		if (rr.pos >= rr.len) {
			// Dangling tag, yield it as an incomplete message and return
			// TODO: Test this!
			yield new ProtoMsg(new Uint8Array([ msgTag ]), true /* isIncomplete */)
			return
		}

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
			const bb = new Uint8Array(arrayBuf, msgStartPos)
			const err = parseTwirpError(bb)
			if (err === EOF) {
				return // We're all done
			}
			throw err
		}

		try {
			// Decode the message and send it downstream
			yield new ProtoMsg(new Uint8Array(arrayBuf, msgStartPos, msgLen))
			rr.pos = msgEndPos // update reader position
		} catch (err) {
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
