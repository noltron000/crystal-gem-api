// Import Mongoose and utilities before the application modules.
import mongoose from 'mongoose'
import util from 'node:util'

// Load configuration and the Express application before startup.
import config from './config/config.mjs'
import app from './config/express.mjs'
import createDebug from 'debug'

const debug = createDebug('auth-api-starterpack:index')

// Connect to MongoDB before starting the server.
const mongoUri = process.env.MONGODB_URI || config.mongo.host
mongoose.connection.on('error', () => {
	throw new Error(`unable to connect to database: ${mongoUri}`)
})
await mongoose.connect(mongoUri)

// Enable Mongoose debug logging when configured.
if (config.mongooseDebug) {
	mongoose.set('debug', (collectionName, method, query, doc) => {
		debug(`${collectionName}.${method}`, util.inspect(query, false, 20), doc)
	})
}

// Start the server on the configured port.
app.listen(process.env.PORT || config.port, () => {
	console.info(`server started on port ${config.port} (${config.env})`)
})

export default app
