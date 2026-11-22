import mongoose from 'mongoose'

// Define the gem schema.
const Schema = mongoose.Schema
const GemSchema = new Schema({
	name: {
		type: String,
		required: true,
		unique: true,
	},
	weapon: {
		type: String,
		required: true,
	},
	power: {
		type: String,
		required: true,
	},
})

GemSchema.virtual('fusions', {
	ref: 'Fusion',
	localField: '_id',
	foreignField: 'gems',
})

export default mongoose.model('Gem', GemSchema)
