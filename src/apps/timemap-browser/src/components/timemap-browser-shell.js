const timemapBrowserShellStyles = `
	:host {
		display: block;
		block-size: 100%;
		min-block-size: 100dvh;
		color: #0f172a;
		font-family: Inter, "Segoe UI", Roboto, Arial, sans-serif;
		--timeline-reserved-space: 5.2rem;
	}

	.shell {
		position: relative;
		inline-size: 100%;
		block-size: 100%;
		min-block-size: 100dvh;
		overflow: hidden;
		background: #0b1120;
	}

	.map-stage {
		position: absolute;
		inset: 0;
		z-index: 0;
	}

	.map-wrap,
	.map-wrap oc-map {
		inline-size: 100%;
		block-size: 100%;
	}

	.map-wrap oc-map {
		--oc-map-height: 100%;
	}

	.overlay-layer {
		position: absolute;
		inset-inline: 0;
		padding-inline: clamp(0.5rem, 2.2vw, 1rem);
		pointer-events: none;
	}

	.top-overlay {
		top: 0;
		z-index: 4;
		padding-block-start: max(env(safe-area-inset-top, 0px), clamp(0.45rem, 1.6vh, 0.75rem));
	}

	.bottom-overlay {
		bottom: 0;
		z-index: 2;
		padding-block-end: max(env(safe-area-inset-bottom, 0px), clamp(0.4rem, 1.2vh, 0.7rem));
	}

	.detail-overlay-layer {
		position: absolute;
		inset-inline: 0;
		bottom: calc(var(--timeline-reserved-space, 5.2rem) + max(env(safe-area-inset-bottom, 0px), 0px));
		z-index: 4;
		padding-inline: clamp(0.5rem, 2.2vw, 1rem);
		pointer-events: none;
	}

	.top-chrome,
	.detail-shell {
		pointer-events: auto;
		border: 1px solid rgba(148, 163, 184, 0.38);
		backdrop-filter: blur(10px);
		background: rgba(248, 250, 252, 0.9);
		box-shadow: 0 16px 34px rgba(15, 23, 42, 0.22);
	}

	.top-chrome {
		inline-size: min(100%, 44rem);
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto auto;
		gap: 0.35rem;
		align-items: center;
		padding: 0.35rem;
		border-radius: 999px;
	}

	.top-title {
		margin: 0;
		font-size: 0.78rem;
		line-height: 1.2;
		font-weight: 700;
		letter-spacing: 0.01em;
		text-transform: uppercase;
		color: #1e293b;
	}

	.chrome-note {
		margin: 0.06rem 0 0;
		font-size: 0.74rem;
		line-height: 1.2;
		color: #475569;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.top-primary {
		display: flex;
		align-items: center;
		gap: 0.2rem;
		padding-inline-start: 0.18rem;
		min-inline-size: 0;
	}

	.top-actions {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		justify-self: end;
		flex-shrink: 0;
	}

	.action-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-block-size: 1.95rem;
		padding: 0.28rem 0.62rem;
		border-radius: 0.65rem;
		border: 1px solid rgba(100, 116, 139, 0.48);
		background: rgba(255, 255, 255, 0.92);
		color: #0f172a;
		font-size: 0.74rem;
		font-weight: 650;
		line-height: 1;
		cursor: pointer;
		white-space: nowrap;
	}

	.action-button:hover {
		border-color: #475569;
		background: #ffffff;
	}

	.action-button--primary {
		background: rgba(14, 116, 144, 0.12);
		border-color: rgba(14, 116, 144, 0.45);
		color: #0f172a;
	}

	.timeline-shell {
		pointer-events: auto;
		inline-size: 100%;
		display: grid;
		gap: 0.2rem;
		padding: 0.48rem 0.7rem;
		border-radius: 1rem;
		border: 1px solid rgba(100, 116, 139, 0.35);
		backdrop-filter: blur(9px);
		background: linear-gradient(180deg, rgba(248, 250, 252, 0.96), rgba(241, 245, 249, 0.9));
		box-shadow: 0 -8px 26px rgba(15, 23, 42, 0.2);
	}

	.timeline-pill {
		inline-size: 2.2rem;
		block-size: 0.26rem;
		border-radius: 999px;
		background: rgba(100, 116, 139, 0.45);
		margin: 0 auto 0.08rem;
	}

	.timeline-title {
		margin: 0;
		font-size: 0.72rem;
		font-weight: 700;
		line-height: 1.15;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: #334155;
	}

	.timeline-note {
		margin: 0;
		font-size: 0.76rem;
		line-height: 1.32;
		color: #1e293b;
	}

	.detail-shell {
		inline-size: min(100%, 34rem);
		max-block-size: min(52vh, 26rem);
		overflow: auto;
		margin-inline: auto auto;
		padding: 0.65rem 0.72rem 0.75rem;
		border-radius: 1rem;
	}

	.detail-shell[data-mobile-sheet="true"] {
		inline-size: min(100%, 44rem);
		border-radius: 1rem 1rem 0.75rem 0.75rem;
	}

	.detail-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		margin-block-end: 0.4rem;
	}

	.detail-heading {
		margin: 0;
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: #475569;
	}

	.detail-card {
		display: grid;
		gap: 0.56rem;
		padding: 0.15rem 0 0.1rem;
	}

	.detail-card__title {
		margin: 0;
		font-size: 1.07rem;
		line-height: 1.18;
		color: #0f172a;
	}

	.detail-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.32rem;
	}

	.detail-chip {
		display: inline-flex;
		align-items: center;
		min-block-size: 1.4rem;
		padding: 0.12rem 0.45rem;
		border-radius: 999px;
		border: 1px solid rgba(100, 116, 139, 0.35);
		background: rgba(255, 255, 255, 0.74);
		color: #334155;
		font-size: 0.7rem;
		font-weight: 600;
	}

	.detail-grid {
		display: grid;
		gap: 0.32rem;
	}

	.detail-row {
		margin: 0;
		font-size: 0.82rem;
		line-height: 1.35;
		color: #334155;
	}

	.detail-label {
		font-weight: 700;
		color: #0f172a;
	}

	.detail-empty {
		margin: 0;
		font-size: 0.85rem;
		line-height: 1.4;
		color: #475569;
	}

	.detail-actions {
		display: flex;
		gap: 0.4rem;
	}

	.sr-only {
		position: absolute;
		inline-size: 1px;
		block-size: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	:host([data-embed-density="compact"]) .top-chrome,
	:host([data-embed-density="compact"]) .timeline-shell,
	:host([data-embed-density="compact"]) .detail-shell {
		box-shadow: 0 8px 20px rgba(15, 23, 42, 0.18);
	}

	:host([data-embed-density="compact"]) {
		--timeline-reserved-space: 4.8rem;
	}

	@media (max-width: 767px) {
		:host {
			--timeline-reserved-space: 4.5rem;
		}

		.top-chrome {
			inline-size: 100%;
			grid-template-columns: minmax(0, 1fr) auto;
			padding: 0.32rem;
		}

		.top-primary {
			grid-column: 1 / -1;
			order: 0;
		}

		.top-actions {
			order: 1;
		}

		.timeline-shell {
			border-radius: 0.9rem;
			padding-block-end: 0.52rem;
		}

		.detail-overlay-layer {
			bottom: var(--timeline-reserved-space, 4.8rem);
		}

		.detail-shell {
			max-block-size: min(58vh, 26rem);
			border-radius: 1rem 1rem 0.7rem 0.7rem;
		}
	}
`;

