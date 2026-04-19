const DEFAULT_SKY = {
  'sky-color': '#88C6FC',
  'horizon-color': '#ffffff',
  'fog-color': '#ffffff',
  'sky-horizon-blend': 0.82,
  'horizon-fog-blend': 0.97,
  'fog-ground-blend': 0.64
};

const FOV_PRESETS = {
  default: 55,
  wide: 45,
  horizon50: 50,
  wider: 55,
  extraWide: 70,
  horizon55: 55,
  horizon60: 60,
  horizon70: 70
};

const HILVERSUM_CENTER = [5.1766, 52.2292];
const MOUNTAIN_CENTER = [11.2953, 47.5479];
const BASELINE_CAMERA = { center: HILVERSUM_CENTER, zoom: 12.5, pitch: 65, bearing: 15 };

const CAMERA_PRESETS = {
  flat: BASELINE_CAMERA,
  browse: { center: HILVERSUM_CENTER, zoom: 12.6, pitch: 30, bearing: 15 },
  spatial: { center: HILVERSUM_CENTER, zoom: 12.4, pitch: 50, bearing: 28 },
  mountain: { center: MOUNTAIN_CENTER, zoom: 11.3, pitch: 50, bearing: 30 }
};

const HORIZON_CAMERA = {
  center: HILVERSUM_CENTER,
  zoom: 10.7,
  pitch: 70,
  bearing: 22
};

const VECTOR_BASEMAP_STYLE_URL = 'https://demotiles.maplibre.org/style.json';
const TERRAIN_SOURCE_ID = 'terrainSource';
const HILLSHADE_SOURCE_ID = 'hillshadeSource';

const map = new maplibregl.Map({
  container: 'map',
  ...BASELINE_CAMERA,
  hash: true,
  style: VECTOR_BASEMAP_STYLE_URL,
  maxZoom: 18,
  maxPitch: 85
});

function setSkyEnabled(isEnabled) {
  if (isEnabled) {
    map.setSky(DEFAULT_SKY);
    return;
  }

  map.setSky(undefined);
}

function flyToPreset(options) {
  map.flyTo({
    duration: 1100,
    essential: true,
    ...options
  });
}

function formatFov(value) {
  return `${Number(value).toFixed(2)}°`;
}

function formatPitch(value) {
  return `${Math.round(Number(value))}°`;
}

function syncPitchUi(value) {
  const numericValue = Number(value);
  document.getElementById('pitch-slider').value = String(numericValue);
  document.getElementById('pitch-value').textContent = formatPitch(numericValue);
}

function setPitchValue(value) {
  const numericValue = Number(value);
  map.jumpTo({ pitch: numericValue });
  syncPitchUi(numericValue);
}

function setVerticalFov(value) {
  const numericValue = Number(value);
  map.setVerticalFieldOfView(numericValue);
  document.getElementById('fov-slider').value = String(numericValue);
  document.getElementById('fov-value').textContent = formatFov(numericValue);
}

function jumpToHorizonWithFov(fov) {
  map.jumpTo(HORIZON_CAMERA);
  setVerticalFov(fov);
}

function setPanelOpenState(isOpen) {
  const panel = document.getElementById('controls-panel');
  const menuToggle = document.getElementById('menu-toggle');
  panel.classList.toggle('is-open', isOpen);
  menuToggle.classList.toggle('is-active', isOpen);
  menuToggle.setAttribute('aria-expanded', String(isOpen));
  menuToggle.textContent = isOpen ? 'Close' : 'Controls';
}

function configureTerrainAndHillshade() {
  const terrainSourceDefinition = {
    type: 'raster-dem',
    url: 'https://tiles.mapterhorn.com/tilejson.json',
    tileSize: 256
  };

  if (!map.getSource(TERRAIN_SOURCE_ID)) {
    map.addSource(TERRAIN_SOURCE_ID, terrainSourceDefinition);
  }

  if (!map.getSource(HILLSHADE_SOURCE_ID)) {
    map.addSource(HILLSHADE_SOURCE_ID, terrainSourceDefinition);
  }

  map.setTerrain({
    source: TERRAIN_SOURCE_ID,
    exaggeration: 0.8
  });

  if (!map.getLayer('hills')) {
    map.addLayer({
      id: 'hills',
      type: 'hillshade',
      source: HILLSHADE_SOURCE_ID,
      layout: { visibility: 'visible' },
      paint: { 'hillshade-shadow-color': '#473B24' }
    });
  }
}

