import test from "node:test";
import assert from "node:assert/strict";

import {
	isCollectionAllowedForEmbeddedSource,
	normalizeEmbeddedSourceCatalog,
	resolveEmbeddedSourceDescriptor,
} from "./manifest-controller.js";

test("normalizeEmbeddedSourceCatalog preserves include/exclude collection filters", () => {
	const normalized = normalizeEmbeddedSourceCatalog([
		{
			id: "source-a",
			sourceType: "source.json",
			sourceUrl: "https://data.example.test/source.json",
			includeCollections: [" photos ", ""],
			excludeCollections: ["private"],
		},
	]);

	assert.equal(normalized.length, 1);
	assert.deepEqual(normalized[0].includeCollections, ["photos"]);
	assert.deepEqual(normalized[0].excludeCollections, ["private"]);
});

test("isCollectionAllowedForEmbeddedSource supports matching by collection id and manifest URL", () => {
	const source = {
		includeCollections: ["city-photos", "https://data.example.test/extra.json"],
		excludeCollections: ["https://data.example.test/private.json"],
	};

	assert.equal(
		isCollectionAllowedForEmbeddedSource(source, {
			id: "city-photos",
			manifestUrl: "https://data.example.test/city.json",
		}),
		true,
	);
	assert.equal(
		isCollectionAllowedForEmbeddedSource(source, {
			id: "misc",
			manifestUrl: "https://data.example.test/extra.json",
		}),
		true,
	);
	assert.equal(
		isCollectionAllowedForEmbeddedSource(source, {
			id: "misc",
			manifestUrl: "https://data.example.test/private.json",
		}),
		false,
	);
});

test("resolveEmbeddedSourceDescriptor filters source catalog collections by include/exclude", async () => {
	const originalWindow = globalThis.window;
	const originalFetch = globalThis.fetch;

	globalThis.window = {
		location: { href: "https://app.example.test/src/apps/collection-browser/" },
	};
	globalThis.fetch = async () => ({
		ok: true,
		json: async () => ({
			collections: [
				{ id: "photos", manifest: "./photos/collection.json" },
				{ id: "audio", manifest: "./audio/collection.json" },
			],
		}),
	});

	try {
		const descriptor = await resolveEmbeddedSourceDescriptor({
			sourceType: "source.json",
			sourceUrl: "https://data.example.test/source.json",
			includeCollections: ["photos", "https://data.example.test/source/audio/collection.json"],
			excludeCollections: ["audio"],
		});

		assert.deepEqual(
			descriptor.collections.map((entry) => entry.id),
			["photos"],
		);
	} finally {
		globalThis.window = originalWindow;
		globalThis.fetch = originalFetch;
	}
});
