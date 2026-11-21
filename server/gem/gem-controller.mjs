import express from 'express'
import Gem from '../gem/gem-model.mjs'
import { serialize } from '../utils/serialize.mjs'

const router = new express.Router()
router.get('/', (req, res) => {
	// Fetch and render all gems.
	Gem.find({})
		.then((gems) => {
			res.render('gem-index', { gems: serialize(gems) })
		})
		.catch((err) => {
			console.error(err)
		})
})

router.get('/json', (req, res) => {
	// Fetch and return all gems as JSON.
	Gem.find({})
		.then((gems) => {
			res.json({
				message: 'Get all gems.',
				gems,
			})
				.status(200)
		})
		.catch((err) => {
			console.error(err)
		})
})

router.get('/new', (req, res) => {
	// Render gem creation form.
	res.render('gem-new.hbs')
})

router.post('/', (req, res) => {
	// Create and save new gem.
	const gem = new Gem(req.body)
	gem
		.save()
		.then(() => {
			res.redirect('/gem')
		})
		.catch((err) => {
			console.error(err)
		})
})

router.get('/:gemID', (req, res) => {
	// Fetch and render gem detail with related fusions.
	Gem.findById(req.params.gemID)
		.populate('fusions')
		.then((gem) => {
			res.render('gem-show.hbs', { gem: serialize(gem) })
		})
		.catch((err) => {
			console.error(err)
		})
})

router.get('/:gemID/json', (req, res) => {
	// Fetch and return gem detail as JSON.
	Gem.findById(req.params.gemID)
		.then((gem) => {
			res.json({
				message: 'Show this gem with the fusions it creates.',
				gem,
			})
				.status(200)
		})
		.catch((err) => {
			console.error(err)
		})
})

router.get('/:gemID/edit', (req, res) => {
	// Fetch and render gem edit form.
	Gem.findById(req.params.gemID)
		.then((gem) => {
			res.render('gem-edit', { gem: serialize(gem) })
		})
		.catch((err) => {
			console.error(err)
		})
})

router.put('/:gemID', (req, res) => {
	// Update gem with new data.
	Gem.findByIdAndUpdate(req.params.gemID, req.body)
		.then((gem) => {
			res.redirect(`/gem/${gem._id}`)
		})
		.catch((err) => {
			console.error(err)
		})
})

router.delete('/:gemID', (req, res) => {
	// Delete gem.
	Gem.findByIdAndDelete(req.params.gemID)
		.then(() => {
			res.redirect('/gem')
		})
		.catch((err) => {
			console.error(err)
		})
})

export default router
