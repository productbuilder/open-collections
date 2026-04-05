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

class TimemapBrowserElement extends HTMLElement {
	static get observedAttributes() {
		return ["data-oc-app-mode", "data-shell-embed", "data-workbench-embed"];
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
	}

	connectedCallback() {
		this.render();
		this.applyRuntimePresentation();
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
