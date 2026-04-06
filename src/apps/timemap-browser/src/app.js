import { APP_RUNTIME_MODES } from "../../../shared/runtime/app-mount-contract.js";
import { createTimemapBrowserController } from "./controllers/timemap-browser-controller.js";

const VIEWPORT_REFRESH_THRESHOLDS = Object.freeze({
	center: 0.00035,
	zoom: 0.08,
	bearing: 0.75,
	pitch: 0.75,
	bbox: 0.0005,
	pixelSize: 2,
});

const VIEWPORT_STATE_THRESHOLDS = Object.freeze({
	center: 0.00008,
	zoom: 0.02,
	bearing: 0.35,
	pitch: 0.35,
	bbox: 0.00015,
	pixelSize: 1,
});

const PRESENTATION_ATTRIBUTES = [
	"show-top-chrome",
	"show-timeline",
	"show-detail-overlay",
	"show-filter-entry",
	"map-edge-to-edge",
	"embed-density",
	"map-clear-selection-on-background",
];

function absDelta(left, right) {
	const safeLeft = Number(left);
	const safeRight = Number(right);
	if (!Number.isFinite(safeLeft) || !Number.isFinite(safeRight)) {
		return Number.POSITIVE_INFINITY;
	}
	return Math.abs(safeLeft - safeRight);
}

function hasMeaningfulViewportDelta(
	nextViewport,
	previousViewport,
	thresholds = VIEWPORT_REFRESH_THRESHOLDS,
) {
	if (!previousViewport) {
		return true;
	}
	if (
		absDelta(nextViewport.center?.lng, previousViewport.center?.lng) >=
			thresholds.center ||
		absDelta(nextViewport.center?.lat, previousViewport.center?.lat) >=
			thresholds.center ||
		absDelta(nextViewport.zoom, previousViewport.zoom) >= thresholds.zoom ||
		absDelta(nextViewport.bearing, previousViewport.bearing) >= thresholds.bearing ||
		absDelta(nextViewport.pitch, previousViewport.pitch) >= thresholds.pitch
	) {
		return true;
	}

	const nextBbox = nextViewport.bbox;
	const previousBbox = previousViewport.bbox;
	if (!nextBbox || !previousBbox) {
		return false;
	}

	if (
		absDelta(nextBbox.west, previousBbox.west) >= thresholds.bbox ||
		absDelta(nextBbox.south, previousBbox.south) >= thresholds.bbox ||
		absDelta(nextBbox.east, previousBbox.east) >= thresholds.bbox ||
		absDelta(nextBbox.north, previousBbox.north) >= thresholds.bbox
	) {
		return true;
	}

	return (
		absDelta(nextViewport.pixelSize?.width, previousViewport.pixelSize?.width) >=
			thresholds.pixelSize ||
		absDelta(nextViewport.pixelSize?.height, previousViewport.pixelSize?.height) >=
			thresholds.pixelSize
	);
}

function toFilterOptionEntries(counts = new Map()) {
	return [...counts.entries()]
		.sort(([leftValue], [rightValue]) => leftValue.localeCompare(rightValue))
		.map(([value, count]) => ({
			value,
			label: value,
			count,
		}));
}

const LOW_SIGNAL_CATEGORY_VALUES = new Set([
	"collection-item",
	"item",
	"unknown",
	"uncategorized",
	"n/a",
]);

const GENERIC_MEDIA_TYPES = new Set(["image", "video", "audio", "text", "application"]);

function hasFilterOptionEntries(entries) {
	return Array.isArray(entries) && entries.length > 0;
}

function collectTypeValues(properties = {}) {
	const resolvedType = String(properties.type ?? "").trim();
	if (resolvedType) {
		return [resolvedType];
	}
	const orderedCandidates = [
		String(properties.format ?? "").trim(),
		String(properties.mediaType ?? "").trim(),
	].filter(Boolean);
	const uniqueValues = [];
	for (const value of orderedCandidates) {
		if (!uniqueValues.includes(value)) {
			uniqueValues.push(value);
		}
	}
	if (uniqueValues.length > 1) {
		return uniqueValues.filter(
			(value) => !GENERIC_MEDIA_TYPES.has(value.toLowerCase()),
		);
	}
	return uniqueValues;
}

