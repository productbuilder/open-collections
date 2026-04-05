import {
	createCollectionQueryState,
	normalizeCollectionQueryState,
} from "../query/collection-query-contract.js";

const DEFAULT_SPATIAL_VIEWPORT = Object.freeze({
	bbox: null,
	center: Object.freeze({
		lng: 0,
		lat: 0,
	}),
	zoom: null,
	bearing: 0,
	pitch: 0,
	pixelSize: Object.freeze({
		width: null,
		height: null,
	}),
});

const DEFAULT_SPATIAL_STRATEGY = Object.freeze({
	mode: "explore",
	density: "auto",
	includeFeatures: true,
	includeClusters: true,
	includeAggregates: false,
});

const DEFAULT_SPATIAL_PAGING = Object.freeze({
	limit: 500,
	cursor: null,
});

const DEFAULT_SPATIAL_CACHE_HINTS = Object.freeze({
	cacheKey: "",
	scope: "viewport",
	maxAgeMs: null,
});

const DEFAULT_SPATIAL_COLLECTION_QUERY = Object.freeze(createCollectionQueryState());

const DEFAULT_SPATIAL_QUERY_INPUT = Object.freeze({
	query: DEFAULT_SPATIAL_COLLECTION_QUERY,
	viewport: DEFAULT_SPATIAL_VIEWPORT,
	strategy: DEFAULT_SPATIAL_STRATEGY,
	paging: DEFAULT_SPATIAL_PAGING,
	cache: DEFAULT_SPATIAL_CACHE_HINTS,
});

const DEFAULT_SPATIAL_RESPONSE_PAYLOAD = Object.freeze({
	request: Object.freeze({
		requestId: "",
		mode: DEFAULT_SPATIAL_STRATEGY.mode,
	}),
	features: Object.freeze([]),
	clusters: Object.freeze([]),
	aggregates: Object.freeze({
		totalApprox: null,
		byType: Object.freeze([]),
		byTimeBucket: Object.freeze([]),
	}),
	pageInfo: Object.freeze({
		cursor: null,
		hasMore: false,
	}),
	meta: Object.freeze({
		isPartial: false,
		dataShape: "features",
		generatedAt: null,
	}),
});

function normalizeText(value) {
	return String(value ?? "").trim();
}

function normalizeFiniteNumber(value, fallback = null) {
	const number = Number(value);
	if (!Number.isFinite(number)) {
		return fallback;
	}
	return number;
}

function normalizeNullablePositiveInteger(value, fallback = null) {
	const number = normalizeFiniteNumber(value, fallback);
	if (!Number.isFinite(number) || number <= 0) {
		return fallback;
	}
	return Math.floor(number);
}

function normalizeLongitude(value, fallback = 0) {
	const longitude = normalizeFiniteNumber(value, fallback);
	return Math.max(-180, Math.min(180, longitude));
}

function normalizeLatitude(value, fallback = 0) {
	const latitude = normalizeFiniteNumber(value, fallback);
	return Math.max(-90, Math.min(90, latitude));
}

function normalizeBbox(bbox) {
	if (!bbox || typeof bbox !== "object") {
		return null;
	}
	const west = normalizeFiniteNumber(bbox.west, null);
	const south = normalizeFiniteNumber(bbox.south, null);
	const east = normalizeFiniteNumber(bbox.east, null);
	const north = normalizeFiniteNumber(bbox.north, null);
	if ([west, south, east, north].some((entry) => entry === null)) {
		return null;
	}
	return {
		west: normalizeLongitude(west),
		south: normalizeLatitude(south),
		east: normalizeLongitude(east),
		north: normalizeLatitude(north),
	};
}

function normalizeSpatialMode(value) {
	if (value === "browse" || value === "focus") {
		return value;
	}
	return "explore";
}

function normalizeSpatialDensity(value) {
	if (value === "points" || value === "clusters" || value === "heatmap") {
		return value;
	}
	return "auto";
}

