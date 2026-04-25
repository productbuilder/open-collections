import {
	createBagViewerUrl,
	fetchBagPandItems,
	normalizeBagPandFeatures,
	wgs84BboxAroundRdPoint,
} from "../../../shared/data/3dbag/index.js";

const LAYER_SOURCE_ID = "oc-3dbag-source";
const LAYER_FILL_ID = "oc-3dbag-fill";
const LAYER_LINE_ID = "oc-3dbag-line";

export class Oc3DBagLayerElement extends HTMLElement {
	static get observedAttributes() {
		return ["bbox", "rdx", "rdy", "debug"];
	}

	constructor() {
		super();
		this._map = null;
		this._abortController = null;
		this._lastFetchKey = "";
		this._ready = false;
		this._boundMapReady = this._onMapReady.bind(this);
		this._boundViewport = this._onViewportChange.bind(this);
		this._boundFeatureClick = this._onFeatureClick.bind(this);
	}

	connectedCallback() {
		this._connectToMap();
	}

	disconnectedCallback() {
		this._disconnectMapListeners();
		if (this._abortController) {
			this._abortController.abort();
			this._abortController = null;
		}
	}

	attributeChangedCallback() {
		if (!this._ready) {
			return;
		}
		this.refresh({ force: true });
	}

	get debug() {
		return this.hasAttribute("debug");
	}

	get bagViewerUrl() {
		const rdx = Number(this.getAttribute("rdx"));
		const rdy = Number(this.getAttribute("rdy"));
		if (!Number.isFinite(rdx) || !Number.isFinite(rdy)) {
			return "";
		}
		return createBagViewerUrl({ rdx, rdy });
	}

	_connectToMap() {
		const explicitMapId = this.getAttribute("for");
		if (explicitMapId) {
			this._map = document.getElementById(explicitMapId);
		}
		if (!this._map) {
			this._map =
				this.closest("main")?.querySelector("oc-map") ||
				this.parentElement?.querySelector("oc-map") ||
				document.querySelector("oc-map");
		}
		if (!this._map) {
			throw new Error("oc-3dbag-layer requires an oc-map in scope.");
		}

		this._map.addEventListener("oc-map-ready", this._boundMapReady);
		this._map.addEventListener("oc-map-viewport-change", this._boundViewport);
		this._map.addEventListener("oc-map-feature-click", this._boundFeatureClick);

		if (this._map.mapInstance) {
			this._onMapReady();
		}
	}

	_disconnectMapListeners() {
		if (!this._map) {
			return;
		}
		this._map.removeEventListener("oc-map-ready", this._boundMapReady);
		this._map.removeEventListener("oc-map-viewport-change", this._boundViewport);
		this._map.removeEventListener("oc-map-feature-click", this._boundFeatureClick);
	}

	_onMapReady() {
		this._ready = true;
		this.refresh({ force: true });
	}

	_onViewportChange() {
		if (this.hasAttribute("bbox") || this.hasAttribute("rdx")) {
			return;
		}
		this.refresh();
	}

	_onFeatureClick(event) {
		if (
			event?.detail?.layerId !== LAYER_FILL_ID &&
			event?.detail?.layerId !== LAYER_LINE_ID
		) {
			return;
		}
		const properties = event.detail.featureProperties || {};
		const bagPandId = properties.bagPandId || event.detail.featureId || null;
		if (!bagPandId) {
			return;
		}
		this.dispatchEvent(
			new CustomEvent("oc-3dbag-building-activate", {
				bubbles: true,
				composed: true,
				detail: {
					bagPandId,
					attributes: properties,
					source: "3dbag",
				},
			}),
		);
	}

	_resolveBbox() {
		const bboxAttr = this.getAttribute("bbox");
		if (bboxAttr) {
			const parsed = bboxAttr.split(",").map((entry) => Number(entry.trim()));
			if (parsed.length === 4 && parsed.every(Number.isFinite)) {
				return parsed;
			}
		}

		const rdx = Number(this.getAttribute("rdx"));
		const rdy = Number(this.getAttribute("rdy"));
		if (Number.isFinite(rdx) && Number.isFinite(rdy)) {
			return wgs84BboxAroundRdPoint(rdx, rdy, 900);
		}

		const bounds = this._map?.mapInstance?.getBounds?.();
		if (!bounds) {
			return null;
		}
		const [southWest, northEast] = bounds.toArray();
		return [southWest[0], southWest[1], northEast[0], northEast[1]];
	}

	async refresh({ force = false } = {}) {
		const bbox = this._resolveBbox();
		if (!bbox) {
			return;
		}
		const fetchKey = bbox.map((value) => value.toFixed(6)).join(",");
		if (!force && fetchKey === this._lastFetchKey) {
			return;
		}
		this._lastFetchKey = fetchKey;

		if (this._abortController) {
			this._abortController.abort();
		}
		this._abortController = new AbortController();

		const payload = await fetchBagPandItems(
			{ bbox, limit: 200 },
			{ signal: this._abortController.signal },
		);
		const normalized = normalizeBagPandFeatures(payload);

		this._map.setGeoJsonData(LAYER_FILL_ID, normalized, {
			type: "fill",
			sourceId: LAYER_SOURCE_ID,
			paint: {
				"fill-color": "#0284c7",
				"fill-opacity": this.debug ? 0.33 : 0.22,
			},
			selectionProperty: "bagPandId",
			selectable: true,
		});

		this._map.setGeoJsonData(LAYER_LINE_ID, normalized, {
			type: "line",
			sourceId: LAYER_SOURCE_ID,
			paint: {
				"line-color": "#22d3ee",
				"line-width": this.debug ? 1.2 : 0.9,
				"line-opacity": 0.92,
			},
			selectionProperty: "bagPandId",
			selectable: true,
		});

		this.dispatchEvent(
			new CustomEvent("oc-3dbag-layer-status", {
				bubbles: true,
				composed: true,
				detail: {
					strategy: "ogc-features-pand-items",
					bbox,
					featureCount: normalized.features.length,
					bagViewerUrl: this.bagViewerUrl,
				},
			}),
		);
	}
}

if (!customElements.get("oc-3dbag-layer")) {
	customElements.define("oc-3dbag-layer", Oc3DBagLayerElement);
}
