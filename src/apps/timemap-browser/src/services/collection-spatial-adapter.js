import { normalizeTemporalDisplayValue } from "./temporal-normalization.js";

function toTrimmedText(value) {
	return String(value ?? "").trim();
}

function toFiniteCoordinate(value) {
	const number = Number(value);
	if (!Number.isFinite(number)) {
		return null;
	}
	return number;
}

function readLongitude(location = {}) {
	const lon = toFiniteCoordinate(location.lon);
	if (lon !== null) {
		return lon;
	}
	return toFiniteCoordinate(location.lng);
}

function readLatitude(location = {}) {
	return toFiniteCoordinate(location.lat);
}

function hasNonEmptyText(value) {
	return toTrimmedText(value).length > 0;
}

function normalizeItemType(value) {
	const normalized = toTrimmedText(value);
	return normalized ? normalized : null;
}

function deriveFormat(item = {}, media = {}) {
	const explicitCandidates = [item.format, item.mediaFormat, media.format];
	for (const candidate of explicitCandidates) {
		const value = toTrimmedText(candidate);
		if (value) {
			return value.toLowerCase();
		}
	}

	const mediaType = toTrimmedText(media.type).toLowerCase();
	if (mediaType.includes("/")) {
		const subtype = toTrimmedText(mediaType.split("/")[1]);
		if (subtype) {
			return subtype.toLowerCase();
		}
	}

	const mediaUrl = toTrimmedText(media.url);
	const extensionMatch = mediaUrl.match(/\.([a-z0-9]+)(?:[?#].*)?$/i);
	if (extensionMatch?.[1]) {
		return extensionMatch[1].toLowerCase();
	}

	return "";
}

function deriveSubtitle(item = {}) {
	if (hasNonEmptyText(item.subtitle)) {
		return toTrimmedText(item.subtitle);
	}
	if (hasNonEmptyText(item.date)) {
		return toTrimmedText(item.date);
	}
	const tags = Array.isArray(item.tags)
		? item.tags.map((entry) => toTrimmedText(entry)).filter(Boolean)
		: [];
	if (tags.length > 0) {
		return tags.slice(0, 3).join(" · ");
	}
	return "";
}

function deriveDescription(item = {}) {
	if (hasNonEmptyText(item.description)) {
		return toTrimmedText(item.description);
	}
	const source = toTrimmedText(item.source);
	if (source) {
		return `Source: ${source}`;
	}
	return "";
}

function deriveTemporalDisplayValue(item = {}) {
	const directCandidates = [item.date, item.time, item.year, item.dateLabel];
	for (const candidate of directCandidates) {
		if (hasNonEmptyText(candidate)) {
			return toTrimmedText(candidate);
		}
	}

	const temporal = item && typeof item.temporal === "object" ? item.temporal : null;
	if (temporal) {
		const start = toTrimmedText(temporal.start || temporal.from);
		const end = toTrimmedText(temporal.end || temporal.to);
		if (start && end) {
			return `${start} to ${end}`;
		}
		if (start) {
			return start;
		}
		if (end) {
			return end;
		}
	}

	const startCandidates = [item.dateStart, item.startDate, item.startYear];
	const endCandidates = [item.dateEnd, item.endDate, item.endYear];
	const start = startCandidates.map((entry) => toTrimmedText(entry)).find(Boolean) || "";
	const end = endCandidates.map((entry) => toTrimmedText(entry)).find(Boolean) || "";
	if (start && end) {
		return `${start} to ${end}`;
	}
	return start || end || "";
}

function deriveCollectionItemFeature(item = {}, index = 0, collection = {}) {
	const location = item && typeof item.location === "object" ? item.location : {};
	const lat = readLatitude(location);
	const lon = readLongitude(location);
	if (lat === null || lon === null) {
		return null;
	}
	if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
		return null;
	}

	const id = toTrimmedText(item.id) || `collection-item-${index + 1}`;
	const media = item && typeof item.media === "object" ? item.media : {};
	const thumbnailUrl = toTrimmedText(media.thumbnailUrl);
	const mediaUrl = toTrimmedText(media.url);
	const imageUrl = thumbnailUrl || mediaUrl || "";
	const title =
		toTrimmedText(item.title) || toTrimmedText(item.name) || `Collection item ${index + 1}`;
	const sourceUrl = toTrimmedText(item.source);
	const sourceLabel = sourceUrl || toTrimmedText(collection.title) || "Collection source";
	const tags = Array.isArray(item.tags)
		? item.tags.map((entry) => toTrimmedText(entry)).filter(Boolean)
		: [];
	const primaryTag = tags[0] || "";
	const category =
		toTrimmedText(item.category) || toTrimmedText(item.type) || primaryTag || "collection-item";
	const format = deriveFormat(item, media);
	const mediaType = toTrimmedText(media.type) || "image";
	const itemType = normalizeItemType(item.type);
	const temporal = normalizeTemporalDisplayValue(deriveTemporalDisplayValue(item));

	return {
		type: "Feature",
		id,
		geometry: {
			type: "Point",
			coordinates: [lon, lat],
		},
		properties: {
			id,
			itemId: id,
			title,
			subtitle: deriveSubtitle(item),
			description: deriveDescription(item),
			category,
			type: itemType,
			format,
			sourceLabel,
			sourceUrl,
			imageUrl,
			thumbnailUrl,
			mediaUrl,
			mediaType,
			tags,
			dateLabel: temporal.temporalDisplayValue,
			timeStart: temporal.timeStart,
			timeEnd: temporal.timeEnd,
			timeKnown: temporal.timeKnown,
			locationLabel: toTrimmedText(location.name),
			collectionId: toTrimmedText(collection.id),
			collectionTitle: toTrimmedText(collection.title),
		},
	};
}

export function mapCollectionItemsToSpatialFeatures(collection = {}) {
	const items = Array.isArray(collection?.items) ? collection.items : [];
	const features = [];
	let georeferencedCount = 0;

	for (const [index, item] of items.entries()) {
		const feature = deriveCollectionItemFeature(item, index, collection);
		if (!feature) {
			continue;
		}
		georeferencedCount += 1;
		features.push(feature);
	}

	return {
		totalItems: items.length,
		georeferencedCount,
		features,
	};
}
