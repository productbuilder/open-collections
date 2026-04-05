const timemapBrowserShellStyles = `
	:host {
		display: block;
		color: #0f172a;
		font-family: Inter, "Segoe UI", Roboto, Arial, sans-serif;
	}

	.shell {
		display: grid;
		gap: 0.75rem;
		padding: 0.75rem;
		box-sizing: border-box;
		min-height: 100%;
		background: #f8fafc;
	}

	.layout {
		display: grid;
		gap: 0.75rem;
		grid-template-columns: minmax(0, 1fr);
	}

	.panel-content {
		display: grid;
		gap: 0.5rem;
	}

	.panel-note {
		margin: 0;
		font-size: 0.9rem;
		line-height: 1.4;
		color: #334155;
	}

	.detail-card {
		display: grid;
		gap: 0.6rem;
		padding: 0.8rem;
		border: 1px solid #cbd5e1;
		border-radius: 0.65rem;
		background: #ffffff;
	}

	.detail-card__title {
		margin: 0;
		font-size: 1rem;
		line-height: 1.2;
		color: #0f172a;
	}

	.detail-grid {
		display: grid;
		gap: 0.35rem;
	}

	.detail-row {
		margin: 0;
		font-size: 0.86rem;
		line-height: 1.35;
		color: #334155;
	}

	.detail-label {
		font-weight: 700;
		color: #0f172a;
	}

	.detail-empty {
		margin: 0;
		font-size: 0.9rem;
		line-height: 1.45;
		color: #475569;
	}

	.clear-selection-button {
		inline-size: fit-content;
		padding: 0.42rem 0.68rem;
		border-radius: 0.5rem;
		border: 1px solid #94a3b8;
		background: #f8fafc;
		color: #0f172a;
		font-size: 0.82rem;
		font-weight: 600;
		cursor: pointer;
	}

	.clear-selection-button:hover {
		background: #eff6ff;
		border-color: #64748b;
	}

	.map-panel {
		padding: 0;
		overflow: hidden;
	}

	.map-wrap {
		min-height: 300px;
		block-size: clamp(300px, 45vh, 560px);
	}

	.map-wrap oc-map {
		--oc-map-height: 100%;
		inline-size: 100%;
		block-size: 100%;
	}

	@media (min-width: 960px) {
		.layout {
			grid-template-columns: minmax(0, 2.2fr) minmax(280px, 1fr);
			align-items: start;
		}

		.main-column,
		.side-column {
			display: grid;
			gap: 0.75rem;
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

function formatViewportSummary(viewport = {}) {
	const centerLng = Number(viewport.center?.lng || 0).toFixed(4);
	const centerLat = Number(viewport.center?.lat || 0).toFixed(4);
	const zoom = Number(viewport.zoom || 0).toFixed(2);
	const bbox = viewport.bbox
		? `${Number(viewport.bbox.west).toFixed(4)}, ${Number(
				viewport.bbox.south,
			).toFixed(4)} → ${Number(viewport.bbox.east).toFixed(4)}, ${Number(
				viewport.bbox.north,
			).toFixed(4)}`
		: "n/a";
	return `${centerLng}, ${centerLat} (z${zoom}) • bbox ${bbox}`;
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
			<div class="detail-grid">
				<p class="detail-row"><span class="detail-label">ID:</span> ${featureId}</p>
				<p class="detail-row"><span class="detail-label">Category:</span> ${category}</p>
				<p class="detail-row"><span class="detail-label">Geometry:</span> ${geometryType}</p>
				<p class="detail-row"><span class="detail-label">Description:</span> ${description}</p>
			</div>
			<button type="button" class="clear-selection-button" data-action="clear-selection">Clear selection</button>
		</div>
	`;
}