export function createSpatialViewportInput() {
	return {
		bbox: DEFAULT_SPATIAL_VIEWPORT.bbox,
		center: {
			lng: DEFAULT_SPATIAL_VIEWPORT.center.lng,
			lat: DEFAULT_SPATIAL_VIEWPORT.center.lat,
		},
		zoom: DEFAULT_SPATIAL_VIEWPORT.zoom,
		bearing: DEFAULT_SPATIAL_VIEWPORT.bearing,
		pitch: DEFAULT_SPATIAL_VIEWPORT.pitch,
		pixelSize: {
			width: DEFAULT_SPATIAL_VIEWPORT.pixelSize.width,
			height: DEFAULT_SPATIAL_VIEWPORT.pixelSize.height,
		},
	};
}

export function normalizeSpatialViewportInput(viewport = {}, baseViewport = null) {
	const base =
		baseViewport && typeof baseViewport === "object"
			? baseViewport
			: createSpatialViewportInput();
	const next = viewport && typeof viewport === "object" ? viewport : {};
	const nextCenter = next.center && typeof next.center === "object" ? next.center : {};
	const nextPixelSize =
		next.pixelSize && typeof next.pixelSize === "object" ? next.pixelSize : {};

	return {
		bbox:
			next.bbox === undefined
				? normalizeBbox(base.bbox)
				: normalizeBbox(next.bbox),
		center: {
			lng:
				nextCenter.lng === undefined
					? normalizeLongitude(base.center?.lng, 0)
					: normalizeLongitude(nextCenter.lng, 0),
			lat:
				nextCenter.lat === undefined
					? normalizeLatitude(base.center?.lat, 0)
					: normalizeLatitude(nextCenter.lat, 0),
		},
		zoom:
			next.zoom === undefined
				? normalizeFiniteNumber(base.zoom, null)
				: normalizeFiniteNumber(next.zoom, null),
		bearing:
			next.bearing === undefined
				? normalizeFiniteNumber(base.bearing, 0)
				: normalizeFiniteNumber(next.bearing, 0),
		pitch:
			next.pitch === undefined
				? normalizeFiniteNumber(base.pitch, 0)
				: normalizeFiniteNumber(next.pitch, 0),
		pixelSize: {
			width:
				nextPixelSize.width === undefined
					? normalizeNullablePositiveInteger(base.pixelSize?.width, null)
					: normalizeNullablePositiveInteger(nextPixelSize.width, null),
			height:
				nextPixelSize.height === undefined
					? normalizeNullablePositiveInteger(base.pixelSize?.height, null)
					: normalizeNullablePositiveInteger(nextPixelSize.height, null),
		},
	};
}

export function createSpatialQueryInput() {
	return {
		query: createCollectionQueryState(),
		viewport: createSpatialViewportInput(),
		strategy: {
			mode: DEFAULT_SPATIAL_STRATEGY.mode,
			density: DEFAULT_SPATIAL_STRATEGY.density,
			includeFeatures: DEFAULT_SPATIAL_STRATEGY.includeFeatures,
			includeClusters: DEFAULT_SPATIAL_STRATEGY.includeClusters,
			includeAggregates: DEFAULT_SPATIAL_STRATEGY.includeAggregates,
		},
		paging: {
			limit: DEFAULT_SPATIAL_PAGING.limit,
			cursor: DEFAULT_SPATIAL_PAGING.cursor,
		},
		cache: {
			cacheKey: DEFAULT_SPATIAL_CACHE_HINTS.cacheKey,
			scope: DEFAULT_SPATIAL_CACHE_HINTS.scope,
			maxAgeMs: DEFAULT_SPATIAL_CACHE_HINTS.maxAgeMs,
		},
	};
}

