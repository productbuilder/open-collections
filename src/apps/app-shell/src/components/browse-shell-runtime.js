import { BROWSER_CONFIG } from "../../../collection-browser/src/config.js";
import { createBrowserRuntimeStore } from "../../../../shared/data/browser-runtime/index.js";
import { createBrowserIngestionService } from "../../../../shared/data/browser-ingestion/index.js";
import {
	createStructuredDiagnostics,
	getNowMs,
} from "../../../../shared/data/browser-diagnostics/index.js";

function normalizeText(value) {
	return String(value ?? "").trim();
}

function toSourceType(value) {
	const sourceType = normalizeText(value).toLowerCase();
	return sourceType === "source.json" ? "source.json" : "collection.json";
}

function normalizeCollectionFilterList(values) {
	if (!Array.isArray(values)) {
		return [];
	}
	return values
		.map((value) => normalizeText(value))
		.filter(Boolean);
}

export function mapEmbeddedSourceCatalogToRegistrations(catalogEntries = []) {
	const entries = Array.isArray(catalogEntries) ? catalogEntries : [];
	return entries
		.filter((entry) => entry && typeof entry === "object")
		.map((entry, index) => {
			const normalizedOptions =
				entry.options && typeof entry.options === "object"
					? { ...entry.options }
					: {};
			if (!Object.prototype.hasOwnProperty.call(normalizedOptions, "includeCollections")) {
				normalizedOptions.includeCollections = normalizeCollectionFilterList(
					entry.includeCollections,
				);
			}
			if (!Object.prototype.hasOwnProperty.call(normalizedOptions, "excludeCollections")) {
				normalizedOptions.excludeCollections = normalizeCollectionFilterList(
					entry.excludeCollections,
				);
			}
			return {
				sourceId: normalizeText(entry.id) || `source-${index + 1}`,
				label:
					normalizeText(entry.label) ||
					normalizeText(entry.title) ||
					`Source ${index + 1}`,
				sourceType: toSourceType(entry.sourceType || entry.type),
				entryUrl: normalizeText(entry.sourceUrl || entry.url),
				enabled: entry.enabled !== false,
				priority: Number.isFinite(Number(entry.priority))
					? Number(entry.priority)
					: 100,
				options: normalizedOptions,
				meta: entry.meta && typeof entry.meta === "object" ? { ...entry.meta } : {},
				organizationName: normalizeText(entry.organizationName),
				curatorName: normalizeText(entry.curatorName),
				placeName: normalizeText(entry.placeName),
				countryName: normalizeText(entry.countryName),
				countryCode: normalizeText(entry.countryCode),
			};
		})
		.filter((entry) => Boolean(entry.entryUrl));
}

