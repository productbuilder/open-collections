import { toAbsoluteUrl } from "./url-utils.js";

function cloneValue(value) {
	return JSON.parse(JSON.stringify(value));
}

export function createJsonFetchRepository({
	fetchImpl = globalThis.fetch,
	baseUrl = "http://localhost/",
	diagnostics = null,
	maxCacheEntries = 256,
} = {}) {
	if (typeof fetchImpl !== "function") {
		throw new Error("createJsonFetchRepository requires fetchImpl.");
	}

	const cache = new Map();
	let requestCount = 0;
	let networkFetchCount = 0;
	let dedupedHitCount = 0;
	let cacheEvictionCount = 0;

	function evictOverflowEntries() {
		const limit = Number.isFinite(Number(maxCacheEntries))
			? Math.max(8, Math.floor(Number(maxCacheEntries)))
			: 256;
		while (cache.size >= limit) {
			const oldestKey = cache.keys().next().value;
			if (oldestKey === undefined) {
				break;
			}
			cache.delete(oldestKey);
			cacheEvictionCount += 1;
			diagnostics?.increment("fetchCacheEvictionCount", 1);
		}
	}

	async function fetchJson(url) {
		const absoluteUrl = toAbsoluteUrl(url, baseUrl);
		requestCount += 1;
		diagnostics?.increment("fetchRequestCount", 1);
		if (cache.has(absoluteUrl)) {
			dedupedHitCount += 1;
			diagnostics?.increment("fetchDedupedHitCount", 1);
			const cached = await cache.get(absoluteUrl);
			return cloneValue(cached);
		}

		networkFetchCount += 1;
		diagnostics?.increment("fetchNetworkCount", 1);
		const requestPromise = (async () => {
			const response = await fetchImpl(absoluteUrl);
			if (!response || response.ok !== true) {
				const status = response ? response.status : "unknown";
				throw new Error(`Failed to fetch ${absoluteUrl} (${status}).`);
			}
			const json = await response.json();
			return json;
		})();
		evictOverflowEntries();
		cache.set(absoluteUrl, requestPromise);
		try {
			const result = await requestPromise;
			return cloneValue(result);
		} catch (error) {
			cache.delete(absoluteUrl);
			throw error;
		}
	}

	return Object.freeze({
		fetchJson,
		getStats() {
			return {
				requestCount,
				networkFetchCount,
				dedupedHitCount,
				cacheSize: cache.size,
				cacheEvictionCount,
				cacheScope: "per-ingestion-run",
			};
		},
		// Current boundary: cache is per repository instance (typically per ingestion run).
		clearCache() {
			cache.clear();
		},
	});
}
