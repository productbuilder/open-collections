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

const OC_MAP_STYLE_URL = 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';
const TERRAIN_SOURCE_ID = 'terrainSource';
const MAPLIBRE_MAX_ZOOM = 24;

const BASEMAP_LAYER_TUNING = {
  road: { minDelta: 1.5, maxDelta: 1 },
  label: { minDelta: 1, maxDelta: 1 }
};

const CAROUSEL_CARDS = [
  {
    title: 'Hilversum Studio Blocks',
    year: '1933',
    subtitle: 'Architecture',
    description: 'Brick-and-glass studio complex studies with facade rhythm notes.',
    swatch: '#c9daf5'
  },
  {
    title: 'Open Air Archives',
    year: '1928',
    subtitle: 'Photo Series',
    description: 'Parks and civic edge conditions captured as archival contact sheets.',
    swatch: '#d8e7c6'
  },
  {
    title: 'New Wave Broadcast',
    year: '1986',
    subtitle: 'Video',
    description: 'Signal-noise edits and production stills from late-night experiments.',
    swatch: '#f4d6bf'
  },
  {
    title: 'City Quiet Intervals',
    year: '1972',
    subtitle: 'Audio Essay',
    description: 'Urban pauses and ambient room tone mapped into listening chapters.',
    swatch: '#d9d1f2'
  },
  {
    title: 'Waterside Marker Studies',
    year: '1959',
    subtitle: 'Cartography',
    description: 'Canal-edge markers and route annotations prepared for field crews.',
    swatch: '#c8e9eb'
  },
  {
    title: 'Night Tram Exposure',
    year: '1964',
    subtitle: 'Photo Plate',
    description: 'Long-exposure tram corridors with stop-by-stop negative references.',
    swatch: '#f1cbdd'
  },
  {
    title: 'Coastal Signal Ledger',
    year: '1947',
    subtitle: 'Survey Log',
    description: 'Harbor signal observations indexed by beacon pattern and weather.',
    swatch: '#d6e5f9'
  },
  {
    title: 'Transit Thread Atlas',
    year: '1991',
    subtitle: 'Route Study',
    description: 'Overlay pack tracing line continuity between rail, ferry, and tram.',
    swatch: '#d9f0da'
  },
  {
    title: 'Signal Tower Notes',
    year: '1938',
    subtitle: 'Field Notes',
    description: 'Operator diagrams and watch-cycle notes from regional control points.',
    swatch: '#f5e1cb'
  },
  {
    title: 'Depot Pattern Review',
    year: '2002',
    subtitle: 'Operations',
    description: 'Service bay sequencing snapshots and turnaround timing annotations.',
    swatch: '#e1daf5'
  },
  {
    title: 'Archive Light Pass',
    year: '2014',
    subtitle: 'Digitization',
    description: 'Color normalization tests for slide batches under mixed lighting.',
    swatch: '#d3eef0'
  },
  {
    title: 'Floodplain Recordings',
    year: '1968',
    subtitle: 'Field Audio',
    description: 'Seasonal floodplain ambiences aligned with river height telemetry.',
    swatch: '#f4d7e5'
  }
];

const CARD_STACK_STOPS = [
  {
    offset: -2,
    y: -152,
    z: 64,
    scaleX: 0.9,
    scaleY: 0.88,
    blur: 1.7,
    saturation: 0.87,
    contrast: 0.87
  },
  {
    offset: -1,
    y: -76,
    z: 122,
    scaleX: 0.97,
    scaleY: 0.95,
    blur: 0.6,
    saturation: 0.95,
    contrast: 0.95
  },
  { offset: 0, y: -4, z: 178, scaleX: 1, scaleY: 1, blur: 0, saturation: 1, contrast: 1 },
  {
    offset: 1,
    y: 76,
    z: 108,
    scaleX: 0.95,
    scaleY: 0.89,
    blur: 0.5,
    saturation: 0.92,
    contrast: 0.92
  },
  {
    offset: 2,
    y: 136,
    z: 34,
    scaleX: 0.87,
    scaleY: 0.75,
    blur: 1.1,
    saturation: 0.86,
    contrast: 0.87
  },
  {
    offset: 3,
    y: 180,
    z: -46,
    scaleX: 0.78,
    scaleY: 0.59,
    blur: 1.9,
    saturation: 0.79,
    contrast: 0.8
  },
  {
    offset: 4,
    y: 216,
    z: -140,
    scaleX: 0.67,
    scaleY: 0.42,
    blur: 2.7,
    saturation: 0.73,
    contrast: 0.74
  }
];

