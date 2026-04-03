import { buildCandidatePools } from "./candidate-pools.js";
import { scoreCandidatePools } from "./scoring.js";
import {
	appendNextFeedChunk,
	assembleFeedWindow,
	createAllModeFeedStreamState,
} from "./assembly.js";
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
	exposureNamespace = "",
} = {}) {
	const memory = exposureMemory || createExposureMemory({ namespace: exposureNamespace });
	const candidatePools = buildCandidatePools({
		sourceCards,
		collectionCards,
		itemCards,
	});
	const scoredPools = scoreCandidatePools(candidatePools, { mode, exposureMemory: memory });
	return assembleFeedWindow(scoredPools, { mode });
}

export function createBrowseFeedStreamSession({
	mode = "all",
	sourceCards = [],
	collectionCards = [],
	itemCards = [],
	exposureMemory = null,
	exposureNamespace = "",
} = {}) {
	if (mode !== "all") {
		return null;
	}
	const memory = exposureMemory || createExposureMemory({ namespace: exposureNamespace });
	const candidatePools = buildCandidatePools({
		sourceCards,
		collectionCards,
		itemCards,
	});
	const scoredPools = scoreCandidatePools(candidatePools, {
		mode,
		exposureMemory: memory,
	});
	return {
		mode,
		streamState: createAllModeFeedStreamState(scoredPools, {
			exposureMemory: memory,
		}),
		exhausted: false,
	};
}

export function appendBrowseFeedStreamChunk(
	session,
	{ count = 24 } = {},
) {
	if (!session || session.mode !== "all" || session.exhausted) {
		return [];
	}
	const chunk = appendNextFeedChunk(session.streamState, { count });
	if (
		chunk.length === 0 ||
		session.streamState.emittedCandidates.length >= session.streamState.maxCards
	) {
		session.exhausted = true;
	}
	return chunk;
}

export { createExposureMemory };
