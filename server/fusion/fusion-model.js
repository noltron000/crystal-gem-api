// Implement fusion-model.js.
const mongoose = require('mongoose')

// Set Schema
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

module.exports = mongoose.model('Fusion', FusionSchema)
