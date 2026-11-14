const mongoose = require('mongoose')

/**
 * root level hooks
 */
after((done) => {
	// required because https://github.com/Automattic/mongoose/issues/1251#issuecomment-65793092
	mongoose.models = {}
	mongoose.modelSchemas = {}
	mongoose.connection.close()
	done()
})

describe('## Fusion APIs', () => {
	// #TODO: Implement fusion-test.js.
})
