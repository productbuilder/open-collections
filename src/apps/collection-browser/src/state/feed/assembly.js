const ALL_MODE_MAX_CARDS = 180;
const ALL_MODE_DEFAULT_CHUNK_SIZE = 36;
const ALL_MODE_SCAN_LIMITS = {
	source: 12,
	collection: 16,
	item: 24,
};
const ALL_MODE_RECENT_SOURCE_WINDOW = 8;
const ALL_MODE_COLLECTION_REUSE_GAP = 10;
const ALL_MODE_SOURCE_REUSE_GAP = 24;

const ALL_MODE_COLLECTION_PACING_STEPS = [5, 6, 7, 6, 8];
const ALL_MODE_SOURCE_PACING_STEPS = [14, 16, 18, 15, 20];

function normalizePool(value) {
	return Array.isArray(value) ? value : [];
}

function getCandidateSourceId(candidate) {
	const sourceId = String(candidate?.sourceId ?? "").trim();
	if (sourceId) {
		return sourceId;
	}
	const entitySourceId = String(candidate?.entity?.sourceId ?? "").trim();
	if (entitySourceId) {
		return entitySourceId;
	}
	const entityId = String(candidate?.entity?.id ?? candidate?.id ?? "").trim();
	return entityId;
}

function getCandidateKey(candidate, index, type) {
	const entityId = String(candidate?.entity?.id ?? candidate?.id ?? "").trim();
	if (entityId) {
		return `${type}:${entityId}`;
	}
	return `${type}:index:${index}`;
}

function getRecentSourceUseCount(sourceId, recentSourceIds) {
	if (!sourceId || !recentSourceIds.length) {
		return 0;
	}
	let uses = 0;
	for (const recentSourceId of recentSourceIds) {
		if (recentSourceId === sourceId) {
			uses += 1;
		}
	}
	return uses;
}

function isAnchorReusable(entityKey, currentIndex, lastSeenByKey, minGap) {
	if (!entityKey) {
		return true;
	}
	const lastSeenIndex = lastSeenByKey.get(entityKey);
	if (typeof lastSeenIndex !== "number") {
		return true;
	}
	return currentIndex - lastSeenIndex >= minGap;
}

function compareCandidateScores(left, right) {
	const maxLength = Math.max(left.length, right.length);
	for (let index = 0; index < maxLength; index += 1) {
		const leftValue = left[index] ?? 0;
		const rightValue = right[index] ?? 0;
		if (leftValue === rightValue) {
			continue;
		}
		return leftValue < rightValue ? -1 : 1;
	}
	return 0;
}

function gatherCandidateOptions({
	type,
	pool,
	cursor,
	scanLimit,
	feedIndex,
	allowReuse,
	anchorReuseGap,
	anchorLastSeenByKey,
}) {
	const options = [];
	const scanEnd = Math.min(pool.length, cursor + scanLimit);
	for (let index = cursor; index < scanEnd; index += 1) {
		const candidate = pool[index] ?? null;
		if (!candidate) {
			continue;
		}
		const key = getCandidateKey(candidate, index, type);
		if (
			anchorReuseGap > 0 &&
			!isAnchorReusable(key, feedIndex, anchorLastSeenByKey, anchorReuseGap)
		) {
			continue;
		}
		options.push({
			candidate,
			index,
			isReuse: false,
			key,
		});
	}

	if (!options.length && allowReuse) {
		for (let index = 0; index < pool.length; index += 1) {
			const candidate = pool[index] ?? null;
			if (!candidate) {
				continue;
			}
			const key = getCandidateKey(candidate, index, type);
			if (
				anchorReuseGap > 0 &&
				!isAnchorReusable(key, feedIndex, anchorLastSeenByKey, anchorReuseGap)
			) {
				continue;
			}
			options.push({
				candidate,
				index,
				isReuse: true,
				key,
			});
		}
	}

	return options;
}

