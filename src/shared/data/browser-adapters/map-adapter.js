import { createStructuredDiagnostics, getNowMs } from "../browser-diagnostics/index.js";

function normalizeText(value) {
	return String(value ?? "").trim();
}

function normalizeToken(value) {
	return normalizeText(value).toLowerCase();
}

function toFiniteNumber(value) {
	if (value === null || value === undefined || value === "") {
		return null;
	}
	const number = Number(value);
	return Number.isFinite(number) ? number : null;
}

function normalizeTokenList(values = []) {
	if (!Array.isArray(values)) {
		return [];
	}
	const unique = new Set();
	for (const value of values) {
		const token = normalizeToken(value);
		if (token) {
			unique.add(token);
		}
	}
	return [...unique];
}

function parseTemporalBound(value, { isEnd = false } = {}) {
	if (value === null || value === undefined || value === "") {
		return null;
	}
	const text = normalizeText(value);
	if (!text) {
		return null;
	}
	const match = text.match(
		/^(?<year>[-+]?\d{1,6})(?:-(?<month>\d{2})(?:-(?<day>\d{2}))?)?$/,
	);
	if (!match?.groups) {
		return null;
	}
	const year = Number(match.groups.year);
	if (!Number.isInteger(year)) {
		return null;
	}
	const month = match.groups.month ? Number(match.groups.month) : null;
	const day = match.groups.day ? Number(match.groups.day) : null;
	if (month === null) {
		return isEnd
			? Date.UTC(year, 11, 31, 23, 59, 59, 999)
			: Date.UTC(year, 0, 1, 0, 0, 0, 0);
	}
	if (!Number.isInteger(month) || month < 1 || month > 12) {
		return null;
	}
	if (day === null) {
		if (isEnd) {
			const monthEndDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
			return Date.UTC(year, month - 1, monthEndDay, 23, 59, 59, 999);
		}
		return Date.UTC(year, month - 1, 1, 0, 0, 0, 0);
	}
	if (!Number.isInteger(day) || day < 1 || day > 31) {
		return null;
	}
	const monthEndDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
	if (day > monthEndDay) {
		return null;
	}
	return isEnd
		? Date.UTC(year, month - 1, day, 23, 59, 59, 999)
		: Date.UTC(year, month - 1, day, 0, 0, 0, 0);
}

function parseActiveTimeRange(query = {}) {
	const timeRange = query?.timeRange && typeof query.timeRange === "object" ? query.timeRange : {};
	const hasStart = timeRange.start !== null && timeRange.start !== undefined && timeRange.start !== "";
	const hasEnd = timeRange.end !== null && timeRange.end !== undefined && timeRange.end !== "";
	if (!hasStart && !hasEnd) {
		return null;
	}
	const start = hasStart
		? parseTemporalBound(timeRange.start, { isEnd: false })
		: Number.NEGATIVE_INFINITY;
	const end = hasEnd
		? parseTemporalBound(timeRange.end, { isEnd: true })
		: Number.POSITIVE_INFINITY;
	if (!Number.isFinite(start) && start !== Number.NEGATIVE_INFINITY) {
		return null;
	}
	if (!Number.isFinite(end) && end !== Number.POSITIVE_INFINITY) {
		return null;
	}
	if (start > end) {
		return null;
	}
	return { start, end };
}

function inViewportBbox(item = {}, viewport = {}) {
	const bbox = viewport?.bbox && typeof viewport.bbox === "object" ? viewport.bbox : null;
	if (!bbox) {
		return true;
	}
	const lat = toFiniteNumber(item?.spatial?.lat);
	const lon = toFiniteNumber(item?.spatial?.lon);
	if (lat === null || lon === null) {
		return false;
	}
	return (
		lon >= Number(bbox.west) &&
		lon <= Number(bbox.east) &&
		lat >= Number(bbox.south) &&
		lat <= Number(bbox.north)
	);
}

function buildTextBlob(item = {}, collection = {}, source = {}) {
	return [
		item.title,
		item.description,
		item.creator,
		item.sourceUrl,
		collection.title,
		collection.description,
		source.label,
		source.organizationName,
		...(Array.isArray(item.tags) ? item.tags : []),
		item.type,
		item.spatial?.locationLabel,
		item.temporal?.display,
	]
		.map((value) => normalizeToken(value))
		.filter(Boolean)
		.join(" ");
}

