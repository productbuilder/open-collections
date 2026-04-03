import { buildCandidatePools } from "./candidate-pools.js";
import { scoreCandidatePools } from "./scoring.js";
import {
	appendNextFeedChunk,
	assembleFeedWindow,
	createAllModeFeedStreamState,
} from "./assembly.js";
import { createExposureMemory } from "./exposure-memory.js";

function toNormalizedText(value) {
	return String(value ?? "").trim();
}

function resolveCardSourceId(card = {}) {
	const sourceId = toNormalizedText(card?.sourceId);
	if (sourceId) {
		return sourceId;
	}
	const nestedSourceId = toNormalizedText(card?.item?.sourceCollectionId);
	if (nestedSourceId.includes("::")) {
		return nestedSourceId.split("::")[0];
	}
	return "__unknown_source__";
}

function sourceDiverseDeterministicOrder(cards = [], { seed = 0 } = {}) {
	const list = Array.isArray(cards) ? cards.filter(Boolean) : [];
	if (list.length <= 1) {
		return list;
	}
	const bucketsBySource = new Map();
	const sourceOrder = [];
	for (const card of list) {
		const sourceId = resolveCardSourceId(card);
		if (!bucketsBySource.has(sourceId)) {
			bucketsBySource.set(sourceId, []);
			sourceOrder.push(sourceId);
		}
		bucketsBySource.get(sourceId).push(card);
	}
	if (sourceOrder.length <= 1) {
		return list;
	}
	const sourceUseCounts = new Map();
	const rotatedSourceOrder = sourceOrder.slice();
	const normalizedShift = Math.abs(Math.floor(Number(seed) || 0)) % rotatedSourceOrder.length;
	if (normalizedShift > 0) {
		rotatedSourceOrder.push(...rotatedSourceOrder.splice(0, normalizedShift));
	}
	const ordered = [];
	while (ordered.length < list.length) {
		let selectedSourceId = "";
		let bestScore = null;
		for (const sourceId of rotatedSourceOrder) {
			const bucket = bucketsBySource.get(sourceId);
			if (!bucket?.length) {
				continue;
			}
			const useCount = sourceUseCounts.get(sourceId) ?? 0;
			const queueDepth = bucket.length;
			const score = [useCount, -queueDepth];
			if (!bestScore || score[0] < bestScore[0] || (score[0] === bestScore[0] && score[1] < bestScore[1])) {
				selectedSourceId = sourceId;
				bestScore = score;
			}
		}
		if (!selectedSourceId) {
			break;
		}
		const nextCard = bucketsBySource.get(selectedSourceId)?.shift();
		if (!nextCard) {
			continue;
		}
		ordered.push(nextCard);
		sourceUseCounts.set(selectedSourceId, (sourceUseCounts.get(selectedSourceId) ?? 0) + 1);
	}
	return ordered;
}

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
	const sessionSeed = memory.beginSession();
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
			sessionSeed,
		}),
		exhausted: false,
	};
}

export function orderBrowseModeCards({
	mode = "all",
	collectionCards = [],
	itemCards = [],
	exposureNamespace = "",
} = {}) {
	const namespaceText = toNormalizedText(exposureNamespace);
	const modeSeed = namespaceText.length + (mode === "items" ? 11 : 3);
	if (mode === "collections") {
		return sourceDiverseDeterministicOrder(collectionCards, { seed: modeSeed });
	}
	if (mode === "items") {
		return sourceDiverseDeterministicOrder(itemCards, { seed: modeSeed });
	}
	return [];
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
