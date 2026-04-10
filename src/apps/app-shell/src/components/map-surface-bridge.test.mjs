import test from "node:test";
import assert from "node:assert/strict";

import { createBrowserRuntimeStore } from "../../../../shared/data/browser-runtime/runtime-store.js";
import { buildMapSurfaceBridgePayload } from "./map-surface-bridge.js";

function seedStore() {
	const store = createBrowserRuntimeStore();
	store.mutate.upsertSource({
		sourceId: "source-a",
		label: "Source A",
		sourceType: "collection.json",
		sourceUrl: "https://example.org/a/collection.json",
	});
	store.mutate.upsertCollection({
		collectionId: "source-a::collection-a",
		sourceId: "source-a",
		manifestUrl: "https://example.org/a/collection.json",
		title: "Collection A",
		itemCount: 2,
		includedItemCount: 2,
		hasSpatialItems: true,
		hasTemporalItems: true,
	});
	store.mutate.upsertItems([
		{
			itemRef: "source-a::collection-a#item-1",
			rawItemId: "item-1",
			sourceId: "source-a",
			collectionId: "source-a::collection-a",
			title: "Item One",
			include: true,
			tags: ["photo"],
			type: "image",
			media: { type: "image/jpeg", url: "https://example.org/a/item-1.jpg" },
			spatial: { hasCoordinates: true, lat: 52.1, lon: 5.1 },
			temporal: { known: true, display: "1930", startMs: -1262304000000, endMs: -1230768000001 },
		},
		{
			itemRef: "source-a::collection-a#item-2",
			rawItemId: "item-2",
			sourceId: "source-a",
			collectionId: "source-a::collection-a",
			title: "Item Two",
			include: true,
			tags: ["drawing"],
			type: "image",
			media: { type: "image/jpeg", url: "https://example.org/a/item-2.jpg" },
			spatial: { hasCoordinates: false, lat: null, lon: null },
			temporal: { known: false, display: "", startMs: null, endMs: null },
		},
	]);
	return store;
}

test("shell map bridge builds projection payload for legacy map child", () => {
	const payload = buildMapSurfaceBridgePayload({
		runtimeStore: seedStore(),
		browseQueryState: { query: {} },
	});
	assert.equal(typeof payload, "object");
	assert.equal(typeof payload.projection, "object");
	assert.equal(payload.compatibility.bridgeMode, "shell-map-adapter-v1");
	assert.equal(payload.projection.response.features.length, 1);
	assert.equal(payload.projection.response.features[0].id, "source-a::collection-a#item-1");
	assert.equal(payload.compatibility.diagnostics.store.kind, "runtime-store");
	assert.equal(payload.compatibility.diagnostics.projection.kind, "map-adapter");
});

test("shell map bridge applies query filtering in new path", () => {
	const payload = buildMapSurfaceBridgePayload({
		runtimeStore: seedStore(),
		browseQueryState: { query: { text: "No match" } },
	});
	assert.equal(payload.projection.response.features.length, 0);
	assert.equal(payload.projection.diagnostics.filteredVisibleItems, 0);
});

test("map bridge projection path does not require direct manifest fetching", () => {
	const originalFetch = globalThis.fetch;
	let fetchCalled = false;
	globalThis.fetch = async () => {
		fetchCalled = true;
		throw new Error("fetch should not be used by map projection bridge");
	};
	try {
		const payload = buildMapSurfaceBridgePayload({
			runtimeStore: seedStore(),
			browseQueryState: { query: {} },
		});
		assert.equal(payload.projection.response.features.length, 1);
		assert.equal(fetchCalled, false);
	} finally {
		globalThis.fetch = originalFetch;
	}
});
