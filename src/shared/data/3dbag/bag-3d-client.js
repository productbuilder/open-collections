export const BAG_3D_ENDPOINTS = {
	pandItems: "https://api.3dbag.nl/collections/pand/items",
	// Documented public 3D Tiles pattern (version segment varies per release):
	// https://data.3dbag.nl/<version>/cesium3dtiles/lod22/tileset.json
	threeDTilesTemplate: "https://data.3dbag.nl/{version}/cesium3dtiles/{lod}/tileset.json",
};

export function createBagPandItemsUrl({
	bbox,
	limit = 200,
	format = "json",
	endpoint = BAG_3D_ENDPOINTS.pandItems,
} = {}) {
	if (!Array.isArray(bbox) || bbox.length !== 4) {
		throw new TypeError("bbox must be an array: [west, south, east, north].");
	}

	const [west, south, east, north] = bbox.map(Number);
	if (![west, south, east, north].every(Number.isFinite)) {
		throw new TypeError("bbox entries must be finite numbers.");
	}

	const url = new URL(endpoint);
	url.searchParams.set("bbox", `${west},${south},${east},${north}`);
	url.searchParams.set("limit", String(Math.max(1, Math.round(Number(limit) || 1))));
	url.searchParams.set("f", format);
	return url.toString();
}

export async function fetchBagPandItems(
	query,
	{ signal, fetchImpl = globalThis.fetch } = {},
) {
	if (typeof fetchImpl !== "function") {
		throw new TypeError("fetchImpl must be a function.");
	}

	const requestUrl = createBagPandItemsUrl(query);
	const response = await fetchImpl(requestUrl, {
		signal,
		headers: {
			Accept: "application/geo+json, application/json",
		},
	});

	if (!response.ok) {
		throw new Error(`3DBAG API request failed with HTTP ${response.status}.`);
	}
	return response.json();
}
