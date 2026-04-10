function defaultSchedule(callback) {
	if (typeof requestAnimationFrame === "function") {
		requestAnimationFrame(() => requestAnimationFrame(callback));
		return;
	}
	setTimeout(callback, 0);
}

export function preserveScrollPosition({
	capture,
	restore,
	schedule = defaultSchedule,
	run,
} = {}) {
	if (typeof capture !== "function" || typeof restore !== "function") {
		if (typeof run === "function") {
			run();
		}
		return;
	}
	const snapshot = capture();
	if (typeof run === "function") {
		run();
	}
	schedule(() => {
		restore(snapshot);
	});
}
