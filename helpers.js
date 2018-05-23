import utf8 from '@protobufjs/utf8'

// Debugging helpers - hex stringifiers
export const ToHex = x => '0x' + ('00' + x.toString(16)).slice(-2)
export const ToHexArray = arr => Array.prototype.map.call(arr, ToHex).join(' ')

// XHR status-to-string and string-to-status map
const XHR_READYSTATE = {}
for (let kk of ['UNSENT', 'OPENED', 'HEADERS_RECEIVED', 'LOADING', 'DONE']) {
	XHR_READYSTATE[XMLHttpRequest[kk]] = kk
	XHR_READYSTATE[kk] = XMLHttpRequest[kk]
}
export { XHR_READYSTATE }

/**
 * Streaming tags. For reference see:
 *   + go client: <service>.twirp.go: protoStreamReader#Read
 *   + go server: <service>.twirp.go: <service>Server#serve<MethodName>Protobuf
 */
export const STREAMING_TAGS = {
	MESSAGE: (1 << 3) | 2, // key for streaming message field #1, length-delimited
	TRAILER: (2 << 3) | 2, // key for streaming message field #2, length-delimited
	MAX_LEN: (1 << 21),    // 1 GiB
}

// TODO: Add full list of twirp error codes
export const ERROR_CODES = {
	SERVER_UNAVAILABLE: 'server_unavailable',
}

/**
 * Twirp error helpers
 * TODO: Make these less ghastly (e.g. abstract out all the xhr stuff)
 */
export function TwirpError(obj) {
	var err = new Error(obj.msg)
	err.meta = obj.meta === undefined ? {} : obj.meta
	err.code = obj.code
	return err
}

export function IntermediateError(xhr, meta = {}) {
	const { status, errorText, _url, _aborted } = xhr || {}
	const { message, msg } = meta || {}
	let mm = ' cause unknown'
	if (errorText || message || msg) {
		mm = ' '
	}
	if (errorText) {
		mm += errorText
		if (message || msg) {
			mm += ', '
		}
	}
	mm += message || msg || ''
	if (status) {
		mm += ` (httpstatus=${status})`
	}
	meta.status  = status
	meta.url     = _url
	meta.aborted = _aborted
	return TwirpError({
		code: 'internal',
		msg: mm,
		meta,
	})
}

// Read twirp Error implementation
export const TwirpErrorFromXHR = xhr => {
	let obj = {}
	try {
		const buf = new Uint8Array(xhr.response)
		const jstr = utf8.read(buf, 0, buf.length)
		console.log('(TwirpErrorFromXHR)', jstr)
		obj = JSON.parse(jstr)
	} catch (err) {
		return IntermediateError(xhr, {
			msg: 'Unable to read/decode error response: ' + err.message,
			cause: err,
		})
	}
	if (!obj.code || !obj.msg) {
		return IntermediateError(xhr, { msg: 'Received a non-twirp-style error', obj })
	}
	obj.meta = obj.meta || {}
	obj.meta.status = xhr.status // TODO: twirp code to HTTP status
	obj.meta.url = xhr._url
	obj.meta.aborted = xhr._aborted
	console.log('(TwirpErrorFromXHR) final', obj)
	return TwirpError(obj)
}
