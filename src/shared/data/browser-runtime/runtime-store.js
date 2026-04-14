import { createStructuredDiagnostics } from "../browser-diagnostics/index.js";
import { toMetadataDisplayValue } from "../metadata-display-value.js";

function normalizeText(value) {
	return String(value ?? "").trim();
}

function normalizeToken(value) {
	return normalizeText(value).toLowerCase();
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
	return [...unique].sort((left, right) => left.localeCompare(right));
}

function toFiniteNumber(value) {
	if (value === null || value === undefined || value === "") {
		return null;
	}
	const number = Number(value);
	return Number.isFinite(number) ? number : null;
}

function normalizeSourceEntity(source = {}) {
	const sourceId = normalizeText(source.sourceId);
	if (!sourceId) {
		throw new Error("SourceEntity.sourceId is required.");
	}
	const label = normalizeText(source.label);
	if (!label) {
		throw new Error("SourceEntity.label is required.");
	}
	const sourceType = normalizeText(source.sourceType);
	if (sourceType !== "source.json" && sourceType !== "collection.json") {
		throw new Error("SourceEntity.sourceType must be \"source.json\" or \"collection.json\".");
	}
	const sourceUrl = normalizeText(source.sourceUrl);
	if (!sourceUrl) {
		throw new Error("SourceEntity.sourceUrl is required.");
	}
	return {
		sourceId,
		label,
		sourceType,
		sourceUrl,
		organizationName: normalizeText(source.organizationName),
		curatorName: normalizeText(source.curatorName),
		placeName: normalizeText(source.placeName),
		countryName: normalizeText(source.countryName),
		countryCode: normalizeText(source.countryCode),
		registrationMeta:
			source.registrationMeta && typeof source.registrationMeta === "object"
				? { ...source.registrationMeta }
				: {},
		descriptorMeta:
			source.descriptorMeta && typeof source.descriptorMeta === "object"
				? { ...source.descriptorMeta }
				: {},
	};
}

function normalizeCollectionEntity(collection = {}) {
	const collectionId = normalizeText(collection.collectionId);
	if (!collectionId) {
		throw new Error("CollectionEntity.collectionId is required.");
	}
	const sourceId = normalizeText(collection.sourceId);
	if (!sourceId) {
		throw new Error("CollectionEntity.sourceId is required.");
	}
	const manifestUrl = normalizeText(collection.manifestUrl);
	if (!manifestUrl) {
		throw new Error("CollectionEntity.manifestUrl is required.");
	}
	const title = normalizeText(collection.title);
	if (!title) {
		throw new Error("CollectionEntity.title is required.");
	}
	const toSafeCount = (value) => {
		const number = Number(value);
		return Number.isFinite(number) && number >= 0 ? Math.floor(number) : 0;
	};
	return {
		collectionId,
		rawCollectionId: normalizeText(collection.rawCollectionId),
		sourceId,
		manifestUrl,
		title,
		description: normalizeText(collection.description),
		publisher: normalizeText(collection.publisher),
		license: normalizeText(collection.license),
		attribution: normalizeText(collection.attribution),
		itemCount: toSafeCount(collection.itemCount),
		includedItemCount: toSafeCount(collection.includedItemCount),
		hasSpatialItems: collection.hasSpatialItems === true,
		hasTemporalItems: collection.hasTemporalItems === true,
		meta: collection.meta && typeof collection.meta === "object" ? { ...collection.meta } : {},
	};
}

