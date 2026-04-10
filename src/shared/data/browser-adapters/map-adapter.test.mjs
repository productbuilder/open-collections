import test from "node:test";
import assert from "node:assert/strict";

import { createBrowserRuntimeStore } from "../browser-runtime/runtime-store.js";
import { createMapProjection } from "./map-adapter.js";

function seedStore() {
	const store = createBrowserRuntimeStore();
	store.mutate.upsertSource({
		sourceId: "source-a",
		label: "Source A",
		sourceType: "source.json",
		sourceUrl: "https://example.org/source-a/source.json",
	});
	store.mutate.upsertCollection({
		collectionId: "source-a::collection-a",
		sourceId: "source-a",
		manifestUrl: "https://example.org/source-a/collection-a/collection.json",
		title: "Collection A",
		itemCount: 3,
		includedItemCount: 3,
		hasSpatialItems: true,
		hasTemporalItems: true,
	});
	store.mutate.upsertItems([
		{
			itemRef: "source-a::collection-a#item-1",
			rawItemId: "item-1",
			sourceId: "source-a",
			collectionId: "source-a::collection-a",
			title: "Town Hall 1932",
			description: "Historic building",
			include: true,
			tags: ["architecture", "photo"],
			type: "image",
			media: { type: "image/jpeg", url: "https://example.org/media/1.jpg" },
			spatial: { hasCoordinates: true, lat: 52.1, lon: 5.1, locationLabel: "Center" },
			temporal: { known: true, display: "1932", startMs: -1199145600000, endMs: -1167609600001 },
		},
		{
			itemRef: "source-a::collection-a#item-2",
			rawItemId: "item-2",
			sourceId: "source-a",
			collectionId: "source-a::collection-a",
			title: "Town Hall 1950",
			include: true,
			tags: ["architecture"],
			type: "image",
			media: { type: "image/jpeg", url: "https://example.org/media/2.jpg" },
			spatial: { hasCoordinates: true, lat: 52.12, lon: 5.12, locationLabel: "Center" },
			temporal: { known: true, display: "1950", startMs: -631152000000, endMs: -599616000001 },
		},
		{
			itemRef: "source-a::collection-a#item-3",
			rawItemId: "item-3",
			sourceId: "source-a",
			collectionId: "source-a::collection-a",
			title: "Letter to Mayor",
			include: true,
			tags: ["text"],
			type: "document",
			media: { type: "application/pdf", url: "https://example.org/media/3.pdf" },
			spatial: { hasCoordinates: false, lat: null, lon: null, locationLabel: "" },
			temporal: { known: false, display: "unknown", startMs: null, endMs: null },
		},
	]);
	return store;
}

test("map adapter returns expected projection shape", () => {
	const projection = createMapProjection({
		store: seedStore(),
		browseQueryState: { query: {} },
	});
	assert.equal(typeof projection, "object");
	assert.equal(typeof projection.response, "object");
	assert.equal(Array.isArray(projection.response.features), true);
	assert.equal(typeof projection.filterOptions, "object");
	assert.equal(typeof projection.diagnostics, "object");
	assert.equal(projection.diagnostics?.structured?.kind, "map-adapter");
	assert.equal(typeof projection.diagnostics?.projectionDurationMs, "number");
});

test("projection preserves canonical ItemRef in feature identity", () => {
	const projection = createMapProjection({
		store: seedStore(),
		browseQueryState: { query: {} },
	});
	const refs = projection.response.features.map((entry) => entry.id);
	assert.deepEqual(refs, [
		"source-a::collection-a#item-1",
		"source-a::collection-a#item-2",
	]);
	assert.equal(
		projection.response.features[0].properties.itemRef,
		"source-a::collection-a#item-1",
	);
});

test("filters by text/type/tag/time", () => {
	const projection = createMapProjection({
		store: seedStore(),
		browseQueryState: {
			query: {
				text: "Town Hall",
				types: ["image"],
				tags: ["architecture"],
				timeRange: { start: "1930", end: "1940" },
			},
		},
	});
	assert.equal(projection.response.features.length, 1);
	assert.equal(projection.response.features[0].id, "source-a::collection-a#item-1");
});

test("supports viewport filtering", () => {
	const projection = createMapProjection({
		store: seedStore(),
		browseQueryState: { query: {} },
		viewport: {
			bbox: {
				west: 5.09,
				south: 52.09,
				east: 5.11,
				north: 52.11,
			},
		},
	});
	assert.equal(projection.response.features.length, 1);
	assert.equal(projection.response.features[0].id, "source-a::collection-a#item-1");
	assert.equal(projection.diagnostics.viewportFilteringApplied, true);
	assert.equal(projection.diagnostics.skippedByViewport, 1);
});

test("map diagnostics include unsupported filter warnings", () => {
	const projection = createMapProjection({
		store: seedStore(),
		browseQueryState: {
			query: {
				categories: ["legacy-category"],
			},
		},
	});
	assert.equal(projection.diagnostics.warnings.length, 1);
	assert.equal(
		projection.diagnostics.warnings[0].code,
		"unsupported_filter_categories",
	);
});