function buildFilterOptionsFromFeatures(features = []) {
	const typeCounts = new Map();
	const categoryCounts = new Map();
	const incrementCount = (counts, value) => {
		const normalized = String(value ?? "").trim();
		if (!normalized) {
			return;
		}
		counts.set(normalized, (counts.get(normalized) || 0) + 1);
	};

	for (const feature of features) {
		const properties = feature?.properties || {};
		const uniqueTypes = new Set(collectTypeValues(properties));
		const uniqueCategories = new Set(
			[properties.category, ...(Array.isArray(properties.tags) ? properties.tags : [])]
				.map((entry) => String(entry ?? "").trim())
				.filter((entry) => !LOW_SIGNAL_CATEGORY_VALUES.has(entry.toLowerCase()))
				.filter(Boolean),
		);
		for (const typeValue of uniqueTypes) {
			incrementCount(typeCounts, typeValue);
		}
		for (const categoryValue of uniqueCategories) {
			incrementCount(categoryCounts, categoryValue);
		}
	}
	if (categoryCounts.size < 2) {
		categoryCounts.clear();
	}

	return {
		types: toFilterOptionEntries(typeCounts),
		categories: toFilterOptionEntries(categoryCounts),
	};
}

function resolveFilterOptions(spatialResponse = {}) {
	const metaOptions =
		spatialResponse?.meta && typeof spatialResponse.meta === "object"
			? spatialResponse.meta.filterOptions
			: null;
	const resolvedMetaOptions =
		metaOptions && typeof metaOptions === "object" ? metaOptions : {};
	const fallbackOptions = buildFilterOptionsFromFeatures(spatialResponse?.features || []);
	return {
		types: hasFilterOptionEntries(resolvedMetaOptions.types)
			? resolvedMetaOptions.types
			: fallbackOptions.types,
		categories: hasFilterOptionEntries(resolvedMetaOptions.categories)
			? resolvedMetaOptions.categories
			: fallbackOptions.categories,
	};
}

