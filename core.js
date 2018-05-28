import { rpc } from 'protobufjs/minimal'

// TODO: Rename generator to factory throughout?

// TwirpJS transports override protobuf.js's implementation of "rpcCall", the original implementation
// is saved as the transport type 'ORIGINAL' and requires use of the createRpcImpl option
const ORIGINAL = 'ORIGINAL'
export const TransportGenerators = {
	[ORIGINAL]: (origRpcCall => {
		return (twirpURL, opts) => origRpcCall
	})(rpc.Service.prototype.rpcCall), // capture rpcCall in case it gets altered
}
export const TRANSPORT_TYPES = { ORIGINAL }
TRANSPORT_TYPES.DEFAULT = ORIGINAL // can be overridden by RegisterTransportGenerator()

// Register a TransportGenerator
// Generator signature: (twirpURL, options) => (method, requestCtor, responseCtor, request, callback)
export function RegisterTransportGenerator({ name, generator, setAsDefault }) {
	if (TRANSPORT_TYPES[name] === name) {
		throw new Error(`A twirpjs transport generator has already been registered for the type ${name}`)
	}
	TRANSPORT_TYPES[name] = name
	if (setAsDefault) {
		TRANSPORT_TYPES.DEFAULT = name
	}
	TransportGenerators[name] = generator
}

export default function NewTwirpClient(hostURL, options = {}) {
	const {
		serviceRoute, // required
		serviceClass, // required
		transportType, // (optional) one of TRANSPORT_TYPES
		createRpcImpl, // required when using TRANSPORT_TYPE.ORIGINAL (protobuf.js-style transport)
	} = options
	const twirpURL = `${hostURL}/twirp/${serviceRoute}`
	const rpcImpl =
		typeof createRpcImpl === 'function'
			? createRpcImpl(twirpURL, options)
			: () => {
					throw new Error(
						`Current transport type ${transportType || 'DEFAULT'} requires the createRpcImpl option`,
					)
				}
	const client = serviceClass.create(rpcImpl, /* req delimited */ false, /* resp delimited */ false)
	client.rpcCall = GetRpcCall(twirpURL, options) // Override protobuf.js's implementation of rpcCall
	return client
}

export function GetRpcCall(twirpURL, opts = {}) {
	const { transportType } = opts
	const tt = transportType || TRANSPORT_TYPES.DEFAULT
	if (typeof TransportGenerators[tt] !== 'function') {
		throw new Error(`Unsupported rpc transport type: ${tt}`)
	}
	return TransportGenerators[tt](twirpURL, opts)
}
