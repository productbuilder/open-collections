import test from "node:test";
import assert from "node:assert/strict";

import { createBrowserRuntimeStore } from "../browser-runtime/runtime-store.js";
import { createListProjection } from "./list-adapter.js";

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
		itemCount: 2,
		includedItemCount: 2,
		hasSpatialItems: true,
		hasTemporalItems: true,
	});
	store.mutate.upsertCollection({
		collectionId: "source-a::collection-b",
		sourceId: "source-a",
		manifestUrl: "https://example.org/source-a/collection-b/collection.json",
		title: "Collection B",
		itemCount: 1,
		includedItemCount: 1,
		hasSpatialItems: false,
		hasTemporalItems: false,
	});
	store.mutate.upsertItems([
		{
			itemRef: "source-a::collection-a#item-1",
			rawItemId: "item-1",
			sourceId: "source-a",
			collectionId: "source-a::collection-a",
			title: "Town Hall 1932",
			description: "Historic building",
			creator: "A. Author",
			sourceUrl: "https://example.org/original/1",
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
			itemRef: "source-a::collection-b#item-3",
			rawItemId: "item-3",
			sourceId: "source-a",
			collectionId: "source-a::collection-b",
			title: "Letter to Mayor",
			include: true,
			tags: ["text"],
			type: "document",
			media: {
				type: "application/pdf",
				url: "https://example.org/media/3.pdf",
				thumbnailUrl: "https://example.org/media/3-thumb.jpg",
			},
			spatial: { hasCoordinates: false, lat: null, lon: null, locationLabel: "" },
			temporal: { known: false, display: "unknown", startMs: null, endMs: null },
		},
	]);
	return store;
}

function seedMixedStore() {
	const store = createBrowserRuntimeStore();
	for (const sourceId of ["source-a", "source-b", "source-c"]) {
		store.mutate.upsertSource({
			sourceId,
			label: sourceId.toUpperCase(),
			sourceType: "source.json",
			sourceUrl: `https://example.org/${sourceId}/source.json`,
		});
		for (let collectionIndex = 1; collectionIndex <= 2; collectionIndex += 1) {
			const collectionId = `${sourceId}::collection-${collectionIndex}`;
			store.mutate.upsertCollection({
				collectionId,
				sourceId,
				manifestUrl: `https://example.org/${sourceId}/collection-${collectionIndex}.json`,
				title: `${sourceId} collection ${collectionIndex}`,
				itemCount: 5,
				includedItemCount: 5,
				hasSpatialItems: true,
				hasTemporalItems: true,
			});
			const items = [];
			for (let itemIndex = 1; itemIndex <= 5; itemIndex += 1) {
				items.push({
					itemRef: `${collectionId}#item-${itemIndex}`,
					rawItemId: `item-${itemIndex}`,
					sourceId,
					collectionId,
					title: `${sourceId} item ${itemIndex}`,
					include: true,
					tags: ["mixed", sourceId],
					type: "image",
					media: {
						type: "image/jpeg",
						url: `https://example.org/${sourceId}/item-${itemIndex}.jpg`,
					},
					spatial: { hasCoordinates: true, lat: 52 + itemIndex / 100, lon: 5 + itemIndex / 100 },
					temporal: { known: true, display: "1932", startMs: -1199145600000, endMs: -1167609600001 },
				});
			}
			store.mutate.upsertItems(items);
		}
	}
	return store;
}

test("list adapter returns expected projection shape", () => {
	const projection = createListProjection({
		store: seedStore(),
		browseQueryState: { query: {} },
		viewMode: "all",
	});
	assert.equal(Array.isArray(projection.sourceCards), true);
	assert.equal(Array.isArray(projection.collectionCards), true);
	assert.equal(Array.isArray(projection.itemCards), true);
	assert.equal(Array.isArray(projection.allBrowseEntities), true);
	assert.equal(typeof projection.total, "object");
	assert.equal(typeof projection.filterOptions, "object");
	assert.equal(typeof projection.model, "object");
	assert.equal(projection.diagnostics?.structured?.kind, "list-adapter");
	assert.equal(typeof projection.diagnostics?.projectionDurationMs, "number");
	assert.equal(typeof projection.diagnostics?.feedCompositionMs, "number");
});

test("projection preserves canonical ItemRef in item outputs", () => {
	const projection = createListProjection({
		store: seedStore(),
		browseQueryState: { query: {} },
		viewMode: "all",
	});
	const refs = projection.itemCards.map((entry) => entry.item?.itemRef);
	assert.deepEqual(refs, [
		"source-a::collection-a#item-1",
		"source-a::collection-a#item-2",
		"source-a::collection-b#item-3",
	]);
});

test("source cards include preview rows when source items expose thumbnails", () => {
	const projection = createListProjection({
		store: seedStore(),
		browseQueryState: { query: {} },
		viewMode: "all",
	});
	assert.equal(projection.sourceCards.length, 1);
	assert.deepEqual(projection.sourceCards[0].previewRows, [
		[
			"https://example.org/media/1.jpg",
			"https://example.org/media/2.jpg",
		],
		["https://example.org/media/3-thumb.jpg"],
	]);
	assert.deepEqual(projection.sourceCards[0].previewImages, [
		"https://example.org/media/1.jpg",
		"https://example.org/media/2.jpg",
		"https://example.org/media/3-thumb.jpg",
	]);
});

