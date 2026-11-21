import express from 'express'
import Gem from '../gem/gem-model.mjs'
import Fusion from '../fusion/fusion-model.mjs'
import { serialize } from '../utils/serialize.mjs'

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
	// Fetch all gems and render fusion creation form.
	const gems = await Gem.find({})
	res.render('fusion-new.hbs', { gems: serialize(gems) })
})

router.post('/', async (req, res) => {
	// Create fusion and establish relationships with gems.
	const fusionBody = req.body
	fusionBody.gems = []
	// Extract checked gem IDs from form.
	for (const key in fusionBody) {
		if (fusionBody[key] === 'on') {
			fusionBody.gems.push(key)
		}
	}
	const fusion = new Fusion(fusionBody)
	await fusion.save()
	// Add new fusion to each associated gem.
	for (const gemID of fusionBody.gems) {
		const gem = await Gem.findById(gemID)
		gem.fusions.push(fusion._id)
		await gem.save()
	}
	res.redirect('/fusion')
})

router.get('/:fusionID', async (req, res) => {
	// Fetch and render fusion detail with related gems.
	const fusion = await Fusion.findById(req.params.fusionID).populate('gems')
	res.render('fusion-show.hbs', { fusion: serialize(fusion) })
})

router.get('/:fusionID/json', async (req, res) => {
	// Fetch and return fusion detail as JSON.
	const fusion = await Fusion.findById(req.params.fusionID)
	res.status(200).json({
		message: 'Show this fusion with the gems who create it.',
		fusion,
	})
})

router.get('/:fusionID/edit', async (req, res) => {
	// Fetch all gems and render fusion edit form.
	const gems = await Gem.find({})
	const fusion = await Fusion.findById(req.params.fusionID)
	const selectedGemIds = new Set(
		fusion.gems.map((gemId) => gemId.toString()),
	)
	const serializedGems = serialize(gems).map((gem) => {
		const selected = selectedGemIds.has(gem._id.toString())
		// We can also track if the gem is selected or not.
		return { ...gem, selected }
	})
	res.render('fusion-edit', {
		fusion: serialize(fusion),
		gems: serializedGems,
	})
})

router.put('/:fusionID', async (req, res) => {
	// Update fusion and gem relationships.
	const fusionBody = req.body
	fusionBody.gems = []
	// Extract checked gem IDs from form.
	for (const key in fusionBody) {
		if (fusionBody[key] === 'on') {
			fusionBody.gems.push(key)
		}
	}
	const fusion = await Fusion.findByIdAndUpdate(
		req.params.fusionID,
		fusionBody,
	)
	for (const gemID of fusionBody.gems) {
		const gem = await Gem.findById(gemID)
		gem.fusions.push(fusion._id)
		await gem.save()
	}
	res.redirect(`/fusion/${fusion._id}`)
})

router.delete('/:fusionID', async (req, res) => {
	// Delete fusion.
	await Fusion.findByIdAndDelete(req.params.fusionID)
	res.redirect('/fusion')
})

export default router
