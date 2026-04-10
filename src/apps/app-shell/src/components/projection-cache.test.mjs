import test from "node:test";
import assert from "node:assert/strict";

import {
	buildListProjectionKey,
	buildMapProjectionKey,
	createBrowseProjectionCache,
} from "./projection-cache.js";
import { buildListSurfaceBridgePayload } from "./list-surface-bridge.js";
import { createBrowserRuntimeStore } from "../../../../shared/data/browser-runtime/runtime-store.js";

function createStore(version = 1) {
	return {
		getMeta() {
			return { version };
		},
	};
}

function seedRuntimeStore() {
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
		itemCount: 40,
		includedItemCount: 40,
		hasSpatialItems: true,
		hasTemporalItems: true,
	});
	const items = [];
	for (let i = 1; i <= 40; i += 1) {
		items.push({
			itemRef: `source-a::collection-a#item-${i}`,
			rawItemId: `item-${i}`,
			sourceId: "source-a",
			collectionId: "source-a::collection-a",
			title: `Item ${i}`,
			include: true,
			tags: ["photo"],
			type: "image",
			media: { type: "image/jpeg", url: `https://example.org/media/${i}.jpg` },
			spatial: { hasCoordinates: true, lat: 52 + i / 1000, lon: 5 + i / 1000 },
			temporal: { known: true, display: "1932", startMs: -1199145600000, endMs: -1167609600001 },
		});
	}
	store.mutate.upsertItems(items);
	return store;
}

test("projection cache hits for unchanged list inputs", () => {
	let listBuildCount = 0;
	const cache = createBrowseProjectionCache({
		buildListPayload: () => {
			listBuildCount += 1;
			return { projection: { id: "list" } };
		},
		buildMapPayload: () => ({ projection: { id: "map" } }),
	});
	const args = {
		runtimeStore: createStore(3),
		browseQueryState: { query: { text: "abc", selection: { itemId: "x" } } },
		viewMode: "all",
	};
	const first = cache.getListProjection(args);
	const second = cache.getListProjection(args);
	assert.equal(first.cache.hit, false);
	assert.equal(second.cache.hit, true);
	assert.equal(listBuildCount, 1);
	const stats = cache.getStats();
	assert.equal(stats.list.hits, 1);
	assert.equal(stats.list.misses, 1);
});

test("list cache invalidates when store version changes", () => {
	let listBuildCount = 0;
	const cache = createBrowseProjectionCache({
		buildListPayload: () => {
			listBuildCount += 1;
			return { projection: { id: `list-${listBuildCount}` } };
		},
		buildMapPayload: () => ({ projection: { id: "map" } }),
	});
	cache.getListProjection({
		runtimeStore: createStore(1),
		browseQueryState: { query: { text: "abc" } },
		viewMode: "all",
	});
	cache.getListProjection({
		runtimeStore: createStore(2),
		browseQueryState: { query: { text: "abc" } },
		viewMode: "all",
	});
	assert.equal(listBuildCount, 2);
});

test("map key excludes selection-only fields so list-only query changes avoid map recompute", () => {
	const store = createStore(5);
	const keyA = buildMapProjectionKey({
		runtimeStore: store,
		browseQueryState: { query: { text: "a", selection: { itemId: "one" } } },
		viewport: { center: { lng: 5, lat: 52 }, zoom: 10 },
	});
	const keyB = buildMapProjectionKey({
		runtimeStore: store,
		browseQueryState: { query: { text: "a", selection: { itemId: "two" } } },
		viewport: { center: { lng: 5, lat: 52 }, zoom: 10 },
	});
	assert.equal(keyA, keyB);
});

test("map cache recomputes only when viewport-relevant key changes", () => {
	let mapBuildCount = 0;
	const cache = createBrowseProjectionCache({
		buildListPayload: () => ({ projection: { id: "list" } }),
		buildMapPayload: () => {
			mapBuildCount += 1;
			return { projection: { id: `map-${mapBuildCount}` } };
		},
	});
	const baseArgs = {
		runtimeStore: createStore(7),
		browseQueryState: { query: { text: "abc" } },
		viewport: { center: { lng: 5, lat: 52 }, zoom: 10 },
	};
	cache.getMapProjection(baseArgs);
	cache.getMapProjection(baseArgs);
	cache.getMapProjection({
		...baseArgs,
		viewport: { center: { lng: 5.01, lat: 52 }, zoom: 10 },
	});
	assert.equal(mapBuildCount, 2);
	const stats = cache.getStats();
	assert.equal(stats.map.hits, 1);
	assert.equal(stats.map.misses, 2);
});

test("list key ignores selected item so detail open does not invalidate list projection", () => {
	const store = createStore(1);
	const keyA = buildListProjectionKey({
		runtimeStore: store,
		browseQueryState: { query: { text: "a", selection: { itemId: "one" } } },
		viewMode: "all",
	});
	const keyB = buildListProjectionKey({
		runtimeStore: store,
		browseQueryState: { query: { text: "a", selection: { itemId: "two" } } },
		viewMode: "all",
	});
	assert.equal(keyA, keyB);
});

test("sources-mode list key ignores selection-derived drill context", () => {
	const store = createStore(1);
	const keyA = buildListProjectionKey({
		runtimeStore: store,
		browseQueryState: {
			query: {
				text: "a",
				selection: {
					sourceId: "source-a",
					collectionManifestUrl: "https://example.org/source-a/collection-a.json",
					itemId: "source-a::collection-a#item-1",
				},
			},
		},
		viewMode: "sources",
	});
	const keyB = buildListProjectionKey({
		runtimeStore: store,
		browseQueryState: {
			query: {
				text: "a",
				selection: {
					sourceId: "source-b",
					collectionManifestUrl: "https://example.org/source-b/collection-a.json",
					itemId: "source-b::collection-a#item-9",
				},
			},
		},
		viewMode: "sources",
	});
	assert.equal(keyA, keyB);
});

test("memoized list payload preserves browse/feed chunk window semantics", () => {
	let buildCount = 0;
	const runtimeStore = seedRuntimeStore();
	const cache = createBrowseProjectionCache({
		buildListPayload: (args) => {
			buildCount += 1;
			return buildListSurfaceBridgePayload(args);
		},
		buildMapPayload: () => ({ projection: { id: "map" } }),
	});
	const args = {
		runtimeStore,
		browseQueryState: { query: {} },
		viewMode: "all",
	};
	const first = cache.getListProjection(args).payload;
	const second = cache.getListProjection(args).payload;
	assert.equal(buildCount, 1);
	assert.equal(first.projection.model.allBrowseEntities.length, 24);
	assert.equal(first.projection.model.fullAllBrowseEntities.length > 24, true);
	assert.equal(second.projection.model.allFeedSessionKey, first.projection.model.allFeedSessionKey);
});
