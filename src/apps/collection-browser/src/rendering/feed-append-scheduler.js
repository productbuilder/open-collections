function fallbackSchedule(callback) {
	return setTimeout(callback, 16);
}

function fallbackCancel(handle) {
	clearTimeout(handle);
}

export function createFeedAppendScheduler({
	scheduleFrame = typeof requestAnimationFrame === "function"
		? requestAnimationFrame.bind(globalThis)
		: fallbackSchedule,
	cancelFrame = typeof cancelAnimationFrame === "function"
		? cancelAnimationFrame.bind(globalThis)
		: fallbackCancel,
} = {}) {
	let frameHandle = null;
	let queuedTask = null;

	function flush() {
		if (!queuedTask) {
			frameHandle = null;
			return;
		}
		const task = queuedTask;
		queuedTask = null;
		frameHandle = null;
		task();
	}

	return Object.freeze({
		request(task) {
			if (typeof task !== "function") {
				return false;
			}
			queuedTask = task;
			if (frameHandle !== null) {
				return false;
			}
			frameHandle = scheduleFrame(flush);
			return true;
		},
		cancel() {
			if (frameHandle !== null) {
				cancelFrame(frameHandle);
			}
			frameHandle = null;
			queuedTask = null;
		},
		getState() {
			return {
				pending: frameHandle !== null,
				hasQueuedTask: typeof queuedTask === "function",
			};
		},
	});
}