function formatTimeRange(timeRange = {}) {
	if (!timeRange.start && !timeRange.end) {
		return "Not set";
	}
	if (timeRange.start && timeRange.end) {
		return `${timeRange.start} to ${timeRange.end}`;
	}
	return timeRange.start ? `From ${timeRange.start}` : `Until ${timeRange.end}`;
}

function getVisibleOverlayCount(visibleOverlays = {}) {
	return Object.values(visibleOverlays).filter(Boolean).length;
}

function toBboxFromBounds(bounds) {
	if (!Array.isArray(bounds) || bounds.length < 2) {
		return null;
	}
	const [southWest, northEast] = bounds;
	if (!Array.isArray(southWest) || !Array.isArray(northEast)) {
		return null;
	}
	return {
		west: Number(southWest[0]),
		south: Number(southWest[1]),
		east: Number(northEast[0]),
		north: Number(northEast[1]),
	};
}

function toFeatureCollection(features) {
	return {
		type: "FeatureCollection",
		features,
	};
}

function toMapFeature(feature, fallbackId) {
	if (!feature || typeof feature !== "object" || !feature.geometry) {
		return null;
	}
	return {
		type: "Feature",
		id: feature.id || feature.properties?.id || fallbackId,
		properties: {
			...(feature.properties || {}),
			id: feature.id || feature.properties?.id || fallbackId,
		},
		geometry: feature.geometry,
	};
}

