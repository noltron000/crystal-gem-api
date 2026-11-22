import { HttpError } from './http-errors.mjs'

export const validateRequestBody = (schema) => (req, res, next) => {
	const { error, value } = schema.validate(req.body)
	if (error) return next(new HttpError(400, error.message))
	req.body = value
	return next()
}