test("filters by text/type/tag/time", () => {
	const projection = createListProjection({
		store: seedStore(),
		browseQueryState: {
			query: {
				text: "Town Hall",
				types: ["image"],
				tags: ["architecture"],
				timeRange: { start: "1930", end: "1940" },
			},
		},
		viewMode: "items",
	});
	assert.equal(projection.itemCards.length, 1);
	assert.equal(projection.itemCards[0].id, "source-a::collection-a#item-1");
});

test("filter options and totals reflect adapter result set", () => {
	const projection = createListProjection({
		store: seedStore(),
		browseQueryState: {
			query: {
				text: "Town Hall",
			},
		},
	});
	assert.equal(projection.total.available.items, 3);
	assert.equal(projection.total.filtered.items, 2);
	assert.equal(projection.filterOptions.types.some((entry) => entry.value === "image"), true);
	assert.equal(
		projection.filterOptions.mediaTypes.some((entry) => entry.value === "image"),
		true,
	);
	assert.equal(projection.diagnostics.structured.counts.filtered.items, 2);
});

test("filters by media type facet", () => {
	const projection = createListProjection({
		store: seedStore(),
		browseQueryState: {
			query: {
				mediaTypes: ["application"],
			},
		},
		viewMode: "items",
	});
	assert.equal(projection.itemCards.length, 1);
	assert.equal(projection.itemCards[0].id, "source-a::collection-b#item-3");
});

test("list diagnostics include unsupported filter warnings", () => {
	const projection = createListProjection({
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

test("all-mode feed composition uses mixed ordering instead of grouped sequence", () => {
	const projection = createListProjection({
		store: seedMixedStore(),
		browseQueryState: { query: {} },
		viewMode: "all",
	});
	const full = projection.model.fullAllBrowseEntities;
	const groupedKinds = [
		...new Array(projection.sourceCards.length).fill("source"),
		...new Array(projection.collectionCards.length).fill("collection"),
		...new Array(projection.itemCards.length).fill("item"),
	];
	const fullKinds = full.map((entry) => entry.browseKind || "item");
	assert.equal(fullKinds.length > 24, true);
	assert.equal(projection.model.allBrowseEntities.length, 24);
	assert.equal(projection.model.allFeedExhausted, false);
	assert.notDeepEqual(fullKinds, groupedKinds);
	assert.equal(fullKinds.slice(0, 12).some((kind) => kind === "item"), true);
});

test("selected item does not change all-mode feed session key", () => {
	const store = seedMixedStore();
	const first = createListProjection({
		store,
		browseQueryState: {
			query: {
				selection: { itemId: "source-a::collection-1#item-1" },
			},
		},
		viewMode: "all",
	});
	const second = createListProjection({
		store,
		browseQueryState: {
			query: {
				selection: { itemId: "source-a::collection-1#item-2" },
			},
		},
		viewMode: "all",
	});
	assert.equal(first.model.allFeedSessionKey, second.model.allFeedSessionKey);
});

test("sources mode returns all canonical sources even when query scope is narrowed", () => {
	const store = seedMixedStore();
	const projection = createListProjection({
		store,
		browseQueryState: {
			query: {
				sourceIds: ["source-a"],
				collectionManifestUrls: ["https://example.org/source-a/collection-1.json"],
				selection: {
					sourceId: "source-a",
					collectionManifestUrl: "https://example.org/source-a/collection-1.json",
					itemId: "source-a::collection-1#item-1",
				},
			},
		},
		viewMode: "sources",
	});
	assert.deepEqual(
		projection.sourceCards.map((card) => card.id),
		["source-a", "source-b", "source-c"],
	);
	assert.deepEqual(
		projection.model.sourceCardsForSourcesMode.map((card) => card.id),
		["source-a", "source-b", "source-c"],
	);
	assert.equal(projection.model.showBack, false);
});

test("all mode remains scoped while sources mode stays global", () => {
	const store = seedMixedStore();
	const query = {
		sourceIds: ["source-a"],
		collectionManifestUrls: ["https://example.org/source-a/collection-1.json"],
	};
	const allProjection = createListProjection({
		store,
		browseQueryState: { query },
		viewMode: "all",
	});
	const sourcesProjection = createListProjection({
		store,
		browseQueryState: { query },
		viewMode: "sources",
	});
	const collectionsProjection = createListProjection({
		store,
		browseQueryState: { query },
		viewMode: "collections",
	});
	const itemsProjection = createListProjection({
		store,
		browseQueryState: { query },
		viewMode: "items",
	});
	assert.deepEqual(allProjection.sourceCards.map((card) => card.id), ["source-a"]);
	assert.deepEqual(sourcesProjection.sourceCards.map((card) => card.id), [
		"source-a",
		"source-b",
		"source-c",
	]);
	assert.deepEqual(collectionsProjection.sourceCards.map((card) => card.id), [
		"source-a",
	]);
	assert.deepEqual(itemsProjection.sourceCards.map((card) => card.id), ["source-a"]);
});
