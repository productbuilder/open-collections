import test from "node:test";
import assert from "node:assert/strict";

import {
	computeAllModePatchPlan,
	getEntityRenderKey,
	normalizeSourceCardPreviewRows,
} from "./browser-collection-browser-rendering.js";

test("entity render key is stable across repeated projections", () => {
	const entity = {
		browseKind: "item",
		actionValue: "source-a::collection-a#item-1",
		id: "source-a::collection-a#item-1",
		previewUrl: "https://example.org/a.jpg",
	};
	assert.equal(
		getEntityRenderKey(entity),
		getEntityRenderKey({ ...entity, previewUrl: "https://example.org/other.jpg" }),
	);
});

test("all-mode patch plan appends only newly added entities for same session", () => {
	const previous = [
		{ browseKind: "item", actionValue: "item-1" },
		{ browseKind: "item", actionValue: "item-2" },
	];
	const next = [...previous, { browseKind: "item", actionValue: "item-3" }];
	assert.deepEqual(
		computeAllModePatchPlan({
			previousSessionKey: "session-a",
			nextSessionKey: "session-a",
			previousEntities: previous,
			nextEntities: next,
		}),
		{
			mode: "append",
			appendEntities: [{ browseKind: "item", actionValue: "item-3" }],
			preserveCount: 2,
		},
	);
});

test("all-mode patch plan resets when entity prefix changes", () => {
	const result = computeAllModePatchPlan({
		previousSessionKey: "session-a",
		nextSessionKey: "session-a",
		previousEntities: [{ browseKind: "item", actionValue: "item-1" }],
		nextEntities: [{ browseKind: "item", actionValue: "item-9" }],
	});
	assert.equal(result.mode, "reset");
	assert.equal(result.appendEntities.length, 1);
});

test("source preview row normalization preserves canonical thumbnail rows", () => {
	assert.deepEqual(
		normalizeSourceCardPreviewRows([
			{
				title: "Collection A",
				images: [
					"https://example.org/media/1.jpg",
					"",
					"https://example.org/media/2.jpg",
					"https://example.org/media/3.jpg",
				],
			},
			["https://example.org/media/4.jpg", null],
		]),
		[
			[
				"https://example.org/media/1.jpg",
				"https://example.org/media/2.jpg",
				"https://example.org/media/3.jpg",
			],
			["https://example.org/media/4.jpg"],
		],
	);
});
