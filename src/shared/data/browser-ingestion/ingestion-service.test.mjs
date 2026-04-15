import test from "node:test";
import assert from "node:assert/strict";

import { createBrowserRuntimeStore } from "../browser-runtime/runtime-store.js";
import { createBrowserIngestionService } from "./ingestion-service.js";

function createMockFetch(routes = {}, calls = []) {
	return async function mockFetch(url) {
		calls.push(url);
		if (!Object.prototype.hasOwnProperty.call(routes, url)) {
			return {
				ok: false,
				status: 404,
				async json() {
					return {};
				},
			};
		}
		const body = routes[url];
		return {
			ok: true,
			status: 200,
			async json() {
				return JSON.parse(JSON.stringify(body));
			},
		};
	};
}

function createServiceWithRoutes({ routes, baseUrl = "https://app.example.test/ui/" }) {
	const calls = [];
	const runtimeStore = createBrowserRuntimeStore();
	const service = createBrowserIngestionService({
		runtimeStore,
		baseUrl,
		fetchImpl: createMockFetch(routes, calls),
	});
	return { runtimeStore, service, calls };
}

test("ingests source.json descriptor path and populates canonical store", async () => {
	const routes = {
		"https://data.example.test/sources/a/source.json": {
			title: "Source A",
			collections: [{ id: "city-photos", manifest: "./city/collection.json" }],
		},
		"https://data.example.test/sources/a/city/collection.json": {
			id: "city-photos",
			title: "City Photos",
			items: [
				{
					id: "img-1",
					title: "Street 1",
					tags: ["Street", "Photo"],
					type: "Image",
					location: { lat: 52.2, lon: 5.1, name: "Center" },
					date: "1932",
					media: { type: "image/jpeg", url: "./img-1.jpg" },
				},
			],
		},
	};
	const { runtimeStore, service } = createServiceWithRoutes({ routes });
	const result = await service.ingest([
		{
			sourceId: "source-a",
			label: "Source A",
			sourceType: "source.json",
			entryUrl: "https://data.example.test/sources/a/source.json",
		},
	]);

	assert.equal(result.sourcesIngested, 1);
	assert.equal(result.collectionsIngested, 1);
	assert.equal(result.itemsIngested, 1);
	assert.equal(result.includedItemsIngested, 1);
	assert.equal(result.georeferencedItemsIngested, 1);
	assert.equal(result.temporalItemsIngested, 1);
	assert.equal(typeof result.fetchCacheEvictionCount, "number");
	assert.equal(typeof result.normalizeCacheHitCount, "number");
	assert.equal(result.structured?.modelVersion, "browser-diagnostics-v1");
	assert.equal(result.structured?.kind, "ingestion");
	assert.equal(typeof result.totalDurationMs, "number");
	assert.equal(typeof result.phases?.descriptorResolutionMs, "number");
	assert.equal(typeof result.phases?.manifestNormalizationMs, "number");
	assert.equal(typeof result.phases?.storePopulationMs, "number");
	assert.equal(runtimeStore.getSource("source-a")?.sourceId, "source-a");
	assert.equal(runtimeStore.getCollectionsForSource("source-a").length, 1);
	assert.equal(runtimeStore.getItemsForCollection("source-a::city-photos").length, 1);
});

test("applies registration include/exclude filters during source descriptor resolution", async () => {
	const routes = {
		"https://data.example.test/sources/a/source.json": {
			title: "Source A",
			collections: [
				{ id: "public-a", manifest: "./public-a/collection.json" },
				{ id: "private-a", manifest: "./private-a/collection.json" },
				{ id: "private-b", manifest: "./private-b/collection.json" },
			],
		},
		"https://data.example.test/sources/a/public-a/collection.json": {
			id: "public-a",
			title: "Public A",
			items: [{ id: "item-1", title: "Item 1", media: { type: "image", url: "./1.jpg" } }],
		},
		"https://data.example.test/sources/a/private-a/collection.json": {
			id: "private-a",
			title: "Private A",
			items: [{ id: "item-2", title: "Item 2", media: { type: "image", url: "./2.jpg" } }],
		},
		"https://data.example.test/sources/a/private-b/collection.json": {
			id: "private-b",
			title: "Private B",
			items: [{ id: "item-3", title: "Item 3", media: { type: "image", url: "./3.jpg" } }],
		},
	};
	const { runtimeStore, service } = createServiceWithRoutes({ routes });
	await service.ingest([
		{
			sourceId: "source-a",
			label: "Source A",
			sourceType: "source.json",
			entryUrl: "https://data.example.test/sources/a/source.json",
			options: {
				includeCollections: ["public-a", "private-a"],
				excludeCollections: ["private-a"],
			},
		},
	]);

	assert.deepEqual(
		runtimeStore
			.getCollectionsForSource("source-a")
			.map((collection) => collection.rawCollectionId),
		["public-a"],
	);
	assert.equal(runtimeStore.getItemsForCollection("source-a::public-a").length, 1);
	assert.equal(runtimeStore.getItemsForCollection("source-a::private-a").length, 0);
	assert.equal(runtimeStore.getItemsForCollection("source-a::private-b").length, 0);
});

