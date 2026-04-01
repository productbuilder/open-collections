let sessionSources = [];
const listeners = new Set();

function normalizeSources(sources = []) {
	if (!Array.isArray(sources)) {
		return [];
	}
	return sources.filter((entry) => entry && typeof entry === "object");
}

function emit() {
	const snapshot = [...sessionSources];
	for (const listener of listeners) {
		listener(snapshot);
	}
}

export function getSessionConnectionSources() {
	return [...sessionSources];
}

export function setSessionConnectionSources(sources = []) {
	sessionSources = [...normalizeSources(sources)];
	emit();
	return getSessionConnectionSources();
}

export function upsertSessionConnectionSource(source) {
	if (!source || typeof source !== "object") {
		return getSessionConnectionSources();
	}
	const sourceId = String(source.id || "").trim();
	if (!sourceId) {
		return getSessionConnectionSources();
	}
	const index = sessionSources.findIndex((entry) => entry.id === sourceId);
	if (index >= 0) {
		sessionSources = sessionSources.map((entry, entryIndex) =>
			entryIndex === index ? source : entry,
		);
	} else {
		sessionSources = [...sessionSources, source];
	}
	emit();
	return getSessionConnectionSources();
}

export function removeSessionConnectionSource(sourceId) {
	const normalizedSourceId = String(sourceId || "").trim();
	if (!normalizedSourceId) {
		return getSessionConnectionSources();
	}
	sessionSources = sessionSources.filter(
		(entry) => entry.id !== normalizedSourceId,
	);
	emit();
	return getSessionConnectionSources();
}

export function clearSessionConnectionSources() {
	sessionSources = [];
	emit();
}

export function subscribeSessionConnectionSources(listener) {
	if (typeof listener !== "function") {
		return () => {};
	}
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
}
