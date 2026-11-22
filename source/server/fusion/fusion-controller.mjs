import express from 'express'
import mongoose from 'mongoose'
import Joi from 'joi'
import Gem from '../gem/gem-model.mjs'
import Fusion from '../fusion/fusion-model.mjs'
import {
	FusionDuplicateNameError,
	FusionInvalidGemsError,
	FusionInvalidIDError,
	FusionNotFoundError,
} from '../utils/http-errors.mjs'
import {
	isDuplicateNameError,
	serialize,
	validateRequestBody,
} from '../utils/helpers.mjs'

const fusionBodySchema = Joi.object({
	name: Joi.string().required(),
	weapon: Joi.string().required(),
	power: Joi.string().required(),
	gems: Joi.array().items(Joi.string()).default([]),
})

/** Translate duplicate-name database errors into fusion HTTP errors; rethrow other errors. */
const runWithDuplicateFusionNameHandling = async (operation) => {
	try {
		return await operation()
	} catch (err) {
		if (isDuplicateNameError(err)) throw new FusionDuplicateNameError()
		else throw err
	}
}

const assertValidFusionID = (fusionID) => {
	if (!mongoose.isObjectIdOrHexString(fusionID)) {
		throw new FusionInvalidIDError()
	}
}

const findFusionOrThrow = async (fusionID) => {
	assertValidFusionID(fusionID)
	const fusion = await Fusion.findById(fusionID)
	if (!fusion) throw new FusionNotFoundError()
	return fusion
}

/** Return unique, normalized IDs for existing gems, or throw if any selection is invalid. */
const validateGemIDs = async (gemIDs) => {
	if (gemIDs === undefined) {
		return []
	}
	if (!Array.isArray(gemIDs)) {
		throw new FusionInvalidGemsError()
	}

	const hasInvalidGemID = gemIDs.some((gemID) => (
		typeof gemID !== 'string'
		|| !mongoose.isObjectIdOrHexString(gemID)
	))
	if (hasInvalidGemID) {
		throw new FusionInvalidGemsError()
	}

	// Normalize IDs and remove duplicate selections.
	gemIDs = gemIDs.map((gemID) => gemID.toLowerCase())
	const uniqueGemIDs = [...new Set(gemIDs)]
	if (uniqueGemIDs.length === 0) {
		return []
	}

	// Confirm that every selected ID belongs to an existing gem.
	const existingGemCount = await Gem.countDocuments({
		_id: { $in: uniqueGemIDs },
	})
	if (existingGemCount !== uniqueGemIDs.length) {
		throw new FusionInvalidGemsError()
	}

	// Return this list of unique Gem IDs.
	// Note, it may have removed duplicates from the original list.
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
	const fusion = new Fusion({ ...req.body, gems: gemIDs })
	await runWithDuplicateFusionNameHandling(() => fusion.save())
	res.redirect('/fusion')
})

router.get('/:fusionID', async (req, res) => {
	// Fetch and render a fusion with its related gems.
	const fusion = await findFusionOrThrow(req.params.fusionID)
	await fusion.populate('gems')
	res.render('fusion-show.hbs', { fusion: serialize(fusion) })
})

router.get('/:fusionID/json', async (req, res) => {
	// Fetch and return the fusion details as JSON.
	const fusion = await findFusionOrThrow(req.params.fusionID)
	await fusion.populate('gems')
	res.status(200).json({
		message: 'Show this fusion with the gems who create it.',
		fusion,
	})
})

router.get('/:fusionID/edit', async (req, res) => {
	// Fetch all gems and render the fusion edit form.
	const fusion = await findFusionOrThrow(req.params.fusionID)
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
	assertValidFusionID(req.params.fusionID)
	const gemIDs = await validateGemIDs(req.body.gems)

	const fusion = await runWithDuplicateFusionNameHandling(() => (
		Fusion.findByIdAndUpdate(
			req.params.fusionID,
			{ ...req.body, gems: gemIDs },
			{ runValidators: true },
		)
	))

	if (!fusion) throw new FusionNotFoundError()
	res.redirect(`/fusion/${fusion._id}`)
})

router.delete('/:fusionID', async (req, res) => {
	// Delete a fusion.
	assertValidFusionID(req.params.fusionID)
	const fusion = await Fusion.findByIdAndDelete(req.params.fusionID)
	if (!fusion) throw new FusionNotFoundError()
	res.redirect('/fusion')
})

export default router