function normalizeItemEntity(item = {}) {
	const itemRef = normalizeText(item.itemRef);
	if (!itemRef) {
		throw new Error("ItemEntity.itemRef is required.");
	}
	const sourceId = normalizeText(item.sourceId);
	if (!sourceId) {
		throw new Error("ItemEntity.sourceId is required.");
	}
	const collectionId = normalizeText(item.collectionId);
	if (!collectionId) {
		throw new Error("ItemEntity.collectionId is required.");
	}
	const title = normalizeText(item.title) || itemRef;
	const media = item && typeof item.media === "object" ? item.media : {};
	const mediaType = normalizeToken(media.type) || "image";
	const mediaUrl = normalizeText(media.url);
	const mediaThumbnailUrl = normalizeText(media.thumbnailUrl);
	const mediaMimeType = normalizeToken(media.mimeType);
	const type = normalizeToken(item.type);
	const spatial = item && typeof item.spatial === "object" ? item.spatial : {};
	const lat = toFiniteNumber(spatial.lat);
	const lon = toFiniteNumber(spatial.lon);
	const hasCoordinates =
		lat !== null &&
		lon !== null &&
		lat >= -90 &&
		lat <= 90 &&
		lon >= -180 &&
		lon <= 180;
	const temporal = item && typeof item.temporal === "object" ? item.temporal : {};
	const startMs = toFiniteNumber(temporal.startMs);
	const endMs = toFiniteNumber(temporal.endMs);
	const temporalKnown =
		temporal.known === true || (startMs !== null && endMs !== null && startMs <= endMs);
	return {
		itemRef,
		rawItemId: normalizeText(item.rawItemId),
		sourceId,
		collectionId,
		title,
		description: normalizeText(item.description),
		creator: normalizeText(item.creator),
		sourceUrl: normalizeText(item.sourceUrl),
		include: item.include !== false,
		tags: normalizeTokenList(item.tags),
		type,
		media: {
			type: mediaType,
			url: mediaUrl,
			thumbnailUrl: mediaThumbnailUrl,
			mimeType: mediaMimeType,
		},
		spatial: {
			hasCoordinates,
			lat: hasCoordinates ? lat : null,
			lon: hasCoordinates ? lon : null,
			locationLabel:
				toMetadataDisplayValue(spatial.locationLabel) ||
				normalizeText(spatial.locationLabel),
		},
		temporal: {
			known: temporalKnown,
			display:
				toMetadataDisplayValue(temporal.display) ||
				normalizeText(temporal.display),
			startMs: temporalKnown ? startMs : null,
			endMs: temporalKnown ? endMs : null,
		},
		raw: item.raw && typeof item.raw === "object" ? { ...item.raw } : {},
	};
}

function toStableJSON(value) {
	return JSON.stringify(value);
}

function cloneValue(value) {
	return JSON.parse(JSON.stringify(value));
}

function cloneEntity(entity = {}) {
	return cloneValue(entity);
}

function mapToSortedValues(idSet, sourceMap) {
	if (!(idSet instanceof Set) || idSet.size === 0) {
		return [];
	}
	return [...idSet]
		.sort((left, right) => left.localeCompare(right))
		.map((id) => sourceMap.get(id))
		.filter(Boolean)
		.map(cloneEntity);
}

