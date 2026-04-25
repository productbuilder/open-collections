import test from "node:test";
import assert from "node:assert/strict";

import { createBagViewerUrl, parseBagViewerUrl } from "./bag-viewer-url.js";

test("parseBagViewerUrl reads known camera parameters", () => {
	const parsed = parseBagViewerUrl(
		"https://www.3dbag.nl/en/viewer?rdx=192647.49226594163&rdy=444371.34647845256&ox=-1003.7251233551651&oy=2606.6962865655137&oz=2489.2067683852656",
	);

	assert.equal(parsed.rdx, 192647.49226594163);
	assert.equal(parsed.rdy, 444371.34647845256);
	assert.equal(parsed.ox, -1003.7251233551651);
	assert.equal(parsed.oy, 2606.6962865655137);
	assert.equal(parsed.oz, 2489.2067683852656);
});

test("createBagViewerUrl writes numeric params only", () => {
	const url = createBagViewerUrl({ rdx: 123, rdy: 456, ox: 1, oy: 2, oz: 3 });
	assert.equal(
		url,
		"https://www.3dbag.nl/en/viewer?rdx=123&rdy=456&ox=1&oy=2&oz=3",
	);
});
