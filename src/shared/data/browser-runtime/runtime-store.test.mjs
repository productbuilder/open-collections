import test from "node:test";
import assert from "node:assert/strict";

import { createBrowserRuntimeStore } from "./runtime-store.js";

function makeSource(overrides = {}) {
	return {
		sourceId: "source-a",
		label: "Source A",
		sourceType: "source.json",
		sourceUrl: "https://example.org/source-a/source.json",
		...overrides,
	};
}

function makeCollection(overrides = {}) {
	return {
		collectionId: "collection-a",
		sourceId: "source-a",
		manifestUrl: "https://example.org/source-a/collection-a/collection.json",
		title: "Collection A",
		itemCount: 0,
		includedItemCount: 0,
		hasSpatialItems: false,
		hasTemporalItems: false,
		...overrides,
	};
}

function makeItem(overrides = {}) {
	return {
		itemRef: "collection-a#item-001",
		rawItemId: "item-001",
		sourceId: "source-a",
		collectionId: "collection-a",
		title: "Item One",
		include: true,
		tags: ["Street", "Photo"],
		type: "Image",
		media: {
			type: "image/jpeg",
			url: "https://example.org/media/item-001.jpg",
			thumbnailUrl: "https://example.org/media/item-001-thumb.jpg",
		},
		spatial: {
			hasCoordinates: true,
			lat: 52.22,
			lon: 5.18,
			locationLabel: "Hilversum",
		},
		temporal: {
			known: true,
			display: "1932",
			startMs: -1199145600000,
			endMs: -1167609600001,
		},
		...overrides,
	};
}

test("source insertion and lookup", () => {
	const store = createBrowserRuntimeStore();
	const versionBefore = store.getMeta().version;
	const changed = store.mutate.upsertSource(makeSource());

	assert.equal(changed, true);
	assert.deepEqual(store.getSource("source-a")?.sourceId, "source-a");
	assert.equal(store.getMeta().sourceCount, 1);
	assert.equal(store.getMeta().version, versionBefore + 1);
});

test("collection insertion and source relation index", () => {
	const store = createBrowserRuntimeStore();
	store.mutate.upsertSource(makeSource());
	store.mutate.upsertCollection(makeCollection());

	const collections = store.getCollectionsForSource("source-a");
	assert.equal(collections.length, 1);
	assert.equal(collections[0].collectionId, "collection-a");
	assert.equal(store.getCollection("collection-a")?.sourceId, "source-a");
});

test("item insertion and lookups by id and collection", () => {
	const store = createBrowserRuntimeStore();
	store.mutate.upsertSource(makeSource());
	store.mutate.upsertCollection(makeCollection());
	store.mutate.upsertItem(makeItem());

	assert.equal(store.getItem("collection-a#item-001")?.rawItemId, "item-001");
	const collectionItems = store.getItemsForCollection("collection-a");
	assert.equal(collectionItems.length, 1);
	assert.equal(collectionItems[0].itemRef, "collection-a#item-001");
});

test("itemRef uniqueness and replacement policy avoid duplicate ownership", () => {
	const store = createBrowserRuntimeStore();
	store.mutate.upsertSource(makeSource());
	store.mutate.upsertCollection(makeCollection());
	store.mutate.upsertCollection(
		makeCollection({
			collectionId: "collection-b",
			manifestUrl: "https://example.org/source-a/collection-b/collection.json",
			title: "Collection B",
		}),
	);

	store.mutate.upsertItem(makeItem());
	store.mutate.upsertItem(
		makeItem({
			collectionId: "collection-b",
			itemRef: "collection-a#item-001",
			title: "Moved Item",
		}),
	);

	assert.equal(store.getItemsForCollection("collection-a").length, 0);
	assert.equal(store.getItemsForCollection("collection-b").length, 1);
	assert.equal(store.getItem("collection-a#item-001")?.collectionId, "collection-b");
	assert.equal(store.getMeta().itemCount, 1);
});

test("tag/type indexes are normalized and deterministic", () => {
	const store = createBrowserRuntimeStore();
	store.mutate.upsertSource(makeSource());
	store.mutate.upsertCollection(makeCollection());
	store.mutate.upsertItem(makeItem({ tags: ["PHOTO", "street", "Street"], type: " IMAGE " }));

	const byTag = store.getItemsByTag("photo");
	const byType = store.getItemsByType("image");
	assert.equal(byTag.length, 1);
	assert.equal(byTag[0].itemRef, "collection-a#item-001");
	assert.equal(byType.length, 1);
	assert.equal(byType[0].itemRef, "collection-a#item-001");
});

test("spatial index population and georeferenced lookup", () => {
	const store = createBrowserRuntimeStore();
	store.mutate.upsertSource(makeSource());
	store.mutate.upsertCollection(makeCollection());
	store.mutate.upsertItem(makeItem());
	store.mutate.upsertItem(
		makeItem({
			itemRef: "collection-a#item-002",
			rawItemId: "item-002",
			spatial: { hasCoordinates: false, lat: null, lon: null },
		}),
	);

	const georeferencedItems = store.getGeoreferencedItems();
	assert.equal(georeferencedItems.length, 1);
	assert.equal(georeferencedItems[0].itemRef, "collection-a#item-001");
	const snapshot = store.getSnapshot();
	assert.deepEqual(snapshot.indexes.spatial.georeferencedItemRefs, [
		"collection-a#item-001",
	]);
	assert.deepEqual(snapshot.indexes.spatial.bounds, {
		minLat: 52.22,
		minLon: 5.18,
		maxLat: 52.22,
		maxLon: 5.18,
	});
});

