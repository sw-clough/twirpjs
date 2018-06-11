# TwirpJS | A protobuf.js-based twirp client library

[twirp](https://github.com/twitchtv/twirp) is a protobuf-based RPC transport spec with a great golang implementation. This project is built on the [protobuf.js](https://github.com/dcodeIO/protobuf.js) library and aims to be a worthy javascript twirp client implementation.

At the moment it provides two transport APIs: a fetch-based promise interface (the default), and an XHR-based RxJS observable transport. See the example directory for detailed usage.

Experiments with streaming twirps are happening on the v6_streams_alpha branch.

## Installation and code generation

	# Install gnarbox fork of protobuf.js so auto-routing works
	# (PR pending to upstream repo: https://github.com/dcodeIO/protobuf.js/pull/1054)
	yarn add https://github.com/gnarbox/protobuf.js

	# Generate js protobuf file with protobuf.js's pbjs command
	npx pbjs --target static-module --es6 --keep-case-all <SERVICE>.proto -o <SERVICE>.pb.js

	# Install twirpjs
	yarn add https://github.com/gnarbox/twirpjs

	# Generate twirp file with twirpjs's gen_twirpjs command
	npx gen_twirpjs <SERVICE> > <SERVICE>.twirp.js

## Usage

Once your service's .twirp.js file has been generated, you can import the twirp file to create and use a twirp client. Casing for services, methods, messages, and fields follows spelling in the .proto file.

	import { New<SERVICE>Client } from './<SERVICE>.twirp'

	const client = New<SERVICE>Client('http://<HOST_ADDR>')

### Using the default fetch-based transport

	// Call rpc method on client
	try {
		const req = { <RequestFieldA>: <ValueA>, <RequestFieldB>: <ValueB> }
		const resp = await client.<MethodName>(req)
		console.log('received a response:', resp)
	} catch (err) {
		console.error('request failed:', err)
	}

	// Call rpc methods with streaming responses
	try {
		const req = { <RequestFieldA>: <ValueA>, <RequestFieldB>: <ValueB> }
		await client.<MethodName>(req, resp => {
			console.log('received a streamed response:', resp)
		})
	} catch (err) {
		console.error('request failed:', err)
	}

### Using the [RxJS](https://github.com/ReactiveX/rxjs) Observable transport

The observable transport is not automatically loaded. You can use it like this:

	//
	// Register the transport once when your application loads
	//
	import { registerTransportGenerator } from 'twirpjs'
	import createObservableTransport from 'twirpjs/transports/rxjs_transport'
	registerTransportGenerator({
		name: 'OBSERVABLE',
		setAsDefault: true, // optional
		generator: createObservableTransport,
	})

	//
	// Elsewhere in your app...
	//
	import { TRANSPORT_TYPES } from 'twirpjs' // only required if transport was not registered as default
	import { finalize } from 'rxjs/operators' // or whatever operators you want
	import { New<SERVICE>Client } from './<SERVICE>.twirp'

	const client = New<SERVICE>Client(
		'http://<HOST_ADDR>',
		{ transportType: TRANSPORT_TYPES.RXJS }, // matches "name" field in register call, only required if transport was not registered as default
	)

	const req = { <RequestFieldA>: <ValueA>, <RequestFieldB>: <ValueB> }
	const subscription = client.<MethodName>(req)
		.pipe(
			// rxjs operators go here, e.g...
			finalize(() => { console.log('<MethodName> ended, either successfully or due to error') }),
		)
		.subscribe(
			resp => { console.log('response:', resp) },
			err  => { console.error('error:', err) },
			()   => { console.log('completed') }
		)

	// All the usual rxjs goodness applies. E.g. to abort, you can...
	//   + use rxjs's "takeUntil" and cohorts inside the pipe function
	//   + call subscription.unsubscribe()

### JavaScript support for streaming responses

For rpc methods with streaming responses, the built-in transports use fetch's `Response.body.getReader` function, which is implemented by some but not all runtimes. See [getReader#Browser_compatibility](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream/getReader#Browser_compatibility) for information on which browsers are covered.

React Native's fetch is a wrapper around its own implementation of the XHR spec and does not include support for streaming arrayBuffers, but support can be achieved in iOS with the experimental [react-native-streaming-xhr](https://github.com/gnarbox/react-native-streaming-xhr) repository, which is a fork of RN's Network library that adds an implementation of the now-deprecated `moz-chunked-arraybuffer` responseType and enables twirp streams with the `createObservableXHRTransport` transport generator (via a forked version of RxJS's AjaxObservable). Android support is in the works.

## TODO

- [x] ~~[transports] Create a default fetch-based promise transport~~
- [x] ~~[transports] Create an RxJS transport~~
- [x] ~~[example] Create an example react web-app client~~
- [ ] [tests] Get some coverage going
- [ ] [README] Explain transport registration and use of custom transports
- [ ] [README] Explain options argument of new client function, including 'transportType' and 'fetchOptions' field
- [ ] [transports] Create a nodejs transport
- [ ] [typing] Evaluate feasibility of flow and/or TypeScript support
