const BASE_PATH = '/crystal-gem-api'

function isAppPath(pathname) {
	return pathname === BASE_PATH || pathname.startsWith(`${BASE_PATH}/`)
}

export default {
	async fetch(request, env) {
		const requestUrl = new URL(request.url)
		if (!isAppPath(requestUrl.pathname)) {
			return fetch(request)
		}

		const renderOrigin = new URL(env.RENDER_ORIGIN)
		const destination = new URL(
			`${requestUrl.pathname}${requestUrl.search}`,
			renderOrigin,
		)

		return fetch(new Request(destination, request))
	},
}
