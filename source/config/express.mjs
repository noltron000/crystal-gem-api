// Import the middleware used by the application.
import express from 'express'
import { engine } from 'express-handlebars'
import cors from 'cors'
import methodOverride from 'method-override'
import { fileURLToPath } from 'node:url'
import { HttpError } from '../server/utils/http-errors.mjs'
// Import the application routes.
import gem from '../server/gem/gem-controller.mjs'
import fusion from '../server/fusion/fusion-controller.mjs'
// Create the Express application.
const app = express()
const basePath = (process.env.PUBLIC_BASE_PATH ?? '').replace(/\/+$/, '')
if (basePath && !basePath.startsWith('/')) {
	throw new Error('PUBLIC_BASE_PATH must start with a slash.')
}
app.locals.basePath = basePath

// Input validation
app.use((req, res, next) => {
	const hasNonAsciiHeader = Object.values(req.headers)
		.flat()
		.some((value) => (
			typeof value === 'string' && /[^\x00-\x7F]/.test(value)
		))
	if (hasNonAsciiHeader) {
		return next(new HttpError(400, 'Request headers must contain only ASCII characters.'))
	}
	return next()
})

// Parse JSON and URL-encoded request bodies.
app.use(express.json({ limit: '16kb' }))
app.use(express.urlencoded({
	extended: true,
	limit: '16kb',
	parameterLimit: 200,
}))

// Allow POST requests to override the HTTP method through the _method query parameter.
app.use(methodOverride('_method'))

// Enable cross-origin resource sharing.
app.use(cors())

// Configure Handlebars as the view engine.
app.engine('.hbs', engine({ extname: '.hbs', defaultLayout: 'main' }))
app.set('view engine', 'hbs')
app.set('views', fileURLToPath(new URL('../views', import.meta.url)))

const router = express.Router()
router.use(express.static('public'))
router.use(express.static(fileURLToPath(new URL('../public', import.meta.url))))

// Render the home page at the root route.
router.get('/', (req, res) => {
	res.render('home.hbs')
})

// Mount the gem and fusion routes.
router.use('/gem', gem)
router.use('/fusion', fusion)
router.use(HttpError.handle)
app.use(basePath || '/', router)

// Input validation
app.use((err, req, res, next) => {
	if (err?.type === 'entity.too.large' || err?.type === 'parameters.too.many') {
		return HttpError.handle(new HttpError(413, 'Request body exceeds the allowed size.'), req, res, next)
	}
	if (err?.type === 'entity.parse.failed') {
		return HttpError.handle(new HttpError(400, 'Invalid request body.'), req, res, next)
	}
	return HttpError.handle(err, req, res, next)
})

export default app
