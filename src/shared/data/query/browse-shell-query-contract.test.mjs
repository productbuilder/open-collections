import test from "node:test";
import assert from "node:assert/strict";

import {
	createBrowseShellQueryState,
	normalizeBrowseShellQueryPatch,
} from "./browse-shell-query-contract.js";

test("browse shell query patch preserves explicit time-range updates", () => {
	const baseQuery = createBrowseShellQueryState().query;
	const patched = normalizeBrowseShellQueryPatch(
		{
			text: "street",
			timeRange: {
				start: "1900",
				end: "1910",
			},
		},
		baseQuery,
	);

	assert.equal(patched.query.text, "street");
	assert.deepEqual(patched.query.timeRange, {
		start: "1900",
		end: "1910",
	});
});

test("browse shell query patch keeps existing time-range bounds when partially patched", () => {
	const patched = normalizeBrowseShellQueryPatch(
		{
			timeRange: {
				end: "1940",
			},
		},
		{
			...createBrowseShellQueryState().query,
			timeRange: {
				start: "1930",
				end: "1935",
			},
		},
	);

	assert.deepEqual(patched.query.timeRange, {
		start: "1930",
		end: "1940",
	});
});

