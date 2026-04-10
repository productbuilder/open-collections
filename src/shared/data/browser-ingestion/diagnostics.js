import { createStructuredDiagnostics, getNowMs } from "../browser-diagnostics/index.js";

export function createIngestionDiagnostics() {
	const startedAtMs = getNowMs();
	const summary = {
		startedAt: new Date().toISOString(),
		completedAt: null,
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
		warnings: [],
		failures: [],
		phases: {
			descriptorResolutionMs: 0,
			manifestNormalizationMs: 0,
			storePopulationMs: 0,
			startupIngestionMs: 0,
		},
	};

	return {
		increment(field, amount = 1) {
			if (!Object.prototype.hasOwnProperty.call(summary, field)) {
				return;
			}
			const value = Number(summary[field]) || 0;
			summary[field] = value + amount;
		},
		addWarning(warning = {}) {
			summary.warnings.push({
				code: warning.code || "warning",
				message: warning.message || "",
				context: warning.context || {},
			});
		},
		addFailure(failure = {}) {
			summary.failures.push({
				code: failure.code || "failure",
				message: failure.message || "",
				context: failure.context || {},
			});
		},
		addPhaseDuration(phaseKey, durationMs = 0) {
			if (!summary.phases || !Object.prototype.hasOwnProperty.call(summary.phases, phaseKey)) {
				return;
			}
			const value = Number(summary.phases[phaseKey]) || 0;
			const duration = Number(durationMs);
			if (!Number.isFinite(duration) || duration < 0) {
				return;
			}
			summary.phases[phaseKey] = value + duration;
		},
		finish(extra = {}) {
			summary.completedAt = new Date().toISOString();
			const totalMs = Math.max(0, getNowMs() - startedAtMs);
			const warnings = Array.isArray(summary.warnings) ? summary.warnings : [];
			const failures = Array.isArray(summary.failures) ? summary.failures : [];
			const structured = createStructuredDiagnostics({
				kind: "ingestion",
				counts: {
					sources: Number(summary.sourcesIngested || 0),
					collections: Number(summary.collectionsIngested || 0),
					items: Number(summary.itemsIngested || 0),
					includedItems: Number(extra?.includedItemsIngested || summary.itemsIngested || 0),
					georeferencedItems: Number(extra?.georeferencedItemsIngested || 0),
					temporalItems: Number(extra?.temporalItemsIngested || 0),
				},
				fetch: {
					requestCount: Number(extra?.fetchRequestCount || summary.fetchRequestCount || 0),
					networkCount: Number(extra?.fetchNetworkCount || summary.fetchNetworkCount || 0),
					dedupHitCount: Number(
						extra?.fetchDedupedHitCount || summary.fetchDedupedHitCount || 0,
					),
				},
				normalization: {
					count: Number(summary.normalizeCount || 0),
				},
				warnings,
				failures,
				timing: {
					totalMs,
					ingestionMs: totalMs,
					descriptorResolutionMs: Number(summary.phases.descriptorResolutionMs || 0),
					manifestNormalizationMs: Number(summary.phases.manifestNormalizationMs || 0),
					storePopulationMs: Number(summary.phases.storePopulationMs || 0),
					startupIngestionMs: totalMs,
				},
				extra: {
					phases: {
						...summary.phases,
						startupIngestionMs: totalMs,
					},
					cache: {
						fetchCacheEvictionCount: Number(
							extra?.fetchCacheEvictionCount || summary.fetchCacheEvictionCount || 0,
						),
						normalizeCacheHitCount: Number(
							extra?.normalizeCacheHitCount || summary.normalizeCacheHitCount || 0,
						),
					},
				},
			});
			return {
				...summary,
				...extra,
				totalDurationMs: totalMs,
				structured,
			};
		},
	};
}
