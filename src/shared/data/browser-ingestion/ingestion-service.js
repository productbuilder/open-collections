import { createJsonFetchRepository } from "./fetch-repository.js";
import { resolveSourceDescriptor, listDescriptorCollectionRefs } from "./descriptor-resolver.js";
import { normalizeManifestToCanonicalEntities } from "./manifest-normalizer.js";
import { intakeRegistrations } from "./registration-intake.js";
import { createIngestionDiagnostics } from "./diagnostics.js";
import { getNowMs } from "../browser-diagnostics/index.js";

function createSourceEntityFromRegistration(entry, descriptor) {
	return {
		sourceId: entry.sourceId,
		label: entry.label,
		sourceType: entry.sourceType,
		sourceUrl: entry.entryUrl,
		organizationName:
			descriptor?.catalog?.organizationName || entry.display?.organizationName || "",
		curatorName: descriptor?.catalog?.curatorName || entry.display?.curatorName || "",
		placeName: descriptor?.catalog?.placeName || entry.display?.placeName || "",
		countryName: descriptor?.catalog?.countryName || entry.display?.countryName || "",
		countryCode: descriptor?.catalog?.countryCode || entry.display?.countryCode || "",
		registrationMeta: entry.meta || {},
		descriptorMeta:
			descriptor && typeof descriptor === "object" ? { ...descriptor } : {},
	};
}

function cloneValue(value) {
	return JSON.parse(JSON.stringify(value));
}

export function createBrowserIngestionService({
	runtimeStore,
	fetchImpl = globalThis.fetch,
	baseUrl = "http://localhost/",
} = {}) {
	if (!runtimeStore || typeof runtimeStore !== "object" || !runtimeStore.mutate) {
		throw new Error("createBrowserIngestionService requires runtimeStore with mutate API.");
	}

	async function ingest(registrationEntries = []) {
		const diagnostics = createIngestionDiagnostics();
		const repository = createJsonFetchRepository({
			fetchImpl,
			baseUrl,
			diagnostics,
		});
		const acceptedEntries = intakeRegistrations(registrationEntries, {
			baseUrl,
			diagnostics,
		});
		const normalizedManifestCache = new Map();
		let normalizeCacheHitCount = 0;

		for (const entry of acceptedEntries) {
			try {
				const descriptorStartMs = getNowMs();
				const descriptor = await resolveSourceDescriptor(entry, {
					repository,
					diagnostics,
				});
				diagnostics.addPhaseDuration(
					"descriptorResolutionMs",
					getNowMs() - descriptorStartMs,
				);
				const sourceEntity = createSourceEntityFromRegistration(entry, descriptor);
				runtimeStore.mutate.upsertSource(sourceEntity);
				diagnostics.increment("sourcesIngested", 1);

				const collectionRefs = listDescriptorCollectionRefs(descriptor);
				for (const collectionRef of collectionRefs) {
					try {
						const manifestJson = await repository.fetchJson(collectionRef.manifestUrl);
						const normalizedCacheKey = `${sourceEntity.sourceId}::${collectionRef.manifestUrl}`;
						let normalized = null;
						if (normalizedManifestCache.has(normalizedCacheKey)) {
							normalizeCacheHitCount += 1;
							diagnostics.increment("normalizeCacheHitCount", 1);
							normalized = cloneValue(normalizedManifestCache.get(normalizedCacheKey));
						} else {
							const normalizeStartMs = getNowMs();
							normalized = normalizeManifestToCanonicalEntities({
								sourceEntity,
								descriptor,
								collectionRef,
								manifestJson,
								normalizeCounter: () => diagnostics.increment("normalizeCount", 1),
							});
							diagnostics.addPhaseDuration(
								"manifestNormalizationMs",
								getNowMs() - normalizeStartMs,
							);
							normalizedManifestCache.set(normalizedCacheKey, cloneValue(normalized));
						}
						const storeStartMs = getNowMs();
						runtimeStore.mutate.upsertCollection(normalized.collectionEntity);
						runtimeStore.mutate.upsertItems(normalized.itemEntities);
						diagnostics.addPhaseDuration(
							"storePopulationMs",
							getNowMs() - storeStartMs,
						);
						diagnostics.increment("collectionsIngested", 1);
						diagnostics.increment("itemsIngested", normalized.itemEntities.length);
					} catch (error) {
						diagnostics.addFailure({
							code: "collection_ingest_failed",
							message: error?.message || "Collection ingestion failed.",
							context: {
								sourceId: entry.sourceId,
								manifestUrl: collectionRef.manifestUrl,
							},
						});
					}
				}
			} catch (error) {
				diagnostics.addFailure({
					code: "source_ingest_failed",
					message: error?.message || "Source ingestion failed.",
					context: {
						sourceId: entry.sourceId,
						entryUrl: entry.entryUrl,
					},
				});
			}
		}

		const fetchStats = repository.getStats();
		const snapshot = runtimeStore.getSnapshot();
		const includedItemsIngested = [...snapshot.itemsById.values()].filter(
			(item) => item.include !== false,
		).length;
		const georeferencedItemsIngested =
			snapshot?.indexes?.spatial?.georeferencedItemRefs?.length || 0;
		const temporalItemsIngested =
			snapshot?.indexes?.temporal?.knownItemRefs?.length || 0;
		return diagnostics.finish({
			sourceEntriesAccepted: acceptedEntries.length,
			sourceEntriesTotal: Array.isArray(registrationEntries)
				? registrationEntries.length
				: 0,
			fetchRequestCount: fetchStats.requestCount,
			fetchNetworkCount: fetchStats.networkFetchCount,
			fetchDedupedHitCount: fetchStats.dedupedHitCount,
			fetchCacheEvictionCount: fetchStats.cacheEvictionCount,
			normalizeCacheHitCount,
			includedItemsIngested,
			georeferencedItemsIngested,
			temporalItemsIngested,
			storeMeta: runtimeStore.getMeta(),
		});
	}

	return Object.freeze({
		ingest,
	});
}
