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

class TimemapBrowserShellElement extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this._state = null;
		this._mapReady = false;
		this._hasRendered = false;
		this._lastLayerDataSignature = null;
		this._lastAppliedCenterSignature = null;
		this._handleMapReady = this._onMapReady.bind(this);
		this._handleViewportChange = this._onMapViewportChange.bind(this);
	}

	set state(nextState) {
		this._state = nextState;
		if (!this._hasRendered) {
			this.render();
			return;
		}
		this.updateViewFromState();
		this.renderSpatialLayers();
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
								description="Reserved area for card list, drawer, and item details."
								heading-level="2"
								surface
							>
								<div class="panel-content">
									<p class="panel-note">Detail drawer/card composition will be implemented in a future step.</p>
									<p class="panel-note" data-bind="selected"></p>
									<p class="panel-note" data-bind="hovered"></p>
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
			}
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
		const selectedFeatureLabel = state.selectedFeatureId || "None";
		const hoveredFeatureLabel = state.hoveredFeatureId || "None";
		const visibleOverlayCount = getVisibleOverlayCount(state.visibleOverlays);
		const viewportSummary = formatViewportSummary(state.viewport);
		const spatialStatus = state.spatial?.status || "idle";
		const spatialFeatureCount = state.spatial?.response?.features?.length || 0;
		const spatialMode = state.spatial?.request?.strategy?.mode || "explore";
		const spatialDensity = state.spatial?.request?.strategy?.density || "auto";

		this.updateText("active-filters", `Active filter values: ${activeFilterCount}`);
		this.updateText("spatial-status", `Spatial status: ${spatialStatus}`);
		this.updateText("spatial-features", `Returned features: ${spatialFeatureCount}`);
		this.updateText(
			"spatial-mode-density",
			`Mode/density: ${spatialMode} / ${spatialDensity}`,
		);
		this.updateText("time-range", `Active time range: ${formatTimeRange(state.timeRange)}`);
		this.updateText("selected", `Selected: ${selectedFeatureLabel}`);
		this.updateText("hovered", `Hovered: ${hoveredFeatureLabel}`);
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

	syncMapViewport(viewport = {}) {
		const mapElement = this.shadowRoot.querySelector("oc-map");
		if (!mapElement) {
			return;
		}
		const centerSignature = toCenterSignature(viewport);
		if (this._lastAppliedCenterSignature === centerSignature) {
			return;
		}
		mapElement.setAttribute("center-lng", String(viewport.center?.lng ?? 0));
		mapElement.setAttribute("center-lat", String(viewport.center?.lat ?? 0));
		mapElement.setAttribute("zoom", String(viewport.zoom ?? 0));
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
			selectable: false,
			visible: Boolean(state.visibleOverlays?.features),
		});
		mapElement.setGeoJsonData("timemap-line", toFeatureCollection(lineFeatures), {
			type: "line",
			paint: {
				"line-color": "#0369a1",
				"line-width": 3,
			},
			selectable: false,
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
	}
}

if (!customElements.get("open-collections-timemap-browser-shell")) {
	customElements.define("open-collections-timemap-browser-shell", TimemapBrowserShellElement);
}

export { TimemapBrowserShellElement };
