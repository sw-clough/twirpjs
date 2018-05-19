#!/usr/bin/env node
'use strict';

const program = require('commander')
const protobuf = require('protobufjs')

const
	Type      = protobuf.Type,
	Service   = protobuf.Service,
	Method    = protobuf.Method,
	Enum      = protobuf.Enum,
	Namespace = protobuf.Namespace,
	util      = protobuf.util

// const log = (...args) => console.log('[gen_twirpjs]', ...args)

let protos = []
program
	.version('0.0.1', '-v, --version')
	.usage('<protofile ...>')
	.arguments('<protofiles...>')
	.action(protofiles => { protos = protofiles })
	.parse(process.argv)

const
	root = new protobuf.Root().loadSync(protos, { keepCase: true }).resolveAll(),
	out = []

let indent = 0
const codeLine = line => {
	if (line === '') { return out.push('') }
	let ind = ''
	for (let i = 0; i < indent; ++i) { ind += "\t" }
	return out.push(ind + line)
}

const codeComment = lines => {
	const split = []
	for (let i = 0; i < lines.length; ++i) {
		if (lines[i] === null) { continue }
		Array.prototype.push.apply(split, lines[i].split(/\r?\n/g))
	}
	codeLine('/**')
	split.forEach(line => {
		if (line === null) return
		codeLine(' * ' + line.replace(/\*\//g, '* /'))
	})
	codeLine(' */')
}

/**
 * Begin code generation
 */
codeLine(`import NewTwirpClient from 'twirpjs'`)

// Import pb.js files
for (const nn of root.nestedArray) {
	if (!(nn instanceof Namespace)) { continue }
	codeLine(`import { ${nn.name} } from './${nn.name}.pb'`)
}
codeLine(``)

// Create a new-client function for each service
for (const n of root.nestedArray) {
	const nn = n.name
	for (const s of n.nestedArray) {
		if (!(s instanceof Service)) { continue }
		const ss = s.name
		const streamers = []
		for (const mm in s.methods) {
			const m = s.methods[mm]
			if (m && m.responseStream) {
				streamers.push(mm)
			}
		}
		codeComment([
			`Create a new ${nn}.${ss} client (or retrieve previous instance if it exists)`,
		])
		codeLine(`export function New${ss}Client(hostURL, opts = {}) {`)
			++indent
			codeLine(`return NewTwirpClient(hostURL, {`)
				++indent
				codeLine(`serviceRoute: '${nn}.${ss}',`)
				codeLine(`serviceClass: ${nn}.${ss},`)
				codeLine(`streamingMethods: ${streamers.length > 0 ? JSON.stringify(streamers) : 'null'},`)
				codeLine(`...opts`)
				--indent
			codeLine(`})`)
			--indent
		codeLine(`}`)
		codeLine(``)
	}
}

// Output the generated code to stdout
console.log(out.join("\n"))
