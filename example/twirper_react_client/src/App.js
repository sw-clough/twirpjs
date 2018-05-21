import './App.css'
import React, { Component } from 'react'
import { NewTwirperClient } from './twirper.twirp'

const log = (...args) => console.log('[App.js]', ...args)

class App extends Component {
	constructor() {
		super()
		this.respCounter = 0
		this.twirperClient = NewTwirperClient('http://localhost:8888')
		this.state = { resps: [], oldResps: [] }

		this.callEcho = this.callEcho.bind(this)
		this.callBadRoute = this.callBadRoute.bind(this)
		this.callBadHost = this.callBadHost.bind(this)
		this._clearPreviousResps = this._clearPreviousResps.bind(this)
		this._pushError = this._pushError.bind(this)
	}

	async callEcho() {
		const ll = (...args) => log('(callEcho)', ...args)
		this._clearPreviousResps()
		try {
			const resp = await this.twirperClient.Echo({ Message: 'Echo?' })
			resp.key = ++this.respCounter
			ll('Echo response:', resp)
			this.setState(state => ({ resps: [...state.resps, resp] }))
		} catch (err) {
			console.error('Echo failed:', err.message, { err })
			this._pushError(err)
		}
	}

	async callBadRoute() {
		const client = NewTwirperClient('http://localhost:8888/not/a/valid/route')
		const ll = (...args) => log('(callBadRoute)', ...args)
		this._clearPreviousResps()
		try {
			const resp = await client.Echo({ Message: 'Is any server out there?' })
			resp.key = ++this.respCounter
			ll('BadRoute response:', resp)
			this.setState(state => ({ resps: [...state.resps, resp] }))
			throw new Error('callBadRoute should have errored!')
		} catch (err) {
			if (err.code === 'bad_route') {
				err.message = 'BadRoute failed as expected: ' + err.message
				ll(err.message, { err })
			} else {
				err.message = 'BadRoute failed but not for the expected reason: ' + err.message
				console.error(err.message, { err })
			}
			this._pushError(err)
		}
	}

	async callBadHost() {
		const client = NewTwirperClient('http://badhost:282347')
		const ll = (...args) => log('(callBadHost)', ...args)
		this._clearPreviousResps()
		try {
			const resp = await client.Echo({ Message: 'Is any server out there?' })
			resp.key = ++this.respCounter
			ll('BadHost response:', resp)
			this.setState(state => ({ resps: [...state.resps, resp] }))
			throw new Error('callBadHost should have errored!')
		} catch (err) {
			if (err.code === 'server_unavailable') {
				err.message = 'BadHost failed as expected: ' + err.message
				ll(err.message, { err })
			} else {
				err.message = 'BadHost failed but not for the expected reason: ' + err.message
				console.error(err.message, { err })
			}
			this._pushError(err)
		}
	}

	_clearPreviousResps() {
		this.setState(state => {
			const resps = state.resps.map(rr => {
				rr.opacity = 0.2
				return rr
			})
			if (resps.length) {
				resps[0].clear = 'left'
			}
			return {
				resps: [],
				oldResps: [...resps, ...state.oldResps],
			}
		})
	}

	_pushError(err) {
		this.setState(state => ({
			resps: [
				...state.resps,
				{ error: err.message, meta: err.meta, code: err.code, key: ++this.respCounter },
			],
		}))
	}

	render() {
		const { resps, oldResps } = this.state
		return (
			<div className="App" style={{ backgroundColor: 'lightgray', overflow: 'auto', padding: 20 }}>
				<button onClick={this.callEcho}><h2>Call Echo</h2></button>
				<button onClick={this.callBadRoute}><h2>Call a bad route</h2></button>
				<button onClick={this.callBadHost}><h2>Call a bad host url</h2></button>
				<Responses resps={[...resps, ...oldResps]} />
			</div>
		)
	}
}

const Responses = ({ resps, style }) => (
	<div style={{ clear: 'both', width: '100%', textAlign: 'center', marginTop: 20 }}>
		{resps.map(resp => (
			<pre
				key={`resp-${resp.key}`}
				style={{
					fontSize: '9pt',
					float: 'left',
					backgroundColor: resp.error && !resp.error.match(/failed as expected/) ? '#c41' : '#444',
					color: 'white',
					padding: '5px',
					margin: '5px',
					textAlign: 'left',
					transition: 'all .7s ease-out',
					opacity: resp.opacity || 1.0,
					clear: resp.clear || 'auto',
					...(style || {}),
				}}
			>
				{JSON.stringify(resp, null, 3)}
			</pre>
		))}
	</div>
)

export default App
