import express from 'express'
import Gem from '../gem/gem-model.mjs'

const router = new express.Router()
router.get('/', (req, res) => {
	// DONE: INDEX //
	// indexes all gems
	Gem.find({})
		.then((gems) => {
			res // here's where INDEX differs
				.render('gem-index', { gems })
		})
		.catch((err) => {
			console.error(err)
		})
})

router.get('/json', (req, res) => {
	// DONE: INDEX JSON //
	// indexes all gems and returns json
	Gem.find({})
		.then((gems) => {
			res // here's where INDEX JSON differs
				.json({
					message: 'Get all gems',
					gems,
				})
				.status(200)
		})
		.catch((err) => {
			console.error(err)
		})
})

router.get('/new', (req, res) => {
	// DONE: NEW //
	// shows a gem creation form
	res.render('gem-new.hbs')
})

router.post('/', (req, res) => {
	// DONE: CREATE //
	// creates a new gem
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
	// DONE: SHOW //
	// shows a single gem in detail
	Gem.findById(req.params.gemID)
		.populate('fusions')
		.then((gems) => {
			res // here's where SHOW differs
				.render('gem-show.hbs', { gems })
		})
		.catch((err) => {
			console.error(err)
		})
})

router.get('/:gemID/json', (req, res) => {
	// DONE: SHOW JSON //
	// shows a single gem in detail
	Gem.findById(req.params.gemID)
		// .populate('fusions')
		.then((gems) => {
			res // here's where SHOW JSON differs
				.json({
					message: 'Show this fusion with the gems who create it',
					gems,
				})
				.status(200)
		})
		.catch((err) => {
			console.error(err)
		})
})

router.get('/:gemID/edit', (req, res) => {
	// DONE: EDIT //
	// shows a gem edit form
	Gem.findById(req.params.gemID)
		.then((gem) => {
			res.render('gem-edit', { gem })
		})
		.catch((err) => {
			console.error(err)
		})
})

router.put('/:gemID', (req, res) => {
	// DONE: UPDATE //
	Gem.findByIdAndUpdate(req.params.gemID, req.body)
		.then((gem) => {
			res.redirect(`/gem/${gem._id}`)
		})
		.catch((err) => {
			console.error(err)
		})
})

router.delete('/:gemID', (req, res) => {
	// DONE: DELETE //
	Gem.findByIdAndDelete(req.params.gemID)
		.then(() => {
			res.redirect('/gem')
		})
		.catch((err) => {
			console.error(err)
		})
})

export default router