function pickBestCandidate({
	type,
	pool,
	cursorState,
	feedIndex,
	recentSourceIds,
	sourceUseCounts,
	emittedEntityKeys,
	allowReuse = false,
	anchorReuseGap = 0,
	anchorLastSeenByKey,
	usedAnchorSourceIds,
	usedAnchorEntityKeys,
}) {
	if (!pool.length) {
		return null;
	}

	const cursor = cursorState[type] ?? 0;
	const scanLimit = ALL_MODE_SCAN_LIMITS[type] || 12;
	const options = gatherCandidateOptions({
		type,
		pool,
		cursor,
		scanLimit,
		feedIndex,
		allowReuse,
		anchorReuseGap,
		anchorLastSeenByKey,
	});
	if (!options.length) {
		return null;
	}

	const lastSourceId = recentSourceIds[recentSourceIds.length - 1] || "";
	let bestOption = null;
	let bestScore = null;

	for (const option of options) {
		const sourceId = getCandidateSourceId(option.candidate);
		const recentUseCount = getRecentSourceUseCount(sourceId, recentSourceIds);
		const globalUseCount = sourceUseCounts.get(sourceId) ?? 0;
		const sameAsLastSource = sourceId && sourceId === lastSourceId ? 1 : 0;
		const anchorSourceSeen = usedAnchorSourceIds.has(sourceId) ? 1 : 0;
		const anchorEntitySeen = usedAnchorEntityKeys.has(option.key) ? 1 : 0;
		const emittedEntityId = String(option.candidate?.entity?.id ?? "").trim();
		const emittedEntitySeen = emittedEntityId && emittedEntityKeys.has(emittedEntityId) ? 1 : 0;

		const score = [
			type === "item" ? 0 : option.isReuse ? 1 : 0,
			type === "source" ? anchorSourceSeen : 0,
			type !== "item" ? anchorEntitySeen : 0,
			emittedEntitySeen,
			recentUseCount,
			sameAsLastSource,
			globalUseCount,
			option.index,
		];

		if (!bestScore || compareCandidateScores(score, bestScore) < 0) {
			bestOption = option;
			bestScore = score;
		}
	}

	if (!bestOption) {
		return null;
	}

	if (!bestOption.isReuse && bestOption.index >= cursor) {
		cursorState[type] = bestOption.index + 1;
	}

	return {
		candidate: bestOption.candidate,
		key: bestOption.key,
		sourceId: getCandidateSourceId(bestOption.candidate),
	};
}

function createPacingState(steps, firstOffset = 0) {
	return {
		steps,
		stepIndex: 0,
		nextInsertAt: firstOffset,
	};
}

function advancePacing(pacingState, feedIndex) {
	const interval = pacingState.steps[pacingState.stepIndex] || pacingState.steps[0] || 1;
	pacingState.stepIndex = (pacingState.stepIndex + 1) % pacingState.steps.length;
	pacingState.nextInsertAt = feedIndex + interval;
}

function updateSourceTracking(sourceId, recentSourceIds, sourceUseCounts) {
	if (!sourceId) {
		return;
	}
	recentSourceIds.push(sourceId);
	if (recentSourceIds.length > ALL_MODE_RECENT_SOURCE_WINDOW) {
		recentSourceIds.shift();
	}
	sourceUseCounts.set(sourceId, (sourceUseCounts.get(sourceId) ?? 0) + 1);
}

function getAnchorTimingState(feedIndex, pacingState) {
	const overdueBy = feedIndex - pacingState.nextInsertAt;
	return {
		due: overdueBy >= 0,
		overdueBy,
	};
}

function getTypeAttemptOrder(state) {
	const feedIndex = state.emittedCandidates.length;
	const sourceTiming = getAnchorTimingState(feedIndex, state.pacing.source);
	const collectionTiming = getAnchorTimingState(feedIndex, state.pacing.collection);

	if (sourceTiming.due && collectionTiming.due) {
		if (sourceTiming.overdueBy >= collectionTiming.overdueBy) {
			return ["source", "collection", "item"];
		}
		return ["collection", "source", "item"];
	}

	if (sourceTiming.due) {
		return ["source", "item", "collection"];
	}

	if (collectionTiming.due) {
		return ["collection", "item", "source"];
	}

	return ["item", "collection", "source"];
}

function selectCandidateForType(type, state, feedIndex) {
	if (type === "source") {
		return pickBestCandidate({
			type,
			pool: state.pools.source,
			cursorState: state.cursorState,
			feedIndex,
			recentSourceIds: state.recentSourceIds,
			sourceUseCounts: state.sourceUseCounts,
			emittedEntityKeys: state.emittedEntityKeys,
			allowReuse: true,
			anchorReuseGap: ALL_MODE_SOURCE_REUSE_GAP,
			anchorLastSeenByKey: state.anchorLastSeen.source,
			usedAnchorSourceIds: state.usedSourceAnchorSourceIds,
			usedAnchorEntityKeys: state.usedSourceAnchorKeys,
		});
	}

	if (type === "collection") {
		return pickBestCandidate({
			type,
			pool: state.pools.collection,
			cursorState: state.cursorState,
			feedIndex,
			recentSourceIds: state.recentSourceIds,
			sourceUseCounts: state.sourceUseCounts,
			emittedEntityKeys: state.emittedEntityKeys,
			allowReuse: true,
			anchorReuseGap: ALL_MODE_COLLECTION_REUSE_GAP,
			anchorLastSeenByKey: state.anchorLastSeen.collection,
			usedAnchorSourceIds: new Set(),
			usedAnchorEntityKeys: state.usedCollectionAnchorKeys,
		});
	}

	return pickBestCandidate({
		type: "item",
		pool: state.pools.item,
		cursorState: state.cursorState,
		feedIndex,
		recentSourceIds: state.recentSourceIds,
		sourceUseCounts: state.sourceUseCounts,
		emittedEntityKeys: state.emittedEntityKeys,
		allowReuse: false,
		anchorLastSeenByKey: new Map(),
		usedAnchorSourceIds: new Set(),
		usedAnchorEntityKeys: new Set(),
	});
}

