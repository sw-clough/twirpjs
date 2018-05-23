export * from './helpers'
export * from './core'
export * from './streaming'
import NewTwirpClient, { RegisterTransportGenerator } from './core'
import FetchTransportGenerator from './transports/fetch_transport'

export default NewTwirpClient

//
// Register built-in transports
//
RegisterTransportGenerator({
	name: 'FETCH',
	setAsDefault: true,
	generator: FetchTransportGenerator,
})
