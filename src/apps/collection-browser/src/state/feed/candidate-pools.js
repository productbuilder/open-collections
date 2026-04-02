// Feed v1 candidates are normalized wrappers around existing browse entities.
// We keep `entity` on each candidate so rendering can stay behavior-identical
// while scoring/assembly evolve in later iterations.

function normalizeList(value) {
	return Array.isArray(value) ? value.filter(Boolean) : [];
}

function toNonEmptyText(value) {
	const text = String(value ?? "").trim();
	return text || "";
}

function resolveSourceId(entity = {}) {
	return (
		toNonEmptyText(entity.sourceId) ||
		toNonEmptyText(entity.id) ||
		toNonEmptyText(entity.actionValue)
	);
}

function resolveCollectionId(entity = {}) {
	return (
		toNonEmptyText(entity.collectionId) ||
		toNonEmptyText(entity.id) ||
		toNonEmptyText(entity.manifestUrl) ||
		toNonEmptyText(entity.actionValue)
	);
}

function toSourceCandidate(entity = {}, index = 0) {
	const id =
		toNonEmptyText(entity.id) ||
		toNonEmptyText(entity.actionValue) ||
		`source-${index + 1}`;
	const sourceId = resolveSourceId(entity) || id;
	return {
		id,
		type: "source",
		sourceId,
		collectionId: "",
		actionValue: toNonEmptyText(entity.actionValue),
		title:
			toNonEmptyText(entity.organizationName) ||
			toNonEmptyText(entity.title) ||
			toNonEmptyText(entity.label),
		entity,
	};
}

function toCollectionCandidate(entity = {}, index = 0) {
	const id =
		toNonEmptyText(entity.id) ||
		toNonEmptyText(entity.manifestUrl) ||
		toNonEmptyText(entity.actionValue) ||
		`collection-${index + 1}`;
	return {
		id,
		type: "collection",
		sourceId: toNonEmptyText(entity.sourceId),
		collectionId: resolveCollectionId(entity) || id,
		actionValue: toNonEmptyText(entity.actionValue),
		title:
			toNonEmptyText(entity.title) ||
			toNonEmptyText(entity.label),
		entity,
	};
}

function toItemCandidate(entity = {}, index = 0) {
	const id =
		toNonEmptyText(entity.id) ||
		toNonEmptyText(entity.actionValue) ||
		`item-${index + 1}`;
	const rawSourceCollectionId = toNonEmptyText(entity.item?.sourceCollectionId);
	const derivedSourceId = rawSourceCollectionId.includes("::")
		? rawSourceCollectionId.split("::")[0]
		: "";
	return {
		id,
		type: "item",
		sourceId: toNonEmptyText(entity.sourceId) || derivedSourceId,
		collectionId:
			toNonEmptyText(entity.collectionId) ||
			rawSourceCollectionId ||
			toNonEmptyText(entity.item?.sourceCollectionManifestUrl),
		actionValue: toNonEmptyText(entity.actionValue),
		title:
			toNonEmptyText(entity.title) ||
			toNonEmptyText(entity.item?.title),
		entity,
		mediaType: toNonEmptyText(entity.mediaType),
	};
}

export function buildCandidatePools({
	sourceCards = [],
	collectionCards = [],
	itemCards = [],
} = {}) {
	const sources = normalizeList(sourceCards).map(toSourceCandidate);
	const collections = normalizeList(collectionCards).map(toCollectionCandidate);
	const items = normalizeList(itemCards).map(toItemCandidate);
	return { sources, collections, items };
}
