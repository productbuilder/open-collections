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

	const features = mapped.features.map((feature) => ({
		...feature,
		properties: {
			...feature.properties,
			mode: normalizedRequest.strategy.mode,
			density: normalizedRequest.strategy.density,
		},
	}));

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
		manifestUrl: HILVERSUM_COLLECTION_MANIFEST_URL,
	};

	return response;
}
