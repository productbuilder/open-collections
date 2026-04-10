import test from "node:test";
import assert from "node:assert/strict";

import {
	isShellMapAdapterModeEnabled,
	shouldRunLocalSpatialLoader,
} from "./shell-adapter-mode.js";

test("shell map adapter mode is enabled only for embedded shell mounts", () => {
	assert.equal(
		isShellMapAdapterModeEnabled({
			embeddedRuntime: true,
			shellMapAdapterAttribute: true,
		}),
		true,
	);
	assert.equal(
		isShellMapAdapterModeEnabled({
			embeddedRuntime: false,
			shellMapAdapterAttribute: true,
		}),
		false,
	);
	assert.equal(
		isShellMapAdapterModeEnabled({
			embeddedRuntime: true,
			shellMapAdapterAttribute: false,
		}),
		false,
	);
});

test("local spatial loading is disabled when shell map adapter mode is active", () => {
	assert.equal(
		shouldRunLocalSpatialLoader({
			embeddedRuntime: true,
			shellMapAdapterAttribute: true,
		}),
		false,
	);
	assert.equal(
		shouldRunLocalSpatialLoader({
			embeddedRuntime: false,
			shellMapAdapterAttribute: false,
		}),
		true,
	);
});
