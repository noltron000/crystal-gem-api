// Require middleware
import express from 'express'
import { engine } from 'express-handlebars'
import cors from 'cors'
import methodOverride from 'method-override'
// Required files
import auth from '../server/auth/auth-route.mjs'
import gem from '../server/gem/gem-controller.mjs'
import fusion from '../server/fusion/fusion-controller.mjs'
// Define app
const app = express()
// // Define router
// // Confused about router vs app
// const router = new express.Router(); // eslint-disable-line new-cap

// Use body parser
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// override with POST having ?_method=DELETE or ?_method=PUT
app.use(express.static('public'))
app.use(methodOverride('_method'))

// Enable CORS - Cross Origin Resource Sharing.
app.use(cors())

// Set up handlebars
app.engine('.hbs', engine({ extname: '.hbs', defaultLayout: 'main' }))
app.set('view engine', 'hbs')

// Start up basic routes
app.get('/', (req, res) => {
	res.render('home.hbs')
})

// Mount all other routes
app.use('/auth', auth)
app.use('/gem', gem)
app.use('/fusion', fusion)

export default app
// // Confused about router vs app
// export default router
