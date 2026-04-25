import "../../../shared/ui/primitives/index.js";

const BAG_ITEMS_ENDPOINT = "https://api.3dbag.nl/collections/pand/items";
const DEFAULT_LIMIT = 150;
const FETCH_DEBOUNCE_MS = 280;
const LAYER_SOURCE_ID = "bag-footprints-source";
const LAYER_FILL_ID = "bag-footprints-fill";
const LAYER_LINE_ID = "bag-footprints-line";

class Oc3DBagAlignmentSandboxElement extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this._mapEl = null;
		this._statusEl = null;
		this._metricsEl = null;
		this._logEl = null;
		this._lastBounds = null;
		this._lastFetchToken = null;
		this._fetchDebounceTimer = null;
		this._activeRequestController = null;
		this._ready = false;
		this._boundMapReady = this._onMapReady.bind(this);
		this._boundViewportChange = this._onViewportChange.bind(this);
		this._boundRefresh = this._onRefreshClick.bind(this);
	}

	connectedCallback() {
		this._render();
		this._bindDom();
	}

	disconnectedCallback() {
		this._mapEl?.removeEventListener("oc-map-ready", this._boundMapReady);
		this._mapEl?.removeEventListener(
			"oc-map-viewport-change",
			this._boundViewportChange,
		);
		const refreshButton = this.shadowRoot?.getElementById("refresh-button");
		refreshButton?.removeEventListener("click", this._boundRefresh);

		if (this._fetchDebounceTimer) {
			window.clearTimeout(this._fetchDebounceTimer);
			this._fetchDebounceTimer = null;
		}
		if (this._activeRequestController) {
			this._activeRequestController.abort();
			this._activeRequestController = null;
		}
	}

	_render() {
		this.shadowRoot.innerHTML = `
			<style>
				:host {
					display: block;
					min-block-size: 100vh;
					font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
					color: #e2e8f0;
					background: #020617;
				}

				* {
					box-sizing: border-box;
				}

				main {
					display: grid;
					grid-template-rows: auto 1fr;
					min-block-size: 100vh;
				}

				header {
					display: grid;
					gap: 10px;
					padding: 12px;
					background: rgb(15 23 42 / 94%);
					border-bottom: 1px solid rgb(148 163 184 / 28%);
				}

				.title-row {
					display: flex;
					align-items: center;
					justify-content: space-between;
					gap: 8px;
				}

				h1 {
					margin: 0;
					font-size: 16px;
				}

				p {
					margin: 0;
					font-size: 13px;
					color: #cbd5e1;
				}

				button {
					border: 1px solid rgb(96 165 250 / 70%);
					background: #1d4ed8;
					color: #eff6ff;
					border-radius: 8px;
					padding: 6px 10px;
					font-size: 12px;
					font-weight: 600;
					cursor: pointer;
				}

				.status {
					font-size: 12px;
					color: #bfdbfe;
				}

				.metrics {
					font-size: 12px;
					color: #cbd5e1;
				}

				.log {
					font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
					font-size: 11px;
					background: #0f172a;
					border: 1px solid #334155;
					border-radius: 8px;
					padding: 8px;
					max-block-size: 100px;
					overflow: auto;
					white-space: pre-wrap;
				}

				oc-map {
					display: block;
					inline-size: 100%;
					--oc-map-height: calc(100vh - 190px);
					border: 0;
					border-radius: 0;
				}
			</style>
			<main>
				<header>
					<div class="title-row">
						<h1>3DBAG Alignment Sandbox (v1)</h1>
						<button id="refresh-button" type="button">Refresh current bbox</button>
					</div>
					<p>
						Moves fetch building footprints from the 3DBAG API using the current map bounds,
						then draws them as fill + outline overlays to verify alignment.
					</p>
					<div class="status" id="status">Waiting for map initialization…</div>
					<div class="metrics" id="metrics">No request yet.</div>
					<div class="log" id="log">Sandbox log is empty.</div>
				</header>
				<oc-map
					id="map"
					center-lng="5.1769"
					center-lat="52.2250"
					zoom="15"
					style-url="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
				></oc-map>
			</main>
		`;
	}

	_bindDom() {
		this._mapEl = this.shadowRoot.getElementById("map");
		this._statusEl = this.shadowRoot.getElementById("status");
		this._metricsEl = this.shadowRoot.getElementById("metrics");
		this._logEl = this.shadowRoot.getElementById("log");
		const refreshButton = this.shadowRoot.getElementById("refresh-button");

		this._mapEl.addEventListener("oc-map-ready", this._boundMapReady);
		this._mapEl.addEventListener(
			"oc-map-viewport-change",
			this._boundViewportChange,
		);
		refreshButton.addEventListener("click", this._boundRefresh);
	}

	_onMapReady() {
		this._ready = true;
		this._setStatus("Map ready. Fetching initial 3DBAG footprints…");

		const mapInstance = this._mapEl.mapInstance;
		const bounds = mapInstance?.getBounds?.();
		if (bounds) {
			this._requestFetch(bounds.toArray());
		}
	}

	_onViewportChange(event) {
		if (!this._ready || !event?.detail?.bounds) {
			return;
		}
		this._requestFetch(event.detail.bounds);
	}

	_onRefreshClick() {
		if (!this._ready || !this._mapEl?.mapInstance) {
			return;
		}
		const bounds = this._mapEl.mapInstance.getBounds();
		if (bounds) {
			this._requestFetch(bounds.toArray(), { force: true });
		}
	}

	_requestFetch(boundsArray, options = {}) {
		const bbox = this._normalizeBounds(boundsArray);
		if (!bbox) {
			return;
		}

		const fetchToken = `${bbox.west.toFixed(6)},${bbox.south.toFixed(6)},${bbox.east.toFixed(6)},${bbox.north.toFixed(6)}`;
		if (!options.force && fetchToken === this._lastFetchToken) {
			return;
		}
		this._lastFetchToken = fetchToken;
		this._lastBounds = bbox;

		if (this._fetchDebounceTimer) {
			window.clearTimeout(this._fetchDebounceTimer);
		}

		this._fetchDebounceTimer = window.setTimeout(() => {
			this._fetchDebounceTimer = null;
			this._fetchBAGForBounds(bbox).catch((error) => {
				this._setStatus(`3DBAG request failed: ${error.message}`);
				this._appendLog(`error: ${error.message}`);
			});
		}, FETCH_DEBOUNCE_MS);
	}

	async _fetchBAGForBounds(bbox) {
		if (this._activeRequestController) {
			this._activeRequestController.abort();
		}

		const controller = new AbortController();
		this._activeRequestController = controller;

		const bboxParam = `${bbox.west},${bbox.south},${bbox.east},${bbox.north}`;
		const requestUrl = new URL(BAG_ITEMS_ENDPOINT);
		requestUrl.searchParams.set("limit", String(DEFAULT_LIMIT));
		requestUrl.searchParams.set("bbox", bboxParam);
		requestUrl.searchParams.set("f", "json");

		this._setStatus("Fetching footprints from api.3dbag.nl…");
		this._appendLog(`request bbox=${bboxParam}`);

		const response = await fetch(requestUrl.toString(), {
			signal: controller.signal,
			headers: {
				Accept: "application/geo+json, application/json",
			},
		});

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}`);
		}

		const payload = await response.json();
		const featureCollection = this._toFeatureCollection(payload);
		const polygonOnly = this._filterPolygonFootprints(featureCollection);

		const fillLayerResult = this._mapEl.setGeoJsonData(LAYER_FILL_ID, polygonOnly, {
			type: "fill",
			sourceId: LAYER_SOURCE_ID,
			paint: {
				"fill-color": "#0284c7",
				"fill-opacity": 0.28,
			},
			selectable: false,
		});
		const lineLayerResult = this._mapEl.setGeoJsonData(LAYER_LINE_ID, polygonOnly, {
			type: "line",
			sourceId: LAYER_SOURCE_ID,
			paint: {
				"line-color": "#22d3ee",
				"line-width": 1.1,
				"line-opacity": 0.9,
			},
			selectable: false,
		});

		const resultCount = polygonOnly.features.length;
		this._setStatus(
			`Rendered ${resultCount} 3DBAG footprints for current bbox (${bboxParam}).`,
		);
		this._metricsEl.textContent = `limit=${DEFAULT_LIMIT}; polygons=${resultCount}; fillLayer=${fillLayerResult}; lineLayer=${lineLayerResult}`;
		this._appendLog(
			`response features=${featureCollection.features.length}; polygons=${resultCount}`,
		);
	}

	_toFeatureCollection(payload) {
		if (payload?.type === "FeatureCollection" && Array.isArray(payload.features)) {
			return payload;
		}

		if (Array.isArray(payload?.features)) {
			return {
				type: "FeatureCollection",
				features: payload.features,
			};
		}

		if (Array.isArray(payload?.items)) {
			return {
				type: "FeatureCollection",
				features: payload.items,
			};
		}

		return { type: "FeatureCollection", features: [] };
	}

	_filterPolygonFootprints(featureCollection) {
		if (!featureCollection || !Array.isArray(featureCollection.features)) {
			return { type: "FeatureCollection", features: [] };
		}

		const features = featureCollection.features.filter((feature) => {
			const geometryType = feature?.geometry?.type;
			return geometryType === "Polygon" || geometryType === "MultiPolygon";
		});

		return {
			type: "FeatureCollection",
			features,
		};
	}

	_normalizeBounds(boundsArray) {
		if (!Array.isArray(boundsArray) || boundsArray.length < 2) {
			return null;
		}
		const [southWest, northEast] = boundsArray;
		if (!Array.isArray(southWest) || !Array.isArray(northEast)) {
			return null;
		}

		const west = Number(southWest[0]);
		const south = Number(southWest[1]);
		const east = Number(northEast[0]);
		const north = Number(northEast[1]);
		if (![west, south, east, north].every(Number.isFinite)) {
			return null;
		}

		return { west, south, east, north };
	}

	_setStatus(text) {
		if (this._statusEl) {
			this._statusEl.textContent = text;
		}
	}

	_appendLog(message) {
		if (!this._logEl) {
			return;
		}
		const timestamp = new Date().toISOString();
		const next = `${timestamp} ${message}`;
		const previous = this._logEl.textContent || "";
		this._logEl.textContent = `${next}\n${previous}`.trim().slice(0, 2200);
	}
}

if (!customElements.get("oc-3dbag-alignment-sandbox")) {
	customElements.define(
		"oc-3dbag-alignment-sandbox",
		Oc3DBagAlignmentSandboxElement,
	);
}
