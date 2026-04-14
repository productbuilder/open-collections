import { normalizeCollection } from "../../library-core/src/model.js";
import { toMetadataDisplayValue } from "../metadata-display-value.js";
import { normalizeIdToken, normalizeText } from "./url-utils.js";

function toFiniteNumber(value) {
	if (value === null || value === undefined || value === "") {
		return null;
	}
	const number = Number(value);
	return Number.isFinite(number) ? number : null;
}

function normalizeTags(values = []) {
	if (!Array.isArray(values)) {
		return [];
	}
	const unique = new Set();
	for (const value of values) {
		const token = normalizeText(value).toLowerCase();
		if (token) {
			unique.add(token);
		}
	}
	return [...unique].sort((left, right) => left.localeCompare(right));
}

function normalizeType(value = "") {
	return normalizeText(value).toLowerCase();
}

function toUtcTimestamp(year, month = 1, day = 1, endOfDay = false) {
	const monthIndex = month - 1;
	if (
		!Number.isInteger(year) ||
		!Number.isInteger(month) ||
		!Number.isInteger(day) ||
		month < 1 ||
		month > 12
	) {
		return null;
	}
	const maxDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
	if (day < 1 || day > maxDay) {
		return null;
	}
	return endOfDay
		? Date.UTC(year, monthIndex, day, 23, 59, 59, 999)
		: Date.UTC(year, monthIndex, day, 0, 0, 0, 0);
}

function parseIsoLikeDateRange(value) {
	const text = normalizeText(value);
	const match = text.match(
		/^(?<year>[-+]?\d{1,6})(?:-(?<month>\d{2})(?:-(?<day>\d{2}))?)?$/,
	);
	if (!match || !match.groups) {
		return null;
	}
	const year = Number(match.groups.year);
	if (!Number.isInteger(year)) {
		return null;
	}
	if (!match.groups.month) {
		return {
			startMs: toUtcTimestamp(year, 1, 1, false),
			endMs: toUtcTimestamp(year, 12, 31, true),
		};
	}
	const month = Number(match.groups.month);
	if (!Number.isInteger(month) || month < 1 || month > 12) {
		return null;
	}
	if (!match.groups.day) {
		const endDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
		return {
			startMs: toUtcTimestamp(year, month, 1, false),
			endMs: toUtcTimestamp(year, month, endDay, true),
		};
	}
	const day = Number(match.groups.day);
	if (!Number.isInteger(day)) {
		return null;
	}
	return {
		startMs: toUtcTimestamp(year, month, day, false),
		endMs: toUtcTimestamp(year, month, day, true),
	};
}

function parseDateRange(value) {
	const text = normalizeText(value);
	const match = text.match(
		/^(?<start>[-+]?\d{1,6}(?:-\d{2}(?:-\d{2})?)?)\s*(?:to|\/|–|—|-)\s*(?<end>[-+]?\d{1,6}(?:-\d{2}(?:-\d{2})?)?)$/i,
	);
	if (!match || !match.groups) {
		return null;
	}
	const start = parseIsoLikeDateRange(match.groups.start);
	const end = parseIsoLikeDateRange(match.groups.end);
	if (!start || !end) {
		return null;
	}
	return {
		startMs: Math.min(start.startMs, end.startMs),
		endMs: Math.max(start.endMs, end.endMs),
	};
}

function parseTemporal(rawItem = {}) {
	const temporalCandidate = normalizeText(
		toMetadataDisplayValue(rawItem?.date) ||
			toMetadataDisplayValue(rawItem?.time) ||
			toMetadataDisplayValue(rawItem?.year) ||
			toMetadataDisplayValue(rawItem?.dateLabel) ||
			toMetadataDisplayValue(rawItem?.temporal?.start) ||
			toMetadataDisplayValue(rawItem?.temporal?.from) ||
			"",
	);
	if (!temporalCandidate) {
		return {
			known: false,
			display: "",
			startMs: null,
			endMs: null,
		};
	}
	const parsed = parseDateRange(temporalCandidate) || parseIsoLikeDateRange(temporalCandidate);
	if (!parsed || !Number.isFinite(parsed.startMs) || !Number.isFinite(parsed.endMs)) {
		return {
			known: false,
			display: temporalCandidate,
			startMs: null,
			endMs: null,
		};
	}
	return {
		known: true,
		display: temporalCandidate,
		startMs: parsed.startMs,
		endMs: parsed.endMs,
	};
}

function normalizeLocation(rawItem = {}, normalizedItem = {}) {
	const location =
		rawItem?.location && typeof rawItem.location === "object" ? rawItem.location : {};
	const lat = toFiniteNumber(location.lat ?? normalizedItem?.location?.lat ?? rawItem?.lat);
	const lon = toFiniteNumber(
		location.lon ?? location.lng ?? normalizedItem?.location?.lon ?? rawItem?.lon ?? rawItem?.lng,
	);
	const hasCoordinates =
		lat !== null &&
		lon !== null &&
		lat >= -90 &&
		lat <= 90 &&
		lon >= -180 &&
		lon <= 180;
	return {
		hasCoordinates,
		lat: hasCoordinates ? lat : null,
		lon: hasCoordinates ? lon : null,
		locationLabel: normalizeText(location.name || normalizedItem?.locationLabel || ""),
	};
}

