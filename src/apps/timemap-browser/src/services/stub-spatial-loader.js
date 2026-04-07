import {
	createSpatialResponsePayload,
	normalizeSpatialQueryInput,
} from "../../../../shared/data/spatial/spatial-query-contract.js";
import { HILVERSUM_SPATIAL_FIXTURE_FEATURES } from "../fixtures/hilversum-spatial-fixture.js";

function createRequestId() {
	return `stub-spatial-${Date.now()}`;
}

function countGeometry(features, geometryType) {
	return features.filter((entry) => entry.geometry?.type === geometryType).length;
}

export async function loadStubSpatialResponse(spatialRequest) {
	const normalizedRequest = normalizeSpatialQueryInput(spatialRequest);
	const response = createSpatialResponsePayload();
	const features = HILVERSUM_SPATIAL_FIXTURE_FEATURES.map((feature) => ({
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
	};

	return response;
}