const SWIPE_SNAP_DISTANCE = 132;
const SWIPE_COMMIT_THRESHOLD = 0.28;
const TOP_STACK_MAX_CARDS = 3;
const TOP_STACK_SPACING = 30;
const TOP_STACK_CEILING_Y = -120;

const map = new maplibregl.Map({
  container: 'map',
  ...BASELINE_CAMERA,
  hash: true,
  style: OC_MAP_STYLE_URL,
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

  map.setTerrain({
    source: TERRAIN_SOURCE_ID,
    exaggeration: 0.8
  });
}

function clampZoomRange(minzoom, maxzoom) {
  const clampedMin = Math.max(0, Math.min(MAPLIBRE_MAX_ZOOM, Number(minzoom)));
  const clampedMax = Math.max(clampedMin, Math.min(MAPLIBRE_MAX_ZOOM, Number(maxzoom)));
  return [clampedMin, clampedMax];
}

function isRoadDetailLayer(layer) {
  const id = String(layer?.id || '').toLowerCase();
  const sourceLayer = String(layer?.['source-layer'] || '').toLowerCase();
  return (
    layer?.type === 'line' &&
    (id.includes('road') ||
      id.includes('street') ||
      id.includes('transport') ||
      id.includes('bridge') ||
      id.includes('tunnel') ||
      id.includes('path') ||
      sourceLayer.includes('road') ||
      sourceLayer.includes('transport'))
  );
}

function isDetailLabelLayer(layer) {
  if (layer?.type !== 'symbol') {
    return false;
  }

  const id = String(layer?.id || '').toLowerCase();
  const sourceLayer = String(layer?.['source-layer'] || '').toLowerCase();
  return (
    id.includes('road') ||
    id.includes('street') ||
    id.includes('highway') ||
    id.includes('transport') ||
    sourceLayer.includes('road') ||
    sourceLayer.includes('transport')
  );
}

function tuneBasemapLayerZoomConsistency() {
  const style = map.getStyle();
  const sources = style?.sources || {};
  const layers = style?.layers || [];

  const vectorSourceIds = new Set(
    Object.entries(sources)
      .filter(([, definition]) => definition?.type === 'vector')
      .map(([sourceId]) => sourceId)
  );

  const sourceSummary = Object.entries(sources)
    .filter(([, definition]) => definition?.type === 'vector')
    .map(([sourceId, definition]) => ({
      sourceId,
      minzoom: definition?.minzoom ?? null,
      maxzoom: definition?.maxzoom ?? null
    }));

  const tunedLayerIds = [];

  layers.forEach(layer => {
    if (!vectorSourceIds.has(layer.source)) {
      return;
    }

    const isRoadLayer = isRoadDetailLayer(layer);
    const isLabelLayer = isDetailLabelLayer(layer);
    if (!isRoadLayer && !isLabelLayer) {
      return;
    }

    const currentMin = layer.minzoom ?? 0;
    const currentMax = layer.maxzoom ?? MAPLIBRE_MAX_ZOOM;
    const tuning = isRoadLayer ? BASEMAP_LAYER_TUNING.road : BASEMAP_LAYER_TUNING.label;
    const [nextMin, nextMax] = clampZoomRange(
      currentMin - tuning.minDelta,
      currentMax + tuning.maxDelta
    );

    if (nextMin === currentMin && nextMax === currentMax) {
      return;
    }

    map.setLayerZoomRange(layer.id, nextMin, nextMax);
    tunedLayerIds.push({
      id: layer.id,
      type: isRoadLayer ? 'road' : 'label',
      previousRange: [currentMin, currentMax],
      nextRange: [nextMin, nextMax]
    });
  });

  console.info(
    '[maplibre-sky-fog-terrain-baseline-v4] basemap zoom consistency tuned',
    {
      vectorSources: sourceSummary,
      tunedLayerCount: tunedLayerIds.length,
      tunedLayers: tunedLayerIds
    }
  );
}

function normalizeCardIndex(index) {
  return (index + CAROUSEL_CARDS.length) % CAROUSEL_CARDS.length;
}

function lerp(start, end, progress) {
  return start + (end - start) * progress;
}

function getWrappedDelta(index, activePosition) {
  let wrappedDelta = index - activePosition;
  const half = CAROUSEL_CARDS.length / 2;
  while (wrappedDelta > half) {
    wrappedDelta -= CAROUSEL_CARDS.length;
  }
  while (wrappedDelta < -half) {
    wrappedDelta += CAROUSEL_CARDS.length;
  }
  return wrappedDelta;
}

function getCardDepthScenePosition(offset) {
  if (offset < 0) {
    const stackIndex = Math.min(Math.abs(offset), TOP_STACK_MAX_CARDS);
    const y = Math.max(-(stackIndex * TOP_STACK_SPACING), TOP_STACK_CEILING_Y);
    const scale = Math.max(0.8, 1 - stackIndex * 0.05);
    const opacity = Math.max(0.25, 1 - stackIndex * 0.2);

    return {
      y,
      z: 140 - stackIndex * 24,
      scaleX: scale,
      scaleY: Math.max(0.78, scale - 0.03),
      zIndex: Math.max(2, 12 + Math.round(stackIndex)),
      blur: stackIndex * 0.45,
      saturation: Math.max(0.72, 1 - stackIndex * 0.08),
      contrast: Math.max(0.72, 1 - stackIndex * 0.08),
      opacity
    };
  }

  const minOffset = CARD_STACK_STOPS[0].offset;
  const maxOffset = CARD_STACK_STOPS[CARD_STACK_STOPS.length - 1].offset;
  const clampedOffset = Math.max(0, Math.min(maxOffset, offset));

  let lower = CARD_STACK_STOPS[0];
  let upper = CARD_STACK_STOPS[CARD_STACK_STOPS.length - 1];
  for (let index = 0; index < CARD_STACK_STOPS.length - 1; index += 1) {
    const current = CARD_STACK_STOPS[index];
    const next = CARD_STACK_STOPS[index + 1];
    if (clampedOffset >= current.offset && clampedOffset <= next.offset) {
      lower = current;
      upper = next;
      break;
    }
  }

  const range = upper.offset - lower.offset || 1;
  const t = (clampedOffset - lower.offset) / range;

  const y = lerp(lower.y, upper.y, t);
  const z = lerp(lower.z, upper.z, t);
  const scaleX = lerp(lower.scaleX, upper.scaleX, t);
  const scaleY = lerp(lower.scaleY, upper.scaleY, t);
  const blur = lerp(lower.blur, upper.blur, t);
  const saturation = lerp(lower.saturation, upper.saturation, t);
  const contrast = lerp(lower.contrast, upper.contrast, t);
  const zIndex = Math.max(2, 12 - Math.round(Math.max(0, clampedOffset) * 2.2) + Math.round(Math.max(0, -clampedOffset) * 2.4));

  return {
    y,
    z,
    scaleX,
    scaleY,
    zIndex,
    blur,
    saturation,
    contrast,
    opacity: 1
  };
}

function createCardElement(card, index) {
  const element = document.createElement('article');
  element.className = 'depth-carousel-card';
  element.dataset.index = String(index);
  element.innerHTML = `
    <div class="depth-carousel-thumb" style="--swatch:${card.swatch || '#cfd8ea'}" aria-hidden="true"></div>
    <div class="depth-carousel-body">
      <span class="depth-carousel-chip">${card.year}</span>
      <h3 class="depth-carousel-title">${card.title}</h3>
      <div class="depth-carousel-meta">${card.subtitle || 'Archive item'}</div>
      <p class="depth-carousel-description">${card.description || 'Collection material prepared for browsing.'}</p>
    </div>
  `;
  return element;
}

function setupDepthCarousel() {
  const interactionZone = document.getElementById('depth-carousel-interaction-zone');
  const track = document.getElementById('depth-carousel-track');
  const prevButton = document.getElementById('carousel-prev-btn');
  const nextButton = document.getElementById('carousel-next-btn');
  if (!interactionZone || !track || !prevButton || !nextButton) {
    return;
  }
  let activeIndex = 2;
  let gestureStartY = 0;
  let dragProgress = 0;
  let isPointerDragging = false;
  let isSnapping = false;
  let topCardInteractionBlend = 0;
  let topCardBlendAnimationFrame = null;
  const snapDurationMs = 320;

  const cardElements = CAROUSEL_CARDS.map((card, index) => {
    const element = createCardElement(card, index);
    track.appendChild(element);
    return element;
  });

  function animateTopCardInteractionBlend(targetBlend, durationMs = 180) {
    if (topCardBlendAnimationFrame) {
      window.cancelAnimationFrame(topCardBlendAnimationFrame);
      topCardBlendAnimationFrame = null;
    }

    const startBlend = topCardInteractionBlend;
    const clampedTarget = Math.max(0, Math.min(1, targetBlend));
    const delta = clampedTarget - startBlend;

    if (Math.abs(delta) < 0.001 || durationMs <= 0) {
      topCardInteractionBlend = clampedTarget;
      renderCarousel({ animate: false });
      return;
    }

    const startTime = performance.now();
    const easeOut = value => 1 - (1 - value) ** 3;

    const step = currentTime => {
      const elapsed = currentTime - startTime;
      const progress = Math.max(0, Math.min(1, elapsed / durationMs));
      const easedProgress = easeOut(progress);
      topCardInteractionBlend = startBlend + delta * easedProgress;
      renderCarousel({ animate: false });

      if (progress < 1) {
        topCardBlendAnimationFrame = window.requestAnimationFrame(step);
        return;
      }

      topCardBlendAnimationFrame = null;
    };

    topCardBlendAnimationFrame = window.requestAnimationFrame(step);
  }

  function renderCarousel({ animate = true } = {}) {
    track.classList.toggle('is-dragging', isPointerDragging);
    track.classList.toggle('is-snapping', animate && !isPointerDragging);
    const activePosition = activeIndex - dragProgress;

    cardElements.forEach((element, index) => {
      const wrappedDelta = getWrappedDelta(index, activePosition);
      const scene = getCardDepthScenePosition(wrappedDelta);
      const isTransientTopCardPosition = wrappedDelta < 0 && wrappedDelta > -1.25;
      const isTransientTopCard = topCardInteractionBlend > 0.001 && isTransientTopCardPosition;
      const visibility = Math.max(0, Math.min(1, scene.opacity));
      const transientScaleBoost = isTransientTopCard ? 1.06 : 1;
      const transientYBoost = isTransientTopCard ? -14 : 0;
      const baseTransform = `translate3d(-50%, ${scene.y + transientYBoost}px, ${scene.z}px) scale(${scene.scaleX * transientScaleBoost}, ${scene.scaleY * transientScaleBoost})`;

      element.style.transform = baseTransform;
      element.style.opacity = String(visibility);
      element.style.zIndex = String(scene.zIndex + (isTransientTopCard ? 2 : 0));
      element.style.filter = `blur(${scene.blur}px) saturate(${scene.saturation}) contrast(${scene.contrast})`;
      element.classList.toggle('is-active', wrappedDelta === 0);
      element.classList.toggle('is-transient-top', isTransientTopCard);
      element.setAttribute('aria-hidden', visibility <= 0.01 || Math.abs(wrappedDelta) > 4 ? 'true' : 'false');
    });
  }

  function completeSnap(stepAfterSnap = 0) {
    if (stepAfterSnap !== 0) {
      activeIndex = normalizeCardIndex(activeIndex + stepAfterSnap);
    }
    dragProgress = 0;
    renderCarousel({ animate: false });
    track.classList.remove('is-snapping');
    isSnapping = false;
    animateTopCardInteractionBlend(0, 200);
  }

  function animateToDragProgress(targetProgress, stepAfterSnap = 0) {
    if (isSnapping) {
      return;
    }

    isSnapping = true;
    dragProgress = targetProgress;
    renderCarousel({ animate: true });
    window.setTimeout(() => {
      completeSnap(stepAfterSnap);
    }, snapDurationMs);
  }

  function shiftBy(step) {
    const targetProgress = step > 0 ? -1 : 1;
    animateToDragProgress(targetProgress, step);
  }

  prevButton.addEventListener('click', () => shiftBy(-1));
  nextButton.addEventListener('click', () => shiftBy(1));

  interactionZone.addEventListener('pointerdown', event => {
    if (isSnapping) {
      return;
    }
    isPointerDragging = true;
    gestureStartY = event.clientY;
    dragProgress = 0;
    animateTopCardInteractionBlend(1, 160);
    renderCarousel({ animate: false });
    interactionZone.setPointerCapture(event.pointerId);
  });

  interactionZone.addEventListener('pointermove', event => {
    if (!isPointerDragging) {
      return;
    }

    const dragDelta = event.clientY - gestureStartY;
    dragProgress = Math.max(-1, Math.min(1, dragDelta / SWIPE_SNAP_DISTANCE));
    renderCarousel({ animate: false });
  });

  interactionZone.addEventListener('pointerup', event => {
    if (!isPointerDragging) {
      return;
    }

    isPointerDragging = false;
    const nextStep = Math.abs(dragProgress) >= SWIPE_COMMIT_THRESHOLD ? (dragProgress < 0 ? 1 : -1) : 0;

    if (interactionZone.hasPointerCapture(event.pointerId)) {
      interactionZone.releasePointerCapture(event.pointerId);
    }

    if (nextStep === 0) {
      animateToDragProgress(0, 0);
      return;
    }

    const targetProgress = nextStep > 0 ? -1 : 1;
    animateToDragProgress(targetProgress, nextStep);
  });

  interactionZone.addEventListener('pointercancel', event => {
    isPointerDragging = false;
    if (interactionZone.hasPointerCapture(event.pointerId)) {
      interactionZone.releasePointerCapture(event.pointerId);
    }
    animateToDragProgress(0, 0);
  });

  renderCarousel();
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
  tuneBasemapLayerZoomConsistency();
  configureTerrainAndHillshade();
  setSkyEnabled(true);
  setVerticalFov(FOV_PRESETS.default);
  syncPitchUi(map.getPitch());
  setupDepthCarousel();

  const timelineSlider = document.getElementById('timeline-slider');
  const timelineValue = document.getElementById('timeline-value');
  timelineSlider.addEventListener('input', event => {
    timelineValue.textContent = event.target.value;
  });

  const panel = document.getElementById('controls-panel');
  const menuToggle = document.getElementById('menu-toggle');
  let isPanelOpen = false;
  setPanelOpenState(isPanelOpen);

  menuToggle.addEventListener('click', () => {
    isPanelOpen = !isPanelOpen;
    setPanelOpenState(isPanelOpen);
  });

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
