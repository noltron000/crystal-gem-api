// Import the middleware used by the application.
import express from 'express'
import { engine } from 'express-handlebars'
import cors from 'cors'
import methodOverride from 'method-override'
import { HttpError } from '../server/utils/http-errors.mjs'
// Import the application routes.
import gem from '../server/gem/gem-controller.mjs'
import fusion from '../server/fusion/fusion-controller.mjs'
// Create the Express application.
const app = express()

// Parse JSON and URL-encoded request bodies.
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Allow POST requests to override the HTTP method through the _method query parameter.
app.use(express.static('public'))
app.use(methodOverride('_method'))

// Enable cross-origin resource sharing.
app.use(cors())

// Configure Handlebars as the view engine.
app.engine('.hbs', engine({ extname: '.hbs', defaultLayout: 'main' }))
app.set('view engine', 'hbs')

// Render the home page at the root route.
app.get('/', (req, res) => {
	res.render('home.hbs')
})

// Mount the gem and fusion routes.
app.use('/gem', gem)
app.use('/fusion', fusion)
app.use(HttpError.handle)

export default app
