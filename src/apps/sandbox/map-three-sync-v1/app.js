import "../../../shared/ui/primitives/index.js";

const VIEW_PRESETS = {
  reset: {
    center: [5.1214, 52.0907],
    zoom: 14.5,
    pitch: 40,
    bearing: 18,
  },
  flat: {
    center: [5.1214, 52.0907],
    zoom: 14.9,
    pitch: 0,
    bearing: 0,
  },
  browse: {
    center: [5.1214, 52.0907],
    zoom: 14.6,
    pitch: 33,
    bearing: 16,
  },
  spatial: {
    center: [5.1214, 52.0907],
    zoom: 14.35,
    pitch: 48,
    bearing: 24,
  },
  horizonTest: {
    center: [5.1214, 52.0907],
    zoom: 13.8,
    pitch: 58,
    bearing: 28,
  },
};

const TEST_ANCHORS = [
  // Near references (tight cluster around center)
  { id: "near-core-box", lng: 5.1214, lat: 52.0907, altitude: 0, kind: "box" },
  { id: "near-core-pillar", lng: 5.1209, lat: 52.0905, altitude: 4, kind: "pillar" },
  { id: "near-west-box", lng: 5.1185, lat: 52.0901, altitude: 2, kind: "box" },
  { id: "near-east-pillar", lng: 5.1244, lat: 52.0906, altitude: 6, kind: "pillar" },

  // Mid references (medium spread and moderate altitude offsets)
  { id: "mid-museum", lng: 5.1162, lat: 52.0905, altitude: 12, kind: "pillar" },
  { id: "mid-station-east", lng: 5.1129, lat: 52.0891, altitude: 10, kind: "box" },
  { id: "mid-canal-south", lng: 5.1228, lat: 52.0878, altitude: 8, kind: "pillar" },
  { id: "mid-north-lane", lng: 5.1235, lat: 52.0946, altitude: 15, kind: "box" },

  // Far references (kept visible with stronger altitude stepping)
  { id: "far-north", lng: 5.123, lat: 52.0984, altitude: 26, kind: "pillar" },
  { id: "far-far-north", lng: 5.1224, lat: 52.103, altitude: 38, kind: "box" },
  { id: "far-east", lng: 5.1352, lat: 52.0939, altitude: 34, kind: "box" },
  { id: "far-west", lng: 5.1049, lat: 52.0934, altitude: 42, kind: "pillar" },
  { id: "far-south", lng: 5.1126, lat: 52.0811, altitude: 28, kind: "box" },
];

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

let map = null;

const appendLog = (message) => {
  const stamp = new Date().toISOString();
  eventLog.textContent = `${stamp} ${message}\n${eventLog.textContent}`.slice(0, 3500);
};

const setHorizonEnabled = (enabled, source = "ui") => {
  if (!sandboxStage || !horizonToggle) {
    return;
  }
  const isEnabled = Boolean(enabled);
  sandboxStage.dataset.horizonEnabled = String(isEnabled);
  horizonToggle.checked = isEnabled;
  appendLog(`fake horizon ${isEnabled ? "ON" : "OFF"} (${source})`);
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
    duration: 650,
  });
  appendLog(`${label} → pitch ${preset.pitch}, zoom ${preset.zoom}, bearing ${preset.bearing}`);
};

mapEl.addEventListener("oc-map-ready", () => {
  map = mapEl.mapInstance;
  appendLog("oc-map-ready received");
  threeLayerEl.setAnchors(TEST_ANCHORS);
  appendLog(`setAnchors(${TEST_ANCHORS.length}) depth references`);

  if (map) {
    updateViewportStats({
      center: map.getCenter(),
      zoom: map.getZoom(),
      pitch: map.getPitch(),
      bearing: map.getBearing(),
    });
  }
});

mapEl.addEventListener("oc-map-viewport-change", (event) => {
  updateViewportStats(event.detail);
});

threeLayerEl.addEventListener("oc-map-three-layer-ready", (event) => {
  appendLog(`oc-map-three-layer-ready: layer=${event.detail.layerId}, anchors=${event.detail.anchorCount}`);
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
  setHorizonEnabled(event.target.checked);
});

document.querySelectorAll("[data-action]").forEach((button) => {
  button.addEventListener("click", () => {
    const action = button.dataset.action;
    if (action === "reset-view") {
      applyPreset(VIEW_PRESETS.reset, "reset view");
      return;
    }

    if (action === "add-anchors") {
      threeLayerEl.setAnchors(TEST_ANCHORS);
      appendLog(`setAnchors(${TEST_ANCHORS.length})`);
      return;
    }

    if (action === "clear-anchors") {
      threeLayerEl.clearScene();
      appendLog("clearScene()");
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

setHorizonEnabled(true, "default");