export function normalizeSpatialQueryInput(
	partialSpatialQuery = {},
	baseSpatialQuery = null,
) {
	const base =
		baseSpatialQuery && typeof baseSpatialQuery === "object"
			? baseSpatialQuery
			: createSpatialQueryInput();
	const partial =
		partialSpatialQuery && typeof partialSpatialQuery === "object"
			? partialSpatialQuery
			: {};
	const partialStrategy =
		partial.strategy && typeof partial.strategy === "object" ? partial.strategy : {};
	const partialPaging =
		partial.paging && typeof partial.paging === "object" ? partial.paging : {};
	const partialCache =
		partial.cache && typeof partial.cache === "object" ? partial.cache : {};

	return {
		query:
			partial.query === undefined
				? normalizeCollectionQueryState(base.query)
				: normalizeCollectionQueryState(partial.query, base.query),
		viewport: normalizeSpatialViewportInput(partial.viewport, base.viewport),
		strategy: {
			mode:
				partialStrategy.mode === undefined
					? normalizeSpatialMode(base.strategy?.mode)
					: normalizeSpatialMode(partialStrategy.mode),
			density:
				partialStrategy.density === undefined
					? normalizeSpatialDensity(base.strategy?.density)
					: normalizeSpatialDensity(partialStrategy.density),
			includeFeatures:
				partialStrategy.includeFeatures === undefined
					? Boolean(base.strategy?.includeFeatures)
					: Boolean(partialStrategy.includeFeatures),
			includeClusters:
				partialStrategy.includeClusters === undefined
					? Boolean(base.strategy?.includeClusters)
					: Boolean(partialStrategy.includeClusters),
			includeAggregates:
				partialStrategy.includeAggregates === undefined
					? Boolean(base.strategy?.includeAggregates)
					: Boolean(partialStrategy.includeAggregates),
		},
		paging: {
			limit:
				partialPaging.limit === undefined
					? normalizeNullablePositiveInteger(base.paging?.limit, 500)
					: normalizeNullablePositiveInteger(partialPaging.limit, 500),
			cursor:
				partialPaging.cursor === undefined
					? base.paging?.cursor || null
					: partialPaging.cursor || null,
		},
		cache: {
			cacheKey:
				partialCache.cacheKey === undefined
					? normalizeText(base.cache?.cacheKey)
					: normalizeText(partialCache.cacheKey),
			scope:
				partialCache.scope === "session" || partialCache.scope === "global"
					? partialCache.scope
					: partialCache.scope === undefined
						? base.cache?.scope || "viewport"
						: "viewport",
			maxAgeMs:
				partialCache.maxAgeMs === undefined
					? normalizeNullablePositiveInteger(base.cache?.maxAgeMs, null)
					: normalizeNullablePositiveInteger(partialCache.maxAgeMs, null),
		},
	};
}

export function createSpatialResponsePayload() {
	return {
		request: {
			requestId: DEFAULT_SPATIAL_RESPONSE_PAYLOAD.request.requestId,
			mode: DEFAULT_SPATIAL_RESPONSE_PAYLOAD.request.mode,
		},
		features: [],
		clusters: [],
		aggregates: {
			totalApprox: DEFAULT_SPATIAL_RESPONSE_PAYLOAD.aggregates.totalApprox,
			byType: [],
			byTimeBucket: [],
		},
		pageInfo: {
			cursor: DEFAULT_SPATIAL_RESPONSE_PAYLOAD.pageInfo.cursor,
			hasMore: DEFAULT_SPATIAL_RESPONSE_PAYLOAD.pageInfo.hasMore,
		},
		meta: {
			isPartial: DEFAULT_SPATIAL_RESPONSE_PAYLOAD.meta.isPartial,
			dataShape: DEFAULT_SPATIAL_RESPONSE_PAYLOAD.meta.dataShape,
			generatedAt: DEFAULT_SPATIAL_RESPONSE_PAYLOAD.meta.generatedAt,
		},
	};
}

export { DEFAULT_SPATIAL_CACHE_HINTS };
export { DEFAULT_SPATIAL_PAGING };
export { DEFAULT_SPATIAL_QUERY_INPUT };
export { DEFAULT_SPATIAL_RESPONSE_PAYLOAD };
export { DEFAULT_SPATIAL_STRATEGY };
export { DEFAULT_SPATIAL_VIEWPORT };