map.addControl(
  new maplibregl.NavigationControl({
    visualizePitch: true,
    showZoom: true,
    showCompass: true
  }),
  'top-right'
);

map.on('load', () => {
  map.setMaxPitch(85);
  configureTerrainAndHillshade();
  setSkyEnabled(true);
  setVerticalFov(FOV_PRESETS.default);
  syncPitchUi(map.getPitch());

  const panel = document.getElementById('controls-panel');
  const menuToggle = document.getElementById('menu-toggle');
  let isPanelOpen = false;

  menuToggle.addEventListener('click', () => {
    isPanelOpen = !isPanelOpen;
    setPanelOpenState(isPanelOpen);
  });

  panel.classList.add('is-visible');
  window.setTimeout(() => {
    panel.classList.remove('is-visible');
    setPanelOpenState(isPanelOpen);
  }, 2000);

  const skyToggle = document.getElementById('sky-enabled');
  skyToggle.addEventListener('change', () => setSkyEnabled(skyToggle.checked));

  document.getElementById('flat-btn').addEventListener('click', () => {
    flyToPreset(CAMERA_PRESETS.flat);
    setVerticalFov(FOV_PRESETS.default);
  });

  document.getElementById('browse-btn').addEventListener('click', () => {
    flyToPreset(CAMERA_PRESETS.browse);
  });

  document.getElementById('spatial-btn').addEventListener('click', () => {
    flyToPreset(CAMERA_PRESETS.spatial);
  });

  document.getElementById('horizon-btn').addEventListener('click', () => {
    flyToPreset(HORIZON_CAMERA);
  });

  document.getElementById('mountain-btn').addEventListener('click', () => {
    flyToPreset(CAMERA_PRESETS.mountain);
  });

  document.getElementById('pitch-slider').addEventListener('input', event => {
    setPitchValue(event.target.value);
  });

  document.getElementById('fov-slider').addEventListener('input', event => {
    setVerticalFov(event.target.value);
  });

  document.getElementById('fov-default-btn').addEventListener('click', () => {
    setVerticalFov(FOV_PRESETS.default);
  });

  document.getElementById('fov-wide-btn').addEventListener('click', () => {
    setVerticalFov(FOV_PRESETS.wide);
  });

  document.getElementById('fov-wider-btn').addEventListener('click', () => {
    setVerticalFov(FOV_PRESETS.wider);
  });

  document.getElementById('fov-extra-wide-btn').addEventListener('click', () => {
    setVerticalFov(FOV_PRESETS.extraWide);
  });

  document.getElementById('horizon-wide-btn').addEventListener('click', () => {
    jumpToHorizonWithFov(FOV_PRESETS.wide);
  });

  document.getElementById('horizon-mid-btn').addEventListener('click', () => {
    jumpToHorizonWithFov(FOV_PRESETS.horizon50);
  });

  document.getElementById('horizon-wider-btn').addEventListener('click', () => {
    jumpToHorizonWithFov(FOV_PRESETS.wider);
  });

  document.getElementById('horizon-extra-wide-btn').addEventListener('click', () => {
    jumpToHorizonWithFov(FOV_PRESETS.horizon55);
  });

  document.getElementById('horizon-60-btn').addEventListener('click', () => {
    jumpToHorizonWithFov(FOV_PRESETS.horizon60);
  });

  document.getElementById('horizon-70-btn').addEventListener('click', () => {
    jumpToHorizonWithFov(FOV_PRESETS.horizon70);
  });

  map.on('pitch', () => {
    syncPitchUi(map.getPitch());
  });
});
