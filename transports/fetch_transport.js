import { IntermediateError, TwirpError, ERROR_CODES, STREAMING_TAGS } from '../helpers'
import utf8 from '@protobufjs/utf8'
const { MESSAGE, TRAILER } = STREAMING_TAGS
const { SERVER_UNAVAILABLE } = ERROR_CODES

const log = (...args) => console.log('[twirpjs/fetch_transport]', ...args)

export default function fetchTransportGenerator(twirpURL, options = {}) {
	const { streamingMethods } = options
	return async function(method, requestCtor, responseCtor, request, callback) {
		// const ll = (...args) => log(`(${method.name})`, ...args)
		const endpoint = `${twirpURL}/${method.name}`
		const req = requestCtor.encode(request).finish()
		// ll(`twirping ${endpoint}`)
		let resp = null
		try {
			resp = await fetch(endpoint, {
				method: 'POST',
				headers: { 'Content-Type': 'application/protobuf' },
				body: req,
			})
		} catch (err) {
			const ee = new Error("fetch failed, likely because the server can't be reached")
			ee.meta = {
				method_name: method.name,
				cause: err,
			}
			ee.code = SERVER_UNAVAILABLE
			throw ee
		}

		if (resp.status !== 200) {
			const err = await resp.json()
			err.meta.method_name = method.name
			throw TwirpError(err)
		}

		if (!streamingMethods.includes(method.name)) {
			const buf = await resp.arrayBuffer()
			const respContent = responseCtor.decode(new Uint8Array(buf))
			// ll(`${method.name} succeeded with response:`, respContent, { resp })
			return respContent
		}

		// This is a streaming endpoint
		if (typeof callback !== 'function') {
			throw new Error(
				'twirpjs fetch transport requires a callback for streaming responses. E.g. client.MethodName(reqObj, resp => { console.log("Received response:", resp) })',
			)
		}
		if (!resp.body || typeof resp.body.getReader !== 'function') {
			throw new Error('twirpjs fetch transport requires Response.body.getReader to be implemented')
		}
		const reader = resp.body.getReader()
		const err = await readFromStream(reader, responseCtor, callback)
		if (err) {
			throw err
		}
	} // end transport function
}

// Streaming response. For reference, see:
// * go client: <service>.twirp.go: protoStreamReader#Read
// * go server: <service>.twirp.go: <service>Server#serve<MethodName>Protobuf
async function readFromStream(reader, responseCtor, callback) {
	// const ll = (...args) => log(`(readFromStream)`, ...args)
	let extra = null
	let missing = null
	while (true) {
		// read loop

		let msg = { value: extra }
		if (!extra || missing) {
			// get more bytes
			try {
				msg = await reader.read()
				if (msg.done && !msg.value) {
					if (!missing) {
						return
					} // stream completed
					const errMsg = 'Stream ended but previous message was incomplete'
					// ll(errMsg, missing)
					const err = new IntermediateError(null, {
						message: errMsg,
						incompleteDataFromPreviousRead: missing,
					})
					return err
				}
			} catch (err) {
				err.meta = err.meta || {}
				err.meta.incompleteDataFromPreviousRead = missing
				err.meta.cause = err.message
				err.message = 'failed to read from stream'
				// ll(err.message, err.meta.cause)
				return err
			}
			if (missing) {
				msg.value = [...missing, ...msg.value]
			}
			missing = null
			extra = null
		}

		// const hexbuf = ToHexArray(msg.value)
		const msgLen = msg.value[1]
		const justTrailer = msg.value[0] === TRAILER
		const hasMessage = msg.value[0] === MESSAGE
		const hasExtra = justTrailer || msg.value.length > msgLen + 2 // Sometimes the trailer is included with the last message
		const hasMissing = !msgLen || msg.value.length < msgLen + 2 // Sometimes a message gets cut in half
		// const hasTrailer = justTrailer || msg.value.length > msgLen + 2
		if (!hasMessage && !hasExtra) {
			return IntermediateError(null, { message: "Can't decode: data is neither a message nor a trailer" })
		}

		if (hasMissing) {
			// Message is incomplete, get the rest
			missing = msg.value
			continue
		}

		if (justTrailer) {
			// Return trailer
			reader.cancel()
			const len = msg.value[1] // [0]=TRAILER, [1]=length [2...]=twirpError
			const errStr = utf8.read(msg.value.slice(2), 0, len)
			if (errStr.match(/^EOF$/)) {
				return null
			}
			return TwirpError(JSON.parse(errStr))
		}

		let trailer = null
		if (hasExtra) {
			trailer = msg.value.slice(msgLen + 2)
			msg.value = msg.value.slice(0, msgLen + 2)
		}

		const respContent = responseCtor.decodeDelimited(new Uint8Array(msg.value.slice(1)))
		callback(respContent)
		extra = trailer
	} // end read loop
} // end readFromStream
