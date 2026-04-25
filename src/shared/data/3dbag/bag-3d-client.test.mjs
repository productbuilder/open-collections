import test from "node:test";
import assert from "node:assert/strict";

import {
	createBag3DTilesUrl,
	createBagPandItemsUrl,
} from "./bag-3d-client.js";

test("createBagPandItemsUrl writes bbox + limit + format", () => {
	const url = createBagPandItemsUrl({
		bbox: [4.8, 52.3, 4.9, 52.4],
		limit: 120.4,
	});
	assert.equal(
		url,
		"https://api.3dbag.nl/collections/pand/items?bbox=4.8%2C52.3%2C4.9%2C52.4&limit=120&f=json",
	);
});

test("createBag3DTilesUrl resolves published template", () => {
	assert.equal(
		createBag3DTilesUrl({ version: "v20250903", lod: "lod22" }),
		"https://data.3dbag.nl/v20250903/cesium3dtiles/lod22/tileset.json",
	);
});

test("createBag3DTilesUrl validates lod values", () => {
	assert.throws(
		() => createBag3DTilesUrl({ version: "v20250903", lod: "lod99" }),
		/lod must be one of: lod12, lod13, lod22/,
	);
});
