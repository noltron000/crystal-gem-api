import assert from 'node:assert/strict'
import { once } from 'node:events'
import { mock } from 'node:test'
import app from '../../config/express.mjs'
import worker from '../../../cloudflare/worker.mjs'
import { useTestServer } from './test-helpers.mjs'

describe('App and proxy', () => {
	const request = useTestServer()

	it('serves the home page and static assets', async () => {
		const home = await request('/')
		assert.equal(home.status, 200)
		const html = await home.text()
		assert.ok(html.includes(`href='${app.locals.basePath}/style.css'`))
		assert.ok(html.includes(`href='${app.locals.basePath}/gem'`))
		assert.ok(html.includes("class='home-banner'"))
		assert.ok(html.includes(`src='${app.locals.basePath}/crystal-gems.jpg'`))
		const css = await request('/style.css')
		assert.equal(css.status, 200)
		assert.match(css.headers.get('content-type'), /^text\/css/)
		await css.text()
		const image = await request('/crystal-gems.jpg')
		assert.equal(image.status, 200)
		assert.match(image.headers.get('content-type'), /^image\/jpeg/)
		await image.arrayBuffer()
	})

	it('serves pages and assets under a configured base path', async () => {
		const original = process.env.PUBLIC_BASE_PATH
		process.env.PUBLIC_BASE_PATH = '/crystal-gem-api'
		let prefixedApp
		try {
			const module = await import('../../config/express.mjs?prefixed-test')
			prefixedApp = module.default
		} finally {
			if (original === undefined) delete process.env.PUBLIC_BASE_PATH
			else process.env.PUBLIC_BASE_PATH = original
		}
		const server = prefixedApp.listen(0, '127.0.0.1')
		try {
			await once(server, 'listening')
			const origin = `http://127.0.0.1:${server.address().port}`
			const home = await fetch(`${origin}/crystal-gem-api/`)
			assert.equal(home.status, 200)
			const html = await home.text()
			assert.ok(html.includes("href='/crystal-gem-api/style.css'"))
			assert.ok(html.includes("src='/crystal-gem-api/crystal-gems.jpg'"))
			const css = await fetch(`${origin}/crystal-gem-api/style.css`)
			assert.equal(css.status, 200)
			await css.text()
			const root = await fetch(`${origin}/`)
			assert.equal(root.status, 404)
			await root.text()
		} finally {
			server.closeAllConnections()
			await new Promise((resolve, reject) => server.close((err) => {
				if (err) reject(err)
				else resolve()
			}))
		}
	})

	it('forwards only app paths to Render, preserving request details', async () => {
		const fetchMock = mock.method(globalThis, 'fetch', async () => new Response('ok'))
		const original = new Request('https://projects.example/crystal-gem-api/gem?sort=name', {
			method: 'POST',
			headers: { 'content-type': 'text/plain' },
			body: 'example',
		})
		const response = await worker.fetch(original, { RENDER_ORIGIN: 'https://render.example' })
		assert.equal(await response.text(), 'ok')
		const forwarded = fetchMock.mock.calls[0].arguments[0]
		assert.equal(forwarded.url, 'https://render.example/crystal-gem-api/gem?sort=name')
		assert.equal(forwarded.method, 'POST')
		assert.equal(forwarded.headers.get('content-type'), 'text/plain')
		assert.equal(await forwarded.text(), 'example')

		const unrelated = new Request('https://projects.example/crystal-gem-api-other')
		await worker.fetch(unrelated, { RENDER_ORIGIN: 'https://render.example' })
		assert.equal(fetchMock.mock.calls[1].arguments[0], unrelated)
	})
})
