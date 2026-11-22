import Fusion from '../fusion/fusion-model.mjs'
import { GemReferencedError, HttpError } from './http-errors.mjs'

export const isDuplicateNameError = (err) => (
	// MongoDB uses error code 11000 for duplicate-key errors.
	err?.code === 11000
	// Make sure `err.keyPattern` has the name property.
	&& Object.hasOwn(err.keyPattern ?? {}, 'name')
)

export const assertGemNotReferenced = async (gemID) => {
	if (await Fusion.exists({ gems: gemID })) {
		throw new GemReferencedError()
	}
}

/** Validate the body and replace it with Joi's normalized value before continuing. */
export const validateRequestBody = (schema) => (req, res, next) => {
	const { error, value } = schema.validate(req.body)
	if (error) return next(new HttpError(400, error.message))
	req.body = value
	return next()
}

/** Convert Mongoose documents or arrays of documents to plain objects, preserving nulls. */
export const serialize = (doc) => {
	if (!doc) return null
	if (Array.isArray(doc)) return doc.map(serialize)
	return doc.toObject ? doc.toObject() : doc
}