class TimemapBrowserShellElement extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this._state = null;
		this._mapReady = false;
		this._hasRendered = false;
		this._lastLayerDataSignature = null;
		this._lastAppliedCenterSignature = null;
		this._lastMapViewportSignature = null;
		this._lastSpatialRenderSignature = null;
		this._handleMapReady = this._onMapReady.bind(this);
		this._handleViewportChange = this._onMapViewportChange.bind(this);
		this._handleMapFeatureClick = this._onMapFeatureClick.bind(this);
		this._handleClearSelection = this._onClearSelection.bind(this);
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

	connectedCallback() {
		this.render();
	}

	render() {
		if (!this._hasRendered) {
			this.shadowRoot.innerHTML = `
				<style>${timemapBrowserShellStyles}</style>
				<main class="shell" aria-label="Timemap browser scaffold">
					<open-collections-section-header
						heading-level="1"
						title="Timemap browser"
						description="Scaffold layout with map, filters, timeline, and detail placeholders."
					></open-collections-section-header>

					<div class="layout">
						<section class="main-column" aria-label="Timemap main workspace">
							<open-collections-section-panel
								title="Filters"
								description="Reserved area for future timemap filters."
								heading-level="2"
								surface
							>
								<div class="panel-content">
									<p class="panel-note">Filter controls will be introduced in a later iteration.</p>
									<p class="panel-note" data-bind="active-filters"></p>
								</div>
							</open-collections-section-panel>

							<open-collections-section-panel
								title="Map"
								description="Shared oc-map primitive scaffolded for timemap integration."
								heading-level="2"
								surface
								class="map-panel"
							>
								<div class="panel-content">
									<p class="panel-note" data-bind="spatial-status"></p>
									<p class="panel-note" data-bind="spatial-features"></p>
									<p class="panel-note" data-bind="spatial-mode-density"></p>
								</div>
								<div class="map-wrap">
									<oc-map
										style-url="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
									></oc-map>
								</div>
							</open-collections-section-panel>

							<open-collections-section-panel
								title="Timeline"
								description="Reserved area for future timeline controls and tracks."
								heading-level="2"
								surface
							>
								<div class="panel-content">
									<p class="panel-note">Timeline UI scaffold placeholder.</p>
									<p class="panel-note" data-bind="time-range"></p>
								</div>
							</open-collections-section-panel>
						</section>

						<aside class="side-column" aria-label="Timemap details workspace">
							<open-collections-section-panel
								title="Cards & detail"
								description="Selection-driven detail card scaffold."
								heading-level="2"
								surface
							>
								<div class="panel-content">
									<div data-bind="selected-feature-detail"></div>
									<p class="panel-note" data-bind="visible-overlays"></p>
									<p class="panel-note" data-bind="viewport"></p>
									<p class="panel-note" data-bind="status"></p>
								</div>
							</open-collections-section-panel>
						</aside>
					</div>
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
			this.shadowRoot.addEventListener("click", this._handleClearSelection);
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
			hoveredFeatureId: null,
			visibleOverlays: {},
			viewport: { center: { lng: 5.1769, lat: 52.225 }, zoom: 13.6 },
			spatial: {
				request: { strategy: { mode: "explore", density: "auto" } },
				response: { features: [] },
				status: "idle",
			},
			status: { text: "Timemap scaffold ready." },
		};

		const activeFilterCount =
			(state.filters.keywords?.length || 0) +
			(state.filters.tags?.length || 0) +
			(state.filters.types?.length || 0);
		const visibleOverlayCount = getVisibleOverlayCount(state.visibleOverlays);
		const viewportSummary = formatViewportSummary(state.viewport);
		const spatialStatus = state.spatial?.status || "idle";
		const spatialFeatureCount = state.spatial?.response?.features?.length || 0;
		const spatialMode = state.spatial?.request?.strategy?.mode || "explore";
		const spatialDensity = state.spatial?.request?.strategy?.density || "auto";
		const selectedFeature = toSelectedFeatureSummary(state);

		this.updateText("active-filters", `Active filter values: ${activeFilterCount}`);
		this.updateText("spatial-status", `Spatial status: ${spatialStatus}`);
		this.updateText("spatial-features", `Returned features: ${spatialFeatureCount}`);
		this.updateText(
			"spatial-mode-density",
			`Mode/density: ${spatialMode} / ${spatialDensity}`,
		);
		this.updateText("time-range", `Active time range: ${formatTimeRange(state.timeRange)}`);
		this.renderSelectedFeatureDetail(selectedFeature);
		this.updateText("visible-overlays", `Visible overlays: ${visibleOverlayCount}`);
		this.updateText("viewport", `Viewport: ${viewportSummary}`);
		this.updateText("status", `Status: ${state.status.text}`);

		this.syncMapViewport(state.viewport);
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
			detailElement.innerHTML = `<p class="detail-empty">Select a map feature to view detail here.</p>`;
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

	_onClearSelection(event) {
		const target = event?.target;
		if (!(target instanceof HTMLElement)) {
			return;
		}
		if (!target.closest('[data-action="clear-selection"]')) {
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
