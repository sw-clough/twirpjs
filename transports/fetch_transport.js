import { IntermediateError, TwirpError, ERROR_CODES } from '../helpers'
import utf8 from '@protobufjs/utf8'
const { SERVER_UNAVAILABLE } = ERROR_CODES

export default function fetchTransportGenerator(twirpURL, options = {}) {
	const { streamingMethods } = options
	return async function(method, requestCtor, responseCtor, request, callback) {
		if (streamingMethods && streamingMethods.includes(method.name)) {
			throw new Error(
				`Twirps do not currently support streaming. See twirpjs's "v6_streams_alpha" branch for an experimental implementation`,
			)
		}

		const endpoint = `${twirpURL}/${method.name}`
		const req = requestCtor.encode(request).finish() // Proto-encode the request
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

		const buf = await resp.arrayBuffer()
		return responseCtor.decode(new Uint8Array(buf))
	} // end transport function
}
