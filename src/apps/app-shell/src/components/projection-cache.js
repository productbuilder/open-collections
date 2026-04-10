import { getNowMs } from "../../../../shared/data/browser-diagnostics/index.js";

function normalizeText(value) {
	return String(value ?? "").trim();
}

function normalizeStringList(values = []) {
	if (!Array.isArray(values)) {
		return [];
	}
	return [...new Set(values.map((value) => normalizeText(value)).filter(Boolean))].sort(
		(left, right) => left.localeCompare(right),
	);
}

function normalizeTimeRange(value = {}) {
	const source = value && typeof value === "object" ? value : {};
	return {
		start: normalizeText(source.start),
		end: normalizeText(source.end),
	};
}

function normalizeSelection(value = {}) {
	const source = value && typeof value === "object" ? value : {};
	return {
		sourceId: normalizeText(source.sourceId),
		collectionManifestUrl: normalizeText(source.collectionManifestUrl),
	};
}

function normalizeListSelectionForViewMode(selection = {}, viewMode = "all") {
	const resolvedViewMode = normalizeText(viewMode) || "all";
	if (resolvedViewMode === "sources") {
		return {
			sourceId: "",
			collectionManifestUrl: "",
		};
	}
	return normalizeSelection(selection);
}

function normalizeViewport(viewport = null) {
	const source = viewport && typeof viewport === "object" ? viewport : {};
	const center = source.center && typeof source.center === "object" ? source.center : {};
	const bbox = source.bbox && typeof source.bbox === "object" ? source.bbox : {};
	const pixelSize =
		source.pixelSize && typeof source.pixelSize === "object" ? source.pixelSize : {};
	return {
		center: {
			lng: Number(center.lng) || 0,
			lat: Number(center.lat) || 0,
		},
		zoom: Number(source.zoom) || 0,
		bearing: Number(source.bearing) || 0,
		pitch: Number(source.pitch) || 0,
		bbox: {
			west: Number(bbox.west) || 0,
			south: Number(bbox.south) || 0,
			east: Number(bbox.east) || 0,
			north: Number(bbox.north) || 0,
		},
		pixelSize: {
			width: Number(pixelSize.width) || 0,
			height: Number(pixelSize.height) || 0,
		},
	};
}

function stableStringify(value) {
	if (value === null || typeof value !== "object") {
		return JSON.stringify(value);
	}
	if (Array.isArray(value)) {
		return `[${value.map((entry) => stableStringify(entry)).join(",")}]`;
	}
	const keys = Object.keys(value).sort((left, right) => left.localeCompare(right));
	return `{${keys
		.map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
		.join(",")}}`;
}

function resolveStoreVersion(runtimeStore = null) {
	const version = Number(runtimeStore?.getMeta?.()?.version);
	return Number.isFinite(version) ? version : 0;
}

function buildListProjectionKey({ runtimeStore, browseQueryState, viewMode = "all" } = {}) {
	const query = browseQueryState?.query || {};
	return stableStringify({
		storeVersion: resolveStoreVersion(runtimeStore),
		viewMode: normalizeText(viewMode) || "all",
		query: {
			text: normalizeText(query.text),
			sourceIds: normalizeStringList(query.sourceIds),
			collectionManifestUrls: normalizeStringList(query.collectionManifestUrls),
			types: normalizeStringList(query.types),
			tags: normalizeStringList(query.tags),
			categories: normalizeStringList(query.categories),
			timeRange: normalizeTimeRange(query.timeRange),
			selection: normalizeListSelectionForViewMode(query.selection, viewMode),
		},
	});
}

function buildMapProjectionKey({ runtimeStore, browseQueryState, viewport } = {}) {
	const query = browseQueryState?.query || {};
	return stableStringify({
		storeVersion: resolveStoreVersion(runtimeStore),
		query: {
			text: normalizeText(query.text),
			sourceIds: normalizeStringList(query.sourceIds),
			collectionManifestUrls: normalizeStringList(query.collectionManifestUrls),
			types: normalizeStringList(query.types),
			tags: normalizeStringList(query.tags),
			categories: normalizeStringList(query.categories),
			timeRange: normalizeTimeRange(query.timeRange),
		},
		viewport: normalizeViewport(viewport),
	});
}

function setCacheValue(cache, key, value, maxEntries = 8) {
	if (cache.has(key)) {
		cache.delete(key);
	}
	cache.set(key, value);
	if (cache.size <= maxEntries) {
		return;
	}
	const oldestKey = cache.keys().next().value;
	if (oldestKey !== undefined) {
		cache.delete(oldestKey);
	}
}

export function createBrowseProjectionCache({
	buildListPayload,
	buildMapPayload,
	maxListEntries = 8,
	maxMapEntries = 16,
} = {}) {
	if (typeof buildListPayload !== "function" || typeof buildMapPayload !== "function") {
		throw new Error("createBrowseProjectionCache requires list/map payload builders.");
	}

	const listCache = new Map();
	const mapCache = new Map();
	const stats = {
		list: { hits: 0, misses: 0, recomputes: 0, totalComputeMs: 0 },
		map: { hits: 0, misses: 0, recomputes: 0, totalComputeMs: 0 },
	};

	function getListProjection(args = {}) {
		const key = buildListProjectionKey(args);
		if (listCache.has(key)) {
			stats.list.hits += 1;
			return {
				payload: listCache.get(key),
				cache: { hit: true, key },
			};
		}
		stats.list.misses += 1;
		stats.list.recomputes += 1;
		const startedAt = getNowMs();
		const payload = buildListPayload(args);
		const durationMs = Math.max(0, getNowMs() - startedAt);
		stats.list.totalComputeMs += durationMs;
		setCacheValue(listCache, key, payload, maxListEntries);
		return {
			payload,
			cache: { hit: false, key, durationMs },
		};
	}

	function getMapProjection(args = {}) {
		const key = buildMapProjectionKey(args);
		if (mapCache.has(key)) {
			stats.map.hits += 1;
			return {
				payload: mapCache.get(key),
				cache: { hit: true, key },
			};
		}
		stats.map.misses += 1;
		stats.map.recomputes += 1;
		const startedAt = getNowMs();
		const payload = buildMapPayload(args);
		const durationMs = Math.max(0, getNowMs() - startedAt);
		stats.map.totalComputeMs += durationMs;
		setCacheValue(mapCache, key, payload, maxMapEntries);
		return {
			payload,
			cache: { hit: false, key, durationMs },
		};
	}

	function getStats() {
		return {
			modelVersion: "browser-projection-cache-v1",
			list: {
				...stats.list,
				cacheSize: listCache.size,
			},
			map: {
				...stats.map,
				cacheSize: mapCache.size,
			},
		};
	}

	return Object.freeze({
		getListProjection,
		getMapProjection,
		getStats,
		reset() {
			listCache.clear();
			mapCache.clear();
			stats.list = { hits: 0, misses: 0, recomputes: 0, totalComputeMs: 0 };
			stats.map = { hits: 0, misses: 0, recomputes: 0, totalComputeMs: 0 };
		},
	});
}

export { buildListProjectionKey, buildMapProjectionKey };