function makeCollectionId({
	sourceId,
	manifestUrl,
	rawCollectionId,
	collectionTitle,
	ordinal = 1,
}) {
	const preferredToken =
		normalizeIdToken(rawCollectionId) ||
		normalizeIdToken(collectionTitle) ||
		normalizeIdToken(new URL(manifestUrl).pathname.split("/").at(-2)) ||
		`collection-${ordinal}`;
	return `${sourceId}::${preferredToken}`;
}

function makeItemSuffix(rawItemId, itemIndex) {
	const rawToken = normalizeIdToken(rawItemId);
	if (rawToken) {
		return rawToken;
	}
	const ordinal = String(itemIndex + 1).padStart(6, "0");
	return `ord-${ordinal}`;
}

export function normalizeManifestToCanonicalEntities({
	sourceEntity,
	descriptor,
	collectionRef,
	manifestJson,
	normalizeCounter = null,
}) {
	normalizeCounter?.();
	const manifestUrl = collectionRef.manifestUrl;
	const normalizedCollection = normalizeCollection(manifestJson, { manifestUrl });
	const rawCollectionId = normalizeText(normalizedCollection.id || manifestJson?.id || "");
	const collectionId = makeCollectionId({
		sourceId: sourceEntity.sourceId,
		manifestUrl,
		rawCollectionId,
		collectionTitle: normalizedCollection.title || manifestJson?.title || "",
		ordinal: 1,
	});

	const itemRefOccurrence = new Map();
	const rawItems = Array.isArray(manifestJson?.items) ? manifestJson.items : [];
	const normalizedItems = Array.isArray(normalizedCollection?.items) ? normalizedCollection.items : [];
	const itemEntities = [];
	let includedItemCount = 0;
	let hasSpatialItems = false;
	let hasTemporalItems = false;

	for (let index = 0; index < normalizedItems.length; index += 1) {
		const normalizedItem = normalizedItems[index] || {};
		const rawItem = rawItems[index] && typeof rawItems[index] === "object" ? rawItems[index] : {};
		const rawItemId = normalizeText(rawItem.id || "");
		const itemSuffix = makeItemSuffix(rawItemId, index);
		const baseItemRef = `${collectionId}#${itemSuffix}`;
		const occurrence = (itemRefOccurrence.get(baseItemRef) || 0) + 1;
		itemRefOccurrence.set(baseItemRef, occurrence);
		const itemRef = occurrence > 1 ? `${baseItemRef}~${occurrence}` : baseItemRef;
		const include = normalizedItem.include !== false && rawItem.include !== false;
		if (include) {
			includedItemCount += 1;
		}
		const tags = normalizeTags(
			Array.isArray(rawItem.tags) && rawItem.tags.length ? rawItem.tags : normalizedItem.tags,
		);
		const type = normalizeType(rawItem.type || normalizedItem.type || "");
		const spatial = normalizeLocation(rawItem, normalizedItem);
		const temporal = parseTemporal(rawItem);
		hasSpatialItems = hasSpatialItems || spatial.hasCoordinates;
		hasTemporalItems = hasTemporalItems || temporal.known;
		itemEntities.push({
			itemRef,
			rawItemId,
			sourceId: sourceEntity.sourceId,
			collectionId,
			title: normalizeText(normalizedItem.title) || `Item ${index + 1}`,
			description: normalizeText(normalizedItem.description),
			creator: normalizeText(normalizedItem.creator),
			sourceUrl: normalizeText(normalizedItem.source || rawItem.source || ""),
			include,
			tags,
			type,
			media: {
				type: normalizeType(normalizedItem.media?.type || rawItem?.media?.type || "image") || "image",
				url: normalizeText(normalizedItem.media?.url),
				thumbnailUrl: normalizeText(normalizedItem.media?.thumbnailUrl),
				mimeType: normalizeType(rawItem?.media?.mimeType || ""),
			},
			spatial,
			temporal,
			raw: rawItem && typeof rawItem === "object" ? { ...rawItem } : {},
		});
	}

	const collectionEntity = {
		collectionId,
		rawCollectionId,
		sourceId: sourceEntity.sourceId,
		manifestUrl,
		title:
			normalizeText(normalizedCollection.title) ||
			normalizeText(collectionRef.label) ||
			"Collection",
		description: normalizeText(
			normalizedCollection.description || collectionRef.description || "",
		),
		publisher: normalizeText(manifestJson?.publisher || ""),
		license: normalizeText(manifestJson?.license || ""),
		attribution: normalizeText(manifestJson?.attribution || ""),
		itemCount: itemEntities.length,
		includedItemCount,
		hasSpatialItems,
		hasTemporalItems,
		meta: {
			descriptorCollectionRefId: normalizeText(collectionRef.collectionRefId),
			sourceTitle: normalizeText(descriptor?.catalog?.title || ""),
			rawManifest: manifestJson && typeof manifestJson === "object" ? { ...manifestJson } : {},
		},
	};

	return {
		sourceEntity,
		collectionEntity,
		itemEntities,
	};
}
