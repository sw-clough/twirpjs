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
		this.callRepeat = this.callRepeat.bind(this)
		this.callRepeatHeavy = this.callRepeatHeavy.bind(this)
		this.callRepeatErrorAfter = this.callRepeatErrorAfter.bind(this)
		this.callBadRoute = this.callBadRoute.bind(this)
		this.callBadHost = this.callBadHost.bind(this)
		this._clearPreviousResps = this._clearPreviousResps.bind(this)
		this._callRepeat = this._callRepeat.bind(this)
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

	async callRepeat() {
		const repeats = 10
		await this._callRepeat({
			Message: `This message should be repeated ${repeats} times`,
			NumRepeats: repeats,
			DelayMs: 200,
		})
	}
	async callRepeatErrorAfter() {
		await this._callRepeat({
			Message: `This message should be repeated four times and then followed by an error`,
			NumRepeats: 10,
			DelayMs: 200,
			ErrAfter: 4,
		})
	}
	async callRepeatHeavy() {
		await this._callRepeat(
			{
				Message: 'No delay, lots of repeats',
				NumRepeats: 30000,
				DelayMs: 0,
			},
			3000,
		)
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
			throw new Error('callBadRoute should have errored')
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
			throw new Error('callBadHost should have errored')
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

	async _callRepeat(req, filterMod) {
		const ll = (...args) => log('(callRepeat)', ...args)
		this._clearPreviousResps()
		const startedAt = new Date()
		try {
			await this.twirperClient.Repeat(req, resp => {
				resp.key = ++this.respCounter
				if (!filterMod || resp.ID % filterMod === 0) {
					const elapsedSec = (new Date() - startedAt) / 1000
					const respsPerSec = resp.ID / elapsedSec
					// ll('Received response:', resp)
					this.setState(state => ({ resps: [...state.resps, resp], respsPerSec }))
				}
			})
			ll('Repeat completed')
		} catch (err) {
			console.error('Repeat failed:', err)
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
				respsPerSec: null,
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
		const { resps, oldResps, respsPerSec } = this.state
		return (
			<div className="App" style={{ backgroundColor: 'lightgray', overflow: 'auto', padding: 20 }}>
				<button onClick={this.callEcho}><h2>Call Echo</h2></button>
				<button onClick={this.callRepeat}><h2>Call Repeat</h2></button>
				<button onClick={this.callRepeatHeavy}><h2>Call Repeat (heavy load)</h2></button>
				<button onClick={this.callRepeatErrorAfter}><h2>Call Repeat (server error after 4 resps)</h2></button>
				<button onClick={this.callBadRoute}><h2>Call a bad route</h2></button>
				<button onClick={this.callBadHost}><h2>Call a bad host url</h2></button>
				{respsPerSec && <pre>Responses per second: {respsPerSec.toFixed(1)}</pre>}
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
