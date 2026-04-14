import { createStructuredDiagnostics, getNowMs } from "../browser-diagnostics/index.js";
import {
	appendBrowseFeedStreamChunk,
	buildBrowseFeedEntities,
	createBrowseFeedStreamSession,
	orderBrowseModeCards,
} from "../../../apps/collection-browser/src/state/feed/index.js";

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

function toYearRangeUtc(value, { isEndBound = false } = {}) {
	if (value === null || value === undefined || value === "") {
		return null;
	}
	const text = normalizeText(value);
	if (!text) {
		return null;
	}
	const dateMatch = text.match(
		/^(?<year>[-+]?\d{1,6})(?:-(?<month>\d{2})(?:-(?<day>\d{2}))?)?$/,
	);
	if (!dateMatch?.groups) {
		return null;
	}
	const year = Number(dateMatch.groups.year);
	const month = dateMatch.groups.month ? Number(dateMatch.groups.month) : null;
	const day = dateMatch.groups.day ? Number(dateMatch.groups.day) : null;
	if (!Number.isInteger(year)) {
		return null;
	}
	if (month === null) {
		return isEndBound
			? Date.UTC(year, 11, 31, 23, 59, 59, 999)
			: Date.UTC(year, 0, 1, 0, 0, 0, 0);
	}
	if (!Number.isInteger(month) || month < 1 || month > 12) {
		return null;
	}
	if (day === null) {
		if (isEndBound) {
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
	return isEndBound
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
		? toYearRangeUtc(timeRange.start, { isEndBound: false })
		: Number.NEGATIVE_INFINITY;
	const end = hasEnd
		? toYearRangeUtc(timeRange.end, { isEndBound: true })
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

function buildTextMatchBlob(item = {}, collection = {}, source = {}) {
	return [
		item.title,
		item.description,
		item.creator,
		item.sourceUrl,
		collection.title,
		collection.description,
		collection.manifestUrl,
		source.label,
		source.organizationName,
		...(Array.isArray(item.tags) ? item.tags : []),
		item.type,
	]
		.map((value) => normalizeToken(value))
		.filter(Boolean)
		.join(" ");
}

function collectFilterOptions(items = []) {
	const typeCounts = new Map();
	const tagCounts = new Map();
	for (const item of items) {
		const type = normalizeText(item.type);
		if (type) {
			typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
		}
		for (const tag of Array.isArray(item.tags) ? item.tags : []) {
			const token = normalizeText(tag);
			if (!token) {
				continue;
			}
			tagCounts.set(token, (tagCounts.get(token) || 0) + 1);
		}
	}
	const toOptions = (counts) =>
		[...counts.entries()]
			.sort(([left], [right]) => left.localeCompare(right))
			.map(([value, count]) => ({ value, label: value, count }));
	return {
		types: toOptions(typeCounts),
		tags: toOptions(tagCounts),
	};
}

function createItemCard(item = {}, collection = {}, source = {}, selectedItemRef = null) {
	const subtitle =
		normalizeText(item.temporal?.display) ||
		normalizeText(collection.title) ||
		normalizeText(source.label);
	return {
		browseKind: "item",
		id: item.itemRef,
		title: item.title || item.itemRef,
		subtitle,
		previewUrl: item.media?.thumbnailUrl || item.media?.url || "",
		actionLabel: "View item",
		actionValue: item.itemRef,
		active: selectedItemRef === item.itemRef,
		item: {
			id: item.itemRef,
			title: item.title || item.itemRef,
			description: item.description || "",
			creator: item.creator || "",
			date: item.temporal?.display || "",
			location: item.spatial?.locationLabel || "",
			source: item.sourceUrl || "",
			sourceCollectionId: collection.collectionId || "",
			sourceCollectionTitle: collection.title || "",
			sourceCollectionManifestUrl: collection.manifestUrl || "",
			media: {
				type: item.media?.type || "image",
				url: item.media?.url || "",
				thumbnailUrl: item.media?.thumbnailUrl || item.media?.url || "",
			},
			tags: Array.isArray(item.tags) ? [...item.tags] : [],
			type: item.type || "",
			itemRef: item.itemRef,
		},
	};
}

function createCollectionCard(collection = {}, source = {}, previewItems = [], selectedManifestUrl = "") {
	const previewImages = previewItems
		.map((item) => item?.media?.thumbnailUrl || item?.media?.url || "")
		.filter(Boolean)
		.slice(0, 6);
	return {
		browseKind: "collection",
		id: collection.collectionId,
		title: collection.title || collection.collectionId,
		subtitle:
			normalizeText(source.organizationName) ||
			normalizeText(source.label) ||
			"Collection",
		countLabel: `${Number(collection.includedItemCount || 0)} item${Number(collection.includedItemCount || 0) === 1 ? "" : "s"}`,
		previewImages,
		actionLabel: "Open collection",
		actionValue: collection.manifestUrl || "",
		manifestUrl: collection.manifestUrl || "",
		active:
			Boolean(selectedManifestUrl) &&
			normalizeText(selectedManifestUrl) === normalizeText(collection.manifestUrl),
		sourceId: source.sourceId || "",
		sourceLabel: source.label || "",
		sourceTitle: source.label || "",
		sourceDisplayName:
			source.organizationName || source.label || "",
		sourceOrganizationName: source.organizationName || "",
		sourceCuratorName: source.curatorName || "",
		collection: {
			id: collection.collectionId,
			title: collection.title || "",
			description: collection.description || "",
			items: previewItems.map((item) => ({
				id: item.itemRef,
				title: item.title || item.itemRef,
				media: {
					type: item.media?.type || "image",
					url: item.media?.url || "",
					thumbnailUrl: item.media?.thumbnailUrl || item.media?.url || "",
				},
			})),
		},
	};
}


function getItemPreviewUrl(item = {}) {
	return normalizeText(item?.media?.thumbnailUrl || item?.media?.url || "");
}

function buildSourcePreviewRows(sourceCollections = [], sourceItems = []) {
	if (!Array.isArray(sourceCollections) || !Array.isArray(sourceItems)) {
		return [];
	}
	const previewUrlsByCollectionId = new Map();
	for (const item of sourceItems) {
		const collectionId = normalizeText(item?.collectionId);
		const previewUrl = getItemPreviewUrl(item);
		if (!collectionId || !previewUrl) {
			continue;
		}
		const existing = previewUrlsByCollectionId.get(collectionId) || [];
		if (existing.length >= 3) {
			continue;
		}
		existing.push(previewUrl);
		previewUrlsByCollectionId.set(collectionId, existing);
	}
	return sourceCollections
		.map((collection) =>
			previewUrlsByCollectionId.get(normalizeText(collection?.collectionId)) || [],
		)
		.filter((row) => row.length > 0)
		.slice(0, 3);
}
function createSourceCard(
	source = {},
	collectionCount = 0,
	itemCount = 0,
	previewRows = [],
) {
	const normalizedPreviewRows = Array.isArray(previewRows)
		? previewRows.filter((row) => Array.isArray(row) && row.length > 0).slice(0, 3)
		: [];
	return {
		browseKind: "source",
		id: source.sourceId,
		title: source.label || source.sourceId,
		organizationName: source.organizationName || source.label || source.sourceId,
		curatorName: source.curatorName || "",
		placeName: source.placeName || "",
		countryName: source.countryName || "",
		countryCode: source.countryCode || "",
		descriptor: "Source",
		subtitle: "",
		countLabel: `${collectionCount} collection${collectionCount === 1 ? "" : "s"} • ${itemCount} item${itemCount === 1 ? "" : "s"}`,
		previewRows: normalizedPreviewRows,
		previewImages: normalizedPreviewRows.flat(),
		actionLabel: "Open source",
		actionValue: source.sourceId,
		active: false,
		sourceType: source.sourceType || "",
	};
}

function buildSourceCardSet({
	sources = [],
	collections = [],
	items = [],
	sourceFilter = null,
} = {}) {
	const sourceList = Array.isArray(sources) ? sources : [];
	const collectionList = Array.isArray(collections) ? collections : [];
	const itemList = Array.isArray(items) ? items : [];
	const filter =
		typeof sourceFilter === "function" ? sourceFilter : () => true;
	return sourceList
		.filter((source) => filter(source))
		.map((source) => {
			const sourceCollections = collectionList.filter(
				(collection) => collection.sourceId === source.sourceId,
			);
			const sourceCollectionIds = new Set(
				sourceCollections.map((entry) => entry.collectionId),
			);
			const sourceItems = itemList.filter((item) =>
				sourceCollectionIds.has(item.collectionId),
			);
			return createSourceCard(
				source,
				sourceCollections.length,
				sourceItems.length,
				buildSourcePreviewRows(sourceCollections, sourceItems),
			);
		});
}

function toSortedArrayFromMap(map) {
	return [...map.values()].sort((left, right) =>
		normalizeText(left?.id || left?.sourceId || left?.collectionId).localeCompare(
			normalizeText(right?.id || right?.sourceId || right?.collectionId),
		),
	);
}

function toFeedKey(value) {
	return normalizeText(value);
}

function buildAllModeFeedSessionKey({
	scope = "global",
	sourceCards = [],
	collectionCards = [],
	itemCards = [],
} = {}) {
	const sourceKeys = sourceCards.map((card) => toFeedKey(card?.actionValue || card?.id));
	const collectionKeys = collectionCards.map((card) =>
		toFeedKey(card?.actionValue || card?.manifestUrl || card?.id),
	);
	const itemKeys = itemCards.map((card) => toFeedKey(card?.actionValue || card?.id));
	return JSON.stringify({
		scope: toFeedKey(scope) || "global",
		sourceKeys,
		collectionKeys,
		itemKeys,
	});
}

export function createListProjection({
	store,
	browseQueryState = {},
	viewMode = "all",
} = {}) {
	const projectionStartMs = getNowMs();
	if (!store || typeof store.getSnapshot !== "function") {
		throw new Error("createListProjection requires a runtime store with getSnapshot().");
	}

	const snapshot = store.getSnapshot();
	const query = browseQueryState?.query || {};
	const selection = query?.selection && typeof query.selection === "object" ? query.selection : {};
	const selectedItemRef = normalizeText(selection.itemId || "");
	const selectedManifestUrl = normalizeText(selection.collectionManifestUrl || "");
	const activeSourceScope = normalizeText(selection.sourceId || "");

	const sources = toSortedArrayFromMap(snapshot.sourcesById);
	const collections = toSortedArrayFromMap(snapshot.collectionsById);
	const allItems = toSortedArrayFromMap(snapshot.itemsById);

	const sourceById = snapshot.sourcesById;
	const collectionById = snapshot.collectionsById;

	const sourceScopeSet = new Set(normalizeTokenList(query.sourceIds));
	const collectionManifestScopeSet = new Set(normalizeTokenList(query.collectionManifestUrls));
	const typeFilterSet = new Set(normalizeTokenList(query.types));
	const tagFilterSet = new Set(normalizeTokenList(query.tags));
	const textQuery = normalizeToken(query.text);
	const timeRange = parseActiveTimeRange(query);
	const resolvedViewMode = normalizeText(viewMode) || "all";
	const includedItems = allItems.filter((item) => item.include !== false);

	const scopedItems = [];
	const preTypeItems = [];
	const warnings = [];
	if (Array.isArray(query.categories) && query.categories.length > 0) {
		warnings.push({
			code: "unsupported_filter_categories",
			message: "List adapter currently ignores category filters in canonical projection.",
			context: {
				requestedCount: query.categories.length,
			},
		});
	}
	const skippedCounts = {
		excludedByIncludeFlag: 0,
		excludedBySourceScope: 0,
		excludedByCollectionScope: 0,
		excludedByText: 0,
		excludedByTag: 0,
		excludedByTime: 0,
		excludedByType: 0,
	};
	for (const item of allItems) {
		if (item.include === false) {
			skippedCounts.excludedByIncludeFlag += 1;
			continue;
		}
		const sourceIdToken = normalizeToken(item.sourceId);
		if (sourceScopeSet.size > 0 && !sourceScopeSet.has(sourceIdToken)) {
			skippedCounts.excludedBySourceScope += 1;
			continue;
		}
		const collection = collectionById.get(item.collectionId) || {};
		const manifestToken = normalizeToken(collection.manifestUrl);
		if (
			collectionManifestScopeSet.size > 0 &&
			!collectionManifestScopeSet.has(manifestToken)
		) {
			skippedCounts.excludedByCollectionScope += 1;
			continue;
		}
		if (textQuery) {
			const source = sourceById.get(item.sourceId) || {};
			const blob = buildTextMatchBlob(item, collection, source);
			if (!blob.includes(textQuery)) {
				skippedCounts.excludedByText += 1;
				continue;
			}
		}
		if (tagFilterSet.size > 0) {
			const itemTags = new Set(normalizeTokenList(item.tags));
			const hasTag = [...tagFilterSet].some((token) => itemTags.has(token));
			if (!hasTag) {
				skippedCounts.excludedByTag += 1;
				continue;
			}
		}
		if (timeRange) {
			if (item.temporal?.known !== true) {
				skippedCounts.excludedByTime += 1;
				continue;
			}
			const start = toFiniteNumber(item.temporal?.startMs);
			const end = toFiniteNumber(item.temporal?.endMs);
			if (start === null || end === null) {
				skippedCounts.excludedByTime += 1;
				continue;
			}
			if (end < timeRange.start || start > timeRange.end) {
				skippedCounts.excludedByTime += 1;
				continue;
			}
		}
		preTypeItems.push(item);
		const itemType = normalizeToken(item.type);
		if (typeFilterSet.size > 0 && !typeFilterSet.has(itemType)) {
			skippedCounts.excludedByType += 1;
			continue;
		}
		scopedItems.push(item);
	}

	const filterOptions = collectFilterOptions(preTypeItems);
	const filteredCollectionIds = new Set(scopedItems.map((item) => item.collectionId));
	const filteredSourceIds = new Set(
		[...filteredCollectionIds].map((collectionId) =>
			normalizeText(collectionById.get(collectionId)?.sourceId),
		),
	);

	const scopedSourceCards = buildSourceCardSet({
		sources,
		collections,
		items: scopedItems,
		sourceFilter: (source) => {
			if (!filteredSourceIds.size && scopedItems.length === 0 && preTypeItems.length === 0) {
				return true;
			}
			return filteredSourceIds.has(normalizeText(source.sourceId));
		},
	});
	const globalSourceCards = buildSourceCardSet({
		sources,
		collections,
		items: includedItems,
	});
	const sourceCards =
		resolvedViewMode === "sources" ? globalSourceCards : scopedSourceCards;

	const baseCollectionCards = collections
		.filter((collection) => {
			if (!filteredCollectionIds.size && scopedItems.length === 0 && preTypeItems.length === 0) {
				return true;
			}
			return filteredCollectionIds.has(collection.collectionId);
		})
		.map((collection) => {
			const source = sourceById.get(collection.sourceId) || {};
			const previewItems = scopedItems.filter(
				(item) => item.collectionId === collection.collectionId,
			);
			return createCollectionCard(
				collection,
				source,
				previewItems,
				selectedManifestUrl,
			);
		});

	const baseItemCards = scopedItems.map((item) => {
		const collection = collectionById.get(item.collectionId) || {};
		const source = sourceById.get(item.sourceId) || {};
		return createItemCard(item, collection, source, selectedItemRef);
	});

	const scope =
		sourceScopeSet.size > 0 || collectionManifestScopeSet.size > 0
			? "scoped"
			: "global";
	const exposureNamespace = JSON.stringify({
		scope,
		sourceIds: [...sourceScopeSet].sort((left, right) => left.localeCompare(right)),
		collectionManifestUrls: [...collectionManifestScopeSet].sort((left, right) =>
			left.localeCompare(right),
		),
	});
	const collectionCards = orderBrowseModeCards({
		mode: "collections",
		collectionCards: baseCollectionCards,
		exposureNamespace,
	});
	const itemCards = orderBrowseModeCards({
		mode: "items",
		itemCards: baseItemCards,
		exposureNamespace,
	});
	const feedComposeStartMs = getNowMs();
	const fullAllBrowseEntities = buildBrowseFeedEntities({
		mode: "all",
		sourceCards,
		collectionCards,
		itemCards,
		exposureNamespace,
	});
	const feedSession = createBrowseFeedStreamSession({
		mode: "all",
		sourceCards,
		collectionCards,
		itemCards,
		exposureNamespace,
	});
	const allBrowseEntities =
		feedSession && typeof feedSession === "object"
			? appendBrowseFeedStreamChunk(feedSession, { count: 24 })
			: fullAllBrowseEntities.slice(0, 24);
	const feedCompositionMs = Math.max(0, getNowMs() - feedComposeStartMs);
	const allFeedExhausted = feedSession ? Boolean(feedSession.exhausted) : true;
	const allFeedSessionKey = buildAllModeFeedSessionKey({
		scope: exposureNamespace,
		sourceCards,
		collectionCards,
		itemCards,
	});
	const availableTotals = {
		sources: sources.length,
		collections: collections.length,
		items: allItems.filter((item) => item.include !== false).length,
	};
	const filteredTotals = {
		sources: sourceCards.length,
		collections: collectionCards.length,
		items: itemCards.length,
	};
	const projectionDurationMs = Math.max(0, getNowMs() - projectionStartMs);
	const diagnostics = {
		availableTotals,
		filteredTotals,
		projectionCount: allBrowseEntities.length,
		projectionDurationMs,
		feedCompositionMs,
		skipped: skippedCounts,
		warnings,
		structured: createStructuredDiagnostics({
			kind: "list-adapter",
			counts: {
				sources: availableTotals.sources,
				collections: availableTotals.collections,
				items: availableTotals.items,
				includedItems: availableTotals.items,
				georeferencedItems:
					snapshot?.indexes?.spatial?.georeferencedItemRefs?.length || 0,
				temporalItems:
					snapshot?.indexes?.temporal?.knownItemRefs?.length || 0,
				filtered: {
					sources: filteredTotals.sources,
					collections: filteredTotals.collections,
					items: filteredTotals.items,
				},
				projected: {
					list: allBrowseEntities.length,
				},
			},
			warnings,
			projection: {
				count: allBrowseEntities.length,
				listCount: allBrowseEntities.length,
			},
			timing: {
				totalMs: projectionDurationMs,
				listProjectionMs: projectionDurationMs,
			},
			extra: {
				feedCompositionMs,
				skipped: skippedCounts,
			},
		}),
	};

	const viewportSubtitle =
		resolvedViewMode === "sources"
			? globalSourceCards.length > 0
				? `${globalSourceCards.length} source${globalSourceCards.length === 1 ? "" : "s"} available. Select one to continue.`
				: "No sources available."
			: itemCards.length > 0
				? `${itemCards.length} item${itemCards.length === 1 ? "" : "s"} available.`
				: "No matching items for current filters.";

	return {
		sourceCards,
		collectionCards,
		itemCards,
		allBrowseEntities,
		fullAllBrowseEntities,
		filterOptions,
		total: {
			available: diagnostics.availableTotals,
			filtered: diagnostics.filteredTotals,
		},
		diagnostics,
		model: {
			viewportTitle:
				resolvedViewMode === "sources" ? "Sources" : "Explore and collect",
			viewportSubtitle,
			viewMode: resolvedViewMode,
			showBack:
				resolvedViewMode === "sources"
					? false
					: Boolean(activeSourceScope || selectedManifestUrl),
			sourceCards,
			sourceCardsForSourcesMode: globalSourceCards,
			collectionCards,
			itemCards,
			allBrowseEntities,
			fullAllBrowseEntities,
			allFeedSessionKey,
			allFeedExhausted,
			isAppendingAllFeedChunk: false,
			sources:
				resolvedViewMode === "sources" ? globalSourceCards : sourceCards,
			collections: collectionCards.map((card) => card.collection),
			items: itemCards.map((card) => card.item),
			selectedCollectionManifestUrl: selectedManifestUrl,
			selectedItemId: selectedItemRef || null,
			isLoading: false,
		},
	};
}
