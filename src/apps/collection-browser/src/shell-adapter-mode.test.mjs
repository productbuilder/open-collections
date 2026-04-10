import test from "node:test";
import assert from "node:assert/strict";

import {
	isShellListAdapterModeEnabled,
	shouldRunEmbeddedLegacyCollectionLoading,
} from "./shell-adapter-mode.js";

test("shell list adapter mode is enabled only for embedded shell mounts", () => {
	assert.equal(
		isShellListAdapterModeEnabled({
			embeddedRuntime: true,
			shellListAdapterAttribute: true,
		}),
		true,
	);
	assert.equal(
		isShellListAdapterModeEnabled({
			embeddedRuntime: false,
			shellListAdapterAttribute: true,
		}),
		false,
	);
	assert.equal(
		isShellListAdapterModeEnabled({
			embeddedRuntime: true,
			shellListAdapterAttribute: false,
		}),
		false,
	);
});

test("embedded legacy list loading is disabled when shell adapter mode is active", () => {
	assert.equal(
		shouldRunEmbeddedLegacyCollectionLoading({
			embeddedRuntime: true,
			shellListAdapterAttribute: true,
		}),
		false,
	);
	assert.equal(
		shouldRunEmbeddedLegacyCollectionLoading({
			embeddedRuntime: true,
			shellListAdapterAttribute: false,
		}),
		true,
	);
});
