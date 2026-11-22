import Joi from 'joi'
import dotenv from 'dotenv'

// Load environment variables from the .env file.
dotenv.config()

// Define validation for environment variables.
const envVarsSchema = Joi.object({
	NODE_ENV: Joi.string()
		.allow('development', 'production', 'test', 'provision')
		.default('development'),
	PORT: Joi.number().integer().default(4040),
	MONGOOSE_DEBUG: Joi.boolean().when('NODE_ENV', {
		is: Joi.string().valid('development'),
		then: Joi.boolean().default(true),
		otherwise: Joi.boolean().default(false),
	}),
	MONGODB_URI: Joi.string()
		.uri({ scheme: ['mongodb', 'mongodb+srv'] })
		.required(),
})
	.unknown()
	.required()

const { error, value: envVars } = envVarsSchema.validate(process.env)
if (error) {
	throw new Error(`Config validation error: ${error.message}`)
}

const config = {
	env: envVars.NODE_ENV,
	port: envVars.PORT,
	mongooseDebug: envVars.MONGOOSE_DEBUG,
	mongo: {
		uri: envVars.MONGODB_URI,
	},
}

export default config