export function createBrowseShellRuntime({
	embeddedSourceCatalog = BROWSER_CONFIG.embeddedSourceCatalog,
	baseUrl = "http://localhost/",
	fetchImpl = globalThis.fetch,
	createStore = createBrowserRuntimeStore,
	createIngestionServiceFactory = createBrowserIngestionService,
} = {}) {
	const state = {
		ingestionStatus: "idle",
		registrationEntries: [],
		diagnostics: null,
		lastError: null,
		hasRuntimeStore: false,
		hasIngestionService: false,
		startupRunCount: 0,
		compatibility: {
			bridgeMode: "legacy-child-apps",
			listSurfaceUsesCanonicalStore: true,
			mapSurfaceUsesCanonicalStore: true,
		},
	};

	let runtimeStore = null;
	let ingestionService = null;
	let startupPromise = null;

	function initializeOwnership() {
		if (runtimeStore && ingestionService) {
			return;
		}
		runtimeStore = createStore();
		ingestionService = createIngestionServiceFactory({
			runtimeStore,
			baseUrl,
			fetchImpl,
		});
		state.hasRuntimeStore = true;
		state.hasIngestionService = true;
		state.registrationEntries =
			mapEmbeddedSourceCatalogToRegistrations(embeddedSourceCatalog);
	}

	async function runStartupIngestionOnce() {
		initializeOwnership();
		if (startupPromise) {
			return startupPromise;
		}
		state.ingestionStatus = "loading";
		state.startupRunCount += 1;
		const startupStartMs = getNowMs();
		startupPromise = (async () => {
			try {
				const diagnostics = await ingestionService.ingest(state.registrationEntries);
				const startupDurationMs = Math.max(0, getNowMs() - startupStartMs);
				state.diagnostics = diagnostics;
				state.lastError = null;
				state.ingestionStatus =
					Array.isArray(diagnostics?.failures) && diagnostics.failures.length > 0
						? "ready_with_failures"
						: "ready";
				state.diagnostics = {
					...diagnostics,
					startupIngestionMs: startupDurationMs,
					structured: createStructuredDiagnostics({
						...(diagnostics?.structured || {}),
						kind: "ingestion",
						timing: {
							...(diagnostics?.structured?.timing || {}),
							totalMs:
								diagnostics?.structured?.timing?.totalMs ?? startupDurationMs,
							startupIngestionMs: startupDurationMs,
						},
					}),
				};
				return state.diagnostics;
			} catch (error) {
				const message = error?.message || "Startup ingestion failed.";
				const startupDurationMs = Math.max(0, getNowMs() - startupStartMs);
				state.lastError = message;
				state.ingestionStatus = "error";
				state.diagnostics = {
					startedAt: new Date().toISOString(),
					completedAt: new Date().toISOString(),
					sourceEntriesTotal: state.registrationEntries.length,
					sourceEntriesAccepted: 0,
					skippedDisabledEntries: 0,
					fetchRequestCount: 0,
					fetchNetworkCount: 0,
					fetchDedupedHitCount: 0,
					fetchCacheEvictionCount: 0,
					normalizeCount: 0,
					normalizeCacheHitCount: 0,
					sourcesIngested: 0,
					collectionsIngested: 0,
					itemsIngested: 0,
					includedItemsIngested: 0,
					georeferencedItemsIngested: 0,
					temporalItemsIngested: 0,
					startupIngestionMs: startupDurationMs,
					warnings: [],
					failures: [
						{
							code: "startup_ingestion_crash",
							message,
							context: {},
						},
					],
					storeMeta: runtimeStore.getMeta(),
					structured: createStructuredDiagnostics({
						kind: "ingestion",
						counts: {
							sources: 0,
							collections: 0,
							items: 0,
							includedItems: 0,
							georeferencedItems: 0,
							temporalItems: 0,
						},
						failures: [
							{
								code: "startup_ingestion_crash",
								message,
								context: {},
							},
						],
						timing: {
							totalMs: startupDurationMs,
							ingestionMs: startupDurationMs,
							startupIngestionMs: startupDurationMs,
						},
					}),
				};
				return state.diagnostics;
			}
		})();
		return startupPromise;
	}

	function getDiagnosticsSummary() {
		const diagnostics = state.diagnostics || {};
		const warnings = Array.isArray(diagnostics.warnings) ? diagnostics.warnings : [];
		const failures = Array.isArray(diagnostics.failures) ? diagnostics.failures : [];
		const storeMeta = diagnostics.storeMeta || runtimeStore?.getMeta?.() || null;
		const runtimeStoreDiagnostics =
			typeof runtimeStore?.getDiagnostics === "function"
				? runtimeStore.getDiagnostics()
				: null;
		const structured = createStructuredDiagnostics({
			kind: "shell-status",
			counts: {
				sources:
					runtimeStoreDiagnostics?.counts?.sources ||
					Number(diagnostics.sourcesIngested || 0),
				collections:
					runtimeStoreDiagnostics?.counts?.collections ||
					Number(diagnostics.collectionsIngested || 0),
				items:
					runtimeStoreDiagnostics?.counts?.items ||
					Number(diagnostics.itemsIngested || 0),
				includedItems:
					runtimeStoreDiagnostics?.counts?.includedItems ||
					Number(diagnostics.includedItemsIngested || diagnostics.itemsIngested || 0),
				georeferencedItems:
					runtimeStoreDiagnostics?.counts?.georeferencedItems ||
					Number(diagnostics.georeferencedItemsIngested || 0),
				temporalItems:
					runtimeStoreDiagnostics?.counts?.temporalItems ||
					Number(diagnostics.temporalItemsIngested || 0),
			},
			fetch: {
				requestCount: Number(diagnostics.fetchRequestCount || 0),
				networkCount: Number(diagnostics.fetchNetworkCount || 0),
				dedupHitCount: Number(diagnostics.fetchDedupedHitCount || 0),
			},
			normalization: {
				count: Number(diagnostics.normalizeCount || 0),
			},
			warnings,
			failures,
			timing: {
				totalMs: Number(diagnostics.totalDurationMs || diagnostics.startupIngestionMs || 0),
				startupIngestionMs: Number(diagnostics.startupIngestionMs || 0),
			},
			compatibility: {
				bridgeMode: state.compatibility.bridgeMode,
				listSurfaceUsesCanonicalStore:
					state.compatibility.listSurfaceUsesCanonicalStore === true,
				mapSurfaceUsesCanonicalStore:
					state.compatibility.mapSurfaceUsesCanonicalStore === true,
			},
		});
		return {
			ingestionStatus: state.ingestionStatus,
			sourcesIngested: Number(diagnostics.sourcesIngested || 0),
			collectionsIngested: Number(diagnostics.collectionsIngested || 0),
			itemsIngested: Number(diagnostics.itemsIngested || 0),
			includedItemsIngested: Number(
				diagnostics.includedItemsIngested || diagnostics.itemsIngested || 0,
			),
			georeferencedItemsIngested: Number(diagnostics.georeferencedItemsIngested || 0),
			temporalItemsIngested: Number(diagnostics.temporalItemsIngested || 0),
			warningCount: warnings.length,
			failureCount: failures.length,
			fetchRequestCount: Number(diagnostics.fetchRequestCount || 0),
			fetchNetworkCount: Number(diagnostics.fetchNetworkCount || 0),
			fetchDedupedHitCount: Number(diagnostics.fetchDedupedHitCount || 0),
			fetchCacheEvictionCount: Number(diagnostics.fetchCacheEvictionCount || 0),
			normalizeCount: Number(diagnostics.normalizeCount || 0),
			normalizeCacheHitCount: Number(diagnostics.normalizeCacheHitCount || 0),
			startupIngestionMs: Number(diagnostics.startupIngestionMs || 0),
			storeMeta,
			runtimeStore: runtimeStoreDiagnostics,
			structured,
		};
	}

	function getCompatibilityState() {
		return {
			...state.compatibility,
			hasRuntimeStore: state.hasRuntimeStore,
			hasIngestionService: state.hasIngestionService,
			registrationCount: state.registrationEntries.length,
			lastError: state.lastError,
			diagnosticsSummary: getDiagnosticsSummary(),
		};
	}

	return Object.freeze({
		initializeOwnership,
		runStartupIngestionOnce,
		getCompatibilityState,
		getDiagnosticsSummary,
		getShellStatusDiagnostics() {
			return getDiagnosticsSummary();
		},
		getRuntimeStore() {
			return runtimeStore;
		},
		getIngestionService() {
			return ingestionService;
		},
		getState() {
			return {
				...state,
				registrationEntries: [...state.registrationEntries],
				diagnostics: state.diagnostics ? { ...state.diagnostics } : null,
			};
		},
	});
}
