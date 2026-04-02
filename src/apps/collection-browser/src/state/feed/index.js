import { buildCandidatePools } from "./candidate-pools.js";
import { scoreCandidatePools } from "./scoring.js";
import { assembleFeedWindow } from "./assembly.js";
import { createExposureMemory } from "./exposure-memory.js";

// Feed v1 orchestration seam for collection-browser.
// Current behavior: preserve the existing flat all-mode merge.
// Later behavior: evolve pools/scoring/assembly without changing callers.
export function buildBrowseFeedEntities({
	mode = "all",
	sourceCards = [],
	collectionCards = [],
	itemCards = [],
	exposureMemory = null,
} = {}) {
	const memory = exposureMemory || createExposureMemory();
	const candidatePools = buildCandidatePools({
		sourceCards,
		collectionCards,
		itemCards,
	});
	const scoredPools = scoreCandidatePools(candidatePools, { mode, exposureMemory: memory });
	return assembleFeedWindow(scoredPools, { mode });
}

export { createExposureMemory };

