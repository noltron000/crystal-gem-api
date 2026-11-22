import { once } from 'node:events'
import { mock } from 'node:test'
import app from '../../config/express.mjs'

export function useTestServer() {
	let server
	let origin

	before(async () => {
		server = app.listen(0, '127.0.0.1')
		await once(server, 'listening')
		origin = `http://127.0.0.1:${server.address().port}${app.locals.basePath}`
	})

	afterEach(() => mock.restoreAll())
	after(async () => {
		server.closeAllConnections()
		await new Promise((resolve, reject) => server.close((err) => {
			if (err) reject(err)
			else resolve()
		}))
	})

	return (path, options = {}) => fetch(`${origin}${path}`, {
		redirect: 'manual',
		...options,
	})
}

export function json(method, body) {
	return {
		method,
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(body),
	}
}
