import test from "node:test";
import assert from "node:assert/strict";

import { createBrowserRuntimeStore } from "../../../../shared/data/browser-runtime/runtime-store.js";
import { buildListSurfaceBridgePayload } from "./list-surface-bridge.js";

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
		itemCount: 1,
		includedItemCount: 1,
		hasSpatialItems: false,
		hasTemporalItems: false,
	});
	store.mutate.upsertItem({
		itemRef: "source-a::collection-a#item-1",
		rawItemId: "item-1",
		sourceId: "source-a",
		collectionId: "source-a::collection-a",
		title: "Item One",
		include: true,
		tags: ["photo"],
		type: "image",
		media: { type: "image/jpeg", url: "https://example.org/a/item-1.jpg" },
		spatial: { hasCoordinates: false, lat: null, lon: null },
		temporal: { known: false, display: "", startMs: null, endMs: null },
	});
	return store;
}

test("shell list bridge builds projection payload for legacy list child", () => {
	const payload = buildListSurfaceBridgePayload({
		runtimeStore: seedStore(),
		browseQueryState: { query: {} },
		viewMode: "all",
	});
	assert.equal(typeof payload, "object");
	assert.equal(typeof payload.projection, "object");
	assert.equal(payload.compatibility.bridgeMode, "shell-list-adapter-v1");
	assert.equal(payload.projection.itemCards.length, 1);
	assert.equal(payload.projection.itemCards[0].item.itemRef, "source-a::collection-a#item-1");
	assert.equal(payload.compatibility.diagnostics.store.kind, "runtime-store");
	assert.equal(payload.compatibility.diagnostics.projection.kind, "list-adapter");
});

test("shell list bridge applies query filtering in new path", () => {
	const payload = buildListSurfaceBridgePayload({
		runtimeStore: seedStore(),
		browseQueryState: { query: { text: "no-match" } },
		viewMode: "items",
	});
	assert.equal(payload.projection.itemCards.length, 0);
	assert.equal(payload.projection.total.filtered.items, 0);
});

test("list bridge projection path does not require direct manifest fetching", () => {
	const originalFetch = globalThis.fetch;
	let fetchCalled = false;
	globalThis.fetch = async () => {
		fetchCalled = true;
		throw new Error("fetch should not be used by list projection bridge");
	};
	try {
		const payload = buildListSurfaceBridgePayload({
			runtimeStore: seedStore(),
			browseQueryState: { query: {} },
			viewMode: "all",
		});
		assert.equal(payload.projection.itemCards.length, 1);
		assert.equal(fetchCalled, false);
	} finally {
		globalThis.fetch = originalFetch;
	}
});

test("list bridge carries mixed-feed model fields for shell/list all-mode composition", () => {
	const payload = buildListSurfaceBridgePayload({
		runtimeStore: seedStore(),
		browseQueryState: { query: {} },
		viewMode: "all",
	});
	assert.equal(typeof payload.projection.model.allFeedSessionKey, "string");
	assert.equal(Array.isArray(payload.projection.model.fullAllBrowseEntities), true);
	assert.equal(Array.isArray(payload.projection.model.allBrowseEntities), true);
	assert.equal(
		payload.projection.model.fullAllBrowseEntities.length >=
			payload.projection.model.allBrowseEntities.length,
		true,
	);
});

test("list bridge preserves source preview rows for legacy list child rendering", () => {
	const payload = buildListSurfaceBridgePayload({
		runtimeStore: seedStore(),
		browseQueryState: { query: {} },
		viewMode: "all",
	});
	assert.deepEqual(payload.projection.sourceCards[0].previewRows, [
		["https://example.org/a/item-1.jpg"],
	]);
	assert.deepEqual(payload.projection.sourceCards[0].previewImages, [
		"https://example.org/a/item-1.jpg",
	]);
});

test("sources-mode bridge payload returns the full canonical source set", () => {
	const store = createBrowserRuntimeStore();
	store.mutate.upsertSource({
		sourceId: "source-a",
		label: "Source A",
		sourceType: "source.json",
		sourceUrl: "https://example.org/a/source.json",
	});
	store.mutate.upsertSource({
		sourceId: "source-b",
		label: "Source B",
		sourceType: "source.json",
		sourceUrl: "https://example.org/b/source.json",
	});
	store.mutate.upsertCollection({
		collectionId: "source-a::collection-a",
		sourceId: "source-a",
		manifestUrl: "https://example.org/a/collection.json",
		title: "Collection A",
		itemCount: 1,
		includedItemCount: 1,
		hasSpatialItems: false,
		hasTemporalItems: false,
	});
	store.mutate.upsertItem({
		itemRef: "source-a::collection-a#item-1",
		rawItemId: "item-1",
		sourceId: "source-a",
		collectionId: "source-a::collection-a",
		title: "Item One",
		include: true,
		tags: ["photo"],
		type: "image",
		media: { type: "image/jpeg", url: "https://example.org/a/item-1.jpg" },
		spatial: { hasCoordinates: false, lat: null, lon: null },
		temporal: { known: false, display: "", startMs: null, endMs: null },
	});
	const payload = buildListSurfaceBridgePayload({
		runtimeStore: store,
		browseQueryState: {
			query: {
				sourceIds: ["source-a"],
				collectionManifestUrls: ["https://example.org/a/collection.json"],
			},
		},
		viewMode: "sources",
	});
	assert.deepEqual(
		payload.projection.sourceCards.map((card) => card.id),
		["source-a", "source-b"],
	);
});
