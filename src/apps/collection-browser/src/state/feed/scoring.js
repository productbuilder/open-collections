// Feed v1 scaffold:
// Placeholder scoring pass. Keep ordering unchanged until Feed Algorithm v1 lands.
export function scoreCandidatePools(pools = {}, _context = {}) {
	return {
		sources: Array.isArray(pools.sources) ? pools.sources : [],
		collections: Array.isArray(pools.collections) ? pools.collections : [],
		items: Array.isArray(pools.items) ? pools.items : [],
	};
}