function commitCandidateSelection(type, selection, state, feedIndex) {
	state.emittedCandidates.push(selection.candidate);
	const entityId = String(selection?.candidate?.entity?.id ?? "").trim();
	if (entityId) {
		state.emittedEntityKeys.add(entityId);
	}
	updateSourceTracking(selection.sourceId, state.recentSourceIds, state.sourceUseCounts);

	if (type === "source") {
		state.anchorLastSeen.source.set(selection.key, feedIndex);
		state.usedSourceAnchorSourceIds.add(selection.sourceId);
		state.usedSourceAnchorKeys.add(selection.key);
		advancePacing(state.pacing.source, feedIndex);
	}

	if (type === "collection") {
		state.anchorLastSeen.collection.set(selection.key, feedIndex);
		state.usedCollectionAnchorKeys.add(selection.key);
		advancePacing(state.pacing.collection, feedIndex);
	}
}

function pickNextCandidate(state) {
	if (state.emittedCandidates.length >= state.maxCards) {
		return null;
	}

	const feedIndex = state.emittedCandidates.length;
	const typeAttemptOrder = getTypeAttemptOrder(state);

	for (const type of typeAttemptOrder) {
		const selection = selectCandidateForType(type, state, feedIndex);
		if (!selection) {
			continue;
		}
		commitCandidateSelection(type, selection, state, feedIndex);
		return selection;
	}

	return null;
}

export function createAllModeFeedStreamState(scoredPools = {}, { maxCards = ALL_MODE_MAX_CARDS } = {}) {
	const pools = {
		source: normalizePool(scoredPools.sources),
		collection: normalizePool(scoredPools.collections),
		item: normalizePool(scoredPools.items),
	};
	const totalCandidateCount =
		pools.source.length + pools.collection.length + pools.item.length;

	return {
		maxCards: Math.min(maxCards, Math.max(0, totalCandidateCount)),
		pools,
		cursorState: { source: 0, collection: 0, item: 0 },
		recentSourceIds: [],
		sourceUseCounts: new Map(),
		emittedEntityKeys: new Set(),
		emittedCandidates: [],
		anchorLastSeen: {
			source: new Map(),
			collection: new Map(),
		},
		usedSourceAnchorSourceIds: new Set(),
		usedSourceAnchorKeys: new Set(),
		usedCollectionAnchorKeys: new Set(),
		pacing: {
			collection: createPacingState(ALL_MODE_COLLECTION_PACING_STEPS, 4),
			source: createPacingState(ALL_MODE_SOURCE_PACING_STEPS, 12),
		},
	};
}

export function appendNextFeedChunk(
	streamState,
	{ count = ALL_MODE_DEFAULT_CHUNK_SIZE } = {},
) {
	if (!streamState || count <= 0) {
		return [];
	}

	const chunkEntities = [];
	while (chunkEntities.length < count) {
		const selection = pickNextCandidate(streamState);
		if (!selection) {
			break;
		}
		const entity = selection?.candidate?.entity;
		if (entity) {
			chunkEntities.push(entity);
		}
	}

	return chunkEntities;
}

function assembleAllModeFeed(scoredPools = {}) {
	const streamState = createAllModeFeedStreamState(scoredPools, {
		maxCards: ALL_MODE_MAX_CARDS,
	});
	const entities = [];

	while (entities.length < streamState.maxCards) {
		const nextChunk = appendNextFeedChunk(streamState, {
			count: Math.min(ALL_MODE_DEFAULT_CHUNK_SIZE, streamState.maxCards - entities.length),
		});
		if (!nextChunk.length) {
			break;
		}
		entities.push(...nextChunk);
	}

	return entities;
}

export function assembleFeedWindow(scoredPools = {}, { mode = "all" } = {}) {
	if (mode !== "all") {
		return [];
	}
	return assembleAllModeFeed(scoredPools);
}
