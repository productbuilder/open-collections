const BAG_VIEWER_NUMERIC_KEYS = ["rdx", "rdy", "ox", "oy", "oz"];

function parseNumericParam(value) {
	if (value === null || value === undefined || value === "") {
		return null;
	}
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : null;
}

export function parseBagViewerUrl(inputUrl) {
	const resolvedUrl =
		inputUrl instanceof URL ? inputUrl : new URL(String(inputUrl));

	const parsed = {};
	for (const key of BAG_VIEWER_NUMERIC_KEYS) {
		parsed[key] = parseNumericParam(resolvedUrl.searchParams.get(key));
	}
	return parsed;
}

export function createBagViewerUrl(params = {}) {
	const url = new URL("https://www.3dbag.nl/en/viewer");
	for (const key of BAG_VIEWER_NUMERIC_KEYS) {
		const value = params[key];
		if (value === null || value === undefined || value === "") {
			continue;
		}
		const numericValue = Number(value);
		if (!Number.isFinite(numericValue)) {
			throw new TypeError(`${key} must be a finite number.`);
		}
		url.searchParams.set(key, String(numericValue));
	}
	return url.toString();
}
