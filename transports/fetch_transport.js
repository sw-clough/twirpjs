import utf8 from '@protobufjs/utf8'
import { concatByteArrays, extractMessages } from '../streaming'
import { IntermediateError, TwirpError, ERROR_CODES, STREAMING_TAGS } from '../helpers'
const { MESSAGE, TRAILER } = STREAMING_TAGS
const { SERVER_UNAVAILABLE } = ERROR_CODES

const log = (...args) => console.log('[twirpjs/fetch_transport]', ...args)

export default function FetchTransportGenerator(twirpURL, options = {}) {
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

		if (!streamingMethods.includes(method.name)) { // unary response
			const buf = await resp.arrayBuffer()
			const respContent = responseCtor.decode(new Uint8Array(buf))
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
		await readFromStream(resp.body.getReader(), responseCtor, callback)
	} // end transport function
}

// TODO: Convert to async generator?
async function readFromStream(reader, responseCtor, callback) {
	while (true) {
		const msg = await reader.read()
		if (msg.done && !msg.value && !reader.leftover) {
			return
		}
		const bb = concatByteArrays(reader.leftover, msg.value)  // Leftover bytes get stashed on the reader
		reader.leftover = null
		for (const protoMsg of extractMessages(bb)) {
			const { msgBytes, isIncomplete } = protoMsg
			if (isIncomplete) {
				reader.leftover = msgBytes // will get prepended to the next arrayBuffer
				break
			}
			callback(responseCtor.decode(msgBytes)) // send the message bytes
		}
	}
} // end readFromStream
