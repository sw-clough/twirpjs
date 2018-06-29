#!/usr/bin/env node
// Based on https://github.com/dcodeIO/protobuf.js/blob/6.8.6/cli/targets/static.js
//
// Original work Copyright (c) 2016, Daniel Wirtz  All rights reserved.
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are
// met:
//
// * Redistributions of source code must retain the above copyright
//   notice, this list of conditions and the following disclaimer.
// * Redistributions in binary form must reproduce the above copyright
//   notice, this list of conditions and the following disclaimer in the
//   documentation and/or other materials provided with the distribution.
// * Neither the name of its author, nor the names of its contributors
//   may be used to endorse or promote products derived from this software
//   without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
// LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
// A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
// OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
// LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
// DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
// THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
// OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
// ---
//
// Code generated by the command line utilities is owned by the owner
// of the input file used when generating it. This code is not
// standalone and requires a support library to be linked with it. This
// support library is itself covered by the above license.
//
// https://github.com/dcodeIO/protobuf.js/blob/6.8.6/cli/LICENSE
//
// ---
//
// Modified work Copyright (c) 2018 MyGnar, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// 	http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

const version = '0.0.5'

const program = require('commander')
const protobuf = require('protobufjs')
const fs = require('fs')
const path = require('path')

const
	Type      = protobuf.Type,
	Service   = protobuf.Service,
	Method    = protobuf.Method,
	Enum      = protobuf.Enum,
	Namespace = protobuf.Namespace,
	util      = protobuf.util

let protos = []
program
	.version(version, '-v, --version')
	.usage('[-j] [-r] <protofile ...>')
	.option('-j, --java [src_dir]', 'Generate code for java client')
	.option('-r, --react_native', 'Generate code for react-native android module')
	.option('-s, --swift [dest_dir]', 'Generate code for swift client')
	.arguments('<protofiles...>')
	.action(protofiles => { protos = protofiles })
	.parse(process.argv)

