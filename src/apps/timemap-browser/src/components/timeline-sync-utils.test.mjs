import test from "node:test";
import assert from "node:assert/strict";

import {
	buildTimelineRangeNote,
	resolveTimelineQueryTimeRange,
} from "./timeline-sync-utils.js";

test("timeline helper resolves query time range from state.query.timeRange", () => {
	const resolved = resolveTimelineQueryTimeRange({
		query: {
			timeRange: {
				start: "1930",
				end: "1940",
			},
		},
		timeRange: {
			start: "1800",
			end: "1810",
		},
	});
	assert.deepEqual(resolved, {
		start: "1930",
		end: "1940",
	});
});

test("timeline helper falls back to state.timeRange when query is missing", () => {
	const resolved = resolveTimelineQueryTimeRange({
		timeRange: {
			start: "1950",
			end: "1960",
		},
	});
	assert.deepEqual(resolved, {
		start: "1950",
		end: "1960",
	});
});

test("timeline note builder is stable for map shell projection sync path", () => {
	const note = buildTimelineRangeNote(
		{
			query: {
				timeRange: {
					start: "1932",
					end: "1939",
				},
			},
		},
		true,
	);
	assert.equal(note, "Active time range: 1932 to 1939.");
});

test("timeline note builder does not throw when no timeRange exists", () => {
	assert.doesNotThrow(() => {
		const note = buildTimelineRangeNote({}, true);
		assert.equal(note, "Active time range: Not set.");
	});
});

