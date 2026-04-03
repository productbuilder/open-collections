const EXPOSURE_MEMORY_STORAGE_PREFIX = "oc:collection-browser:all-feed:exposure:";
const EXPOSURE_MEMORY_VERSION = 1;
const EXPOSURE_MEMORY_MAX_ENTRIES = 2400;

function normalizeId(value) {
	return String(value ?? "").trim();
}

function normalizeEntityType(value) {
	const type = normalizeId(value).toLowerCase();
	if (type === "source" || type === "collection" || type === "item") {
		return type;
	}
	return "";
}

function buildEntryKey(type = "", id = "") {
	const normalizedType = normalizeEntityType(type);
	const normalizedId = normalizeId(id);
	if (!normalizedType || !normalizedId) {
		return "";
	}
	return `${normalizedType}:${normalizedId}`;
}

function normalizeNamespace(value = "") {
	const text = normalizeId(value);
	return text || "global";
}

function resolveStorage() {
	try {
		if (typeof window === "undefined" || !window.localStorage) {
			return null;
		}
		return window.localStorage;
	} catch {
		return null;
	}
}

function createEmptyState() {
	return {
		version: EXPOSURE_MEMORY_VERSION,
		seq: 0,
		entries: {},
	};
}

function toValidState(value) {
	if (!value || typeof value !== "object") {
		return createEmptyState();
	}
	const seq = Number.isFinite(Number(value.seq))
		? Math.max(0, Math.floor(Number(value.seq)))
		: 0;
	const incomingEntries =
		value.entries && typeof value.entries === "object" ? value.entries : {};
	const entries = {};
	for (const [rawKey, rawEntry] of Object.entries(incomingEntries)) {
		const key = normalizeId(rawKey);
		if (!key || !Array.isArray(rawEntry)) {
			continue;
		}
		const seenSeq = Number(rawEntry[0]);
		const seenAt = Number(rawEntry[1]);
		if (!Number.isFinite(seenSeq) || !Number.isFinite(seenAt)) {
			continue;
		}
		entries[key] = [Math.max(0, Math.floor(seenSeq)), Math.max(0, Math.floor(seenAt))];
	}
	return {
		version: EXPOSURE_MEMORY_VERSION,
		seq,
		entries,
	};
}

function pruneEntries(state) {
	const keys = Object.keys(state.entries || {});
	if (keys.length <= EXPOSURE_MEMORY_MAX_ENTRIES) {
		return;
	}
	keys.sort((left, right) => {
		const leftSeq = Number(state.entries[left]?.[0] ?? 0);
		const rightSeq = Number(state.entries[right]?.[0] ?? 0);
		return leftSeq - rightSeq;
	});
	const removeCount = keys.length - EXPOSURE_MEMORY_MAX_ENTRIES;
	for (let index = 0; index < removeCount; index += 1) {
		delete state.entries[keys[index]];
	}
}

function readState(storage, storageKey) {
	if (!storage || !storageKey) {
		return createEmptyState();
	}
	try {
		const raw = storage.getItem(storageKey);
		if (!raw) {
			return createEmptyState();
		}
		return toValidState(JSON.parse(raw));
	} catch {
		return createEmptyState();
	}
}

function writeState(storage, storageKey, state) {
	if (!storage || !storageKey) {
		return;
	}
	try {
		storage.setItem(storageKey, JSON.stringify(state));
	} catch {
		// Ignore quota/write errors and keep in-memory fallback behavior.
	}
}

function resolveEntityId(entity = {}) {
	return normalizeId(entity.id || entity.actionValue || entity.manifestUrl);
}

function resolveEntityType(entity = {}) {
	return normalizeEntityType(entity.browseKind || entity.type);
}

export function createExposureMemory({ namespace = "" } = {}) {
	const storage = resolveStorage();
	const normalizedNamespace = normalizeNamespace(namespace);
	const storageKey = `${EXPOSURE_MEMORY_STORAGE_PREFIX}${normalizedNamespace}`;
	const state = readState(storage, storageKey);

	function markSeen({ type = "", id = "", seenAt = Date.now() } = {}) {
		const key = buildEntryKey(type, id);
		if (!key) {
			return;
		}
		state.seq += 1;
		state.entries[key] = [state.seq, Math.max(0, Math.floor(Number(seenAt) || Date.now()))];
		pruneEntries(state);
		writeState(storage, storageKey, state);
	}

	return {
		namespace: normalizedNamespace,
		storageKey,
		markSeen,
		markSeenEntity(entity = {}, type = "") {
			markSeen({
				type: normalizeEntityType(type) || resolveEntityType(entity),
				id: resolveEntityId(entity),
			});
		},
		hasSeen({ type = "", id = "" } = {}) {
			const key = buildEntryKey(type, id);
			return Boolean(key && state.entries[key]);
		},
		getSeenRecord({ type = "", id = "" } = {}) {
			const key = buildEntryKey(type, id);
			if (!key) {
				return null;
			}
			const entry = state.entries[key];
			if (!entry) {
				return null;
			}
			return {
				seenSeq: Number(entry[0] || 0),
				seenAt: Number(entry[1] || 0),
			};
		},
		// Lower recencyRank means more recently seen. Null means unseen.
		getRecencyRank({ type = "", id = "" } = {}) {
			const record = this.getSeenRecord({ type, id });
			if (!record || record.seenSeq <= 0) {
				return null;
			}
			return Math.max(0, state.seq - record.seenSeq);
		},
		reset() {
			state.seq = 0;
			state.entries = {};
			writeState(storage, storageKey, state);
		},
	};
}
