import assert from 'node:assert/strict'
import { mock } from 'node:test'
import Gem from './gem-model.mjs'
import Fusion from '../fusion/fusion-model.mjs'
import app from '../../config/express.mjs'
import { json, useTestServer } from '../tests/test-helpers.mjs'

describe('Gem routes', () => {
	const request = useTestServer()
	const id = 'aaaaaaaaaaaaaaaaaaaaaaaa'
	const gem = { _id: id, name: 'Ruby', weapon: 'Gauntlets', power: 'Heat' }

	it('validates required gem fields', async () => {
		await new Gem(gem).validate()
		await assert.rejects(new Gem({ name: 'Ruby' }).validate(), { name: 'ValidationError' })
	})

	it('shows the index, JSON collection, and creation form', async () => {
		const gems = [{ ...gem, fusions: [{ name: 'Garnet' }] }]
		mock.method(Gem, 'find', () => Object.assign([...gems], {
			populate: async () => gems,
		}))

		const index = await request('/gem')
		assert.equal(index.status, 200)
		assert.ok((await index.text()).includes(`href='${app.locals.basePath}/gem/${id}'`))

		const collection = await request('/gem/json')
		assert.equal(collection.status, 200)
		assert.equal((await collection.json()).gems[0].fusions[0].name, 'Garnet')

		const form = await request('/gem/new')
		assert.equal(form.status, 200)
		assert.ok((await form.text()).includes(`action='${app.locals.basePath}/gem'`))
	})

	it('shows a gem, its JSON, and its edit form', async () => {
		mock.method(Gem, 'findById', async () => ({
			...gem,
			fusions: [{ name: 'Garnet' }],
			populate: async () => {},
		}))
		const show = await request(`/gem/${id}`)
		assert.equal(show.status, 200)
		const html = await show.text()
		assert.ok(html.includes('Ruby'))
		assert.ok(html.includes('Garnet'))
		assert.ok(html.includes(`href='${app.locals.basePath}/gem/${id}/edit'`))

		const detail = await request(`/gem/${id}/json`)
		assert.equal(detail.status, 200)
		assert.equal((await detail.json()).gem.fusions[0].name, 'Garnet')
		const edit = await request(`/gem/${id}/edit`)
		assert.equal(edit.status, 200)
		assert.ok((await edit.text()).includes("value='Ruby'"))
	})

	it('creates a gem and rejects invalid or duplicate input', async () => {
		const save = mock.method(Gem.prototype, 'save', async function () {
			return this
		})
		const response = await request('/gem', json('POST', { name: gem.name }))
		assert.equal(response.status, 400)

		const body = { name: gem.name, weapon: gem.weapon, power: gem.power }
		const created = await request('/gem', json('POST', body))
		assert.equal(created.status, 302)
		assert.equal(created.headers.get('location'), `${app.locals.basePath}/gem`)
		assert.equal(save.mock.calls[0].this.name, 'Ruby')

		const invalidValues = [
			{ ...body, name: '   ' },
			{ ...body, name: 'x'.repeat(101) },
			{ ...body, power: 'line\nbreak' },
			{ ...body, power: '\tHeat' },
			{ ...body, power: 'Heat\r' },
			{ ...body, power: 'Heat\x7F' },
			{ ...body, power: '\x00Heat' },
			{ ...body, name: 'Améthyste' },
		]
		for (const invalidValue of invalidValues) {
			assert.equal((await request('/gem', json('POST', invalidValue))).status, 400)
		}
		assert.equal(save.mock.callCount(), 1)

		const trimmed = await request('/gem', json('POST', {
			...body,
			name: ' Opal ',
		}))
		assert.equal(trimmed.status, 302)
		assert.equal(save.mock.calls[1].this.name, 'Opal')

		save.mock.mockImplementation(async () => {
			throw Object.assign(new Error('duplicate'), { code: 11000, keyPattern: { name: 1 } })
		})
		const duplicate = await request('/gem', json('POST', body))
		assert.equal(duplicate.status, 409)
		assert.match((await duplicate.json()).error, /already exists/)
	})

	it('escapes special characters in rendered gem text', async () => {
		const unsafeText = '<img src=x onerror=alert(1)>'
		mock.method(Gem, 'findById', async () => ({
			...gem,
			name: unsafeText,
			populate: async () => {},
		}))
		const response = await request(`/gem/${id}`)
		assert.equal(response.status, 200)
		const html = await response.text()
		assert.ok(html.includes('&lt;img'))
		assert.ok(!html.includes(unsafeText))
	})

	it('updates and deletes a gem, but prevents deleting a referenced gem', async () => {
		const update = mock.method(Gem, 'findByIdAndUpdate', async () => gem)
		const exists = mock.method(Fusion, 'exists', async () => null)
		const remove = mock.method(Gem, 'findByIdAndDelete', async () => gem)
		const body = { name: 'Ruby', weapon: 'Sword', power: 'Heat' }
		const updated = await request(`/gem/${id}`, json('PUT', body))
		assert.equal(updated.status, 302)
		assert.equal(updated.headers.get('location'), `${app.locals.basePath}/gem/${id}`)
		assert.deepEqual(update.mock.calls[0].arguments, [id, body, { runValidators: true }])

		const formUpdate = await request(`/gem/${id}?_method=PUT`, {
			method: 'POST',
			body: new URLSearchParams(body),
		})
		assert.equal(formUpdate.status, 302)
		assert.deepEqual(update.mock.calls[1].arguments[1], body)

		exists.mock.mockImplementation(async () => ({ _id: id }))
		const blocked = await request(`/gem/${id}`, { method: 'DELETE' })
		assert.equal(blocked.status, 409)
		assert.equal(remove.mock.callCount(), 0)
		exists.mock.mockImplementation(async () => null)
		const deleted = await request(`/gem/${id}?_method=DELETE`, { method: 'POST' })
		assert.equal(deleted.status, 302)
		assert.equal(deleted.headers.get('location'), `${app.locals.basePath}/gem`)
	})

	it('reports invalid and missing gem IDs', async () => {
		const invalid = await request('/gem/not-an-id/json')
		assert.equal(invalid.status, 400)
		mock.method(Gem, 'findById', async () => null)
		const missing = await request(`/gem/${id}`)
		assert.equal(missing.status, 404)
		assert.equal((await missing.json()).error, 'Gem not found.')
		mock.method(Gem, 'findByIdAndUpdate', async () => null)
		const body = { name: gem.name, weapon: gem.weapon, power: gem.power }
		assert.equal((await request(`/gem/${id}`, json('PUT', body))).status, 404)
		mock.method(Fusion, 'exists', async () => null)
		mock.method(Gem, 'findByIdAndDelete', async () => null)
		assert.equal((await request(`/gem/${id}`, { method: 'DELETE' })).status, 404)
	})
})