test("ingests direct collection.json path", async () => {
	const routes = {
		"https://data.example.test/direct/collection.json": {
			id: "direct-col",
			title: "Direct Collection",
			items: [{ id: "x1", title: "X1", media: { type: "image", url: "./x1.jpg" } }],
		},
	};
	const { runtimeStore, service } = createServiceWithRoutes({ routes });
	const result = await service.ingest([
		{
			sourceId: "source-direct",
			label: "Direct",
			sourceType: "collection.json",
			entryUrl: "https://data.example.test/direct/collection.json",
		},
	]);

	assert.equal(result.sourcesIngested, 1);
	assert.equal(result.collectionsIngested, 1);
	assert.equal(result.itemsIngested, 1);
	assert.equal(result.structured?.counts?.sources, 1);
	assert.equal(runtimeStore.getCollection("source-direct::direct-col")?.sourceId, "source-direct");
});

test("normalizes object-shaped item date metadata for card-ready temporal display", async () => {
	const routes = {
		"https://data.example.test/direct/collection.json": {
			id: "direct-col",
			title: "Direct Collection",
			items: [
				{
					id: "x1",
					title: "X1",
					date: { label: "1932" },
					media: { type: "image", url: "./x1.jpg" },
				},
			],
		},
	};
	const { runtimeStore, service } = createServiceWithRoutes({ routes });
	await service.ingest([
		{
			sourceId: "source-direct",
			label: "Direct",
			sourceType: "collection.json",
			entryUrl: "https://data.example.test/direct/collection.json",
		},
	]);

	const items = runtimeStore.getItemsForCollection("source-direct::direct-col");
	assert.equal(items.length, 1);
	assert.equal(items[0]?.temporal?.display, "1932");
});

test("skips disabled entries", async () => {
	const { service } = createServiceWithRoutes({ routes: {} });
	const result = await service.ingest([
		{
			sourceId: "disabled-source",
			label: "Disabled",
			sourceType: "collection.json",
			entryUrl: "https://data.example.test/direct/collection.json",
			enabled: false,
		},
	]);
	assert.equal(result.skippedDisabledEntries, 1);
	assert.equal(result.sourceEntriesAccepted, 0);
});

test("enforces sourceId uniqueness and records duplicate failure", async () => {
	const routes = {
		"https://data.example.test/one/collection.json": { id: "one", title: "One", items: [] },
	};
	const { service } = createServiceWithRoutes({ routes });
	const result = await service.ingest([
		{
			sourceId: "dup",
			label: "One",
			sourceType: "collection.json",
			entryUrl: "https://data.example.test/one/collection.json",
			priority: 10,
		},
		{
			sourceId: "dup",
			label: "Two",
			sourceType: "collection.json",
			entryUrl: "https://data.example.test/one/collection.json",
			priority: 20,
		},
	]);
	assert.equal(result.sourceEntriesAccepted, 1);
	assert.equal(result.failures.some((entry) => entry.code === "duplicate_source_id"), true);
});

test("ingest order is deterministic by priority then sourceId", async () => {
	const calls = [];
	const routes = {
		"https://data.example.test/b/source.json": { collections: [] },
		"https://data.example.test/a/source.json": { collections: [] },
	};
	const runtimeStore = createBrowserRuntimeStore();
	const service = createBrowserIngestionService({
		runtimeStore,
		baseUrl: "https://app.example.test/",
		fetchImpl: createMockFetch(routes, calls),
	});
	await service.ingest([
		{
			sourceId: "b-source",
			label: "B",
			sourceType: "source.json",
			entryUrl: "https://data.example.test/b/source.json",
			priority: 20,
		},
		{
			sourceId: "a-source",
			label: "A",
			sourceType: "source.json",
			entryUrl: "https://data.example.test/a/source.json",
			priority: 20,
		},
	]);
	assert.deepEqual(calls, [
		"https://data.example.test/a/source.json",
		"https://data.example.test/b/source.json",
	]);
});

test("resolves relative collection refs to absolute URLs", async () => {
	const calls = [];
	const routes = {
		"https://data.example.test/root/source.json": {
			collections: [{ id: "c1", manifest: "./nested/collection.json" }],
		},
		"https://data.example.test/root/nested/collection.json": {
			id: "c1",
			title: "C1",
			items: [],
		},
	};
	const runtimeStore = createBrowserRuntimeStore();
	const service = createBrowserIngestionService({
		runtimeStore,
		baseUrl: "https://app.example.test/",
		fetchImpl: createMockFetch(routes, calls),
	});
	await service.ingest([
		{
			sourceId: "s1",
			label: "S1",
			sourceType: "source.json",
			entryUrl: "https://data.example.test/root/source.json",
		},
	]);
	assert.equal(
		calls.includes("https://data.example.test/root/nested/collection.json"),
		true,
	);
});

