export const serialize = (doc) => {
	if (!doc) return null
	if (Array.isArray(doc)) return doc.map(serialize)
	return doc.toObject ? doc.toObject() : doc
}
