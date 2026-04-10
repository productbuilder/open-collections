import test from "node:test";
import assert from "node:assert/strict";

import { preserveScrollPosition } from "./scroll-preservation.js";

test("preserveScrollPosition restores captured value after operation", () => {
	const calls = [];
	const scheduled = [];
	preserveScrollPosition({
		capture() {
			calls.push("capture");
			return 320;
		},
		restore(value) {
			calls.push(`restore:${value}`);
		},
		schedule(callback) {
			scheduled.push(callback);
		},
		run() {
			calls.push("run");
		},
	});

	assert.deepEqual(calls, ["capture", "run"]);
	assert.equal(scheduled.length, 1);
	scheduled[0]();
	assert.deepEqual(calls, ["capture", "run", "restore:320"]);
});
