import utf8 from '@protobufjs/utf8'

export const ERROR_CODES = {
	SERVER_UNAVAILABLE: 'server_unavailable',
}

//
// Twirp error helpers
// TODO: Make these less ghastly (e.g. abstract out all the xhr stuff)
//
export function TwirpError(obj) {
	var err = new Error(obj.msg)
	err.meta = obj.meta === undefined ? {} : obj.meta
	err.code = obj.code
	return err
}

export function IntermediateError(xhr, meta = {}) {
	const { status, errorText } = xhr || {}
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
	meta.status  = xhr.status
	meta.url     = xhr._url
	meta.aborted = xhr._aborted
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
