import "../../../shared/ui/primitives/index.js";

const TERRAIN_SOURCE_ID = "terrainSource";
const HILLSHADE_SOURCE_ID = "hillshadeSource";
const HILLSHADE_LAYER_ID = "hills";

const HORIZON_VIEW = {
	center: [11.2953, 47.5479],
	zoom: 9,
	pitch: 75,
	bearing: 20,
};

const VIEW_PRESETS = {
	flat: {
		...HORIZON_VIEW,
		zoom: 12,
		pitch: 0,
	},
	browse: {
		...HORIZON_VIEW,
		zoom: 11,
		pitch: 30,
	},
	spatial: {
		...HORIZON_VIEW,
		zoom: 10,
		pitch: 50,
	},
	horizon: HORIZON_VIEW,
};

const SKY_PRESET = {
	"sky-color": "#88C6FC",
	"horizon-color": "#ffffff",
	"fog-color": "#e0f2ff",
	"sky-horizon-blend": 0.6,
	"horizon-fog-blend": 0.8,
	"fog-ground-blend": 0.3,
};

const mapEl = document.getElementById("horizon-map");
const statusText = document.getElementById("status-text");

let map = null;

const setStatus = (message) => {
	statusText.textContent = message;
};

const configureHorizonScene = () => {
	if (!map.getSource(TERRAIN_SOURCE_ID)) {
		map.addSource(TERRAIN_SOURCE_ID, {
			type: "raster-dem",
			url: "https://tiles.mapterhorn.com/tilejson.json",
			tileSize: 256,
		});
	}

	if (!map.getSource(HILLSHADE_SOURCE_ID)) {
		map.addSource(HILLSHADE_SOURCE_ID, {
			type: "raster-dem",
			url: "https://tiles.mapterhorn.com/tilejson.json",
			tileSize: 256,
		});
	}

	map.setTerrain({
		source: TERRAIN_SOURCE_ID,
		exaggeration: 1.0,
	});

	if (!map.getLayer(HILLSHADE_LAYER_ID)) {
		map.addLayer({
			id: HILLSHADE_LAYER_ID,
			type: "hillshade",
			source: HILLSHADE_SOURCE_ID,
			paint: {
				"hillshade-shadow-color": "#473B24",
			},
		});
	}

	map.jumpTo(HORIZON_VIEW);
	map.setSky(SKY_PRESET);

	setStatus(
		"Horizon baseline applied (terrain + fog + sky). Use presets to compare visibility.",
	);
};

const applyPreset = (presetName) => {
	if (!map) {
		return;
	}

	const preset = VIEW_PRESETS[presetName];
	if (!preset) {
		return;
	}

	map.jumpTo(preset);
	setStatus(
		`${presetName} preset → pitch ${preset.pitch}°, zoom ${preset.zoom}, bearing ${preset.bearing}°`,
	);
};

mapEl.addEventListener("oc-map-ready", () => {
	map = mapEl.mapInstance;
	if (!map) {
		setStatus("oc-map-ready received, but mapInstance is missing.");
		return;
	}

	if (map.isStyleLoaded()) {
		configureHorizonScene();
		return;
	}

	map.once("load", configureHorizonScene);
	setStatus(
		"Map ready. Waiting for style load before applying horizon scene…",
	);
});

mapEl.addEventListener("oc-map-error", (event) => {
	setStatus(`Map error: ${event.detail?.message || "unknown error"}`);
});

document.querySelectorAll("[data-action]").forEach((button) => {
	button.addEventListener("click", () => {
		applyPreset(button.dataset.action);
	});
});
