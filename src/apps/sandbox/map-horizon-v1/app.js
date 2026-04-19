import "../../../shared/ui/primitives/index.js";

const TERRAIN_SOURCE_ID = "horizon-terrain";
const HILLSHADE_LAYER_ID = "horizon-hillshade";

const SKY_PRESET = {
	"sky-color": "#88C6FC",
	"horizon-color": "#ffffff",
	"fog-color": "#e0f2ff",
	"sky-horizon-blend": 0.6,
	"horizon-fog-blend": 0.8,
	"fog-ground-blend": 0.3,
};

const SKY_OFF_PRESET = {
	"sky-color": "#000000",
	"horizon-color": "#000000",
	"fog-color": "#000000",
	"sky-horizon-blend": 0,
	"horizon-fog-blend": 0,
	"fog-ground-blend": 0,
};

const VIEW_PRESETS = {
	reset: {
		center: [11.391, 47.268],
		zoom: 11,
		pitch: 65,
		bearing: 20,
	},
	flat: {
		center: [11.391, 47.268],
		zoom: 11,
		pitch: 0,
		bearing: 0,
	},
	browse: {
		center: [11.391, 47.268],
		zoom: 11,
		pitch: 30,
		bearing: 12,
	},
	spatial: {
		center: [11.405, 47.281],
		zoom: 10.8,
		pitch: 50,
		bearing: 18,
	},
	horizon: {
		center: [11.43, 47.305],
		zoom: 10,
		pitch: 70,
		bearing: 24,
	},
};

const mapEl = document.getElementById("horizon-map");
const panel = document.getElementById("control-panel");
const panelToggle = document.getElementById("panel-toggle");
const statusText = document.getElementById("status-text");
const skyToggle = document.getElementById("sky-toggle");
const terrainToggle = document.getElementById("terrain-toggle");

let map = null;

const setStatus = (message) => {
	statusText.textContent = message;
};

const ensureTerrain = () => {
	if (!map.getSource(TERRAIN_SOURCE_ID)) {
		map.addSource(TERRAIN_SOURCE_ID, {
			type: "raster-dem",
			url: "https://tiles.mapterhorn.com/tilejson.json",
			tileSize: 256,
		});
	}

	map.setTerrain({
		source: TERRAIN_SOURCE_ID,
		exaggeration: terrainToggle.checked ? 1.5 : 1.0,
	});
};

const ensureHillshade = () => {
	if (map.getLayer(HILLSHADE_LAYER_ID)) {
		return;
	}

	map.addLayer({
		id: HILLSHADE_LAYER_ID,
		type: "hillshade",
		source: TERRAIN_SOURCE_ID,
		paint: {
			"hillshade-shadow-color": "#473B24",
		},
	});
};

const applySky = (enabled) => {
	map.setSky(enabled ? SKY_PRESET : SKY_OFF_PRESET);
};

const applyPreset = (presetName) => {
	const preset = VIEW_PRESETS[presetName];
	if (!preset || !map) {
		return;
	}

	map.easeTo({
		center: preset.center,
		zoom: preset.zoom,
		pitch: preset.pitch,
		bearing: preset.bearing,
		duration: 700,
	});

	setStatus(
		`${presetName} → pitch ${preset.pitch}°, zoom ${preset.zoom}, bearing ${preset.bearing}°`,
	);
};

const togglePanel = () => {
	const nextHidden = !panel.hidden;
	panel.hidden = nextHidden;
	panelToggle.setAttribute("aria-expanded", String(!nextHidden));
};

mapEl.addEventListener("oc-map-ready", () => {
	map = mapEl.mapInstance;
	if (!map) {
		setStatus("oc-map-ready received, but map instance missing.");
		return;
	}

	ensureTerrain();
	ensureHillshade();
	applySky(true);

	setStatus("Terrain, hillshade, and sky/fog enabled.");
});

mapEl.addEventListener("oc-map-error", (event) => {
	setStatus(`Map error: ${event.detail?.message || "unknown error"}`);
});

panelToggle.addEventListener("click", togglePanel);

skyToggle.addEventListener("change", () => {
	if (!map) {
		return;
	}
	applySky(skyToggle.checked);
	setStatus(skyToggle.checked ? "Sky + fog ON." : "Sky + fog OFF.");
});

terrainToggle.addEventListener("change", () => {
	if (!map) {
		return;
	}
	ensureTerrain();
	setStatus(
		terrainToggle.checked
			? "Terrain exaggeration set to 1.5x."
			: "Terrain exaggeration reset to 1.0x.",
	);
});

document.querySelectorAll("[data-action]").forEach((button) => {
	button.addEventListener("click", () => {
		applyPreset(button.dataset.action);
	});
});
