import { rpc } from 'protobufjs/minimal'

// Debugging helpers - hex stringifiers
export const ToHex = (x) => '0x' + ('00' + x.toString(16)).slice(-2)
export const ToHexArray = (arr) => Array.prototype.map.call(arr, ToHex).join(' ')

// TwirpJS transports override protobuf.js's implementation of "rpcCall",
// the original implementation is saved as the transport type 'ORIGINAL'
const ORIGINAL = 'ORIGINAL'
export const TransportGenerators = {
	[ORIGINAL]: (origRpcCall => {
		return (twirpURL, opts) => origRpcCall
	})(rpc.Service.prototype.rpcCall) // capture rpcCall in case it gets altered
}
export const TRANSPORT_TYPES = { ORIGINAL }
TRANSPORT_TYPES.DEFAULT = ORIGINAL // can be overridden by RegisterTransportGenerator()

// Register a TransportGenerator
// Generator signature: (twirpURL, options) => (method, requestCtor, responseCtor, request, callback)
export function RegisterTransportGenerator({ name, generator, setAsDefault }) {
	TRANSPORT_TYPES[name] = name
	if (setAsDefault) { TRANSPORT_TYPES.DEFAULT = name }
	TransportGenerators[name] = generator
}

const _clients = {} // cache for clients that have already been created
export default function NewTwirpClient(hostURL, options = {}) {
	const {
		serviceRoute, serviceClass, // required
		transportType,    // (optional) one of TRANSPORT_TYPES
		createRpcImpl,    // required when using TRANSPORT_TYPE.ORIGINAL
	} = options
	const clientKey = `${transportType}:${hostURL}/${serviceRoute}` // for caching the client
	if (_clients[clientKey]) { return _clients[clientKey] }
	const twirpURL = `${hostURL}/twirp/${serviceRoute}`
	const rpcImpl = typeof createRpcImpl === 'function'
		? createRpcImpl(twirpURL, options)
		: () => { throw(new Error(`Current transport type ${transportType || 'DEFAULT'} requires the createRpcImpl option`)) }
	client = serviceClass.create(rpcImpl)
	client.rpcCall = GetRpcCall(twirpURL, options)
	_clients[clientKey] = client
	return client
}

export function GetRpcCall(twirpURL, opts = {}) {
	const { transportType } = opts
	const tt = transportType || TRANSPORT_TYPES.DEFAULT
	if (typeof TransportGenerators[tt] !== 'function') { throw(new Error(`Unsupported rpc transport type: ${tt}`)) }
	return TransportGenerators[tt](twirpURL, opts)
}
