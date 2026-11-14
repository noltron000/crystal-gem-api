// mongoose and util come first
const mongoose = require('mongoose')
const util = require('util')

// config & app should be imported before any other file
const config = require('./config/config.js')
const app = require('./config/express.js')
const debug = require('debug')('auth-api-starterpack:index')

// connect to mongo db
const mongoUri = process.env.MONGODB_URI || config.mongo.host
mongoose.connect(mongoUri)

mongoose.connection.on('error', () => {
	throw new Error(`unable to connect to database: ${mongoUri}`)
})

// print mongoose logs in dev env
if (config.mongooseDebug) {
	mongoose.set('debug', (collectionName, method, query, doc) => {
		debug(`${collectionName}.${method}`, util.inspect(query, false, 20), doc)
	})
}

// module.parent check is required to support mocha watch
// src: https://github.com/mochajs/mocha/issues/1912
// if (!module.parent) {
// listen on port config.port
app.listen(process.env.PORT || config.port, () => {
	console.info(`server started on port ${config.port} (${config.env})`) // eslint-disable-line no-console
})

module.exports = app
