const DEFAULT_COLLECTION_QUERY = Object.freeze({
	text: "",
	keywords: [],
	tags: [],
	types: [],
	categories: [],
	sourceIds: [],
	collectionManifestUrls: [],
	timeRange: Object.freeze({
		start: null,
		end: null,
	}),
	selection: Object.freeze({
		sourceId: "",
		collectionManifestUrl: "",
		itemId: null,
		featureId: null,
	}),
});

function normalizeText(value) {
	return String(value ?? "").trim();
}

function normalizeStringList(value) {
	if (!Array.isArray(value)) {
		return [];
	}
	const unique = new Set();
	for (const entry of value) {
		const text = normalizeText(entry);
		if (!text) {
			continue;
		}
		unique.add(text);
	}
	return [...unique];
}

function normalizeNullableBound(value) {
	if (value === null || value === undefined || value === "") {
		return null;
	}
	const text = normalizeText(value);
	return text || null;
}

export function createCollectionQueryState() {
	return {
		text: DEFAULT_COLLECTION_QUERY.text,
		keywords: [],
		tags: [],
		types: [],
		categories: [],
		sourceIds: [],
		collectionManifestUrls: [],
		timeRange: {
			start: DEFAULT_COLLECTION_QUERY.timeRange.start,
			end: DEFAULT_COLLECTION_QUERY.timeRange.end,
		},
		selection: {
			sourceId: DEFAULT_COLLECTION_QUERY.selection.sourceId,
			collectionManifestUrl:
				DEFAULT_COLLECTION_QUERY.selection.collectionManifestUrl,
			itemId: DEFAULT_COLLECTION_QUERY.selection.itemId,
			featureId: DEFAULT_COLLECTION_QUERY.selection.featureId,
		},
	};
}

export function normalizeCollectionQueryState(partialQuery = {}, baseQuery = null) {
	const base =
		baseQuery && typeof baseQuery === "object"
			? baseQuery
			: createCollectionQueryState();
	const partial =
		partialQuery && typeof partialQuery === "object" ? partialQuery : {};
	const partialTimeRange =
		partial.timeRange && typeof partial.timeRange === "object"
			? partial.timeRange
			: {};
	const partialSelection =
		partial.selection && typeof partial.selection === "object"
			? partial.selection
			: {};

	const nextText =
		partial.text === undefined
			? normalizeText(base.text)
			: normalizeText(partial.text);

	return {
		text: nextText,
		keywords:
			partial.keywords === undefined
				? normalizeStringList(base.keywords)
				: normalizeStringList(partial.keywords),
		tags:
			partial.tags === undefined
				? normalizeStringList(base.tags)
				: normalizeStringList(partial.tags),
		types:
			partial.types === undefined
				? normalizeStringList(base.types)
				: normalizeStringList(partial.types),
		categories:
			partial.categories === undefined
				? normalizeStringList(base.categories)
				: normalizeStringList(partial.categories),
		sourceIds:
			partial.sourceIds === undefined
				? normalizeStringList(base.sourceIds)
				: normalizeStringList(partial.sourceIds),
		collectionManifestUrls:
			partial.collectionManifestUrls === undefined
				? normalizeStringList(base.collectionManifestUrls)
				: normalizeStringList(partial.collectionManifestUrls),
		timeRange: {
			start:
				partialTimeRange.start === undefined
					? normalizeNullableBound(base.timeRange?.start)
					: normalizeNullableBound(partialTimeRange.start),
			end:
				partialTimeRange.end === undefined
					? normalizeNullableBound(base.timeRange?.end)
					: normalizeNullableBound(partialTimeRange.end),
		},
		selection: {
			sourceId:
				partialSelection.sourceId === undefined
					? normalizeText(base.selection?.sourceId)
					: normalizeText(partialSelection.sourceId),
			collectionManifestUrl:
				partialSelection.collectionManifestUrl === undefined
					? normalizeText(base.selection?.collectionManifestUrl)
					: normalizeText(partialSelection.collectionManifestUrl),
			itemId:
				partialSelection.itemId === undefined
					? base.selection?.itemId || null
					: partialSelection.itemId || null,
			featureId:
				partialSelection.featureId === undefined
					? base.selection?.featureId || null
					: partialSelection.featureId || null,
		},
	};
}

export function normalizeCollectionQueryFilterPatch(
	filterPatch = {},
	baseQuery = null,
) {
	const partial =
		filterPatch && typeof filterPatch === "object" ? filterPatch : {};
	const base =
		baseQuery && typeof baseQuery === "object"
			? baseQuery
			: createCollectionQueryState();
	return normalizeCollectionQueryState(
		{
			text: partial.text,
			keywords: partial.keywords,
			tags: partial.tags,
			types: partial.types,
			categories: partial.categories,
			sourceIds: partial.sourceIds,
			collectionManifestUrls: partial.collectionManifestUrls,
			timeRange: base.timeRange,
			selection: base.selection,
		},
		base,
	);
}

export { DEFAULT_COLLECTION_QUERY };
