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

const DEMO_ITEMS = [
	{
		id: "timeline-1852",
		title: "Canal Lock Survey",
		year: 1852,
		lng: 5.1202,
		lat: 52.0918,
		description:
			"Early measurements established the lock alignment used for later trade routes.",
	},
	{
		id: "timeline-1874",
		title: "Rail Spur Proposal",
		year: 1874,
		lng: 5.1178,
		lat: 52.0902,
		description:
			"City planners sketched a spur corridor to connect warehouses with the station edge.",
	},
	{
		id: "timeline-1908",
		title: "Market Hall Opening",
		year: 1908,
		lng: 5.1233,
		lat: 52.0908,
		description:
			"A covered market activated the central square and changed daily pedestrian flow.",
	},
	{
		id: "timeline-1929",
		title: "Tram Turnaround",
		year: 1929,
		lng: 5.1256,
		lat: 52.0896,
		description:
			"A turning loop improved commuter circulation and concentrated activity at this corner.",
	},
	{
		id: "timeline-1945",
		title: "Bridge Repairs",
		year: 1945,
		lng: 5.1191,
		lat: 52.0887,
		description:
			"Post-war emergency repairs restored crossing access and goods movement.",
	},
	{
		id: "timeline-1968",
		title: "Pedestrian Street Pilot",
		year: 1968,
		lng: 5.1216,
		lat: 52.0929,
		description:
			"A pilot car-free block introduced a calmer public realm and storefront spill-out.",
	},
	{
		id: "timeline-1987",
		title: "University Annex",
		year: 1987,
		lng: 5.1156,
		lat: 52.0914,
		description:
			"The annex brought student life into the district and extended evening activity.",
	},
	{
		id: "timeline-2001",
		title: "Waterfront Lighting",
		year: 2001,
		lng: 5.1248,
		lat: 52.0936,
		description:
			"Lighting upgrades made waterfront routes safer and more legible after dusk.",
	},
	{
		id: "timeline-2012",
		title: "Cycle Priority Link",
		year: 2012,
		lng: 5.1137,
		lat: 52.0898,
		description:
			"A continuous bike corridor connected neighborhoods to the center without detours.",
	},
	{
		id: "timeline-2019",
		title: "Public Square Renewal",
		year: 2019,
		lng: 5.1225,
		lat: 52.0901,
		description:
			"The square was resurfaced with seating terraces and integrated stormwater planting.",
	},
];

const YEAR_MIN = 1850;
const YEAR_MAX = 2020;
const TEMPORAL_VISIBILITY_WINDOW = 60;
const CLICK_SELECT_DISTANCE_PX = 28;

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
const timelineControl = document.getElementById("timeline-control");
const timelineYearLabel = document.getElementById("timeline-year");
const activeCardEl = document.getElementById("active-card");
const activeCardYearEl = document.getElementById("active-card-year");
const activeCardTitleEl = document.getElementById("active-card-title");
const activeCardDescriptionEl = document.getElementById(
	"active-card-description",
);

let map = null;
let activeYear = YEAR_MIN;
let activeItemId = null;

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

const setHorizonEnabled = (enabled, source = "ui") => {
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
	updateActiveCardPosition();
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
	appendLog(
		`${label} → pitch ${preset.pitch}, zoom ${preset.zoom}, bearing ${preset.bearing}`,
	);
};

const findNearestItemByYear = (year) => {
	const targetYear = Number(year);
	return DEMO_ITEMS.reduce((best, item) => {
		if (!best) {
			return item;
		}

		const bestDistance = Math.abs(best.year - targetYear);
		const itemDistance = Math.abs(item.year - targetYear);

		if (itemDistance < bestDistance) {
			return item;
		}

		if (itemDistance === bestDistance && item.year < best.year) {
			return item;
		}

		return best;
	}, null);
};

const getActiveItem = () =>
	DEMO_ITEMS.find((item) => item.id === activeItemId) || null;

