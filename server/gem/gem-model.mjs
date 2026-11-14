// Implement gem-model.mjs.
import mongoose from 'mongoose'

// Set Schema
const Schema = mongoose.Schema
const GemSchema = new Schema({
	name: {
		type: String,
		required: true,
		unique: true,
	},
	fusions: [
		{
			type: Schema.Types.ObjectId,
			ref: 'Fusion',
		},
	],
	weapon: {
		type: String,
		required: true,
	},
	power: {
		type: String,
		required: true,
	},
})

export default mongoose.model('Gem', GemSchema)
