import express from 'express'
import mongoose from 'mongoose'
import Joi from 'joi'
import Gem from '../gem/gem-model.mjs'
import Fusion from '../fusion/fusion-model.mjs'
import { validateRequestBody } from '../utils/request-validation.mjs'
import { serialize } from '../utils/serialize.mjs'

const fusionBodySchema = Joi.object({
	name: Joi.string().required(),
	weapon: Joi.string().required(),
	power: Joi.string().required(),
	gems: Joi.array().items(Joi.string()).default([]),
})

const validateGemIDs = async (gemIDs) => {
	if (gemIDs === undefined) return []
	if (!Array.isArray(gemIDs)) return null

	const hasInvalidGemID = gemIDs.some((gemID) => (
		typeof gemID !== 'string'
		|| !mongoose.isObjectIdOrHexString(gemID)
	))
	if (hasInvalidGemID) return null

	// Normalize IDs and remove duplicate selections.
	gemIDs = gemIDs.map((gemID) => gemID.toLowerCase())
	const uniqueGemIDs = [...new Set(gemIDs)]
	if (uniqueGemIDs.length === 0) return []

	// Confirm that every selected ID belongs to an existing gem.
	const existingGemCount = await Gem.countDocuments({
		_id: { $in: uniqueGemIDs },
	})
	if (existingGemCount !== uniqueGemIDs.length) return null
	return uniqueGemIDs
}

const router = new express.Router()
router.get('/', async (req, res) => {
	// Fetch and render all fusions.
	const fusions = await Fusion.find({})
	res.render('fusion-index', { fusions: serialize(fusions) })
})

router.get('/json', async (req, res) => {
	// Fetch and return all fusions as JSON.
	const fusions = await Fusion.find({})
	res.status(200).json({
		message: 'Get all fusions.',
		fusions,
	})
})

router.get('/new', async (req, res) => {
	// Fetch all gems and render the fusion creation form.
	const gems = await Gem.find({})
	res.render('fusion-new.hbs', { gems: serialize(gems) })
})

router.post('/', validateRequestBody(fusionBodySchema), async (req, res) => {
	// Create a fusion and its gem relationships.
	const gemIDs = await validateGemIDs(req.body.gems)
	if (gemIDs === null) {
		return res
			.status(400)
			.send('The selected gems are invalid or no longer exist.')
	}
	const fusion = new Fusion({ ...req.body, gems: gemIDs })
	await fusion.save()
	res.redirect('/fusion')
})

router.get('/:fusionID', async (req, res) => {
	// Fetch and render a fusion with its related gems.
	const fusion = await Fusion.findById(req.params.fusionID).populate('gems')
	res.render('fusion-show.hbs', { fusion: serialize(fusion) })
})

router.get('/:fusionID/json', async (req, res) => {
	// Fetch and return the fusion details as JSON.
	const fusion = await Fusion.findById(req.params.fusionID)
	res.status(200).json({
		message: 'Show this fusion with the gems who create it.',
		fusion,
	})
})

router.get('/:fusionID/edit', async (req, res) => {
	// Fetch all gems and render the fusion edit form.
	const gems = await Gem.find({})
	const fusion = await Fusion.findById(req.params.fusionID)
	const selectedGemIds = new Set(
		fusion.gems.map((gemId) => (
			gemId.toString()
		))
	)
	const serializedGems = serialize(gems).map((gem) => {
		const selected = selectedGemIds.has(gem._id.toString())
		// Add the selection state to each gem for the edit form.
		return { ...gem, selected }
	})
	res.render('fusion-edit', {
		fusion: serialize(fusion),
		gems: serializedGems,
	})
})

router.put('/:fusionID', validateRequestBody(fusionBodySchema), async (req, res) => {
	// Update a fusion and its gem relationships.
	const gemIDs = await validateGemIDs(req.body.gems)
	if (gemIDs === null) {
		return res
			.status(400)
			.send('The selected gems are invalid or no longer exist.')
	}
	const fusion = await Fusion.findByIdAndUpdate(
		req.params.fusionID,
		{ ...req.body, gems: gemIDs },
	)
	res.redirect(`/fusion/${fusion._id}`)
})

router.delete('/:fusionID', async (req, res) => {
	// Delete a fusion.
	await Fusion.findByIdAndDelete(req.params.fusionID)
	res.redirect('/fusion')
})

export default router
