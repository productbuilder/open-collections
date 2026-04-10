import test from "node:test";
import assert from "node:assert/strict";

import {
	createBrowseShellRuntime,
	mapEmbeddedSourceCatalogToRegistrations,
} from "./browse-shell-runtime.js";

test("maps embedded catalog entries to contract-style registrations", () => {
	const registrations = mapEmbeddedSourceCatalogToRegistrations([
		{
			id: "source-a",
			label: "Source A",
			sourceType: "source.json",
			sourceUrl: "https://example.org/source-a/source.json",
			enabled: true,
			priority: 20,
		},
	]);
	assert.equal(registrations.length, 1);
	assert.deepEqual(registrations[0], {
		sourceId: "source-a",
		label: "Source A",
		sourceType: "source.json",
		entryUrl: "https://example.org/source-a/source.json",
		enabled: true,
		priority: 20,
		options: {},
		meta: {},
		organizationName: "",
		curatorName: "",
		placeName: "",
		countryName: "",
		countryCode: "",
	});
});

test("startup initializes runtime store and ingestion service ownership", async () => {
	const created = {
		storeCount: 0,
		serviceCount: 0,
		ingestCount: 0,
	};
	const mockStore = { getMeta: () => ({ version: 0 }) };
	const runtime = createBrowseShellRuntime({
		embeddedSourceCatalog: [
			{
				id: "source-a",
				label: "A",
				sourceType: "collection.json",
				sourceUrl: "https://example.org/a/collection.json",
			},
		],
		createStore: () => {
			created.storeCount += 1;
			return mockStore;
		},
		createIngestionServiceFactory: ({ runtimeStore }) => {
			created.serviceCount += 1;
			assert.equal(runtimeStore, mockStore);
			return {
				async ingest(entries) {
					created.ingestCount += 1;
					return {
						sourcesIngested: entries.length,
						collectionsIngested: 1,
						itemsIngested: 2,
						warnings: [],
						failures: [],
						fetchRequestCount: 2,
						fetchNetworkCount: 2,
						fetchDedupedHitCount: 0,
						normalizeCount: 1,
						storeMeta: runtimeStore.getMeta(),
					};
				},
			};
		},
	});

	runtime.initializeOwnership();
	assert.equal(created.storeCount, 1);
	assert.equal(created.serviceCount, 1);
	assert.equal(runtime.getState().hasRuntimeStore, true);
	assert.equal(runtime.getState().hasIngestionService, true);

	await runtime.runStartupIngestionOnce();
	assert.equal(created.ingestCount, 1);
	assert.equal(runtime.getState().ingestionStatus, "ready");
	assert.equal(runtime.getDiagnosticsSummary().sourcesIngested, 1);
	assert.equal(runtime.getDiagnosticsSummary().structured.kind, "shell-status");
	assert.equal(typeof runtime.getDiagnosticsSummary().startupIngestionMs, "number");
});

test("startup ingestion runs once even when requested multiple times", async () => {
	let ingestCalls = 0;
	const runtime = createBrowseShellRuntime({
		embeddedSourceCatalog: [
			{
				id: "s1",
				label: "S1",
				sourceType: "collection.json",
				sourceUrl: "https://example.org/s1.json",
			},
		],
		createStore: () => ({ getMeta: () => ({ version: 0 }) }),
		createIngestionServiceFactory: () => ({
			async ingest() {
				ingestCalls += 1;
				return {
					sourcesIngested: 1,
					collectionsIngested: 0,
					itemsIngested: 0,
					warnings: [],
					failures: [],
					fetchRequestCount: 0,
					fetchNetworkCount: 0,
					fetchDedupedHitCount: 0,
					normalizeCount: 0,
					storeMeta: { version: 0 },
				};
			},
		}),
	});
	await Promise.all([
		runtime.runStartupIngestionOnce(),
		runtime.runStartupIngestionOnce(),
		runtime.runStartupIngestionOnce(),
	]);
	assert.equal(ingestCalls, 1);
	assert.equal(runtime.getState().startupRunCount, 1);
});

