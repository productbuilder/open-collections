import {
	createSpatialResponsePayload,
	normalizeSpatialQueryInput,
} from "../../../../shared/data/spatial/spatial-query-contract.js";

const HILVERSUM_FEATURES = Object.freeze([
	{
		id: "stub-point-1",
		type: "Feature",
		geometry: {
			type: "Point",
			coordinates: [5.1769, 52.225],
		},
		properties: {
			id: "stub-point-1",
			kind: "point",
			label: "Hilversum Center",
			type: "place",
		},
	},
	{
		id: "stub-point-2",
		type: "Feature",
		geometry: {
			type: "Point",
			coordinates: [5.1712, 52.2295],
		},
		properties: {
			id: "stub-point-2",
			kind: "point",
			label: "Media Park",
			type: "media",
		},
	},
	{
		id: "stub-point-3",
		type: "Feature",
		geometry: {
			type: "Point",
			coordinates: [5.1862, 52.2198],
		},
		properties: {
			id: "stub-point-3",
			kind: "point",
			label: "Station Hilversum",
			type: "station",
		},
	},
	{
		id: "stub-line-1",
		type: "Feature",
		geometry: {
			type: "LineString",
			coordinates: [
				[5.1696, 52.226],
				[5.1769, 52.225],
				[5.1836, 52.2234],
			],
		},
		properties: {
			id: "stub-line-1",
			kind: "line",
			label: "Stub transit corridor",
			type: "route",
		},
	},
	{
		id: "stub-polygon-1",
		type: "Feature",
		geometry: {
			type: "Polygon",
			coordinates: [
				[
					[5.1728, 52.2286],
					[5.1806, 52.2286],
					[5.1806, 52.2232],
					[5.1728, 52.2232],
					[5.1728, 52.2286],
				],
			],
		},
		properties: {
			id: "stub-polygon-1",
			kind: "polygon",
			label: "Central focus area",
			type: "area",
		},
	},
]);

function createRequestId() {
	return `stub-spatial-${Date.now()}`;
}

export async function loadStubSpatialResponse(spatialRequest) {
	const normalizedRequest = normalizeSpatialQueryInput(spatialRequest);
	const response = createSpatialResponsePayload();
	const features = HILVERSUM_FEATURES.map((feature) => ({
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
			{ type: "point", count: features.filter((entry) => entry.geometry?.type === "Point").length },
			{ type: "line", count: features.filter((entry) => entry.geometry?.type === "LineString").length },
			{ type: "polygon", count: features.filter((entry) => entry.geometry?.type === "Polygon").length },
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
