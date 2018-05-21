import NewTwirpClient from 'twirpjs'
import { twirper } from './twirper.pb'

/**
 * Create a new twirper.Twirper client (or retrieve previous instance if it exists)
 */
export function NewTwirperClient(hostURL, opts = {}) {
	return NewTwirpClient(hostURL, {
		serviceRoute: 'twirper.Twirper',
		serviceClass: twirper.Twirper,
		streamingMethods: null,
		...opts
	})
}

