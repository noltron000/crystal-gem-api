export const validateRequestBody = (schema) => (req, res, next) => {
	const { error, value } = schema.validate(req.body)
	if (error) return res.status(400).send(error.message)
	req.body = value
	return next()
}