const buildAnchorsForScene = () => {
	const activeItem = getActiveItem();

	return DEMO_ITEMS.filter((item) => {
		const yearDistance = Math.abs(item.year - activeYear);
		return (
			yearDistance <= TEMPORAL_VISIBILITY_WINDOW ||
			item.id === activeItem?.id
		);
	}).map((item) => {
		const isActive = item.id === activeItem?.id;
		const yearDistance = Math.abs(item.year - activeYear);
		const altitude = isActive
			? 24
			: Math.max(3, 11 - Math.round(yearDistance / 8));

		return {
			id: item.id,
			lng: item.lng,
			lat: item.lat,
			altitude,
			kind: isActive ? "pillar" : "box",
		};
	});
};

const refreshAnchors = (reason = "refresh") => {
	threeLayerEl.setAnchors(buildAnchorsForScene());
	if (map) {
		map.triggerRepaint();
	}
	appendLog(`anchors refreshed (${reason})`);
};

const renderActiveCard = () => {
	const activeItem = getActiveItem();
	if (!activeItem) {
		activeCardEl.hidden = true;
		return;
	}

	activeCardYearEl.textContent = `${activeItem.year}`;
	activeCardTitleEl.textContent = activeItem.title;
	activeCardDescriptionEl.textContent = activeItem.description;
	activeCardEl.hidden = false;
	updateActiveCardPosition();
};

const updateActiveCardPosition = () => {
	if (!map || activeCardEl.hidden) {
		return;
	}

	const activeItem = getActiveItem();
	if (!activeItem) {
		activeCardEl.hidden = true;
		return;
	}

	const projected = map.project([activeItem.lng, activeItem.lat]);
	const liftPx = 72;
	activeCardEl.style.left = `${projected.x}px`;
	activeCardEl.style.top = `${projected.y - liftPx}px`;
};

const setActiveItem = (item, source = "timeline") => {
	if (!item) {
		return;
	}

	activeItemId = item.id;
	appendLog(`active item → ${item.title} (${item.year}) via ${source}`);
	refreshAnchors(source);
	renderActiveCard();
};

const setActiveYear = (year, source = "timeline") => {
	const clampedYear = Math.max(YEAR_MIN, Math.min(YEAR_MAX, Number(year)));
	activeYear = clampedYear;
	timelineControl.value = String(clampedYear);
	timelineYearLabel.textContent = String(clampedYear);

	const nearestItem = findNearestItemByYear(clampedYear);
	setActiveItem(nearestItem, source);
};

const findClosestItemToPoint = (point) => {
	if (!map) {
		return null;
	}

	let best = null;

	for (const item of DEMO_ITEMS) {
		const projected = map.project([item.lng, item.lat]);
		const dx = projected.x - point.x;
		const dy = projected.y - point.y;
		const distance = Math.hypot(dx, dy);

		if (distance > CLICK_SELECT_DISTANCE_PX) {
			continue;
		}

		if (!best || distance < best.distance) {
			best = { item, distance };
		}
	}

	return best?.item || null;
};

mapEl.addEventListener("oc-map-ready", () => {
	map = mapEl.mapInstance;
	appendLog("oc-map-ready received");

	if (map) {
		updateViewportStats({
			center: map.getCenter(),
			zoom: map.getZoom(),
			pitch: map.getPitch(),
			bearing: map.getBearing(),
		});

		map.on("click", (event) => {
			const clickedItem = findClosestItemToPoint(event.point);
			if (!clickedItem) {
				return;
			}
			setActiveYear(clickedItem.year, "anchor-click");
		});
	}

	setActiveYear(activeYear, "initial");
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
	setHorizonEnabled(event.target.checked);
});

helperToggle.addEventListener("click", () => {
	setHelperExpanded(helperPanel.hidden);
});

helperClose.addEventListener("click", () => {
	setHelperExpanded(false);
});

timelineControl.addEventListener("input", (event) => {
	setActiveYear(Number(event.target.value), "timeline");
});

document.querySelectorAll("[data-action]").forEach((button) => {
	button.addEventListener("click", () => {
		const action = button.dataset.action;
		if (action === "reset-view") {
			applyPreset(VIEW_PRESETS.reset, "reset view");
			return;
		}

		if (action === "add-anchors") {
			refreshAnchors("manual");
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

setHelperExpanded(false);
setHorizonEnabled(true, "default");
setActiveYear(1900, "default-seed");
