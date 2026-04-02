const ALL_MODE_MAX_CARDS = 180;
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

		const score = [
			option.isReuse ? 1 : 0,
			type === "source" ? anchorSourceSeen : 0,
			type !== "item" ? anchorEntitySeen : 0,
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

function advancePacing(pacingState) {
	const interval = pacingState.steps[pacingState.stepIndex] || pacingState.steps[0] || 1;
	pacingState.stepIndex = (pacingState.stepIndex + 1) % pacingState.steps.length;
	pacingState.nextInsertAt += interval;
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

function assembleAllModeFeed(scoredPools = {}) {
	const pools = {
		source: normalizePool(scoredPools.sources),
		collection: normalizePool(scoredPools.collections),
		item: normalizePool(scoredPools.items),
	};
	const totalCandidateCount =
		pools.source.length + pools.collection.length + pools.item.length;
	const targetCount = Math.min(totalCandidateCount, ALL_MODE_MAX_CARDS);
	if (!targetCount) {
		return [];
	}

	const cursorState = { source: 0, collection: 0, item: 0 };
	const recentSourceIds = [];
	const sourceUseCounts = new Map();
	const sourceAnchorLastSeenByKey = new Map();
	const collectionAnchorLastSeenByKey = new Map();
	const usedSourceAnchorSourceIds = new Set();
	const usedSourceAnchorKeys = new Set();
	const usedCollectionAnchorKeys = new Set();
	const assembledCandidates = [];

	const collectionPacing = createPacingState(ALL_MODE_COLLECTION_PACING_STEPS, 4);
	const sourcePacing = createPacingState(ALL_MODE_SOURCE_PACING_STEPS, 12);

	while (assembledCandidates.length < targetCount) {
		const feedIndex = assembledCandidates.length;
		let selectedType = "item";

		if (feedIndex >= sourcePacing.nextInsertAt && pools.source.length > 0) {
			selectedType = "source";
		} else if (
			feedIndex >= collectionPacing.nextInsertAt &&
			pools.collection.length > 0
		) {
			selectedType = "collection";
		}

		const candidateSelection =
			(selectedType === "source" &&
				pickBestCandidate({
					type: "source",
					pool: pools.source,
					cursorState,
					feedIndex,
					recentSourceIds,
					sourceUseCounts,
					allowReuse: true,
					anchorReuseGap: ALL_MODE_SOURCE_REUSE_GAP,
					anchorLastSeenByKey: sourceAnchorLastSeenByKey,
					usedAnchorSourceIds: usedSourceAnchorSourceIds,
					usedAnchorEntityKeys: usedSourceAnchorKeys,
				})) ||
			(selectedType === "collection" &&
				pickBestCandidate({
					type: "collection",
					pool: pools.collection,
					cursorState,
					feedIndex,
					recentSourceIds,
					sourceUseCounts,
					allowReuse: true,
					anchorReuseGap: ALL_MODE_COLLECTION_REUSE_GAP,
					anchorLastSeenByKey: collectionAnchorLastSeenByKey,
					usedAnchorSourceIds: new Set(),
					usedAnchorEntityKeys: usedCollectionAnchorKeys,
				})) ||
			pickBestCandidate({
				type: "item",
				pool: pools.item,
				cursorState,
				feedIndex,
				recentSourceIds,
				sourceUseCounts,
				allowReuse: false,
				anchorLastSeenByKey: new Map(),
				usedAnchorSourceIds: new Set(),
				usedAnchorEntityKeys: new Set(),
			});

		if (!candidateSelection) {
			break;
		}

		assembledCandidates.push(candidateSelection.candidate);
		updateSourceTracking(
			candidateSelection.sourceId,
			recentSourceIds,
			sourceUseCounts,
		);

		if (selectedType === "source") {
			sourceAnchorLastSeenByKey.set(candidateSelection.key, feedIndex);
			usedSourceAnchorSourceIds.add(candidateSelection.sourceId);
			usedSourceAnchorKeys.add(candidateSelection.key);
			advancePacing(sourcePacing);
		} else if (selectedType === "collection") {
			collectionAnchorLastSeenByKey.set(candidateSelection.key, feedIndex);
			usedCollectionAnchorKeys.add(candidateSelection.key);
			advancePacing(collectionPacing);
		}
	}

	return assembledCandidates
		.map((candidate) => candidate?.entity)
		.filter(Boolean);
}

export function assembleFeedWindow(
	scoredPools = {},
	{ mode = "all" } = {},
) {
	if (mode !== "all") {
		return [];
	}
	return assembleAllModeFeed(scoredPools);
}
