# TwirpJS | A protobuf.js-based twirp client library

[twirp](https://github.com/twitchtv/twirp) is a protobuf-based RPC transport spec with a great golang implementation. This repo aims to be a worthy javascript client implementation, built with [protobuf.js](https://github.com/dcodeIO/protobuf.js)

See the example directory and [react-native-streaming-xhr](https://github.com/gnarbox/react-native-streaming-xhr) for usage

## Usage

	# Install twirpjs module
	yarn add https://github.com/gnarbox/twirpjs

	# Generate js protobuf file
	npx pbjs --target static-module --es6 --keep-case <SERVICE>.proto -o <SERVICE>.pb.js

	# Generate twirp file
	npx gen_twirpjs <SERVICE> > <SERVICE>.twirp.js

And then import the twirp file to create and use a twirp client:

	import { New<SERVICE>Client } from './<SERVICE>.twirp'

	const client = New<SERVICE>Client('http://<HOST_ADDR>')

	// Call rpc methods on client
	// The return value of the rpc method depends on transport implementation

## TODO

- [ ] [README] Explain registration and selection of transportType
- [ ] [example] Create an example react web-app client
- [ ] [transports] Create a default promise transport
- [ ] [transports] Create a nodejs transport
- [ ] [transports] Create RxJS transports?