class TimemapBrowserElement extends HTMLElement {
	static get observedAttributes() {
		return [
			"data-oc-app-mode",
			"data-shell-embed",
			"data-workbench-embed",
			...PRESENTATION_ATTRIBUTES,
		];
	}

	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.controller = createTimemapBrowserController();
		this.unsubscribeState = null;
		this.viewportRefreshTimer = null;
		this.viewportStateTimer = null;
		this.lastSpatialRefreshViewport = null;
		this.pendingSpatialRefreshViewport = null;
		this.lastViewportStateUpdate = null;
		this.pendingViewportStateUpdate = null;
		this.handleMapViewportChange = this.onMapViewportChange.bind(this);
		this.handleMapFeatureClick = this.onMapFeatureClick.bind(this);
		this.handleClearSelection = this.onClearSelection.bind(this);
		this.handleFilterPatch = this.onFilterPatch.bind(this);
		this.filterRefreshTimer = null;
	}

	connectedCallback() {
		this.render();
		this.applyRuntimePresentation();
		this.syncShellPresentationConfig();
		this.bindState();
		this.bindMapEvents();
		this.controller.initializeSpatialData();
	}

	disconnectedCallback() {
		if (this.unsubscribeState) {
			this.unsubscribeState();
			this.unsubscribeState = null;
		}
		this.unbindMapEvents();
		if (this.viewportRefreshTimer) {
			clearTimeout(this.viewportRefreshTimer);
			this.viewportRefreshTimer = null;
		}
		if (this.viewportStateTimer) {
			clearTimeout(this.viewportStateTimer);
			this.viewportStateTimer = null;
		}
		if (this.filterRefreshTimer) {
			clearTimeout(this.filterRefreshTimer);
			this.filterRefreshTimer = null;
		}
		this.pendingSpatialRefreshViewport = null;
		this.pendingViewportStateUpdate = null;
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (oldValue === newValue) {
			return;
		}
		if (
			name === "data-oc-app-mode" ||
			name === "data-shell-embed" ||
			name === "data-workbench-embed"
		) {
			this.applyRuntimePresentation();
		}
		if (
			name === "data-oc-app-mode" ||
			name === "data-shell-embed" ||
			name === "data-workbench-embed" ||
			PRESENTATION_ATTRIBUTES.includes(name)
		) {
			this.syncShellPresentationConfig();
		}
	}

	isEmbeddedRuntime() {
		const runtimeMode =
			this.dataset?.ocAppMode || this.getAttribute("data-oc-app-mode");
		if (runtimeMode === APP_RUNTIME_MODES.EMBEDDED) {
			return true;
		}
		return (
			this.hasAttribute("data-shell-embed") ||
			this.hasAttribute("data-workbench-embed")
		);
	}

	applyRuntimePresentation() {
		this.toggleAttribute("data-app-presentation-embedded", this.isEmbeddedRuntime());
	}

	resolvePresentationConfig() {
		const embedded = this.isEmbeddedRuntime();
		const defaults = {
			showTopChrome: !embedded,
			showTimeline: true,
			showDetailOverlay: true,
			showFilterEntry: true,
			mapEdgeToEdge: true,
			embedDensity: embedded ? "compact" : "comfortable",
			mapClearSelectionOnBackground: null,
		};

		const resolveBoolean = (attributeName, fallbackValue) => {
			if (!this.hasAttribute(attributeName)) {
				return fallbackValue;
			}
			const rawValue = this.getAttribute(attributeName);
			if (rawValue === "false") {
				return false;
			}
			if (rawValue === "true" || rawValue === "") {
				return true;
			}
			return fallbackValue;
		};

		const rawEmbedDensity = this.getAttribute("embed-density");
		const embedDensity =
			rawEmbedDensity === "compact" || rawEmbedDensity === "comfortable"
				? rawEmbedDensity
				: defaults.embedDensity;

		return {
			embedded,
			showTopChrome: resolveBoolean("show-top-chrome", defaults.showTopChrome),
			showTimeline: resolveBoolean("show-timeline", defaults.showTimeline),
			showDetailOverlay: resolveBoolean(
				"show-detail-overlay",
				defaults.showDetailOverlay,
			),
			showFilterEntry: resolveBoolean(
				"show-filter-entry",
				defaults.showFilterEntry,
			),
			mapEdgeToEdge: resolveBoolean("map-edge-to-edge", defaults.mapEdgeToEdge),
			embedDensity,
			mapClearSelectionOnBackground: resolveBoolean(
				"map-clear-selection-on-background",
				defaults.mapClearSelectionOnBackground,
			),
		};
	}

	syncShellPresentationConfig() {
		const shellElement = this.shadowRoot.querySelector(
			"open-collections-timemap-browser-shell",
		);
		if (!shellElement) {
			return;
		}
		const config = this.resolvePresentationConfig();
		shellElement.presentation = config;
		for (const attributeName of PRESENTATION_ATTRIBUTES) {
			if (this.hasAttribute(attributeName)) {
				shellElement.setAttribute(attributeName, this.getAttribute(attributeName) ?? "");
			} else {
				shellElement.removeAttribute(attributeName);
			}
		}
		shellElement.setAttribute("embed-density", config.embedDensity);
	}

	bindState() {
		const shellElement = this.shadowRoot.querySelector(
			"open-collections-timemap-browser-shell",
		);
		if (!shellElement) {
			return;
		}

		if (this.unsubscribeState) {
			this.unsubscribeState();
		}

		this.unsubscribeState = this.controller.subscribe((nextState) => {
			shellElement.state = nextState;
			this.dispatchEvent(
				new CustomEvent("timemap-browser-query-state", {
					bubbles: true,
					composed: true,
					detail: {
						query: nextState.query,
						options: resolveFilterOptions(nextState.spatial?.response),
					},
				}),
			);
		});
	}

	bindMapEvents() {
		const shellElement = this.shadowRoot.querySelector(
			"open-collections-timemap-browser-shell",
		);
		if (!shellElement) {
			return;
		}
		shellElement.addEventListener(
			"timemap-browser-map-viewport-change",
			this.handleMapViewportChange,
		);
		shellElement.addEventListener(
			"timemap-browser-map-feature-click",
			this.handleMapFeatureClick,
		);
		shellElement.addEventListener(
			"timemap-browser-clear-selection",
			this.handleClearSelection,
		);
		this.addEventListener("timemap-browser-filter-patch", this.handleFilterPatch);
	}

	unbindMapEvents() {
		const shellElement = this.shadowRoot.querySelector(
			"open-collections-timemap-browser-shell",
		);
		if (!shellElement) {
			return;
		}
		shellElement.removeEventListener(
			"timemap-browser-map-viewport-change",
			this.handleMapViewportChange,
		);
		shellElement.removeEventListener(
			"timemap-browser-map-feature-click",
			this.handleMapFeatureClick,
		);
		shellElement.removeEventListener(
			"timemap-browser-clear-selection",
			this.handleClearSelection,
		);
		this.removeEventListener("timemap-browser-filter-patch", this.handleFilterPatch);
	}

	onMapViewportChange(event) {
		const viewport = event?.detail || {};
		this.queueViewportStateUpdate(viewport);

		const refreshBaseline =
			this.pendingSpatialRefreshViewport || this.lastSpatialRefreshViewport;
		if (!hasMeaningfulViewportDelta(viewport, refreshBaseline)) {
			return;
		}

		this.pendingSpatialRefreshViewport = viewport;
		if (this.viewportRefreshTimer) {
			clearTimeout(this.viewportRefreshTimer);
		}
		this.viewportRefreshTimer = setTimeout(() => {
			this.viewportRefreshTimer = null;
			if (!this.pendingSpatialRefreshViewport) {
				return;
			}
			this.lastSpatialRefreshViewport = this.pendingSpatialRefreshViewport;
			this.pendingSpatialRefreshViewport = null;
			this.controller.initializeSpatialData();
		}, 280);
	}

	onMapFeatureClick(event) {
		const featureId = event?.detail?.featureId || null;
		this.controller.setSelectedFeature(featureId);
	}

	onClearSelection() {
		this.controller.setSelectedFeature(null);
	}

	onFilterPatch(event) {
		const detail =
			event?.detail && typeof event.detail === "object" ? event.detail : {};
		const filterPatch =
			detail.filterPatch && typeof detail.filterPatch === "object"
				? detail.filterPatch
				: {};
		this.controller.setFilters(filterPatch);
		if (this.filterRefreshTimer) {
			clearTimeout(this.filterRefreshTimer);
		}
		this.filterRefreshTimer = setTimeout(() => {
			this.filterRefreshTimer = null;
			this.controller.initializeSpatialData();
		}, 120);
	}

	queueViewportStateUpdate(viewport) {
		const stateBaseline =
			this.pendingViewportStateUpdate || this.lastViewportStateUpdate;
		if (
			!hasMeaningfulViewportDelta(
				viewport,
				stateBaseline,
				VIEWPORT_STATE_THRESHOLDS,
			)
		) {
			return;
		}

		this.pendingViewportStateUpdate = viewport;
		if (this.viewportStateTimer) {
			return;
		}

		this.viewportStateTimer = setTimeout(() => {
			this.viewportStateTimer = null;
			if (!this.pendingViewportStateUpdate) {
				return;
			}
			this.lastViewportStateUpdate = this.pendingViewportStateUpdate;
			this.pendingViewportStateUpdate = null;
			this.controller.setViewport(this.lastViewportStateUpdate);
		}, 72);
	}

	render() {
		this.shadowRoot.innerHTML = `<open-collections-timemap-browser-shell></open-collections-timemap-browser-shell>`;
	}
}

if (!customElements.get("timemap-browser")) {
	customElements.define("timemap-browser", TimemapBrowserElement);
}

export { TimemapBrowserElement };