function createLayerDataSignature(features, overlays = {}) {
	return JSON.stringify({
		features: features.map((feature) => ({
			id: feature.id,
			geometryType: feature.geometry?.type,
			coordinates: feature.geometry?.coordinates,
			properties: feature.properties,
		})),
		featuresVisible: Boolean(overlays.features),
	});
}

function toCenterSignature(viewport = {}) {
	return `${Number(viewport.center?.lng || 0).toFixed(6)}:${Number(
		viewport.center?.lat || 0,
	).toFixed(6)}:${Number(viewport.zoom || 0).toFixed(4)}`;
}

function createSpatialRenderSignature(state = {}) {
	return JSON.stringify({
		requestId: state.spatial?.response?.request?.requestId || "",
		featureCount: Array.isArray(state.spatial?.response?.features)
			? state.spatial.response.features.length
			: 0,
		featuresVisible: Boolean(state.visibleOverlays?.features),
		selectedFeatureId: state.selectedFeatureId || null,
	});
}

function toSelectedFeatureSummary(state = {}) {
	const features = Array.isArray(state.spatial?.response?.features)
		? state.spatial.response.features
		: [];
	const selectedFeatureId = state.selectedFeatureId;
	if (!selectedFeatureId) {
		return null;
	}
	return (
		features.find((feature) => {
			const featureId = feature?.id ?? feature?.properties?.id ?? null;
			return featureId === selectedFeatureId;
		}) || null
	);
}

function renderSelectedFeatureCard(feature) {
	const properties = feature?.properties || {};
	const title =
		properties.title || properties.label || properties.name || "Untitled feature";
	const featureId = feature?.id || properties.id || "n/a";
	const category = properties.category || properties.type || properties.kind || "n/a";
	const description =
		properties.description || properties.statusText || properties.status || "n/a";
	const geometryType = feature?.geometry?.type || "n/a";
	return `
		<div class="detail-card" data-bind="selected-detail-card">
			<h3 class="detail-card__title">${title}</h3>
			<div class="detail-meta">
				<span class="detail-chip">Category: ${category}</span>
				<span class="detail-chip">Geometry: ${geometryType}</span>
			</div>
			<div class="detail-grid">
				<p class="detail-row"><span class="detail-label">ID:</span> ${featureId}</p>
				<p class="detail-row"><span class="detail-label">Description:</span> ${description}</p>
			</div>
			<div class="detail-actions">
				<button type="button" class="action-button action-button--primary" data-action="feature-action-save">Save</button>
				<button type="button" class="action-button" data-action="clear-selection">Clear selection</button>
			</div>
		</div>
	`;
}

function parseBooleanAttribute(value, fallbackValue) {
	if (value == null) {
		return fallbackValue;
	}
	if (value === "" || value === "true") {
		return true;
	}
	if (value === "false") {
		return false;
	}
	return fallbackValue;
}