test("deduplicates repeated fetches within one run", async () => {
	const routes = {
		"https://data.example.test/shared/source.json": {
			collections: [
				{ id: "c1", manifest: "https://data.example.test/shared/collection.json" },
				{ id: "c2", manifest: "https://data.example.test/shared/collection.json" },
			],
		},
		"https://data.example.test/shared/collection.json": {
			id: "shared-col",
			title: "Shared",
			items: [],
		},
	};
	const { service } = createServiceWithRoutes({ routes });
	const result = await service.ingest([
		{
			sourceId: "s-shared",
			label: "Shared",
			sourceType: "source.json",
			entryUrl: "https://data.example.test/shared/source.json",
		},
	]);
	assert.equal(result.fetchRequestCount > result.fetchNetworkCount, true);
	assert.equal(result.fetchDedupedHitCount >= 1, true);
	assert.equal(result.structured?.fetch?.dedupHitCount >= 1, true);
});

test("normalization cache hits when same manifest is referenced multiple times", async () => {
	const routes = {
		"https://data.example.test/shared/source.json": {
			collections: [
				{ id: "c1", manifest: "https://data.example.test/shared/collection.json" },
				{ id: "c2", manifest: "https://data.example.test/shared/collection.json" },
			],
		},
		"https://data.example.test/shared/collection.json": {
			id: "shared-col",
			title: "Shared",
			items: [{ id: "x1", title: "Item", media: { url: "./x1.jpg" } }],
		},
	};
	const { service } = createServiceWithRoutes({ routes });
	const result = await service.ingest([
		{
			sourceId: "s-shared",
			label: "Shared",
			sourceType: "source.json",
			entryUrl: "https://data.example.test/shared/source.json",
		},
	]);
	assert.equal(result.normalizeCacheHitCount >= 1, true);
});

test("generates canonical ItemRef deterministically for duplicate and missing raw ids", async () => {
	const routes = {
		"https://data.example.test/direct/dup.json": {
			id: "dup-col",
			title: "Dup",
			items: [
				{ id: "IMG-1", title: "A", media: { url: "./a.jpg" } },
				{ id: "IMG-1", title: "B", media: { url: "./b.jpg" } },
				{ title: "C", media: { url: "./c.jpg" } },
			],
		},
	};
	const { runtimeStore, service } = createServiceWithRoutes({ routes });
	await service.ingest([
		{
			sourceId: "s",
			label: "S",
			sourceType: "collection.json",
			entryUrl: "https://data.example.test/direct/dup.json",
		},
	]);
	const refs = runtimeStore
		.getItemsForCollection("s::dup-col")
		.map((entry) => entry.itemRef);
	assert.deepEqual(refs, [
		"s::dup-col#img-1",
		"s::dup-col#img-1~2",
		"s::dup-col#ord-000003",
	]);
});

test("normalizes location and temporal fallback", async () => {
	const routes = {
		"https://data.example.test/direct/norm.json": {
			id: "norm-col",
			title: "Norm",
			items: [
				{
					id: "a",
					title: "Has Lng and Year",
					location: { lat: 52.21, lng: 5.19 },
					date: "1932",
					media: { url: "./a.jpg" },
				},
				{
					id: "b",
					title: "Unknown Time",
					location: { lat: 999, lon: 5.0 },
					date: "around long ago",
					media: { url: "./b.jpg" },
				},
			],
		},
	};
	const { runtimeStore, service } = createServiceWithRoutes({ routes });
	await service.ingest([
		{
			sourceId: "norm-source",
			label: "Norm Source",
			sourceType: "collection.json",
			entryUrl: "https://data.example.test/direct/norm.json",
		},
	]);
	assert.equal(runtimeStore.getGeoreferencedItems().length, 1);
	assert.equal(runtimeStore.getTemporalItems().length, 1);
	const itemA = runtimeStore.getItem("norm-source::norm-col#a");
	const itemB = runtimeStore.getItem("norm-source::norm-col#b");
	assert.equal(itemA?.spatial?.lon, 5.19);
	assert.equal(itemB?.temporal?.known, false);
});

test("diagnostics include warnings and partial failures while continuing ingestion", async () => {
	const routes = {
		"https://data.example.test/good/source.json": {
			collections: [{ id: "ok", manifest: "./ok/collection.json" }],
		},
		"https://data.example.test/good/ok/collection.json": {
			id: "ok",
			title: "OK",
			items: [],
		},
		"https://data.example.test/bad/source.json": {
			collections: [{ id: "missing", manifest: "./missing/collection.json" }],
		},
	};
	const { runtimeStore, service } = createServiceWithRoutes({ routes });
	const result = await service.ingest([
		{
			sourceId: "bad",
			label: "Bad",
			sourceType: "source.json",
			entryUrl: "https://data.example.test/bad/source.json",
			priority: 1,
		},
		{
			sourceId: "good",
			label: "Good",
			sourceType: "source.json",
			entryUrl: "https://data.example.test/good/source.json",
			priority: 2,
		},
	]);

	assert.equal(result.sourcesIngested, 2);
	assert.equal(result.collectionsIngested, 1);
	assert.equal(result.failures.some((entry) => entry.code === "collection_ingest_failed"), true);
	assert.equal(result.structured?.failures?.count >= 1, true);
	assert.equal(runtimeStore.getCollectionsForSource("good").length, 1);
});
