import test from "node:test";
import assert from "node:assert/strict";

import { createFeedAppendScheduler } from "./feed-append-scheduler.js";

test("feed append scheduler coalesces repeated requests into one frame", () => {
	const scheduled = [];
	const scheduler = createFeedAppendScheduler({
		scheduleFrame(callback) {
			scheduled.push(callback);
			return scheduled.length;
		},
		cancelFrame() {},
	});
	const calls = [];
	scheduler.request(() => calls.push("first"));
	scheduler.request(() => calls.push("second"));

	assert.equal(scheduled.length, 1);
	scheduled[0]();
	assert.deepEqual(calls, ["second"]);
	assert.equal(scheduler.getState().pending, false);
});

test("feed append scheduler cancels queued work", () => {
	let cancelledHandle = null;
	const scheduler = createFeedAppendScheduler({
		scheduleFrame() {
			return 42;
		},
		cancelFrame(handle) {
			cancelledHandle = handle;
		},
	});
	scheduler.request(() => {});
	scheduler.cancel();

	assert.equal(cancelledHandle, 42);
	assert.deepEqual(scheduler.getState(), {
		pending: false,
		hasQueuedTask: false,
	});
});