const
	root = new protobuf.Root().loadSync(protos, { keepCase: true }).resolveAll(),
	protoNames = protos.map(pp => pp.replace(/.*\//, '')).join(', ')
let out = []

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

const mkdirSync = dirPath => {
	try {
		fs.mkdirSync(path.resolve(dirPath))
	} catch (err) {
		if (err.code !== 'EEXIST') throw err
	}
}
const mkdirpSync = dirPath => {
	const parts = dirPath.split(path.sep)
	for (let ii = 1; ii <= parts.length; ii++) {
		mkdirSync(path.join.apply(null, parts.slice(0, ii)))
	}
}

// const

const L = codeLine
const C = codeComment
const generatedBy = () => {
	L(`// Code generated by gen_twirpjs v${version}, DO NOT EDIT.`)
	L(`// source: ${protoNames}`)
}

/**
 * Begin code generation
 */
if (program.swift) {
	if (!fs.existsSync(program.swift)) {
		mkdirpSync(program.swift)
		if (!fs.existsSync(program.swift)) {
			throw new Error(`Failed to create ${program.swift}`)
		}
		console.log(`Created ${program.swift}`)
	}

	for (const n of root.nestedArray) {
		const nn = n.name
		for (const s of n.nestedArray) {
			if (!(s instanceof Service)) { continue }
			generatedBy()
			L(``)
			L(`import Foundation`)
			L(`import RxSwift`)
			L(`import SwiftProtobuf`)
			L(``)

			const Nn = nn.replace(/^\w/, c => c.toUpperCase()) // uppercase first letter of namespace
			const ss = s.name
			const Ss = ss.replace(/^\w/, c => c.toUpperCase()) // uppercase first letter of service name
			const svcRoute = `/twirp/${nn}.${ss}`
			const clientClass = `${Ss}Client`
			C([ `${clientClass} implements a twirp client for ${nn}.${ss}` ])
			L(`public class ${clientClass}: NSObject {`)
				++indent
				L(`public static let protoNamespace = "${nn}"`)
				L(`public static let protoService = "${ss}"`)
				L(`private let url: String`)
				L(``)
				L(`public init(url: String) {`)
					++indent
					L(`self.url = url + "${svcRoute}"`)
					L(`super.init()`)
					--indent
				L(`}`)
				L(``)

				for (const mm in s.methods) {
					const m = s.methods[mm]
					const isRespStreaming = !!m.responseStream
					let reqType = `${Nn}_${m.requestType}`
					let respType = `${Nn}_${m.responseType}`
					if (m.requestType.match(/\./)) {
						reqType = m.requestType
							.replace(/^\w/, c => c.toUpperCase())
							.replace(/\./, '_')
					}
					if (m.responseType.match(/\./)) {
						respType = m.responseType
							.replace(/^\w/, c => c.toUpperCase())
							.replace(/\./, '_')
					}
					L(`func ${mm}(_ req: ${reqType}) -> Observable<${respType}> {`)
						++indent
						L(`let url = self.url + "/${mm}";`)
						L(`let ioSched = SerialDispatchQueueScheduler(qos: .background)`)
						L(`return GBXTwirp().twirp(url: url, reqMsg: req, isRespStreaming: ${isRespStreaming})`)
							++indent
							L(`.subscribeOn(ioSched)`)
							L(`.decodeMessage(${respType}.self)`)
							--indent
						--indent
					L(`}`)
					L(``)
				} // end methods
				--indent
			L(`} // end class ${clientClass}`)
			L(``)
			let svcFile = `${program.swift}/${clientClass}.swift`
			fs.writeFileSync(svcFile, out.join("\n"), err => { throw err })
			out = []
			console.log(`Wrote ${svcFile}`)

			if (!program.react_native) {
				continue
			}

			//
			// iOS react native module
			//
			// <Namespace>_<Service>Manager.swift
			//
			generatedBy()
			L(``)
			L(`import Foundation`)
			L(`import RxSwift`)
			L(``)
			const { java_package: pkg, java_outer_classname: protoClass } = n.options
			const mgmtClassSwift = `${Nn}_${Ss}Manager`
			C([ `${mgmtClassSwift} implements an RN twirp module for ${nn}.${ss}` ])
			L(`@objc(${mgmtClassSwift})`)
			L(`class ${mgmtClassSwift}: RNEventEmitter {`)
				++indent
				L(`private static var reqID = 0`)
				L(`private var subs: [String: Disposable] = [:]`)
				L(``)
				L(`override init() {`)
					++indent
					L(`super.init()`)
					L(`EventEmitter.sharedInstance.registerEventEmitter(eventEmitter: self)`)
					--indent
				L(`}`)
				L(``)
				L(`@objc open override func supportedEvents() -> [String] {`)
					++indent
					L(`return [`)
						++indent
						for (const mm in s.methods) {
							L(`"${pkg}.${nn}.${ss}.${mm}",`)
						}
						--indent
					L(`]`)
					--indent
				L(`}`)

				for (const mm in s.methods) {
					const m = s.methods[mm]
					const isRespStreaming = !!m.responseStream
					let reqType = `${Nn}_${m.requestType}`
					let respType = `${Nn}_${m.responseType}`
					if (m.requestType.match(/\./)) {
						reqType = m.requestType
							.replace(/^\w/, c => c.toUpperCase())
							.replace(/\./, '_')
					}
					if (m.responseType.match(/\./)) {
						respType = m.responseType
							.replace(/^\w/, c => c.toUpperCase())
							.replace(/\./, '_')
					}
					L(`@objc func ${mm}(`)
						++indent
						L(`_ url: String,`)
						L(`withReqBase64 reqBase64: String,`)
						L(`resolver resolve: RCTPromiseResolveBlock,`)
						L(`rejecter reject: RCTPromiseRejectBlock`)
						--indent
					L(`) -> Void {`)
						++indent
						L(`${mgmtClassSwift}.reqID += 1`)
						L(`let eventName = "${pkg}.${nn}.${ss}.${mm}"`)
						L(`let rID = "\\(eventName).\\(${mgmtClassSwift}.reqID)"`)
						L(`let taskID: [String: Any] = [`)
							++indent
							L(`"eventName": eventName,`)
							L(`"id": ${mgmtClassSwift}.reqID,`)
							--indent
						L(`]`)
						L(`let url = url + "/twirp/${nn}.${ss}/${mm}"`)
						L(`let reqMsg: ${reqType}`)
						L(`do {`)
							++indent
							L(`reqMsg = try ${reqType}(serializedData: Data(base64Encoded: reqBase64)!)`)
							L(`resolve(taskID) // TODO: Resolve earlier (never reject)`)
							--indent
						L(`} catch let err {`)
							++indent
							L(`reject("Malformed request", "Not a valid base64-encoded ${reqType}", err)`)
							L(`return`)
							--indent
						L(`}`)
						L(``)
						L(`let ioSched = SerialDispatchQueueScheduler(qos: .background)`)
						L(`let sub = GBXTwirp().twirp(url: url, reqMsg: reqMsg, isRespStreaming: ${!!m.responseStream})`)
							++indent
							L(`.subscribeOn(ioSched)`)
							L(`.subscribe { event in`)
								++indent
								L(`var resp: [String: Any] = ["id": ${mgmtClassSwift}.reqID]`)
								L(`switch event {`)
								L(`case .next(let msgBytes):`)
									++indent
									L(`let next: [String: Any] = [`)
										++indent
										L(`"sizeBytes": msgBytes.count,`)
										L(`"dataBase64": msgBytes.base64EncodedString(),`)
										--indent
									L(`]`)
									L(`resp["next"] = next`)
									L(`self.sendEvent(withName: eventName, body: resp)`)
									--indent
								L(`case .error(let err as NSError):`)
									++indent
									L(`// TODO: Get GBXTwirpError going`)
									L(`let ui = err.userInfo`)
									L(`let msg = err.localizedDescription`)
									L(`let errMap: [String: Any] = [`)
										++indent
										L(`"msg": msg,`)
										L(`"code": ui["code"] == nil ? "internal" : ui["code"]!,`)
										L(`"meta": ui["meta"] == nil ? ["cause": "unknown"] : ui["meta"]!,`)
										--indent
									L(`]`)
									L(`resp["error"] = errMap`)
									L(`self.sendEvent(withName: eventName, body: resp)`)
									--indent
								L(`case .completed:`)
									++indent
									L(`//print(TAG, rID, "**** COMPLETED")`)
									L(`resp["completed"] = true`)
									L(`self.sendEvent(withName: eventName, body: resp)`)
									--indent
								L(`}`)
								--indent
							L(`} // end .subscribe`)
							--indent
						L(`self.subs[rID] = sub`)
						--indent
					L(`} // end ${ss}.${mm}`)
					L(``)
					L(`@objc func Abort${mm}(`)
						++indent
						L(`_ reqID: Int,`)
						L(`resolver resolve: RCTPromiseResolveBlock,`)
						L(`rejecter reject: RCTPromiseRejectBlock`)
						--indent
					L(`) -> Void {`)
						++indent
						L(`let eventName = "${pkg}.${nn}.${ss}.${mm}"`)
						L(`let rID = "\\(eventName).\\(reqID)"`)
						L(`if let sub = self.subs.removeValue(forKey: rID) {`)
							++indent
							L(`sub.dispose()`)
							L(`resolve(nil)`)
							L(`return`)
							--indent
						L(`}`)
						L(`// print("GBX:AbortCopy", "ERROR", "Unable to abort, subscription #\\(reqID) not found")`)
						L(`reject(`)
							++indent
							L(`"Unable to abort, subscription not found",`)
							L(`"No subscription exists for \\(rID)",`)
							L(`NSError(domain: eventName, code: -444, userInfo: [NSLocalizedDescriptionKey: "Unable to abort, subscription #\\(reqID) not found"])`)
							--indent
						L(`)`)
						--indent
					L(`} // end ${ss}.Abort${mm}`)
					L(``)
				} // end foreach rpc method
				--indent
			L(`} // end class ${mgmtClassSwift}`)
			L(``)
			svcFile = `${program.swift}/${mgmtClassSwift}.swift`
			fs.writeFileSync(svcFile, out.join("\n"), err => { throw err })
			out = []
			console.log(`Wrote ${svcFile}`)

			//
			// <Namespace>_<Service>Manager.m
			//
			generatedBy()
			L(``)
			L(`#import <Foundation/Foundation.h>`)
			L(`#import <React/RCTBridgeModule.h>`)
			L(`#import <React/RCTEventEmitter.h>`)
			L(``)
			L(`@interface RCT_EXTERN_MODULE(${mgmtClassSwift}, RCTEventEmitter)`)
			L(``)
			for (const mm in s.methods) {
				L(`RCT_EXTERN_METHOD(${mm}:(NSString)url withReqBase64:(NSString)reqBase64 resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)`)
				L(`RCT_EXTERN_METHOD(Abort${mm}:(int)reqID resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)`)
			}
			L(``)
			L(`@end`)
			svcFile = `${program.swift}/${mgmtClassSwift}.m`
			fs.writeFileSync(svcFile, out.join("\n"), err => { throw err })
			out = []
			console.log(`Wrote ${svcFile}`)

		} // end foreach service
	} // end foreach namespace
} // end if swift

if (program.java) {
	const getImports = (n, s) => {
		const nn = n.name
		const ss = s.name
		// Find imported protos
		const imports = {
			typeMap: {},
			pkgMap: {},
		}
		for (const mm in s.methods) {
			const m = s.methods[mm]
			for (const rr of [m.requestType, m.responseType]) {
				let pkgMatch = rr.match(/^.*\./)
				if (!pkgMatch || !pkgMatch.length || !pkgMatch[0].length) {
					imports.typeMap[rr] = rr
					continue
				}
				const otherPkgName = pkgMatch[0].substr(0, pkgMatch[0].length -1)
				const otherPkg = root.nested[otherPkgName]
				if (!otherPkg || !otherPkg.options) {
					throw new Error(`${nn}.${ss}.${mm} uses ${rr} but ${otherPkgName} package cannot be found`)
				}
				const { java_package: otherPkgRoot, java_outer_classname: otherPkgClass } = otherPkg.options
				const otherRrClass = rr.substring(pkgMatch[0].length)
				imports.typeMap[rr] = `${otherPkgClass}.${otherRrClass}`
				if (!imports.pkgMap[otherPkgName]) {
					imports.pkgMap[otherPkgName] = `import ${otherPkgRoot}.${otherPkgClass};`
				}
			}
		}
		return imports
	}

	//
	// Generate Java client
	//
	const dirStat = fs.statSync(program.java)
	if (!dirStat.isDirectory()) {
		console.error(`--java arg "${program.java}" must be a directory`)
		process.exit(100)
	}

	for (const n of root.nestedArray) {
		const { java_package: pkg, java_outer_classname: protoClass } = n.options
		const pkgDir = `${program.java}/${pkg.replace(/\./g, '/')}`
		if (!fs.existsSync(pkgDir)) {
			mkdirpSync(pkgDir)
			if (!fs.existsSync(pkgDir)) {
				throw new Error(`Failed to create ${pkgDir}`)
			}
			console.log(`Created ${pkgDir}`)
		}
		const nn = n.name
		for (const s of n.nestedArray) {
			if (!(s instanceof Service)) { continue }
			const imports = getImports(n, s)
			generatedBy()
			L(``)
			L(`package ${pkg};`)
			L(``)
			L(`import com.google.protobuf.InvalidProtocolBufferException;`)
			L(`import io.reactivex.Flowable;`)
			L(`import io.reactivex.schedulers.Schedulers;`)
			L(`import com.gnarbox.twirp.GBXTwirp;`)
			L(`import com.gnarbox.twirp.GBXTwirpError;`)
			L(`import ${pkg}.${protoClass}.*;`)
			for (const pkgName in imports.pkgMap) {
				L(imports.pkgMap[pkgName])
			}
			L(``)

			const Nn = nn.replace(/^\w/, c => c.toUpperCase()) // uppercase first letter of namespace
			const ss = s.name
			const Ss = ss.replace(/^\w/, c => c.toUpperCase()) // uppercase first letter of service name
			const svcRoute = `/twirp/${nn}.${ss}`
			const clientClass = `${Ss}Client`
			const rnModuleName = `${Nn}_${Ss}Manager`
			C([ `${clientClass} implements a twirp client for ${nn}.${ss}` ])
			L(`public class ${clientClass} {`)
				++indent
				L(`public static final String protoNamespace = "${nn}";`)
				L(`public static final String protoService = "${ss}";`)
				L(`private final String url;`)
				L(``)
				L(`public ${clientClass}(String url) {`)
					++indent
					L(`this.url = url + "${svcRoute}";`)
					--indent
				L(`}`)
				L(``)

				for (const mm in s.methods) {
					const m = s.methods[mm]
					const isRespStreaming = !!m.responseStream
					const reqType = imports.typeMap[m.requestType]
					const respType = imports.typeMap[m.responseType]
					L(`public Flowable<${respType}> ${mm}(${reqType} req) {`)
						++indent
						L(`final String url = this.url + "/${mm}";`)
						L(`return GBXTwirp.twirp(url, req, ${isRespStreaming})`)
							++indent
							L(`.subscribeOn(Schedulers.io())`)
							L(`.map(msgBytes -> {`)
								++indent
								L(`try {`)
									++indent
									L(`${respType} resp = ${respType}.parseFrom(msgBytes);`)
									L(`return resp;`)
									--indent
								L(`} catch (InvalidProtocolBufferException err) {`)
									++indent
									L(`throw new GBXTwirpError("Failed to decode ${respType}", err);`)
									--indent
								L(`}`)
								--indent
							L(`});`)
							--indent
						--indent
					L(`}`)
					L(``)
				} // end methods
				--indent
			L(`} // end class ${clientClass}`)
			L(``)
			const svcFile = `${pkgDir}/${clientClass}.java`
			fs.writeFileSync(svcFile, out.join("\n"), err => { throw err })
			out = []
			console.log(`Wrote ${svcFile}`)

			if (!program.react_native) {
				continue
			}

			//
			// Generate RN service package
			//
			const pkgClass = `${Ss}Package`
			const moduleClass = `${Ss}Module`
			generatedBy()
			L(`package ${pkg};`)
			L(``)
			L(`import java.util.Arrays;`)
			L(`import java.util.Collections;`)
			L(`import java.util.List;`)
			L(`import com.facebook.react.ReactPackage;`)
			L(`import com.facebook.react.bridge.NativeModule;`)
			L(`import com.facebook.react.bridge.ReactApplicationContext;`)
			L(`import com.facebook.react.uimanager.ViewManager;`)
			L(`import com.facebook.react.bridge.JavaScriptModule;`)
			L(``)
			L(`public class ${pkgClass} implements ReactPackage {`)
				++indent
				L(`@Override`)
				L(`public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {`)
					++indent
					L(`return Arrays.<NativeModule>asList(new ${moduleClass}(reactContext));`)
					--indent
				L(`}`)
				L(``)
				L(`// Deprecated from RN 0.47`)
				L(`public List<Class<? extends JavaScriptModule>> createJSModules() {`)
					++indent
					L(`return Collections.emptyList();`)
					--indent
				L(`}`)
				L(``)
				L(`@Override`)
				L(`public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {`)
					++indent
					L(`return Collections.emptyList();`)
					--indent
				L(`}`)
				--indent
			L(`}`)
			L(``)
			// Write package file
			const pkgFile = `${pkgDir}/${pkgClass}.java`
			fs.writeFileSync(pkgFile, out.join("\n"), err => { throw err })
			out = []
			console.log(`Wrote ${pkgFile}`)

			//
			// Generate RN service module
			//
			generatedBy()
			L(`package ${pkg};`)
			L(``)
			L(`import android.annotation.SuppressLint;`)
			L(`import android.util.Base64;`)
			L(`import android.util.Log;`)
			L(`import java.util.Iterator;`)
			L(`import io.reactivex.schedulers.Schedulers;`)
			L(`import com.facebook.react.bridge.Arguments;`)
			L(`import com.facebook.react.bridge.ReactApplicationContext;`)
			L(`import com.facebook.react.bridge.ReactContextBaseJavaModule;`)
			L(`import com.facebook.react.bridge.ReactMethod;`)
			L(`import com.facebook.react.bridge.Promise;`)
			L(`import com.facebook.react.bridge.WritableMap;`)
			L(`import com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter;`)
			L(`import com.google.protobuf.InvalidProtocolBufferException;`)
			L(`import com.gnarbox.twirp.GBXTwirp;`)
			L(`import com.gnarbox.twirp.GBXTwirpError;`)
			L(`import com.gnarbox.api.${protoClass}.*;`)
			for (const pkgName in imports.pkgMap) {
				L(imports.pkgMap[pkgName])
			}
			L(``)
			L(`public class ${moduleClass} extends ReactContextBaseJavaModule {`)
				++indent
				L(`private static int reqID = 0;`)
				L(`private final ReactApplicationContext reactContext;`)
				L(``)
				L(`// Constructor`)
				L(`public ${moduleClass}(ReactApplicationContext reactContext) {`)
					++indent
					L(`super(reactContext);`)
					L(`this.reactContext = reactContext;`)
					--indent
				L(`}`)
				L(``)
				L(`@Override`)
				L(`public String getName() { return "${rnModuleName}"; }`)
				L(``)
				L(`private static void sendError(RCTDeviceEventEmitter emitter, String eventName, int id, Throwable err) {`)
				L(`	WritableMap resp = Arguments.createMap();`)
				L(`	resp.putInt("id", id);`)
				L(`	WritableMap ee = Arguments.createMap();`)
				L(`	WritableMap meta = Arguments.createMap();`)
				L(`	if (err instanceof GBXTwirpError) {`)
				L(`		GBXTwirpError twerr = (GBXTwirpError) err;`)
				L(`		ee.putString("code", twerr.code);`)
				L(`		ee.putString("msg", twerr.msg);`)
				L(`		Iterator<String> keys = twerr.meta.keySet().iterator();`)
				L(`		while (keys.hasNext()) {`)
				L(`			String key = keys.next();`)
				L(`			meta.putString(key, twerr.meta.get(key).toString());`)
				L(`		}`)
				L(`	} else {`)
				L(`		ee.putString("code", "internal");`)
				L(`		ee.putString("msg", err.getMessage());`)
				L(`		meta.putBoolean("unhandled", true);`)
				L(`	}`)
				L(`	ee.putMap("meta", meta);`)
				L(`	resp.putMap("error", ee);`)
				L(`	emitter.emit(eventName, resp);`)
				L(`}`)
				L(``)

				for (const mm in s.methods) {
					const m = s.methods[mm]
					const isRespStreaming = !!m.responseStream
					const reqType = imports.typeMap[m.requestType]
					const respType = imports.typeMap[m.responseType]
					L(`@SuppressLint("CheckResult")`)
					L(`@ReactMethod`)
					L(`public void ${mm}(String url, String reqBase64, Promise promise) {`)
						++indent
						L(`// let the js client know which events to listen for`)
						L(`final String eventName = "${pkg}.${nn}.${ss}.${mm}";`)
						L(`final int reqID = ++${moduleClass}.reqID;`)
						L(`WritableMap taskID = Arguments.createMap();`)
						L(`taskID.putString("eventName", eventName);`)
						L(`taskID.putInt("id", reqID);`)
						L(`promise.resolve(taskID);`)
						L(``)
						L(`final String _url = url + "${svcRoute}/${mm}";`)
						L(`final RCTDeviceEventEmitter emitter = this.reactContext.getJSModule(RCTDeviceEventEmitter.class);`)
						L(`final ${reqType} req;`)
						L(`try {`)
							++indent
							L(`req = ${reqType}.parseFrom(Base64.decode(reqBase64, Base64.DEFAULT));`)
							--indent
						L(`} catch (Exception err) {`)
							++indent
							L(`Log.e("${ss}", "(${mm}) Request is not a valid protobuf", err);`)
							L(`${moduleClass}.sendError(emitter, eventName, reqID, new GBXTwirpError("Request is not a valid base64-encoded ${reqType} protobuf string", err));`)
							L(`return;`)
							--indent
						L(`}`)
						L(`GBXTwirp.twirp(_url, req, ${isRespStreaming})`)
							++indent
							L(`.subscribeOn(Schedulers.io())`)
							L(`.subscribe(`)
								++indent
								L(`msgBytes -> {`)
									++indent
									// L(`Log.i("${ss}", "(${mm}) Received bytes: " + msgBytes.length);`)
									L(`WritableMap resp = Arguments.createMap();`)
									L(`resp.putInt("id", reqID);`)
									L(`WritableMap next = Arguments.createMap();`)
									L(`next.putInt("sizeBytes", msgBytes.length);`)
									L(`next.putString("dataBase64", Base64.encodeToString(msgBytes, Base64.NO_WRAP));`)
									L(`resp.putMap("next", next);`)
									L(`emitter.emit(eventName, resp);`)
									--indent
								L(`},`)
								L(`err -> {`)
									++indent
									L(`Log.w("${ss}", "Received an error from ${mm}", err);`)
									L(`${moduleClass}.sendError(emitter, eventName, reqID, err);`)
									--indent
								L(`},`)
								L(`() -> {`)
									++indent
									// L(`Log.i("${ss}", "(${mm}) Completed");`)
									L(`WritableMap resp = Arguments.createMap();`)
									L(`resp.putInt("id", reqID);`)
									L(`resp.putBoolean("completed", true);`)
									L(`emitter.emit(eventName, resp);`)
									--indent
								L(`}`)
								--indent
							L(`);`)
							--indent
						--indent
					L(`}`)
					L(``)
				} // end methods

				--indent
			L(`} // end class ${moduleClass}`)
			L(``)
			// Write module file
			const moduleFile = `${pkgDir}/${moduleClass}.java`
			fs.writeFileSync(moduleFile, out.join("\n"), err => { throw err })
			out = []
			console.log(`Wrote ${moduleFile}`)
		} // end foreach service
	} // end foreach namespace
	return
}

//
// Generate JS client
//
generatedBy()
L(`import { NativeModules, Platform } from 'react-native'`)
L(`import TwirpObservable from 'react-native-twirp'`)
// Import js proto definition and native client implementation
for (const n of root.nestedArray) {
	const nn = n.name
	if (!(n instanceof Namespace)) { continue }
	L(`import { ${nn} } from './${nn}.pb'`)
	const { java_package: pkg } = n.options
	for (const s of n.nestedArray) {
		if (!(s instanceof Service)) { continue }
		const Nn = nn.replace(/^\w/, c => c.toUpperCase()) // uppercase first letter of namespace
		const ss = s.name
		const Ss = ss.replace(/^\w/, c => c.toUpperCase()) // uppercase first letter of service name for new client func
		const rnModuleName = `${Nn}_${Ss}Manager`
		const nativeClient = `native${Ss}Client`
		L(`const ${nativeClient} = NativeModules['${rnModuleName}']`)
	}
}
// Create a new-client function for each service
for (const n of root.nestedArray) {
	const nn = n.name
	for (const s of n.nestedArray) {
		if (!(s instanceof Service)) { continue }
		const ss = s.name
		const Ss = ss.replace(/^\w/, c => c.toUpperCase()) // uppercase first letter of service name for new client func
		const clientClass = `${Ss}Client`
		const nativeClient = `native${Ss}Client`
		L(``)
		L(`export class ${clientClass} {`)
			++indent
			L(`constructor(hostURL) { this.url = hostURL }`)
			L(``)
			for (const mm in s.methods) {
				const m = s.methods[mm]
				const isRespStreaming = !!m.responseStream
				L(`${mm} = reqObj => new TwirpObservable({`)
					++indent
					L(`hostURL: this.url,`)
					L(`nativeClient: ${nativeClient},`)
					L(`rpcName: '${mm}',`)
					L(`request: reqObj,`)
					L(`reqType: ${nn}.${m.requestType},`)
					L(`respType: ${nn}.${m.responseType},`)
					--indent
				L(`})`)
				L(``)
			}
			--indent
		L(`}`)
		L(``)
	}
}

// Output the generated code to stdout
console.log(out.join("\n"))
