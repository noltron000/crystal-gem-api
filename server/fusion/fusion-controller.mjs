import express from 'express'
import Gem from '../gem/gem-model.mjs'
import Fusion from '../fusion/fusion-model.mjs'

const router = new express.Router()
router.get('/', (req, res) => {
	// DONE: INDEX //
	// indexes all fusions
	Fusion.find({})
		.then((fusions) => {
			res // here's where INDEX differs
				.render('fusion-index', { fusions })
		})
		.catch((err) => {
			console.error(err)
		})
})

router.get('/json', (req, res) => {
	// DONE: INDEX JSON //
	// indexes all fusions and returns json
	Fusion.find({})
		.then((fusions) => {
			res // here's where INDEX JSON differs
				.json({
					message: 'Get all fusions',
					fusions,
				})
				.status(200)
		})
		.catch((err) => {
			console.error(err)
		})
})

router.get('/new', (req, res) => {
	// DONE: NEW //
	// shows a fusion creation form
	Gem.find({})
		.then((gems) => {
			res.render('fusion-new.hbs', { gems })
		})
		.catch((err) => {
			console.error(err)
		})
})

router.post('/', (req, res) => {
	// DONE: CREATE //
	// creates a new fusion
	const fusionBody = req.body
	fusionBody.gems = []
	// give gemIDs to fusion, in array
	for (const key in fusionBody) {
		if (fusionBody[key] === 'on') {
			fusionBody.gems.push(key)
		}
	}
	const fusion = new Fusion(fusionBody)
	fusion
		.save()
		.then(() => {
			// give fusionID to gems, in array
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
	// DONE: SHOW //
	// shows a single fusion in detail
	Fusion.findById(req.params.fusionID)
		.populate('gems')
		.then((fusion) => {
			res // here's where SHOW differs
				.render('fusion-show.hbs', { fusion })
		})
		.catch((err) => {
			console.error(err)
		})
})

router.get('/:fusionID/json', (req, res) => {
	// DONE: SHOW JSON //
	// shows a single fusion in detail
	Fusion.findById(req.params.fusionID)
		// .populate('gems')
		.then((fusion) => {
			res // here's where SHOW JSON differs
				.json({
					message: 'Show this fusion with the gems who create it',
					fusion,
				})
				.status(200)
		})
		.catch((err) => {
			console.error(err)
		})
})

router.get('/:fusionID/edit', (req, res) => {
	// DONE: EDIT //
	// shows a fusion edit form
	Gem.find({})
		.then((gems) => {
			Fusion.findById(req.params.fusionID)
				.then((fusion) => {
					//////////////// PROBLEMS ARE HAPPENING
					// console.log(fusion.gems)
					// gems.forEach(gem => {
					// 	console.log(gem._id.toString())
					// 	console.log(fusion.gems.filter(fuseGemID => gem._id.toString() === fuseGemID))
					// });
					//////////////// END PROBLEMS
					res.render('fusion-edit', { fusion, gems })
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
	// DONE: UPDATE //
	const fusionBody = req.body
	fusionBody.gems = []
	// give gemIDs to fusion, in array
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
	// DONE: DELETE //
	Fusion.findByIdAndDelete(req.params.fusionID)
		.then(() => {
			res.redirect('/fusion')
		})
		.catch((err) => {
			console.error(err)
		})
})

export default router
