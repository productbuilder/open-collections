import { normalizeCollection } from "../../../../shared/library-core/src/model.js";
import {
	createSpatialResponsePayload,
	normalizeSpatialQueryInput,
} from "../../../../shared/data/spatial/spatial-query-contract.js";
import { mapCollectionItemsToSpatialFeatures } from "./collection-spatial-adapter.js";

const HILVERSUM_COLLECTION_MANIFEST_URL = new URL(
	"../../../../collections/hilversum-wikimedia/collection.json",
	import.meta.url,
).href;

function createRequestId() {
	return `collection-spatial-${Date.now()}`;
}

function countGeometry(features, geometryType) {
	return features.filter((entry) => entry.geometry?.type === geometryType).length;
}

function toNormalizedText(value) {
	return String(value ?? "")
		.trim()
		.toLowerCase();
}

function toNormalizedSet(value) {
	if (!Array.isArray(value)) {
		return new Set();
	}
	return new Set(
		value
			.map((entry) => toNormalizedText(entry))
			.filter(Boolean),
	);
}

function collectTypeValues(properties = {}) {
	const resolvedType = String(properties.type ?? "").trim();
	if (resolvedType) {
		return [resolvedType];
	}
	return [];
}

function createFilterOptions(features = []) {
	const typeCounts = new Map();
	const incrementCount = (counts, value) => {
		const normalizedValue = String(value ?? "").trim();
		if (!normalizedValue) {
			return;
		}
		counts.set(normalizedValue, (counts.get(normalizedValue) || 0) + 1);
	};
	for (const feature of features) {
		const properties = feature?.properties || {};
		const typeCandidates = collectTypeValues(properties);
		const uniqueTypes = new Set(
			typeCandidates.map((entry) => String(entry ?? "").trim()).filter(Boolean),
		);
		for (const typeValue of uniqueTypes) {
			incrementCount(typeCounts, typeValue);
		}
	}
	const toSortedList = (counts) =>
		[...counts.entries()]
			.sort(([leftLabel], [rightLabel]) => leftLabel.localeCompare(rightLabel))
			.map(([value, count]) => ({
				value,
				label: value,
				count,
			}));
	return {
		types: toSortedList(typeCounts),
		categories: [],
	};
}

function featureMatchesFilters(feature = {}, query = {}) {
	const properties = feature?.properties || {};
	const textQuery = toNormalizedText(query.text);
	if (textQuery) {
		const searchableValues = [
			properties.title,
			properties.subtitle,
			properties.description,
			properties.sourceLabel,
			properties.locationLabel,
			properties.dateLabel,
			...(Array.isArray(properties.tags) ? properties.tags : []),
		];
		const searchableText = searchableValues
			.map((entry) => toNormalizedText(entry))
			.filter(Boolean)
			.join(" ");
		if (!searchableText.includes(textQuery)) {
			return false;
		}
	}

	const typeSet = toNormalizedSet(query.types);
	if (typeSet.size > 0) {
		const candidateTypeValues = collectTypeValues(properties).map((entry) =>
			toNormalizedText(entry),
		);
		if (!candidateTypeValues.some((entry) => typeSet.has(entry))) {
			return false;
		}
	}

	return true;
}

export async function loadCollectionSpatialResponse(spatialRequest) {
	const normalizedRequest = normalizeSpatialQueryInput(spatialRequest);
	const response = createSpatialResponsePayload();
	const manifestResponse = await fetch(HILVERSUM_COLLECTION_MANIFEST_URL);
	if (!manifestResponse.ok) {
		throw new Error(
			`Failed to load hilversum-wikimedia collection (${manifestResponse.status}).`,
		);
	}

	const manifestJson = await manifestResponse.json();
	const collection = normalizeCollection(manifestJson, {
		manifestUrl: HILVERSUM_COLLECTION_MANIFEST_URL,
	});
	const mapped = mapCollectionItemsToSpatialFeatures(collection);

	const mappedFeatures = mapped.features.map((feature) => ({
		...feature,
		properties: {
			...feature.properties,
			mode: normalizedRequest.strategy.mode,
			density: normalizedRequest.strategy.density,
		},
	}));
	const filterOptions = createFilterOptions(mappedFeatures);
	const features = mappedFeatures.filter((feature) =>
		featureMatchesFilters(feature, normalizedRequest.query),
	);

	response.request = {
		requestId: createRequestId(),
		mode: normalizedRequest.strategy.mode,
	};
	response.features = features;
	response.aggregates = {
		totalApprox: features.length,
		byType: [
			{ type: "point", count: countGeometry(features, "Point") },
			{ type: "line", count: countGeometry(features, "LineString") },
			{ type: "polygon", count: countGeometry(features, "Polygon") },
		],
		byTimeBucket: [],
	};
	response.meta = {
		isPartial: false,
		dataShape: "features",
		generatedAt: new Date().toISOString(),
		collectionId: collection.id,
		collectionTitle: collection.title,
		totalItems: mapped.totalItems,
		georeferencedItems: mapped.georeferencedCount,
		filteredGeoreferencedItems: features.length,
		filterOptions,
		manifestUrl: HILVERSUM_COLLECTION_MANIFEST_URL,
	};

	return response;
}
