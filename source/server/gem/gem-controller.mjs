import express from 'express'
import Joi from 'joi'
import mongoose from 'mongoose'
import Gem from '../gem/gem-model.mjs'
import {
	GemDuplicateNameError,
	GemInvalidIDError,
	GemNotFoundError,
} from '../utils/http-errors.mjs'
import {
	assertGemNotReferenced,
	isDuplicateNameError,
	serialize,
	validateRequestBody,
} from '../utils/helpers.mjs'

const gemBodySchema = Joi.object({
	name: Joi.string().required(),
	weapon: Joi.string().required(),
	power: Joi.string().required(),
})

const serializeGem = (gem) => ({
	...serialize(gem),
	fusions: serialize(gem.fusions),
})

/** Translate duplicate-name database errors into gem HTTP errors; rethrow other errors. */
const runWithDuplicateGemNameHandling = async (operation) => {
	try {
		return await operation()
	} catch (err) {
		if (isDuplicateNameError(err)) throw new GemDuplicateNameError()
		else throw err
	}
}

const assertValidGemID = (gemID) => {
	if (!mongoose.isObjectIdOrHexString(gemID)) {
		throw new GemInvalidIDError()
	}
}

const findGemOrThrow = async (gemID) => {
	assertValidGemID(gemID)
	const gem = await Gem.findById(gemID)
	if (!gem) throw new GemNotFoundError()
	return gem
}

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
	await runWithDuplicateGemNameHandling(() => gem.save())
	res.redirect(req.baseUrl)
})

router.get('/:gemID', async (req, res) => {
	// Fetch and render a gem with its related fusions.
	const gem = await findGemOrThrow(req.params.gemID)
	await gem.populate('fusions')
	res.render('gem-show.hbs', { gem: serializeGem(gem) })
})

router.get('/:gemID/json', async (req, res) => {
	// Fetch and return the gem details as JSON.
	const gem = await findGemOrThrow(req.params.gemID)
	await gem.populate('fusions')
	res.status(200).json({
		message: 'Show this gem with the fusions it creates.',
		gem: serializeGem(gem),
	})
})

router.get('/:gemID/edit', async (req, res) => {
	// Fetch and render the gem edit form.
	const gem = await findGemOrThrow(req.params.gemID)
	res.render('gem-edit', { gem: serialize(gem) })
})

router.put('/:gemID', validateRequestBody(gemBodySchema), async (req, res) => {
	// Update a gem with the submitted data.
	assertValidGemID(req.params.gemID)

	const gem = await runWithDuplicateGemNameHandling(() => (
		Gem.findByIdAndUpdate(
			req.params.gemID,
			req.body,
			{ runValidators: true },
		)
	))

	if (!gem) throw new GemNotFoundError()
	res.redirect(`${req.baseUrl}/${gem._id}`)
})

router.delete('/:gemID', async (req, res) => {
	// Delete a gem, but refuse while a fusion references it.
	assertValidGemID(req.params.gemID)
	const gemID = req.params.gemID
	await assertGemNotReferenced(gemID)
	const gem = await Gem.findByIdAndDelete(gemID)
	if (!gem) throw new GemNotFoundError()
	res.redirect(req.baseUrl)
})

export default router
