// Feed v1 scaffold:
// Window assembly remains a flat merge for now to preserve current behavior.
export function assembleFeedWindow(
	scoredPools = {},
	{ mode = "all" } = {},
) {
	if (mode !== "all") {
		return [];
	}
	const sources = Array.isArray(scoredPools.sources) ? scoredPools.sources : [];
	const collections = Array.isArray(scoredPools.collections)
		? scoredPools.collections
		: [];
	const items = Array.isArray(scoredPools.items) ? scoredPools.items : [];
	return [...sources, ...collections, ...items]
		.map((candidate) => candidate?.entity)
		.filter(Boolean);
}
