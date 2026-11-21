import express from 'express'
import Gem from '../gem/gem-model.mjs'
import Fusion from '../fusion/fusion-model.mjs'
import { serialize } from '../utils/serialize.mjs'

const router = new express.Router()
router.get('/', (req, res) => {
	// Fetch and render all fusions.
	Fusion.find({})
		.then((fusions) => {
			res.render('fusion-index', { fusions: serialize(fusions) })
		})
		.catch((err) => {
			console.error(err)
		})
})

router.get('/json', (req, res) => {
	// Fetch and return all fusions as JSON.
	Fusion.find({})
		.then((fusions) => {
			res.json({
				message: 'Get all fusions.',
				fusions,
			})
				.status(200)
		})
		.catch((err) => {
			console.error(err)
		})
})

router.get('/new', (req, res) => {
	// Fetch all gems and render fusion creation form.
	Gem.find({})
		.then((gems) => {
			res.render('fusion-new.hbs', { gems: serialize(gems) })
		})
		.catch((err) => {
			console.error(err)
		})
})

router.post('/', (req, res) => {
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
	fusion
		.save()
		.then(() => {
			// Add new fusion to each associated gem.
			for (const key in fusionBody) {
				if (fusionBody[key] === 'on') {
					Gem.findById(key).then((gem) => {
						gem.fusions.push(fusion._id)
						return gem.save()
					})
				}
			}
			res.redirect('/fusion')
		})
		.catch((err) => {
			console.error(err)
		})
})

router.get('/:fusionID', (req, res) => {
	// Fetch and render fusion detail with related gems.
	Fusion.findById(req.params.fusionID)
		.populate('gems')
		.then((fusion) => {
			res.render('fusion-show.hbs', { fusion: serialize(fusion) })
		})
		.catch((err) => {
			console.error(err)
		})
})

router.get('/:fusionID/json', (req, res) => {
	// Fetch and return fusion detail as JSON.
	Fusion.findById(req.params.fusionID)
		.then((fusion) => {
			res.json({
				message: 'Show this fusion with the gems who create it.',
				fusion,
			})
				.status(200)
		})
		.catch((err) => {
			console.error(err)
		})
})

router.get('/:fusionID/edit', (req, res) => {
	// Fetch all gems and render fusion edit form.
	Gem.find({})
		.then((gems) => {
			Fusion.findById(req.params.fusionID)
				.then((fusion) => {
					res.render('fusion-edit', { fusion: serialize(fusion), gems: serialize(gems) })
				})
				.catch((err) => {
					console.error(err)
				})
		})
		.catch((err) => {
			console.error(err)
		})
})

router.put('/:fusionID', (req, res) => {
	// Update fusion and gem relationships.
	const fusionBody = req.body
	fusionBody.gems = []
	// Extract checked gem IDs from form.
	for (const key in fusionBody) {
		if (fusionBody[key] === 'on') {
			fusionBody.gems.push(key)
		}
	}
	Fusion.findByIdAndUpdate(req.params.fusionID, fusionBody)
		.then((fusion) => {
			for (const key in fusionBody) {
				if (fusionBody[key] === 'on') {
					Gem.findById(key).then((gem) => {
						gem.fusions.push(fusion._id)
						return gem.save()
					})
				}
			}
			res.redirect(`/fusion/${fusion._id}`)
		})
		.catch((err) => {
			console.error(err)
		})
})

router.delete('/:fusionID', (req, res) => {
	// Delete fusion.
	Fusion.findByIdAndDelete(req.params.fusionID)
		.then(() => {
			res.redirect('/fusion')
		})
		.catch((err) => {
			console.error(err)
		})
})

export default router
