export const isDuplicateNameError = (err) => (
	// MongoDB uses error code 11000 for duplicate-key errors.
	err?.code === 11000
	// Make sure `err.keyPattern` has the name property.
	&& Object.hasOwn(err.keyPattern ?? {}, 'name')
)

export class HttpError extends Error {
	static handle(err, req, res, next) {
		if (!(err instanceof HttpError)) return next(err)
		return res.status(err.status).json(err.response)
	}

	constructor(status, message) {
		super(message)
		this.name = new.target.name
		this.status = status
		this.response = { error: message }
	}
}

export class GemInvalidIDError extends HttpError {
	constructor() {
		super(400, 'Invalid gem ID.')
	}
}

export class GemNotFoundError extends HttpError {
	constructor() {
		super(404, 'Gem not found.')
	}
}

export class GemDuplicateNameError extends HttpError {
	constructor() {
		super(409, 'A gem with that name already exists.')
	}
}

export class FusionInvalidIDError extends HttpError {
	constructor() {
		super(400, 'Invalid fusion ID.')
	}
}

export class FusionInvalidGemsError extends HttpError {
	constructor() {
		super(400, 'The selected gems are invalid or no longer exist.')
	}
}

export class FusionNotFoundError extends HttpError {
	constructor() {
		super(404, 'Fusion not found.')
	}
}

export class FusionDuplicateNameError extends HttpError {
	constructor() {
		super(409, 'A fusion with that name already exists.')
	}
}
