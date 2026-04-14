import test from "node:test";
import assert from "node:assert/strict";

import { toMetadataDisplayValue } from "./metadata-display-value.js";

test("toMetadataDisplayValue normalizes scalar and object shapes", () => {
	assert.equal(toMetadataDisplayValue("1932"), "1932");
	assert.equal(toMetadataDisplayValue(1932), "1932");
	assert.equal(toMetadataDisplayValue({ label: "1932" }), "1932");
	assert.equal(toMetadataDisplayValue({ value: "1932" }), "1932");
	assert.equal(toMetadataDisplayValue({ value: { label: "1932" } }), "1932");
	assert.equal(toMetadataDisplayValue({ foo: "bar" }), "");
	assert.equal(toMetadataDisplayValue(null), "");
});
