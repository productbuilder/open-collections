function toNonNegativeInteger(value, fallback = 0) {
	const parsed = Number(value);
	if (!Number.isFinite(parsed) || parsed < 0) {
		return fallback;
	}
	return Math.floor(parsed);
}

function toNullableDurationMs(value) {
	const parsed = Number(value);
	if (!Number.isFinite(parsed) || parsed < 0) {
		return null;
	}
	return Math.round(parsed * 1000) / 1000;
}

export function getNowMs() {
	if (
		typeof globalThis !== "undefined" &&
		globalThis.performance &&
		typeof globalThis.performance.now === "function"
	) {
		return globalThis.performance.now();
	}
	return Date.now();
}

export function createStructuredDiagnostics({
	kind = "generic",
	counts = {},
	fetch = {},
	normalization = {},
	warnings = [],
	failures = [],
	projection = {},
	timing = {},
	compatibility = {},
	extra = {},
} = {}) {
	const warningItems = Array.isArray(warnings) ? warnings : [];
	const failureItems = Array.isArray(failures) ? failures : [];
	return {
		modelVersion: "browser-diagnostics-v1",
		kind,
		counts: {
			sources: toNonNegativeInteger(counts.sources),
			collections: toNonNegativeInteger(counts.collections),
			items: toNonNegativeInteger(counts.items),
			includedItems: toNonNegativeInteger(counts.includedItems),
			georeferencedItems: toNonNegativeInteger(counts.georeferencedItems),
			temporalItems: toNonNegativeInteger(counts.temporalItems),
			...(counts.filtered
				? {
						filtered: {
							sources: toNonNegativeInteger(counts.filtered.sources),
							collections: toNonNegativeInteger(counts.filtered.collections),
							items: toNonNegativeInteger(counts.filtered.items),
						},
				  }
				: {}),
			...(counts.projected
				? {
						projected: {
							list: toNonNegativeInteger(counts.projected.list),
							map: toNonNegativeInteger(counts.projected.map),
						},
				  }
				: {}),
		},
		fetch: {
			requestCount: toNonNegativeInteger(fetch.requestCount),
			networkCount: toNonNegativeInteger(fetch.networkCount),
			dedupHitCount: toNonNegativeInteger(fetch.dedupHitCount),
		},
		normalization: {
			count: toNonNegativeInteger(normalization.count),
		},
		warnings: {
			count: warningItems.length,
			items: warningItems,
		},
		failures: {
			count: failureItems.length,
			items: failureItems,
		},
		projection: {
			count: toNonNegativeInteger(projection.count),
			listCount: toNonNegativeInteger(projection.listCount),
			mapCount: toNonNegativeInteger(projection.mapCount),
			viewportFilteredCount: toNonNegativeInteger(projection.viewportFilteredCount),
		},
		timing: {
			totalMs: toNullableDurationMs(timing.totalMs),
			ingestionMs: toNullableDurationMs(timing.ingestionMs),
			descriptorResolutionMs: toNullableDurationMs(timing.descriptorResolutionMs),
			manifestNormalizationMs: toNullableDurationMs(timing.manifestNormalizationMs),
			storePopulationMs: toNullableDurationMs(timing.storePopulationMs),
			listProjectionMs: toNullableDurationMs(timing.listProjectionMs),
			mapProjectionMs: toNullableDurationMs(timing.mapProjectionMs),
			startupIngestionMs: toNullableDurationMs(timing.startupIngestionMs),
		},
		compatibility: {
			...compatibility,
		},
		...extra,
	};
}

