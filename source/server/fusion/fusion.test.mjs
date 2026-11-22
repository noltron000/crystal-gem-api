import assert from 'node:assert/strict'
import { mock } from 'node:test'
import Fusion from './fusion-model.mjs'
import Gem from '../gem/gem-model.mjs'
import app from '../../config/express.mjs'
import { json, useTestServer } from '../tests/test-helpers.mjs'

describe('Fusion routes', () => {
	const request = useTestServer()
	const id = 'bbbbbbbbbbbbbbbbbbbbbbbb'
	const gemID = 'aaaaaaaaaaaaaaaaaaaaaaaa'
	const gem = { _id: gemID, name: 'Ruby' }
	const fusion = { _id: id, name: 'Garnet', weapon: 'Gauntlets', power: 'Vision', gems: [gemID] }

	it('validates required fusion fields', async () => {
		await new Fusion(fusion).validate()
		await assert.rejects(new Fusion({ name: 'Garnet' }).validate(), { name: 'ValidationError' })
	})

	it('shows the index, JSON collection, and creation form', async () => {
		mock.method(Fusion, 'find', async () => [fusion])
		mock.method(Gem, 'find', async () => [gem])
		const index = await request('/fusion')
		assert.equal(index.status, 200)
		assert.ok((await index.text()).includes(`href='${app.locals.basePath}/fusion/${id}'`))
		const collection = await request('/fusion/json')
		assert.equal(collection.status, 200)
		assert.equal((await collection.json()).fusions[0].name, 'Garnet')
		const form = await request('/fusion/new')
		assert.equal(form.status, 200)
		assert.ok((await form.text()).includes('Ruby'))
	})

	it('shows a fusion, its JSON, and its edit form', async () => {
		mock.method(Fusion, 'findById', async () => ({
			...fusion,
			populate: async function () { this.gems = [gem] },
		}))
		mock.method(Gem, 'find', async () => [gem])
		const show = await request(`/fusion/${id}`)
		assert.equal(show.status, 200)
		const html = await show.text()
		assert.ok(html.includes('Garnet'))
		assert.ok(html.includes('Ruby'))
		assert.ok(html.includes(`href='${app.locals.basePath}/fusion/${id}/edit'`))
		const detail = await request(`/fusion/${id}/json`)
		assert.equal(detail.status, 200)
		assert.equal((await detail.json()).fusion.gems[0].name, 'Ruby')
		const edit = await request(`/fusion/${id}/edit`)
		assert.equal(edit.status, 200)
		assert.match(await edit.text(), new RegExp(`value='${gemID}'\\s+checked`))
	})

	it('creates a fusion with normalized, unique gem IDs', async () => {
		const count = mock.method(Gem, 'countDocuments', async () => 1)
		const save = mock.method(Fusion.prototype, 'save', async function () { return this })
		const body = new URLSearchParams({
			name: fusion.name, weapon: fusion.weapon, power: fusion.power,
		})
		body.append('gems[]', gemID)
		body.append('gems[]', gemID.toUpperCase())
		const response = await request('/fusion', { method: 'POST', body })
		assert.equal(response.status, 302)
		assert.equal(response.headers.get('location'), `${app.locals.basePath}/fusion`)
		assert.deepEqual(count.mock.calls[0].arguments[0], { _id: { $in: [gemID] } })
		assert.deepEqual(save.mock.calls[0].this.gems.map(String), [gemID])
	})

	it('rejects invalid gem selections and duplicate fusion names', async () => {
		const body = { name: fusion.name, weapon: fusion.weapon, power: fusion.power }
		const invalid = await request('/fusion', json('POST', { ...body, gems: ['bad-id'] }))
		assert.equal(invalid.status, 400)
		const tooMany = await request('/fusion', json('POST', {
			...body,
			gems: Array(101).fill(gemID),
		}))
		assert.equal(tooMany.status, 400)
		mock.method(Gem, 'countDocuments', async () => 0)
		const missing = await request('/fusion', json('POST', { ...body, gems: [gemID] }))
		assert.equal(missing.status, 400)
		mock.method(Fusion.prototype, 'save', async () => {
			throw Object.assign(new Error('duplicate'), { code: 11000, keyPattern: { name: 1 } })
		})
		const duplicate = await request('/fusion', json('POST', body))
		assert.equal(duplicate.status, 409)
	})

	it('updates and deletes a fusion', async () => {
		const update = mock.method(Fusion, 'findByIdAndUpdate', async () => fusion)
		mock.method(Gem, 'countDocuments', async () => 1)
		const remove = mock.method(Fusion, 'findByIdAndDelete', async () => fusion)
		const body = { name: 'Garnet', weapon: 'Gloves', power: 'Vision', gems: [gemID] }
		const updated = await request(`/fusion/${id}`, json('PUT', body))
		assert.equal(updated.status, 302)
		assert.equal(updated.headers.get('location'), `${app.locals.basePath}/fusion/${id}`)
		assert.deepEqual(update.mock.calls[0].arguments, [id, body, { runValidators: true }])
		const deleted = await request(`/fusion/${id}`, { method: 'DELETE' })
		assert.equal(deleted.status, 302)
		assert.equal(deleted.headers.get('location'), `${app.locals.basePath}/fusion`)
		assert.equal(remove.mock.calls[0].arguments[0], id)
	})

	it('reports invalid and missing fusion IDs', async () => {
		const invalid = await request('/fusion/not-an-id/json')
		assert.equal(invalid.status, 400)
		mock.method(Fusion, 'findById', async () => null)
		const missing = await request(`/fusion/${id}`)
		assert.equal(missing.status, 404)
		assert.equal((await missing.json()).error, 'Fusion not found.')
		mock.method(Fusion, 'findByIdAndUpdate', async () => null)
		const body = { name: fusion.name, weapon: fusion.weapon, power: fusion.power }
		assert.equal((await request(`/fusion/${id}`, json('PUT', body))).status, 404)
		mock.method(Fusion, 'findByIdAndDelete', async () => null)
		assert.equal((await request(`/fusion/${id}`, { method: 'DELETE' })).status, 404)
	})
})
