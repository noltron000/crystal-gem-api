import { HttpError } from './http-errors.mjs'

/** Validate the body and replace it with Joi's normalized value before continuing. */
export const validateRequestBody = (schema) => (req, res, next) => {
	const { error, value } = schema.validate(req.body)
	if (error) return next(new HttpError(400, error.message))
	req.body = value
	return next()
}
