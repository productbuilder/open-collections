const HILVERSUM_GOoi_DEFAULT = Object.freeze({
	centerLat: 52.225,
	centerLng: 5.1769,
	zoom: 13.6,
});

export function parseNumericAttribute(value) {
	if (value === null || value === undefined || value === "") {
		return null;
	}
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : null;
}

export function parseBoundsAttribute(value) {
	if (value === null || value === undefined || value === "") {
		return null;
	}
	const parts = String(value)
		.split(",")
		.map((entry) => Number(entry.trim()));
	if (parts.length !== 4 || parts.some((entry) => !Number.isFinite(entry))) {
		return null;
	}
	const [west, south, east, north] = parts;
	return { west, south, east, north };
}

export function resolveConfiguredInitialMapView(config = {}) {
	if (config?.mapDefaultBounds) {
		return {
			mode: "bounds",
			bounds: config.mapDefaultBounds,
		};
	}
	const hasCenter =
		Number.isFinite(config?.mapDefaultCenterLat) &&
		Number.isFinite(config?.mapDefaultCenterLng);
	const hasZoom = Number.isFinite(config?.mapDefaultZoom);
	if (hasCenter || hasZoom) {
		return {
			mode: "center_zoom",
			centerLat: hasCenter
				? config.mapDefaultCenterLat
				: HILVERSUM_GOoi_DEFAULT.centerLat,
			centerLng: hasCenter
				? config.mapDefaultCenterLng
				: HILVERSUM_GOoi_DEFAULT.centerLng,
			zoom: hasZoom ? config.mapDefaultZoom : HILVERSUM_GOoi_DEFAULT.zoom,
		};
	}
	return null;
}

