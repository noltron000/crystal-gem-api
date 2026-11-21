import mongoose from 'mongoose'

/**
 * root level hooks
 */
after(async () => {
	// required because https://github.com/Automattic/mongoose/issues/1251#issuecomment-65793092
	mongoose.models = {}
	mongoose.modelSchemas = {}
	await mongoose.connection.close()
})

describe('## Gem APIs', () => {
	// #TODO: Implement gem-test.mjs.
})
