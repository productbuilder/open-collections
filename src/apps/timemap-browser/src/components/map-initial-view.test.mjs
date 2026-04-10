import test from "node:test";
import assert from "node:assert/strict";

import {
	parseBoundsAttribute,
	parseNumericAttribute,
	resolveConfiguredInitialMapView,
} from "./map-initial-view.js";

test("map initial view prefers explicit bounds when configured", () => {
	const resolved = resolveConfiguredInitialMapView({
		mapDefaultBounds: { west: 4.9, south: 52.1, east: 5.3, north: 52.3 },
		mapDefaultCenterLat: 1,
		mapDefaultCenterLng: 1,
		mapDefaultZoom: 9,
	});
	assert.deepEqual(resolved, {
		mode: "bounds",
		bounds: { west: 4.9, south: 52.1, east: 5.3, north: 52.3 },
	});
});

test("map initial view uses explicit center/zoom when bounds are absent", () => {
	const resolved = resolveConfiguredInitialMapView({
		mapDefaultCenterLat: 52.11,
		mapDefaultCenterLng: 5.22,
		mapDefaultZoom: 11.5,
	});
	assert.deepEqual(resolved, {
		mode: "center_zoom",
		centerLat: 52.11,
		centerLng: 5.22,
		zoom: 11.5,
	});
});

test("map initial view falls back to extent-fit when no explicit defaults are configured", () => {
	assert.equal(resolveConfiguredInitialMapView({}), null);
});

test("component-level map defaults can override app defaults", () => {
	const appDefaults = {
		mapDefaultCenterLat: 52.225,
		mapDefaultCenterLng: 5.1769,
		mapDefaultZoom: 13.6,
	};
	const componentOverrides = {
		mapDefaultCenterLat: parseNumericAttribute("40.7128"),
		mapDefaultCenterLng: parseNumericAttribute("-74.0060"),
		mapDefaultZoom: parseNumericAttribute("10"),
		mapDefaultBounds: parseBoundsAttribute(""),
	};
	const resolved = resolveConfiguredInitialMapView({
		...appDefaults,
		...componentOverrides,
	});
	assert.deepEqual(resolved, {
		mode: "center_zoom",
		centerLat: 40.7128,
		centerLng: -74.006,
		zoom: 10,
	});
});

