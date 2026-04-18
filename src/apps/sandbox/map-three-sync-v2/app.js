import "../../../shared/ui/primitives/index.js";

const VIEW_PRESETS = {
	reset: {
		center: [11.391, 47.268],
		zoom: 11.1,
		pitch: 52,
		bearing: 28,
	},
	flat: {
		center: [11.391, 47.268],
		zoom: 11.4,
		pitch: 0,
		bearing: 0,
	},
	browse: {
		center: [11.372, 47.255],
		zoom: 10.9,
		pitch: 36,
		bearing: 20,
	},
	spatial: {
		center: [11.41, 47.283],
		zoom: 10.7,
		pitch: 58,
		bearing: 34,
	},
	horizonTest: {
		center: [11.43, 47.3],
		zoom: 9.8,
		pitch: 70,
		bearing: 44,
	},
};

const BASE_ANCHORS = [
	{ id: "ridge-west", lng: 11.317, lat: 47.254, altitude: 20, kind: "box" },
	{ id: "center-valley", lng: 11.391, lat: 47.268, altitude: 24, kind: "pillar" },
	{ id: "ridge-east", lng: 11.485, lat: 47.293, altitude: 18, kind: "box" },
	{ id: "nordkette", lng: 11.379, lat: 47.324, altitude: 28, kind: "pillar" },
	{ id: "pass-south", lng: 11.422, lat: 47.207, altitude: 16, kind: "box" },
];

const TERRAIN_SOURCE_ID = "terrain-dem";

const sandboxStage = document.getElementById("sandbox-stage");
const mapEl = document.getElementById("demo-map");
const threeLayerEl = document.getElementById("demo-three-layer");
const statCenter = document.getElementById("stat-center");
const statZoom = document.getElementById("stat-zoom");
const statPitch = document.getElementById("stat-pitch");
const statBearing = document.getElementById("stat-bearing");
const pitchControl = document.getElementById("pitch-control");
const pitchSliderValue = document.getElementById("pitch-slider-value");
const horizonToggle = document.getElementById("horizon-toggle");
const eventLog = document.getElementById("event-log");
const helperPanel = document.getElementById("helper-panel");
const helperToggle = document.getElementById("helper-toggle");
const helperClose = document.getElementById("helper-close");

let map = null;
let generatedAnchorCount = 0;

const appendLog = (message) => {
	const stamp = new Date().toISOString();
	eventLog.textContent = `${stamp} ${message}\n${eventLog.textContent}`.slice(
		0,
		3500,
	);
};

const setHelperExpanded = (expanded) => {
	const isExpanded = Boolean(expanded);
	helperPanel.hidden = !isExpanded;
	helperToggle.setAttribute("aria-expanded", String(isExpanded));
};

const setOptionalHorizonMask = (enabled, source = "ui") => {
	const isEnabled = Boolean(enabled);
	sandboxStage.dataset.fakeHorizon = String(isEnabled);
	horizonToggle.checked = isEnabled;
	appendLog(`optional fake horizon ${isEnabled ? "ON" : "OFF"} (${source})`);
};

const syncPitchSlider = (pitch) => {
	const roundedPitch = Math.round(pitch);
	pitchControl.value = String(roundedPitch);
	pitchSliderValue.textContent = String(roundedPitch);
};

const updateViewportStats = (viewport) => {
	if (!viewport?.center) {
		return;
	}

	statCenter.textContent = `${viewport.center.lng.toFixed(5)}, ${viewport.center.lat.toFixed(5)}`;
	statZoom.textContent = viewport.zoom.toFixed(2);
	statPitch.textContent = viewport.pitch.toFixed(1);
	statBearing.textContent = viewport.bearing.toFixed(1);
	syncPitchSlider(viewport.pitch);
};

const applyPreset = (preset, label = "preset") => {
	if (!map || !preset) {
		return;
	}

	map.easeTo({
		center: preset.center,
		zoom: preset.zoom,
		pitch: preset.pitch,
		bearing: preset.bearing,
		duration: 700,
	});
	appendLog(
		`${label} → pitch ${preset.pitch}, zoom ${preset.zoom}, bearing ${preset.bearing}`,
	);
};

