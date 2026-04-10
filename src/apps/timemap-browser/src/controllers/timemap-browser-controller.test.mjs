import test from "node:test";
import assert from "node:assert/strict";

import { createTimemapBrowserController } from "./timemap-browser-controller.js";

test("setSpatialResponse stores adapter response and preserves selected feature when present", () => {
	const controller = createTimemapBrowserController();
	controller.setSelectedFeature("source-a::collection-a#item-1");
	controller.setSpatialResponse({
		request: { requestId: "req-1", mode: "browser-runtime-store" },
		features: [
			{
				type: "Feature",
				id: "source-a::collection-a#item-1",
				geometry: { type: "Point", coordinates: [5.1, 52.1] },
				properties: {
					id: "source-a::collection-a#item-1",
					itemRef: "source-a::collection-a#item-1",
				},
			},
		],
		aggregates: { totalApprox: 1, byType: [], byTimeBucket: [] },
		meta: { georeferencedItems: 1 },
	});
	const state = controller.getState();
	assert.equal(state.spatial.status, "ready");
	assert.equal(state.spatial.response.features.length, 1);
	assert.equal(state.selectedFeatureId, "source-a::collection-a#item-1");
	assert.equal(state.spatial.response.features[0].properties.itemRef, "source-a::collection-a#item-1");
});

test("setSpatialResponse clears selected feature when it no longer exists", () => {
	const controller = createTimemapBrowserController();
	controller.setSelectedFeature("source-a::collection-a#item-1");
	controller.setSpatialResponse({
		request: { requestId: "req-2", mode: "browser-runtime-store" },
		features: [],
		aggregates: { totalApprox: 0, byType: [], byTimeBucket: [] },
		meta: { georeferencedItems: 0 },
	});
	const state = controller.getState();
	assert.equal(state.selectedFeatureId, null);
});

test("initializeSpatialData uses injected standalone loader instead of hardcoded manifest ingestion", async () => {
	let capturedRequest = null;
	const controller = createTimemapBrowserController(undefined, {
		loadSpatialResponse: async (request) => {
			capturedRequest = request;
			return {
				request: { requestId: "req-standalone", mode: "fixture" },
				features: [],
				clusters: [],
				aggregates: { totalApprox: 0, byType: [], byTimeBucket: [] },
				pageInfo: {},
				meta: { georeferencedItems: 0 },
			};
		},
	});

	await controller.initializeSpatialData();

	assert.equal(typeof capturedRequest, "object");
	assert.equal(controller.getState().spatial.status, "ready");
	assert.equal(controller.getState().status.tone, "positive");
});