function collectFilterOptions(features = []) {
	const typeCounts = new Map();
	const tagCounts = new Map();
	for (const feature of features) {
		const properties = feature?.properties || {};
		const type = normalizeText(properties.type);
		if (type) {
			typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
		}
		for (const tag of Array.isArray(properties.tags) ? properties.tags : []) {
			const token = normalizeText(tag);
			if (!token) {
				continue;
			}
			tagCounts.set(token, (tagCounts.get(token) || 0) + 1);
		}
	}
	const toEntries = (map) =>
		[...map.entries()]
			.sort(([left], [right]) => left.localeCompare(right))
			.map(([value, count]) => ({ value, label: value, count }));
	return {
		types: toEntries(typeCounts),
		tags: toEntries(tagCounts),
		categories: [],
	};
}

export function createMapProjection({
	store,
	browseQueryState = {},
	viewport = null,
} = {}) {
	const projectionStartMs = getNowMs();
	if (!store || typeof store.getSnapshot !== "function") {
		throw new Error("createMapProjection requires runtime store.");
	}
	const snapshot = store.getSnapshot();
	const query = browseQueryState?.query || {};
	const sourceById = snapshot.sourcesById;
	const collectionById = snapshot.collectionsById;
	const allItems = [...snapshot.itemsById.values()].sort((left, right) =>
		normalizeText(left.itemRef).localeCompare(normalizeText(right.itemRef)),
	);

	const sourceScope = new Set(normalizeTokenList(query.sourceIds));
	const collectionManifestScope = new Set(normalizeTokenList(query.collectionManifestUrls));
	const typeFilter = new Set(normalizeTokenList(query.types));
	const tagFilter = new Set(normalizeTokenList(query.tags));
	const textQuery = normalizeToken(query.text);
	const timeRange = parseActiveTimeRange(query);

	let skippedMissingSpatial = 0;
	let skippedInvalidSpatial = 0;
	let skippedBySourceScope = 0;
	let skippedByCollectionScope = 0;
	let skippedByText = 0;
	let skippedByType = 0;
	let skippedByTag = 0;
	let skippedByTime = 0;
	let skippedByViewport = 0;
	let includedTotal = 0;
	let georeferencedTotal = 0;
	const features = [];
	for (const item of allItems) {
		if (item.include === false) {
			continue;
		}
		includedTotal += 1;
		const collection = collectionById.get(item.collectionId) || {};
		const source = sourceById.get(item.sourceId) || {};
		if (sourceScope.size > 0 && !sourceScope.has(normalizeToken(item.sourceId))) {
			skippedBySourceScope += 1;
			continue;
		}
		if (collectionManifestScope.size > 0) {
			const manifestToken = normalizeToken(collection.manifestUrl);
			if (!collectionManifestScope.has(manifestToken)) {
				skippedByCollectionScope += 1;
				continue;
			}
		}
		if (textQuery) {
			const blob = buildTextBlob(item, collection, source);
			if (!blob.includes(textQuery)) {
				skippedByText += 1;
				continue;
			}
		}
		if (typeFilter.size > 0) {
			const itemType = normalizeToken(item.type);
			if (!typeFilter.has(itemType)) {
				skippedByType += 1;
				continue;
			}
		}
		if (tagFilter.size > 0) {
			const itemTags = new Set(normalizeTokenList(item.tags));
			const hasTag = [...tagFilter].some((token) => itemTags.has(token));
			if (!hasTag) {
				skippedByTag += 1;
				continue;
			}
		}
		if (timeRange) {
			if (item.temporal?.known !== true) {
				skippedByTime += 1;
				continue;
			}
			const start = toFiniteNumber(item.temporal?.startMs);
			const end = toFiniteNumber(item.temporal?.endMs);
			if (start === null || end === null) {
				skippedByTime += 1;
				continue;
			}
			if (end < timeRange.start || start > timeRange.end) {
				skippedByTime += 1;
				continue;
			}
		}
		if (item.spatial?.hasCoordinates !== true) {
			skippedMissingSpatial += 1;
			continue;
		}
		const lat = toFiniteNumber(item.spatial.lat);
		const lon = toFiniteNumber(item.spatial.lon);
		if (
			lat === null ||
			lon === null ||
			lat < -90 ||
			lat > 90 ||
			lon < -180 ||
			lon > 180
		) {
			skippedInvalidSpatial += 1;
			continue;
		}
		georeferencedTotal += 1;
		if (!inViewportBbox(item, viewport)) {
			skippedByViewport += 1;
			continue;
		}
		features.push({
			type: "Feature",
			id: item.itemRef,
			geometry: {
				type: "Point",
				coordinates: [lon, lat],
			},
			properties: {
				id: item.itemRef,
				itemRef: item.itemRef,
				itemId: item.itemRef,
				title: item.title || item.itemRef,
				subtitle: item.temporal?.display || "",
				description: item.description || "",
				category: item.type || "",
				type: item.type || "",
				format: item.media?.type || "",
				sourceLabel: source.label || "",
				sourceUrl: item.sourceUrl || "",
				imageUrl: item.media?.thumbnailUrl || item.media?.url || "",
				thumbnailUrl: item.media?.thumbnailUrl || item.media?.url || "",
				mediaUrl: item.media?.url || "",
				mediaType: item.media?.type || "",
				tags: Array.isArray(item.tags) ? [...item.tags] : [],
				dateLabel: item.temporal?.display || "",
				timeStart: item.temporal?.startMs ?? null,
				timeEnd: item.temporal?.endMs ?? null,
				timeKnown: item.temporal?.known === true,
				locationLabel: item.spatial?.locationLabel || "",
				collectionId: collection.collectionId || item.collectionId,
				collectionTitle: collection.title || "",
				sourceId: item.sourceId,
			},
		});
	}

	const filterOptions = collectFilterOptions(features);
	const aggregates = {
		totalApprox: features.length,
		byType: [{ type: "point", count: features.length }],
		byTimeBucket: [],
	};
	const projectionDurationMs = Math.max(0, getNowMs() - projectionStartMs);
	const warnings = [];
	if (Array.isArray(query.categories) && query.categories.length > 0) {
		warnings.push({
			code: "unsupported_filter_categories",
			message: "Map adapter currently ignores category filters in canonical projection.",
			context: {
				requestedCount: query.categories.length,
			},
		});
	}
	const skippedBreakdown = {
		missingSpatial: skippedMissingSpatial,
		invalidSpatial: skippedInvalidSpatial,
		byViewport: skippedByViewport,
		bySourceScope: skippedBySourceScope,
		byCollectionScope: skippedByCollectionScope,
		byText: skippedByText,
		byType: skippedByType,
		byTag: skippedByTag,
		byTime: skippedByTime,
	};
	const structured = createStructuredDiagnostics({
		kind: "map-adapter",
		counts: {
			sources: snapshot.sourcesById.size,
			collections: snapshot.collectionsById.size,
			items: snapshot.itemsById.size,
			includedItems: includedTotal,
			georeferencedItems: georeferencedTotal,
			temporalItems: snapshot?.indexes?.temporal?.knownItemRefs?.length || 0,
			filtered: {
				sources: sourceScope.size > 0 ? sourceScope.size : snapshot.sourcesById.size,
				collections:
					collectionManifestScope.size > 0
						? collectionManifestScope.size
						: snapshot.collectionsById.size,
				items: features.length,
			},
			projected: {
				map: features.length,
			},
		},
		warnings,
		projection: {
			count: features.length,
			mapCount: features.length,
			viewportFilteredCount: skippedByViewport,
		},
		timing: {
			totalMs: projectionDurationMs,
			mapProjectionMs: projectionDurationMs,
		},
		extra: {
			skipped: skippedBreakdown,
		},
	});

	return {
		response: {
			request: {
				requestId: `shell-map-${Date.now()}`,
				mode: "browser-runtime-store",
			},
			features,
			clusters: [],
			aggregates,
			pageInfo: {
				cursor: null,
				hasMore: false,
			},
			meta: {
				isPartial: Boolean(viewport?.bbox),
				dataShape: "features",
				generatedAt: new Date().toISOString(),
				totalItems: allItems.length,
				georeferencedItems: georeferencedTotal,
				filteredGeoreferencedItems: features.length,
				filterOptions,
				projectionSource: "shell-runtime-store",
			},
		},
		filterOptions,
		diagnostics: {
			totalItems: allItems.length,
			totalGeoreferencedItems: georeferencedTotal,
			filteredVisibleItems: features.length,
			skippedMissingSpatial,
			skippedInvalidSpatial,
			skippedByViewport,
			skippedBySourceScope,
			skippedByCollectionScope,
			skippedByText,
			skippedByType,
			skippedByTag,
			skippedByTime,
			projectionCount: features.length,
			projectionDurationMs,
			viewportFilteringApplied: Boolean(viewport?.bbox),
			warnings,
			structured,
		},
	};
}