export function createBrowserRuntimeStore() {
	const sourcesById = new Map();
	const collectionsById = new Map();
	const itemsById = new Map();

	const collectionsBySourceId = new Map();
	const itemsByCollectionId = new Map();

	const tagsIndex = new Map();
	const typesIndex = new Map();
	const temporalKnownItemRefs = new Set();
	const temporalByItemRef = new Map();
	const spatialGeoreferencedItemRefs = new Set();
	const spatialCoordsByItemRef = new Map();

	const sourceFingerprints = new Map();
	const collectionFingerprints = new Map();
	const itemFingerprints = new Map();

	const storeMeta = {
		version: 0,
		builtAt: new Date().toISOString(),
	};

	function ensureSet(map, key) {
		if (!map.has(key)) {
			map.set(key, new Set());
		}
		return map.get(key);
	}

	function addSetValue(map, key, value) {
		ensureSet(map, key).add(value);
	}

	function removeSetValue(map, key, value) {
		const bucket = map.get(key);
		if (!(bucket instanceof Set)) {
			return;
		}
		bucket.delete(value);
		if (bucket.size === 0) {
			map.delete(key);
		}
	}

	function touch() {
		storeMeta.version += 1;
		storeMeta.builtAt = new Date().toISOString();
	}

	function removeItemIndexes(item = {}) {
		removeSetValue(itemsByCollectionId, item.collectionId, item.itemRef);
		for (const tag of Array.isArray(item.tags) ? item.tags : []) {
			removeSetValue(tagsIndex, tag, item.itemRef);
		}
		if (item.type) {
			removeSetValue(typesIndex, item.type, item.itemRef);
		}
		temporalKnownItemRefs.delete(item.itemRef);
		temporalByItemRef.delete(item.itemRef);
		spatialGeoreferencedItemRefs.delete(item.itemRef);
		spatialCoordsByItemRef.delete(item.itemRef);
	}

	function addItemIndexes(item = {}) {
		addSetValue(itemsByCollectionId, item.collectionId, item.itemRef);
		for (const tag of Array.isArray(item.tags) ? item.tags : []) {
			addSetValue(tagsIndex, tag, item.itemRef);
		}
		if (item.type) {
			addSetValue(typesIndex, item.type, item.itemRef);
		}
		if (item.temporal?.known === true) {
			temporalKnownItemRefs.add(item.itemRef);
			const startMs = toFiniteNumber(item.temporal.startMs);
			const endMs = toFiniteNumber(item.temporal.endMs);
			if (startMs !== null && endMs !== null && startMs <= endMs) {
				temporalByItemRef.set(item.itemRef, {
					itemRef: item.itemRef,
					startMs,
					endMs,
				});
			}
		}
		if (item.spatial?.hasCoordinates === true) {
			spatialGeoreferencedItemRefs.add(item.itemRef);
			spatialCoordsByItemRef.set(item.itemRef, {
				lat: item.spatial.lat,
				lon: item.spatial.lon,
			});
		}
	}

	function upsertSource(sourceEntity = {}) {
		const normalized = normalizeSourceEntity(sourceEntity);
		const fingerprint = toStableJSON(normalized);
		const previousFingerprint = sourceFingerprints.get(normalized.sourceId);
		if (fingerprint === previousFingerprint) {
			return false;
		}
		sourcesById.set(normalized.sourceId, normalized);
		sourceFingerprints.set(normalized.sourceId, fingerprint);
		touch();
		return true;
	}

	function upsertCollection(collectionEntity = {}) {
		const normalized = normalizeCollectionEntity(collectionEntity);
		const fingerprint = toStableJSON(normalized);
		const previousFingerprint = collectionFingerprints.get(normalized.collectionId);
		if (fingerprint === previousFingerprint) {
			return false;
		}
		const previous = collectionsById.get(normalized.collectionId);
		if (previous && previous.sourceId !== normalized.sourceId) {
			removeSetValue(collectionsBySourceId, previous.sourceId, previous.collectionId);
		}
		collectionsById.set(normalized.collectionId, normalized);
		collectionFingerprints.set(normalized.collectionId, fingerprint);
		addSetValue(collectionsBySourceId, normalized.sourceId, normalized.collectionId);
		touch();
		return true;
	}

	function upsertItem(itemEntity = {}) {
		const normalized = normalizeItemEntity(itemEntity);
		const fingerprint = toStableJSON(normalized);
		const previousFingerprint = itemFingerprints.get(normalized.itemRef);
		if (fingerprint === previousFingerprint) {
			return false;
		}
		const previous = itemsById.get(normalized.itemRef);
		if (previous) {
			removeItemIndexes(previous);
		}
		itemsById.set(normalized.itemRef, normalized);
		itemFingerprints.set(normalized.itemRef, fingerprint);
		addItemIndexes(normalized);
		touch();
		return true;
	}

	function upsertSources(sourceEntities = []) {
		let changed = false;
		for (const entity of Array.isArray(sourceEntities) ? sourceEntities : []) {
			changed = upsertSource(entity) || changed;
		}
		return changed;
	}

	function upsertCollections(collectionEntities = []) {
		let changed = false;
		for (const entity of Array.isArray(collectionEntities) ? collectionEntities : []) {
			changed = upsertCollection(entity) || changed;
		}
		return changed;
	}

	function upsertItems(itemEntities = []) {
		let changed = false;
		for (const entity of Array.isArray(itemEntities) ? itemEntities : []) {
			changed = upsertItem(entity) || changed;
		}
		return changed;
	}

	function getSource(sourceId = "") {
		const resolved = sourcesById.get(normalizeText(sourceId));
		return resolved ? cloneEntity(resolved) : null;
	}

	function getCollection(collectionId = "") {
		const resolved = collectionsById.get(normalizeText(collectionId));
		return resolved ? cloneEntity(resolved) : null;
	}

	function getItem(itemRef = "") {
		const resolved = itemsById.get(normalizeText(itemRef));
		return resolved ? cloneEntity(resolved) : null;
	}

	function getCollectionsForSource(sourceId = "") {
		return mapToSortedValues(
			collectionsBySourceId.get(normalizeText(sourceId)),
			collectionsById,
		);
	}

	function getItemsForCollection(collectionId = "") {
		return mapToSortedValues(itemsByCollectionId.get(normalizeText(collectionId)), itemsById);
	}

	function getItemsByTag(tag = "") {
		return mapToSortedValues(tagsIndex.get(normalizeToken(tag)), itemsById);
	}

	function getItemsByType(type = "") {
		return mapToSortedValues(typesIndex.get(normalizeToken(type)), itemsById);
	}

	function getGeoreferencedItems() {
		return mapToSortedValues(spatialGeoreferencedItemRefs, itemsById);
	}

	function getTemporalItems() {
		return mapToSortedValues(temporalKnownItemRefs, itemsById);
	}

	function getMeta() {
		return {
			version: storeMeta.version,
			builtAt: storeMeta.builtAt,
			sourceCount: sourcesById.size,
			collectionCount: collectionsById.size,
			itemCount: itemsById.size,
		};
	}

	function getDiagnostics() {
		const includedItems = [...itemsById.values()].filter(
			(item) => item.include !== false,
		).length;
		return createStructuredDiagnostics({
			kind: "runtime-store",
			counts: {
				sources: sourcesById.size,
				collections: collectionsById.size,
				items: itemsById.size,
				includedItems,
				georeferencedItems: spatialGeoreferencedItemRefs.size,
				temporalItems: temporalKnownItemRefs.size,
			},
			timing: {},
		});
	}

	function getSnapshot() {
		const tags = new Map();
		for (const [key, values] of tagsIndex.entries()) {
			tags.set(key, [...values].sort((left, right) => left.localeCompare(right)));
		}
		const types = new Map();
		for (const [key, values] of typesIndex.entries()) {
			types.set(key, [...values].sort((left, right) => left.localeCompare(right)));
		}
		const temporalRanges = [...temporalByItemRef.values()].sort((left, right) =>
			left.itemRef.localeCompare(right.itemRef),
		);
		const spatialBounds = (() => {
			const coords = [...spatialCoordsByItemRef.values()].filter(
				(entry) => Number.isFinite(entry.lat) && Number.isFinite(entry.lon),
			);
			if (!coords.length) {
				return null;
			}
			const lats = coords.map((entry) => entry.lat);
			const lons = coords.map((entry) => entry.lon);
			return {
				minLat: Math.min(...lats),
				minLon: Math.min(...lons),
				maxLat: Math.max(...lats),
				maxLon: Math.max(...lons),
			};
		})();
		return {
			sourcesById: new Map(
				[...sourcesById.entries()].map(([key, value]) => [key, cloneEntity(value)]),
			),
			collectionsById: new Map(
				[...collectionsById.entries()].map(([key, value]) => [key, cloneEntity(value)]),
			),
			itemsById: new Map(
				[...itemsById.entries()].map(([key, value]) => [key, cloneEntity(value)]),
			),
			collectionsBySourceId: new Map(
				[...collectionsBySourceId.entries()].map(([key, value]) => [
					key,
					[...value].sort((left, right) => left.localeCompare(right)),
				]),
			),
			itemsByCollectionId: new Map(
				[...itemsByCollectionId.entries()].map(([key, value]) => [
					key,
					[...value].sort((left, right) => left.localeCompare(right)),
				]),
			),
			indexes: {
				tags,
				types,
				temporal: {
					knownItemRefs: [...temporalKnownItemRefs].sort((left, right) =>
						left.localeCompare(right),
					),
					byStartMs: temporalRanges,
				},
				spatial: {
					georeferencedItemRefs: [...spatialGeoreferencedItemRefs].sort(
						(left, right) => left.localeCompare(right),
					),
					bounds: spatialBounds,
				},
			},
			meta: getMeta(),
		};
	}

	function reset() {
		sourcesById.clear();
		collectionsById.clear();
		itemsById.clear();
		collectionsBySourceId.clear();
		itemsByCollectionId.clear();
		tagsIndex.clear();
		typesIndex.clear();
		temporalKnownItemRefs.clear();
		temporalByItemRef.clear();
		spatialGeoreferencedItemRefs.clear();
		spatialCoordsByItemRef.clear();
		sourceFingerprints.clear();
		collectionFingerprints.clear();
		itemFingerprints.clear();
		touch();
	}

	return Object.freeze({
		getSource,
		getCollection,
		getItem,
		getCollectionsForSource,
		getItemsForCollection,
		getItemsByTag,
		getItemsByType,
		getGeoreferencedItems,
		getTemporalItems,
		getMeta,
		getDiagnostics,
		getSnapshot,
		mutate: Object.freeze({
			upsertSource,
			upsertCollection,
			upsertItem,
			upsertSources,
			upsertCollections,
			upsertItems,
			reset,
		}),
	});
}
