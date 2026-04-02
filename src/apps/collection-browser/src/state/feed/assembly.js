const ALL_MODE_WINDOW_SIZE = 20;
const ALL_MODE_MAX_WINDOWS = 3;

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

function pickCandidate(type, pools, indices) {
	const typePool = pools[type];
	const index = indices[type] || 0;
	if (index >= typePool.length) {
		return null;
	}
	indices[type] = index + 1;
	return typePool[index] || null;
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

function assembleAllModeWindow({ pools, indices, windowSize }) {
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

		const candidate = pickCandidate(selectedType, pools, indices);
		if (!candidate) {
			continue;
		}

		pickedByType[selectedType] += 1;
		assembledCandidates.push(candidate);
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