const buildAnchorSet = () => {
	const extraAnchors = Array.from({ length: generatedAnchorCount }, (_, index) => {
		const offset = index + 1;
		return {
			id: `generated-${offset}`,
			lng: 11.33 + offset * 0.02,
			lat: 47.22 + (offset % 3) * 0.03,
			altitude: 10 + offset * 2,
			kind: offset % 2 === 0 ? "box" : "pillar",
		};
	});

	return [...BASE_ANCHORS, ...extraAnchors];
};

const refreshAnchors = (reason = "refresh") => {
	const anchors = buildAnchorSet();
	threeLayerEl.setAnchors(anchors);
	if (map) {
		map.triggerRepaint();
	}
	appendLog(`anchors refreshed (${reason}) count=${anchors.length}`);
};

const clearAnchors = () => {
	generatedAnchorCount = 0;
	threeLayerEl.clearScene();
	appendLog("clearScene()");
};

const ensureTerrain = () => {
	if (!map) {
		return;
	}

	if (!map.getSource(TERRAIN_SOURCE_ID)) {
		map.addSource(TERRAIN_SOURCE_ID, {
			type: "raster-dem",
			tiles: [
				"https://elevation-tiles-prod.s3.amazonaws.com/terrarium/{z}/{x}/{y}.png",
			],
			tileSize: 256,
			maxzoom: 14,
		});
		appendLog(`terrain source added (${TERRAIN_SOURCE_ID})`);
	}

	map.setTerrain({ source: TERRAIN_SOURCE_ID, exaggeration: 1.2 });
	appendLog("terrain enabled (exaggeration=1.2)");
};

mapEl.addEventListener("oc-map-ready", () => {
	map = mapEl.mapInstance;
	appendLog("oc-map-ready received");

	if (!map) {
		return;
	}

	ensureTerrain();
	updateViewportStats({
		center: map.getCenter(),
		zoom: map.getZoom(),
		pitch: map.getPitch(),
		bearing: map.getBearing(),
	});
	refreshAnchors("initial");
});

mapEl.addEventListener("oc-map-viewport-change", (event) => {
	updateViewportStats(event.detail);
});

threeLayerEl.addEventListener("oc-map-three-layer-ready", (event) => {
	appendLog(
		`oc-map-three-layer-ready: layer=${event.detail.layerId}, anchors=${event.detail.anchorCount}`,
	);
});

threeLayerEl.addEventListener("oc-map-three-layer-error", (event) => {
	appendLog(`oc-map-three-layer-error: ${event.detail.message}`);
});

pitchControl.addEventListener("input", (event) => {
	if (!map) {
		return;
	}

	const nextPitch = Number(event.target.value);
	map.easeTo({ pitch: nextPitch, duration: 120 });
});

horizonToggle.addEventListener("change", (event) => {
	setOptionalHorizonMask(event.target.checked);
});

helperToggle.addEventListener("click", () => {
	setHelperExpanded(helperPanel.hidden);
});

helperClose.addEventListener("click", () => {
	setHelperExpanded(false);
});

document.querySelectorAll("[data-action]").forEach((button) => {
	button.addEventListener("click", () => {
		const action = button.dataset.action;
		if (action === "reset-view") {
			applyPreset(VIEW_PRESETS.reset, "reset view");
			return;
		}

		if (action === "add-anchors") {
			generatedAnchorCount += 3;
			refreshAnchors("manual add");
			return;
		}

		if (action === "clear-anchors") {
			clearAnchors();
			return;
		}

		if (action === "flat") {
			applyPreset(VIEW_PRESETS.flat, "flat preset");
			return;
		}

		if (action === "browse") {
			applyPreset(VIEW_PRESETS.browse, "browse preset");
			return;
		}

		if (action === "spatial") {
			applyPreset(VIEW_PRESETS.spatial, "spatial preset");
			return;
		}

		if (action === "horizon-test") {
			applyPreset(VIEW_PRESETS.horizonTest, "horizon test preset");
		}
	});
});

setHelperExpanded(false);
setOptionalHorizonMask(false, "default");