test("startup failure is captured without throwing to caller", async () => {
	const runtime = createBrowseShellRuntime({
		embeddedSourceCatalog: [
			{
				id: "s1",
				label: "S1",
				sourceType: "collection.json",
				sourceUrl: "https://example.org/s1.json",
			},
		],
		createStore: () => ({ getMeta: () => ({ version: 0 }) }),
		createIngestionServiceFactory: () => ({
			async ingest() {
				throw new Error("boom");
			},
		}),
	});
	const result = await runtime.runStartupIngestionOnce();
	assert.equal(runtime.getState().ingestionStatus, "error");
	assert.equal(runtime.getState().lastError, "boom");
	assert.equal(Array.isArray(result.failures), true);
	assert.equal(result.failures[0].code, "startup_ingestion_crash");
	assert.equal(result.structured.kind, "ingestion");
});

test("compatibility state remains available for legacy child surface bridge", async () => {
	const runtime = createBrowseShellRuntime({
		embeddedSourceCatalog: [],
		createStore: () => ({
			getMeta: () => ({ version: 0 }),
			getDiagnostics: () => ({
				modelVersion: "browser-diagnostics-v1",
				kind: "runtime-store",
				counts: {
					sources: 0,
					collections: 0,
					items: 0,
					includedItems: 0,
					georeferencedItems: 0,
					temporalItems: 0,
				},
			}),
		}),
		createIngestionServiceFactory: () => ({
			async ingest() {
				return {
					sourcesIngested: 0,
					collectionsIngested: 0,
					itemsIngested: 0,
					warnings: [],
					failures: [],
					fetchRequestCount: 0,
					fetchNetworkCount: 0,
					fetchDedupedHitCount: 0,
					normalizeCount: 0,
					storeMeta: { version: 0 },
				};
			},
		}),
	});
	await runtime.runStartupIngestionOnce();
	const compatibility = runtime.getCompatibilityState();
	assert.equal(compatibility.bridgeMode, "legacy-child-apps");
	assert.equal(compatibility.listSurfaceUsesCanonicalStore, true);
	assert.equal(compatibility.mapSurfaceUsesCanonicalStore, true);
	assert.equal(typeof compatibility.diagnosticsSummary, "object");
	assert.equal(typeof compatibility.diagnosticsSummary.runtimeStore, "object");
	assert.equal(compatibility.diagnosticsSummary.runtimeStore.kind, "runtime-store");
	assert.equal(compatibility.diagnosticsSummary.structured.kind, "shell-status");
});

test("runtime uses config-provided entry URLs without hardcoded manifest constants", async () => {
	const seenEntryUrls = [];
	const runtime = createBrowseShellRuntime({
		embeddedSourceCatalog: [
			{
				id: "source-a",
				label: "A",
				sourceType: "collection.json",
				sourceUrl: "https://custom.example/a/collection.json",
			},
			{
				id: "source-b",
				label: "B",
				sourceType: "collection.json",
				sourceUrl: "https://custom.example/b/collection.json",
			},
		],
		createStore: () => ({ getMeta: () => ({ version: 0 }) }),
		createIngestionServiceFactory: () => ({
			async ingest(entries) {
				seenEntryUrls.push(...entries.map((entry) => entry.entryUrl));
				return {
					sourcesIngested: entries.length,
					collectionsIngested: 0,
					itemsIngested: 0,
					warnings: [],
					failures: [],
					fetchRequestCount: 0,
					fetchNetworkCount: 0,
					fetchDedupedHitCount: 0,
					normalizeCount: 0,
					storeMeta: { version: 0 },
				};
			},
		}),
	});
	await runtime.runStartupIngestionOnce();
	assert.deepEqual(seenEntryUrls, [
		"https://custom.example/a/collection.json",
		"https://custom.example/b/collection.json",
	]);
	assert.equal(seenEntryUrls.some((url) => url.includes("hilversum-wikimedia")), false);
});