test("temporal index population and temporal lookup", () => {
	const store = createBrowserRuntimeStore();
	store.mutate.upsertSource(makeSource());
	store.mutate.upsertCollection(makeCollection());
	store.mutate.upsertItem(makeItem());
	store.mutate.upsertItem(
		makeItem({
			itemRef: "collection-a#item-003",
			rawItemId: "item-003",
			temporal: { known: false, display: "unknown", startMs: null, endMs: null },
		}),
	);

	const temporalItems = store.getTemporalItems();
	assert.equal(temporalItems.length, 1);
	assert.equal(temporalItems[0].itemRef, "collection-a#item-001");
	const snapshot = store.getSnapshot();
	assert.deepEqual(snapshot.indexes.temporal.knownItemRefs, [
		"collection-a#item-001",
	]);
	assert.equal(snapshot.indexes.temporal.byStartMs.length, 1);
	assert.equal(snapshot.indexes.temporal.byStartMs[0].itemRef, "collection-a#item-001");
});

test("normalizes object-shaped metadata values for temporal display fields", () => {
	const store = createBrowserRuntimeStore();
	store.mutate.upsertSource(makeSource());
	store.mutate.upsertCollection(makeCollection());
	store.mutate.upsertItem(
		makeItem({
			itemRef: "collection-a#item-004",
			rawItemId: "item-004",
			temporal: {
				known: false,
				display: { label: "1932" },
				startMs: null,
				endMs: null,
			},
		}),
	);

	assert.equal(store.getItem("collection-a#item-004")?.temporal?.display, "1932");
});

test("version increments only on effective mutation", () => {
	const store = createBrowserRuntimeStore();
	const source = makeSource();
	const collection = makeCollection();
	const item = makeItem();

	const v0 = store.getMeta().version;
	store.mutate.upsertSource(source);
	const v1 = store.getMeta().version;
	store.mutate.upsertSource(source);
	const v2 = store.getMeta().version;
	store.mutate.upsertCollection(collection);
	const v3 = store.getMeta().version;
	store.mutate.upsertCollection(collection);
	const v4 = store.getMeta().version;
	store.mutate.upsertItem(item);
	const v5 = store.getMeta().version;
	store.mutate.upsertItem(item);
	const v6 = store.getMeta().version;

	assert.equal(v1, v0 + 1);
	assert.equal(v2, v1);
	assert.equal(v3, v2 + 1);
	assert.equal(v4, v3);
	assert.equal(v5, v4 + 1);
	assert.equal(v6, v5);
});

test("replacement updates indexes by removing previous tag/type references", () => {
	const store = createBrowserRuntimeStore();
	store.mutate.upsertSource(makeSource());
	store.mutate.upsertCollection(makeCollection());
	store.mutate.upsertItem(makeItem({ tags: ["photo"], type: "image" }));
	store.mutate.upsertItem(
		makeItem({
			tags: ["drawing"],
			type: "document",
		}),
	);

	assert.equal(store.getItemsByTag("photo").length, 0);
	assert.equal(store.getItemsByType("image").length, 0);
	assert.equal(store.getItemsByTag("drawing").length, 1);
	assert.equal(store.getItemsByType("document").length, 1);
});

test("batch upsert helpers populate deterministic relation indexes", () => {
	const store = createBrowserRuntimeStore();
	store.mutate.upsertSources([
		makeSource({ sourceId: "source-b", label: "Source B", sourceUrl: "https://example.org/b/source.json" }),
		makeSource({ sourceId: "source-a", label: "Source A", sourceUrl: "https://example.org/a/source.json" }),
	]);
	store.mutate.upsertCollections([
		makeCollection({ collectionId: "collection-b", sourceId: "source-a", manifestUrl: "https://example.org/a/b.json", title: "B" }),
		makeCollection({ collectionId: "collection-a", sourceId: "source-a", manifestUrl: "https://example.org/a/a.json", title: "A" }),
	]);
	store.mutate.upsertItems([
		makeItem({ itemRef: "collection-a#b", rawItemId: "b", collectionId: "collection-a", sourceId: "source-a" }),
		makeItem({ itemRef: "collection-a#a", rawItemId: "a", collectionId: "collection-a", sourceId: "source-a" }),
	]);

	assert.deepEqual(
		store.getCollectionsForSource("source-a").map((entry) => entry.collectionId),
		["collection-a", "collection-b"],
	);
	assert.deepEqual(
		store.getItemsForCollection("collection-a").map((entry) => entry.itemRef),
		["collection-a#a", "collection-a#b"],
	);
});

test("runtime diagnostics expose canonical counts for observability", () => {
	const store = createBrowserRuntimeStore();
	store.mutate.upsertSource(makeSource());
	store.mutate.upsertCollection(makeCollection());
	store.mutate.upsertItem(makeItem());
	store.mutate.upsertItem(
		makeItem({
			itemRef: "collection-a#item-002",
			rawItemId: "item-002",
			include: false,
			spatial: { hasCoordinates: false, lat: null, lon: null },
			temporal: { known: false, display: "", startMs: null, endMs: null },
		}),
	);
	const diagnostics = store.getDiagnostics();
	assert.equal(diagnostics.modelVersion, "browser-diagnostics-v1");
	assert.equal(diagnostics.kind, "runtime-store");
	assert.equal(diagnostics.counts.sources, 1);
	assert.equal(diagnostics.counts.collections, 1);
	assert.equal(diagnostics.counts.items, 2);
	assert.equal(diagnostics.counts.includedItems, 1);
	assert.equal(diagnostics.counts.georeferencedItems, 1);
	assert.equal(diagnostics.counts.temporalItems, 1);
});
