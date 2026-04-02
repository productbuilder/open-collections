const ALL_MODE_WINDOW_SIZE = 20;
const ALL_MODE_MAX_WINDOWS = 6;
const ALL_MODE_SOURCE_SCAN_LIMIT = 6;
const ALL_MODE_RECENT_SOURCE_SPAN = 3;

const ALL_MODE_TYPE_QUOTAS = {
	source: 1,
	collection: 3,
	item: 16,
};

const ALL_MODE_TYPE_RHYTHM = [
	"source",
	"collection",
	"item",
	"item",
	"collection",
	"item",
	"source",
	"item",
	"collection",
	"item",
	"item",
	"collection",
	"item",
	"source",
	"item",
	"collection",
	"item",
	"item",
	"collection",
	"item",
];

const TYPE_KEYS = ["source", "collection", "item"];

function normalizePool(value) {
	return Array.isArray(value) ? value : [];
}

function getCandidateSourceId(candidate) {
	const sourceId = String(candidate?.sourceId ?? "").trim();
	return sourceId || "";
}

function countRecentSourceUses(sourceId, recentSourceIds) {
	if (!sourceId) {
		return 0;
	}
	return recentSourceIds.reduce(
		(total, recentSourceId) => total + (recentSourceId === sourceId ? 1 : 0),
		0,
	);
}

function isLocallyDiverseSource(candidate, recentSourceIds) {
	const sourceId = getCandidateSourceId(candidate);
	if (!sourceId || !recentSourceIds.length) {
		return true;
	}

	const lastSourceId = recentSourceIds[recentSourceIds.length - 1] || "";
	if (sourceId === lastSourceId) {
		return false;
	}

	return countRecentSourceUses(sourceId, recentSourceIds) < 2;
}

function pickCandidate(type, pools, indices, recentSourceIds = []) {
	const typePool = pools[type];
	const startIndex = indices[type] || 0;
	if (startIndex >= typePool.length) {
		return null;
	}

	let selectedIndex = startIndex;
	const currentCandidate = typePool[startIndex] || null;
	const recentWindow = recentSourceIds.slice(-ALL_MODE_RECENT_SOURCE_SPAN);
	const shouldSeekAlternative = !isLocallyDiverseSource(currentCandidate, recentWindow);
	if (shouldSeekAlternative) {
		const endIndex = Math.min(
			typePool.length,
			startIndex + 1 + ALL_MODE_SOURCE_SCAN_LIMIT,
		);
		for (let index = startIndex + 1; index < endIndex; index += 1) {
			const candidate = typePool[index] || null;
			if (!isLocallyDiverseSource(candidate, recentWindow)) {
				continue;
			}
			selectedIndex = index;
			break;
		}
	}

	if (selectedIndex !== startIndex) {
		const candidateAtStart = typePool[startIndex];
		typePool[startIndex] = typePool[selectedIndex];
		typePool[selectedIndex] = candidateAtStart;
	}

	indices[type] = startIndex + 1;
	return typePool[startIndex] || null;
}

function hasRemaining(type, pools, indices) {
	return (indices[type] || 0) < pools[type].length;
}

function findFallbackType(types, pools, indices, pickedByType, predicate) {
	for (const type of types) {
		if (!predicate(type, pickedByType)) {
			continue;
		}
		if (hasRemaining(type, pools, indices)) {
			return type;
		}
	}
	return "";
}

function assembleAllModeWindow({
	pools,
	indices,
	windowSize,
	recentSourceIds = [],
}) {
	const pickedByType = { source: 0, collection: 0, item: 0 };
	const assembledCandidates = [];

	for (let index = 0; index < windowSize; index += 1) {
		const preferredType = ALL_MODE_TYPE_RHYTHM[index] || "item";
		const typeOrder = [
			preferredType,
			...TYPE_KEYS.filter((type) => type !== preferredType),
		];

		let selectedType = findFallbackType(
			typeOrder,
			pools,
			indices,
			pickedByType,
			(type, counts) => counts[type] < ALL_MODE_TYPE_QUOTAS[type],
		);

		if (!selectedType) {
			selectedType = findFallbackType(
				typeOrder,
				pools,
				indices,
				pickedByType,
				() => true,
			);
		}

		if (!selectedType) {
			break;
		}

		const candidate = pickCandidate(
			selectedType,
			pools,
			indices,
			recentSourceIds,
		);
		if (!candidate) {
			continue;
		}

		pickedByType[selectedType] += 1;
		assembledCandidates.push(candidate);
		recentSourceIds.push(getCandidateSourceId(candidate));
		if (recentSourceIds.length > ALL_MODE_RECENT_SOURCE_SPAN) {
			recentSourceIds.shift();
		}
	}

	return assembledCandidates;
}

function assembleAllModeFeed(scoredPools = {}) {
	const pools = {
		source: normalizePool(scoredPools.sources),
		collection: normalizePool(scoredPools.collections),
		item: normalizePool(scoredPools.items),
	};
	const indices = { source: 0, collection: 0, item: 0 };
	const assembledCandidates = [];
	const totalCandidates =
		pools.source.length + pools.collection.length + pools.item.length;
	const maxCandidatesByWindowCount = ALL_MODE_WINDOW_SIZE * ALL_MODE_MAX_WINDOWS;
	const targetCandidateCount = Math.min(totalCandidates, maxCandidatesByWindowCount);

	while (assembledCandidates.length < targetCandidateCount) {
		const remainingCount = targetCandidateCount - assembledCandidates.length;
		const windowSize = Math.min(ALL_MODE_WINDOW_SIZE, remainingCount);
		const windowCandidates = assembleAllModeWindow({
			pools,
			indices,
			windowSize,
			recentSourceIds: assembledCandidates
				.slice(-ALL_MODE_RECENT_SOURCE_SPAN)
				.map((candidate) => getCandidateSourceId(candidate)),
		});
		if (!windowCandidates.length) {
			break;
		}
		assembledCandidates.push(...windowCandidates);
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
