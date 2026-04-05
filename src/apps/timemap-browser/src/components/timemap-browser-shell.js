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

class TimemapBrowserShellElement extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this._state = null;
		this._mapReady = false;
	}

	set state(nextState) {
		this._state = nextState;
		this.render();
	}

	get state() {
		return this._state;
	}

	connectedCallback() {
		this.render();
	}

	render() {
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
		const viewportSummary = `${state.viewport.center.lng}, ${state.viewport.center.lat} (z${state.viewport.zoom})`;
		const spatialStatus = state.spatial?.status || "idle";
		const spatialFeatureCount = state.spatial?.response?.features?.length || 0;
		const spatialMode = state.spatial?.request?.strategy?.mode || "explore";
		const spatialDensity = state.spatial?.request?.strategy?.density || "auto";

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
								<p class="panel-note">Active filter values: ${activeFilterCount}</p>
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
								<p class="panel-note">Spatial status: ${spatialStatus}</p>
								<p class="panel-note">Returned features: ${spatialFeatureCount}</p>
								<p class="panel-note">Mode/density: ${spatialMode} / ${spatialDensity}</p>
							</div>
							<div class="map-wrap">
								<oc-map
									center-lng="${state.viewport.center.lng}"
									center-lat="${state.viewport.center.lat}"
									zoom="${state.viewport.zoom}"
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
								<p class="panel-note">Active time range: ${formatTimeRange(state.timeRange)}</p>
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
								<p class="panel-note">Selected: ${selectedFeatureLabel}</p>
								<p class="panel-note">Hovered: ${hoveredFeatureLabel}</p>
								<p class="panel-note">Visible overlays: ${visibleOverlayCount}</p>
								<p class="panel-note">Viewport: ${viewportSummary}</p>
								<p class="panel-note">Status: ${state.status.text}</p>
							</div>
						</open-collections-section-panel>
					</aside>
				</div>
			</main>
		`;

		const mapElement = this.shadowRoot.querySelector("oc-map");
		if (mapElement) {
			mapElement.addEventListener(
				"oc-map-ready",
				() => {
					this._mapReady = true;
					this.renderSpatialLayers();
				},
				{ once: true },
			);
		}

		this._mapReady = false;
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
