import mongoose from 'mongoose'

// Define the fusion schema.
const Schema = mongoose.Schema
const FusionSchema = new Schema({
	name: {
		type: String,
		required: true,
		unique: true,
	},
	gems: [
		{
			type: Schema.Types.ObjectId,
			ref: 'Gem',
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

export default mongoose.model('Fusion', FusionSchema)
