import express from 'express'
import Joi from 'joi'
import Gem from '../gem/gem-model.mjs'
import { removeGemReferencesFromFusions } from '../utils/relationships.mjs'
import { validateRequestBody } from '../utils/request-validation.mjs'
import { serialize } from '../utils/serialize.mjs'

const gemBodySchema = Joi.object({
	name: Joi.string().required(),
	weapon: Joi.string().required(),
	power: Joi.string().required(),
})

const serializeGem = (gem) => ({
	...serialize(gem),
	fusions: serialize(gem.fusions),
})

const router = new express.Router()
router.get('/', async (req, res) => {
	// Fetch and render all gems.
	const gems = await Gem.find({})
	res.render('gem-index', { gems: serialize(gems) })
})

router.get('/json', async (req, res) => {
	// Fetch and return all gems as JSON.
	const gems = await Gem.find({}).populate('fusions')
	res.status(200).json({
		message: 'Get all gems.',
		gems: gems.map(serializeGem),
	})
})

router.get('/new', (req, res) => {
	// Render the gem creation form.
	res.render('gem-new.hbs')
})

router.post('/', validateRequestBody(gemBodySchema), async (req, res) => {
	// Create and save a new gem.
	const gem = new Gem(req.body)
	await gem.save()
	res.redirect('/gem')
})

router.get('/:gemID', async (req, res) => {
	// Fetch and render a gem with its related fusions.
	const gem = await Gem.findById(req.params.gemID).populate('fusions')
	res.render('gem-show.hbs', { gem: serializeGem(gem) })
})

router.get('/:gemID/json', async (req, res) => {
	// Fetch and return the gem details as JSON.
	const gem = await Gem.findById(req.params.gemID).populate('fusions')
	res.status(200).json({
		message: 'Show this gem with the fusions it creates.',
		gem: serializeGem(gem),
	})
})

router.get('/:gemID/edit', async (req, res) => {
	// Fetch and render the gem edit form.
	const gem = await Gem.findById(req.params.gemID)
	res.render('gem-edit', { gem: serialize(gem) })
})

router.put('/:gemID', validateRequestBody(gemBodySchema), async (req, res) => {
	// Update a gem with the submitted data.
	const gem = await Gem.findByIdAndUpdate(
		req.params.gemID,
		req.body,
		{ runValidators: true },
	)
	res.redirect(`/gem/${gem._id}`)
})

router.delete('/:gemID', async (req, res) => {
	// Delete a gem.
	const gemID = req.params.gemID
	await Gem.findByIdAndDelete(gemID)
	await removeGemReferencesFromFusions(gemID)
	res.redirect('/gem')
})

export default router
