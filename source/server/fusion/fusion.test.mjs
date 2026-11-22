import mongoose from 'mongoose'

after(async () => {
	// Reset Mongoose's model caches before closing the test connection.
	// This works around https://github.com/Automattic/mongoose/issues/1251#issuecomment-65793092.
	mongoose.models = {}
	mongoose.modelSchemas = {}
	await mongoose.connection.close()
})

describe('## Fusion APIs', () => {
	// TODO: Fusion API tests have not been implemented yet.
})
