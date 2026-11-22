import Joi from 'joi'

export const MAX_NAME_LENGTH = 100
export const MAX_ATTRIBUTE_LENGTH = 500
export const MAX_FUSION_GEMS = 100

const printableAsciiPattern = /^(?![\s\S]*[^\x20-\x7E])[\s\S]*$/

/** Build a Joi schema for trimmed, non-empty printable ASCII text capped at maxLength. */
export const textFieldSchema = (maxLength) => (
	Joi.string()
		.pattern(printableAsciiPattern)
		.custom((value) => value.trim())
		.min(1)
		.max(maxLength)
)
