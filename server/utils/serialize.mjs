/** Convert Mongoose documents or arrays of documents to plain objects, preserving nulls. */
export const serialize = (doc) => {
	if (!doc) return null
	if (Array.isArray(doc)) return doc.map(serialize)
	return doc.toObject ? doc.toObject() : doc
}
