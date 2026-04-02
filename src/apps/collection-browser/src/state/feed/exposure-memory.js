// Feed v1 scaffold:
// Frontend-only minimal exposure store. No ranking impact yet.
export function createExposureMemory() {
	const seen = new Set();
	return {
		markSeen(key = "") {
			const value = String(key || "").trim();
			if (!value) {
				return;
			}
			seen.add(value);
		},
		hasSeen(key = "") {
			const value = String(key || "").trim();
			if (!value) {
				return false;
			}
			return seen.has(value);
		},
		reset() {
			seen.clear();
		},
	};
}

