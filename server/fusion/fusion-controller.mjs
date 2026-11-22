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
	try {
		await fusion.save()
	} catch (err) {
		if (err.code === 11000 && err.keyPattern?.name === 1) {
			return res.status(409).send('A fusion with that name already exists.')
		}
		throw err
	}
	res.redirect('/fusion')
})

router.get('/:fusionID', async (req, res) => {
	// Fetch and render a fusion with its related gems.
	if (!mongoose.isObjectIdOrHexString(req.params.fusionID)) {
		return res.status(400).send('Invalid fusion ID.')
	}
	const fusion = await Fusion.findById(req.params.fusionID).populate('gems')
	if (!fusion) return res.status(404).send('Fusion not found.')
	res.render('fusion-show.hbs', { fusion: serialize(fusion) })
})

router.get('/:fusionID/json', async (req, res) => {
	// Fetch and return the fusion details as JSON.
	if (!mongoose.isObjectIdOrHexString(req.params.fusionID)) {
		return res.status(400).json({ error: 'Invalid fusion ID.' })
	}
	const fusion = await Fusion.findById(req.params.fusionID)
	if (!fusion) return res.status(404).json({ error: 'Fusion not found.' })
	res.status(200).json({
		message: 'Show this fusion with the gems who create it.',
		fusion,
	})
})

router.get('/:fusionID/edit', async (req, res) => {
	// Fetch all gems and render the fusion edit form.
	if (!mongoose.isObjectIdOrHexString(req.params.fusionID)) {
		return res.status(400).send('Invalid fusion ID.')
	}
	const fusion = await Fusion.findById(req.params.fusionID)
	if (!fusion) return res.status(404).send('Fusion not found.')
	const gems = await Gem.find({})
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
	if (!mongoose.isObjectIdOrHexString(req.params.fusionID)) {
		return res.status(400).send('Invalid fusion ID.')
	}
	const gemIDs = await validateGemIDs(req.body.gems)
	if (gemIDs === null) {
		return res
			.status(400)
			.send('The selected gems are invalid or no longer exist.')
	}
	let fusion
	try {
		fusion = await Fusion.findByIdAndUpdate(
			req.params.fusionID,
			{ ...req.body, gems: gemIDs },
			{ runValidators: true },
		)
	} catch (err) {
		if (err.code === 11000 && err.keyPattern?.name === 1) {
			return res.status(409).send('A fusion with that name already exists.')
		}
		throw err
	}
	if (!fusion) return res.status(404).send('Fusion not found.')
	res.redirect(`/fusion/${fusion._id}`)
})

router.delete('/:fusionID', async (req, res) => {
	// Delete a fusion.
	if (!mongoose.isObjectIdOrHexString(req.params.fusionID)) {
		return res.status(400).send('Invalid fusion ID.')
	}
	const fusion = await Fusion.findByIdAndDelete(req.params.fusionID)
	if (!fusion) return res.status(404).send('Fusion not found.')
	res.redirect('/fusion')
})

export default router
