import "../../../shared/ui/primitives/index.js";

const INITIAL_VIEW = {
  center: [5.1214, 52.0907],
  zoom: 14.8,
  pitch: 60,
  bearing: 25,
};

const TEST_ANCHORS = [
  { id: "utrecht-core", lng: 5.1214, lat: 52.0907, altitude: 0, kind: "box" },
  { id: "museum-quarter", lng: 5.1162, lat: 52.0905, altitude: 0, kind: "pillar" },
  { id: "station-east", lng: 5.1129, lat: 52.0891, altitude: 0, kind: "box" },
  { id: "canal-north", lng: 5.1225, lat: 52.0945, altitude: 0, kind: "pillar" },
];

const mapEl = document.getElementById("demo-map");
const threeLayerEl = document.getElementById("demo-three-layer");
const statCenter = document.getElementById("stat-center");
const statZoom = document.getElementById("stat-zoom");
const statPitch = document.getElementById("stat-pitch");
const statBearing = document.getElementById("stat-bearing");
const eventLog = document.getElementById("event-log");

let map = null;

const appendLog = (message) => {
  const stamp = new Date().toISOString();
  eventLog.textContent = `${stamp} ${message}\n${eventLog.textContent}`.slice(0, 2500);
};

const updateViewportStats = (viewport) => {
  if (!viewport?.center) {
    return;
  }

  statCenter.textContent = `${viewport.center.lng.toFixed(5)}, ${viewport.center.lat.toFixed(5)}`;
  statZoom.textContent = viewport.zoom.toFixed(2);
  statPitch.textContent = viewport.pitch.toFixed(1);
  statBearing.textContent = viewport.bearing.toFixed(1);
};

const resetView = () => {
  if (!map) {
    return;
  }
  map.easeTo({
    center: INITIAL_VIEW.center,
    zoom: INITIAL_VIEW.zoom,
    pitch: INITIAL_VIEW.pitch,
    bearing: INITIAL_VIEW.bearing,
    duration: 600,
  });
};

const tiltMap = () => {
  if (!map) {
    return;
  }
  const nextPitch = map.getPitch() > 45 ? 30 : 68;
  map.easeTo({ pitch: nextPitch, duration: 500 });
};

const rotateMap = () => {
  if (!map) {
    return;
  }
  map.easeTo({ bearing: map.getBearing() + 35, duration: 500 });
};

mapEl.addEventListener("oc-map-ready", () => {
  map = mapEl.mapInstance;
  appendLog("oc-map-ready received");
  threeLayerEl.setAnchors(TEST_ANCHORS);

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

document.querySelectorAll("[data-action]").forEach((button) => {
  button.addEventListener("click", () => {
    const action = button.dataset.action;
    if (action === "reset-view") {
      resetView();
      appendLog("reset view");
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

    if (action === "tilt-map") {
      tiltMap();
      appendLog("toggle pitch");
      return;
    }

    if (action === "rotate-map") {
      rotateMap();
      appendLog("rotate bearing +35");
    }
  });
});
