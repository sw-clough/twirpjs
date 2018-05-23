# TwirpJS | A protobuf.js-based twirp client library

[twirp](https://github.com/twitchtv/twirp) is a protobuf-based RPC transport spec with a great golang implementation. This repo aims to be a worthy javascript client implementation, built with [protobuf.js](https://github.com/dcodeIO/protobuf.js)

See the example directory for usage.

Experiments with streaming twirps are happening on the v6_streams_alpha branch.

## Installation and code generation

	# Install gnarbox fork of protobuf.js (PR pending to upstream repo)
	yarn add https://github.com/gnarbox/protobuf.js

	# Generate js protobuf file with protobuf.js's pbjs command
	npx pbjs --target static-module --es6 --keep-case-all <SERVICE>.proto -o <SERVICE>.pb.js

	# Install twirpjs
	yarn add https://github.com/gnarbox/twirpjs

	# Generate twirp file with twirpjs's gen_twirpjs command
	npx gen_twirpjs <SERVICE> > <SERVICE>.twirp.js

And then import the twirp file to create and use a twirp client:

	import { New<SERVICE>Client } from './<SERVICE>.twirp'

	const client = New<SERVICE>Client('http://<HOST_ADDR>')

	// Call rpc methods on client
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

## A note on naming conventions

This repository makes the rather controversial decision to use golang-style naming and formatting, meaning that everything exported by this package is ***TitleCased*** and all .proto-file-based classes, types, and methods keep the same casing as in the source .proto file. Among other things, this makes it easy for twirpjs to generate the correct routes. If you're primarily a javascript developer, this will undoubtably annoy you; for us at GNARBOX though, we've been applying golang conventions across languages wherever we can and have found that it has dramatically disambiguated things and reduced cognitive overhead at language boundaries. Win!

## TODO

- [x] ~~[transports] Create a default promise transport~~
- [x] ~~[example] Create an example react web-app client~~
- [ ] [README] Add warning about how this repo uses a temporary fork of protobufjs for the new "keep-case-all" pbjs flag
- [ ] [tests] Get some coverage going
- [ ] [README] Explain registration and selection of new transport types
- [ ] [transports] Create a nodejs transport
- [ ] [transports] Create an RxJS transport?