class TimemapBrowserShellElement extends HTMLElement {
	static get observedAttributes() {
		return [
			"show-top-chrome",
			"show-timeline",
			"show-detail-overlay",
			"show-filter-entry",
			"map-edge-to-edge",
			"embed-density",
			"map-clear-selection-on-background",
		];
	}

	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this._state = null;
		this._presentation = {};
		this._mapReady = false;
		this._hasRendered = false;
		this._lastLayerDataSignature = null;
		this._lastAppliedCenterSignature = null;
		this._lastMapViewportSignature = null;
		this._lastSpatialRenderSignature = null;
		this._lastFeatureClickTimestamp = 0;
		this._handleMapReady = this._onMapReady.bind(this);
		this._handleViewportChange = this._onMapViewportChange.bind(this);
		this._handleMapFeatureClick = this._onMapFeatureClick.bind(this);
		this._handleClick = this._onClick.bind(this);
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (oldValue === newValue) {
			return;
		}
		if (name === "embed-density") {
			this.dataset.embedDensity = newValue === "compact" ? "compact" : "comfortable";
		}
		if (this._hasRendered) {
			this.updateViewFromState();
		}
	}

	set state(nextState) {
		const previousState = this._state;
		this._state = nextState;
		if (!this._hasRendered) {
			this.render();
			return;
		}
		this.updateViewFromState();
		if (this.shouldRenderSpatialLayers(previousState, nextState)) {
			this.renderSpatialLayers();
		}
	}

	get state() {
		return this._state;
	}

	set presentation(nextPresentation) {
		this._presentation = { ...(nextPresentation || {}) };
		if (this._hasRendered) {
			this.updateViewFromState();
		}
	}

	get presentation() {
		return this._presentation;
	}

	connectedCallback() {
		this.render();
	}

	getConfig() {
		const embeddedByState = Boolean(this._presentation?.embedded);
		const showTopChromeDefault = !embeddedByState;
		const mapClearFallback = this.isMobileViewport();
		const embedDensityDefault = embeddedByState ? "compact" : "comfortable";
		const embedDensityAttr = this.getAttribute("embed-density");
		const embedDensity =
			embedDensityAttr === "compact" || embedDensityAttr === "comfortable"
				? embedDensityAttr
				: embedDensityDefault;

		return {
			showTopChrome: parseBooleanAttribute(
				this.getAttribute("show-top-chrome"),
				showTopChromeDefault,
			),
			showTimeline: parseBooleanAttribute(this.getAttribute("show-timeline"), true),
			showDetailOverlay: parseBooleanAttribute(
				this.getAttribute("show-detail-overlay"),
				true,
			),
			showFilterEntry: parseBooleanAttribute(
				this.getAttribute("show-filter-entry"),
				true,
			),
			mapEdgeToEdge: parseBooleanAttribute(
				this.getAttribute("map-edge-to-edge"),
				true,
			),
			embedDensity,
			mapClearSelectionOnBackground: parseBooleanAttribute(
				this.getAttribute("map-clear-selection-on-background"),
				mapClearFallback,
			),
		};
	}

	isMobileViewport() {
		return typeof window !== "undefined"
			? window.matchMedia("(max-width: 767px)").matches
			: false;
	}

	render() {
		if (!this._hasRendered) {
			this.shadowRoot.innerHTML = `
				<style>${timemapBrowserShellStyles}</style>
				<main class="shell" aria-label="Timemap browser map-first shell">
					<section class="map-stage" aria-label="Map stage">
						<div class="map-wrap">
							<oc-map
								style-url="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
							></oc-map>
						</div>
					</section>

					<section class="overlay-layer top-overlay" data-region="top-overlay">
						<div class="top-chrome" data-bind="top-chrome">
							<div class="top-primary">
								<h1 class="top-title">Timemap browser</h1>
								<p class="chrome-note" data-bind="top-summary"></p>
							</div>
							<div class="top-actions">
								<button type="button" class="action-button action-button--primary" data-action="filter-entry">Filters</button>
							</div>
							<div class="top-actions">
								<button type="button" class="action-button" data-action="shell-menu">Menu</button>
							</div>
						</div>
					</section>

					<section class="detail-overlay-layer" data-region="detail-overlay">
						<div class="detail-shell" data-bind="detail-shell" hidden>
							<div class="detail-header">
								<h2 class="detail-heading">Selected feature</h2>
								<button type="button" class="action-button" data-action="clear-selection">Close</button>
							</div>
							<div data-bind="selected-feature-detail"></div>
						</div>
					</section>

					<section class="overlay-layer bottom-overlay" data-region="bottom-overlay">
						<div class="timeline-shell" data-bind="timeline-shell">
							<div class="timeline-pill" aria-hidden="true"></div>
							<p class="timeline-title">Timeline region (v1 reserved)</p>
							<p class="timeline-note" data-bind="time-range"></p>
							<p class="sr-only" data-bind="status"></p>
						</div>
					</section>
				</main>
			`;

			const mapElement = this.shadowRoot.querySelector("oc-map");
			if (mapElement) {
				mapElement.addEventListener("oc-map-ready", this._handleMapReady, {
					once: true,
				});
				mapElement.addEventListener(
					"oc-map-viewport-change",
					this._handleViewportChange,
				);
				mapElement.addEventListener(
					"oc-map-feature-click",
					this._handleMapFeatureClick,
				);
			}
			this.shadowRoot.addEventListener("click", this._handleClick);
			this._hasRendered = true;
		}

		this.updateViewFromState();
		this.renderSpatialLayers();
	}

	updateViewFromState() {
		const state = this._state || {
			filters: {},
			timeRange: {},
			selectedFeatureId: null,
			visibleOverlays: {},
			viewport: { center: { lng: 5.1769, lat: 52.225 }, zoom: 13.6 },
			spatial: {
				request: { strategy: { mode: "explore", density: "auto" } },
				response: { features: [] },
				status: "idle",
			},
			status: { text: "Timemap map-first shell ready." },
		};

		const config = this.getConfig();
		this.dataset.embedDensity = config.embedDensity;
		const selectedFeature = toSelectedFeatureSummary(state);
		const activeFilterCount =
			(state.filters.keywords?.length || 0) +
			(state.filters.tags?.length || 0) +
			(state.filters.types?.length || 0);
		const spatialFeatureCount = state.spatial?.response?.features?.length || 0;
		const visibleOverlayCount = getVisibleOverlayCount(state.visibleOverlays);

		this.updateText(
			"top-summary",
			`${spatialFeatureCount} mapped features • ${activeFilterCount} active filters • ${visibleOverlayCount} visible overlays`,
		);
		this.updateText(
			"time-range",
			`Active time range: ${formatTimeRange(state.timeRange)}. Shared timeline slider will mount here next.`,
		);
		this.updateText("status", `Status: ${state.status.text}`);
		this.renderSelectedFeatureDetail(selectedFeature);
		this.syncOverlayVisibility(config, Boolean(selectedFeature));
		this.syncMapViewport(state.viewport);
	}

	syncOverlayVisibility(config, hasSelectedFeature) {
		const topOverlay = this.shadowRoot.querySelector('[data-region="top-overlay"]');
		const topChrome = this.shadowRoot.querySelector('[data-bind="top-chrome"]');
		const timelineOverlay = this.shadowRoot.querySelector('[data-region="bottom-overlay"]');
		const timelineShell = this.shadowRoot.querySelector('[data-bind="timeline-shell"]');
		const detailOverlay = this.shadowRoot.querySelector('[data-region="detail-overlay"]');
		const detailShell = this.shadowRoot.querySelector('[data-bind="detail-shell"]');
		const filterButton = this.shadowRoot.querySelector('[data-action="filter-entry"]');
		if (!topOverlay || !topChrome || !timelineOverlay || !timelineShell || !detailOverlay || !detailShell) {
			return;
		}

		topOverlay.hidden = !config.showTopChrome;
		topChrome.hidden = !config.showTopChrome;
		timelineOverlay.hidden = !config.showTimeline;
		timelineShell.hidden = !config.showTimeline;
		detailOverlay.hidden = !(config.showDetailOverlay && hasSelectedFeature);
		detailShell.hidden = !(config.showDetailOverlay && hasSelectedFeature);
		detailShell.dataset.mobileSheet = this.isMobileViewport() ? "true" : "false";
		if (filterButton) {
			filterButton.hidden = !config.showFilterEntry;
		}

		if (!config.mapEdgeToEdge) {
			this.style.setProperty("--timeline-reserved-space", "6rem");
		} else {
			this.style.removeProperty("--timeline-reserved-space");
		}
	}

	updateText(bindKey, value) {
		const element = this.shadowRoot.querySelector(`[data-bind="${bindKey}"]`);
		if (element && element.textContent !== value) {
			element.textContent = value;
		}
	}

	renderSelectedFeatureDetail(selectedFeature) {
		const detailElement = this.shadowRoot.querySelector(
			'[data-bind="selected-feature-detail"]',
		);
		if (!detailElement) {
			return;
		}

		if (!selectedFeature) {
			detailElement.innerHTML = `<p class="detail-empty">Select a map feature to open detail.</p>`;
			return;
		}
		detailElement.innerHTML = renderSelectedFeatureCard(selectedFeature);
	}

	syncMapViewport(viewport = {}) {
		const mapElement = this.shadowRoot.querySelector("oc-map");
		if (!mapElement) {
			return;
		}
		const centerSignature = toCenterSignature(viewport);
		if (this._lastAppliedCenterSignature === centerSignature) {
			return;
		}
		if (this._lastMapViewportSignature === centerSignature) {
			this._lastAppliedCenterSignature = centerSignature;
			return;
		}
		const centerLngValue = String(viewport.center?.lng ?? 0);
		const centerLatValue = String(viewport.center?.lat ?? 0);
		const zoomValue = String(viewport.zoom ?? 0);
		if (mapElement.getAttribute("center-lng") !== centerLngValue) {
			mapElement.setAttribute("center-lng", centerLngValue);
		}
		if (mapElement.getAttribute("center-lat") !== centerLatValue) {
			mapElement.setAttribute("center-lat", centerLatValue);
		}
		if (mapElement.getAttribute("zoom") !== zoomValue) {
			mapElement.setAttribute("zoom", zoomValue);
		}
		this._lastAppliedCenterSignature = centerSignature;
	}

	_onMapReady() {
		this._mapReady = true;
		this.renderSpatialLayers();
	}

	_onMapViewportChange(event) {
		const detail = event?.detail || {};
		const center = detail.center
			? {
					lng: Number(detail.center.lng),
					lat: Number(detail.center.lat),
				}
			: null;
		if (!center) {
			return;
		}
		const viewportSignature = toCenterSignature({
			center,
			zoom: Number(detail.zoom),
		});
		this._lastMapViewportSignature = viewportSignature;

		const mapElement = this.shadowRoot.querySelector("oc-map");
		this.dispatchEvent(
			new CustomEvent("timemap-browser-map-viewport-change", {
				bubbles: true,
				composed: true,
				detail: {
					center,
					zoom: Number(detail.zoom),
					bearing: Number(detail.bearing),
					pitch: Number(detail.pitch),
					bbox: toBboxFromBounds(detail.bounds),
					pixelSize: mapElement
						? {
								width: Math.round(mapElement.clientWidth || 0),
								height: Math.round(mapElement.clientHeight || 0),
							}
						: {
								width: null,
								height: null,
							},
				},
			}),
		);
	}

	_onMapFeatureClick(event) {
		this._lastFeatureClickTimestamp = Date.now();
		const detail = event?.detail || {};
		this.dispatchEvent(
			new CustomEvent("timemap-browser-map-feature-click", {
				bubbles: true,
				composed: true,
				detail: {
					featureId: detail.featureId || detail.featureProperties?.id || null,
					layerId: detail.layerId || null,
					sourceId: detail.sourceId || null,
				},
			}),
		);
	}

	_onClick(event) {
		const target = event?.target;
		if (!(target instanceof HTMLElement)) {
			return;
		}

		if (target.closest('[data-action="clear-selection"]')) {
			this.dispatchEvent(
				new CustomEvent("timemap-browser-clear-selection", {
					bubbles: true,
					composed: true,
				}),
			);
			return;
		}

		const mapContainerClicked = Boolean(target.closest("oc-map"));
		const state = this._state || {};
		if (!state.selectedFeatureId || !mapContainerClicked) {
			return;
		}
		const config = this.getConfig();
		if (!config.mapClearSelectionOnBackground) {
			return;
		}
		if (Date.now() - this._lastFeatureClickTimestamp < 240) {
			return;
		}
		this.dispatchEvent(
			new CustomEvent("timemap-browser-clear-selection", {
				bubbles: true,
				composed: true,
			}),
		);
	}

	shouldRenderSpatialLayers(previousState, nextState) {
		if (!nextState) {
			return false;
		}
		const nextSignature = createSpatialRenderSignature(nextState);
		if (this._lastSpatialRenderSignature === nextSignature) {
			return false;
		}
		this._lastSpatialRenderSignature = nextSignature;
		return previousState !== nextState;
	}

	renderSpatialLayers() {
		const mapElement = this.shadowRoot.querySelector("oc-map");
		const state = this._state;
		if (!mapElement || !this._mapReady || !state) {
			return;
		}

		const features = Array.isArray(state.spatial?.response?.features)
			? state.spatial.response.features
			: [];
		const normalizedFeatures = features
			.map((feature, index) => toMapFeature(feature, `stub-feature-${index}`))
			.filter(Boolean);
		const nextLayerDataSignature = createLayerDataSignature(
			normalizedFeatures,
			state.visibleOverlays,
		);
		if (nextLayerDataSignature === this._lastLayerDataSignature) {
			return;
		}
		this._lastLayerDataSignature = nextLayerDataSignature;

		const pointFeatures = normalizedFeatures.filter(
			(feature) => feature.geometry?.type === "Point",
		);
		const lineFeatures = normalizedFeatures.filter(
			(feature) => feature.geometry?.type === "LineString",
		);
		const polygonFeatures = normalizedFeatures.filter(
			(feature) => feature.geometry?.type === "Polygon",
		);

		mapElement.setGeoJsonData("timemap-polygon-fill", toFeatureCollection(polygonFeatures), {
			type: "fill",
			paint: {
				"fill-color": "#60a5fa",
				"fill-opacity": 0.2,
			},
			selectionProperty: "id",
			visible: Boolean(state.visibleOverlays?.features),
		});
		mapElement.setGeoJsonData("timemap-line", toFeatureCollection(lineFeatures), {
			type: "line",
			paint: {
				"line-color": "#0369a1",
				"line-width": 3,
			},
			selectionProperty: "id",
			visible: Boolean(state.visibleOverlays?.features),
		});
		mapElement.setGeoJsonData("timemap-points", toFeatureCollection(pointFeatures), {
			type: "circle",
			paint: {
				"circle-radius": 7,
				"circle-color": "#1d4ed8",
				"circle-stroke-width": 1.5,
				"circle-stroke-color": "#e2e8f0",
			},
			selectionProperty: "id",
			visible: Boolean(state.visibleOverlays?.features),
		});

		const selectedFeature = toSelectedFeatureSummary(state);
		if (!selectedFeature) {
			mapElement.clearSelection();
			return;
		}
		const geometryType = selectedFeature.geometry?.type;
		const sourceId =
			geometryType === "Point"
				? "timemap-points"
				: geometryType === "LineString"
					? "timemap-line"
					: "timemap-polygon-fill";
		mapElement.selectFeature(sourceId, selectedFeature.id, { property: "id" });
	}
}

if (!customElements.get("open-collections-timemap-browser-shell")) {
	customElements.define("open-collections-timemap-browser-shell", TimemapBrowserShellElement);
}

export { TimemapBrowserShellElement };
