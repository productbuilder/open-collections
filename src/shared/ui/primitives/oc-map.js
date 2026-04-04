import { loadMapLibreGl } from "./maplibre-loader.js";

import { BaseElement } from "../app-foundation/base-element.js";
import { appFoundationTokenStyles } from "../app-foundation/tokens.css.js";

/**
 * `oc-map` — app-agnostic shared map primitive.
 *
 * Attributes:
 * - `style-url`: Map style URL (defaults to MapLibre demo style).
 * - `center`: JSON array or comma-separated `lng,lat`.
 * - `zoom`, `bearing`, `pitch`: numeric viewport options.
 * - `interactive`: optional boolean toggle (defaults to true when absent).
 *
 * Events:
 * - `oc-map-ready`
 * - `oc-map-feature-click`
 * - `oc-map-viewport-change`
 * - `oc-map-error`
 */
const ocMapStyles = `
	${appFoundationTokenStyles}

	:host {
		display: block;
		position: relative;
		inline-size: 100%;
		block-size: var(--oc-map-height, 320px);
		min-block-size: 120px;
		border-radius: var(--oc-radius-md);
		overflow: clip;
		background: var(--oc-bg-subtle);
		border: var(--oc-border-width-sm, 1px) solid var(--oc-border-default);
	}

	.map-root {
		inline-size: 100%;
		block-size: 100%;
	}
`;

class OcMapElement extends BaseElement {
	static get observedAttributes() {
		return ["style-url", "center", "zoom", "bearing", "pitch", "interactive"];
	}

	constructor() {
		super();
		this._map = null;
		this._mapLibre = null;
		this._highlightState = null;
		this._isMapReady = false;
		this._boundMoveEnd = this._onMoveEnd.bind(this);
		this._layerClickHandlers = new Map();
		this._sourceDataById = new Map();
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (oldValue === newValue) {
			return;
		}
		this.onAttributeChanged(name, oldValue, newValue);
	}

	renderStyles() {
		return ocMapStyles;
	}

	renderTemplate() {
		return `<div id="map-root" class="map-root" part="map"></div>`;
	}

	onFirstConnected() {
		this._ensureMap().catch((error) => {
			this._emitMapError(error);
		});
	}

	onDisconnected() {
		this.destroyMap();
	}

	onAttributeChanged(name) {
		if (!this._map) {
			return;
		}

		if (name === "style-url") {
			const styleUrl = this._resolveStyleUrl();
			if (styleUrl) {
				this._isMapReady = false;
				this._map.setStyle(styleUrl);
			}
			return;
		}

		this._applyViewportConfig();
	}

	get mapInstance() {
		return this._map;
	}

	get center() {
		return this.getStringAttr("center");
	}

	set center(value) {
		this.setStringAttr("center", value);
	}

	get zoom() {
		return this.getNumberAttr("zoom");
	}

	set zoom(value) {
		this.setStringAttr("zoom", value);
	}

	setGeoJsonData(name, geojson, options = {}) {
		if (!this._map || !this._isMapReady || !name || !geojson) {
			return false;
		}

		const sourceId = options.sourceId || name;
		const layerId = options.layerId || name;
		const source = this._map.getSource(sourceId);

		if (source) {
			source.setData(geojson);
		} else {
			this._map.addSource(sourceId, {
				type: "geojson",
				data: geojson,
			});
		}
		this._sourceDataById.set(sourceId, geojson);

		if (!this._map.getLayer(layerId)) {
			this._map.addLayer({
				id: layerId,
				type: options.type || "circle",
				source: sourceId,
				paint: {
					"circle-radius": 5,
					"circle-color": "#0f6cc6",
					"circle-stroke-width": 1,
					"circle-stroke-color": "#ffffff",
					...(options.paint || {}),
				},
				layout: {
					visibility: options.visible === false ? "none" : "visible",
					...(options.layout || {}),
				},
				filter: options.filter,
			});
		}

		if (!this._layerClickHandlers.has(layerId)) {
			const clickHandler = (event) => {
				const [feature] = event.features || [];
				this.dispatchEvent(
					new CustomEvent("oc-map-feature-click", {
						bubbles: true,
						composed: true,
						detail: {
							layerId,
							sourceId,
							lngLat: event.lngLat,
							point: event.point,
							feature: feature || null,
						},
					}),
				);
			};
			this._layerClickHandlers.set(layerId, clickHandler);
			this._map.on("click", layerId, clickHandler);
		}

		return true;
	}

	setLayerVisibility(layerId, visible) {
		if (!this._map || !this._isMapReady || !this._map.getLayer(layerId)) {
			return false;
		}
		this._map.setLayoutProperty(layerId, "visibility", visible ? "visible" : "none");
		return true;
	}

	fitToBounds(bounds, options = {}) {
		if (!this._map || !this._isMapReady || !bounds) {
			return false;
		}
		this._map.fitBounds(bounds, {
			padding: options.padding ?? 32,
			maxZoom: options.maxZoom,
			duration: options.duration ?? 0,
		});
		return true;
	}

	fitToData(name, options = {}) {
		if (!this._map || !this._isMapReady || !name) {
			return false;
		}
		const source = this._map.getSource(name);
		const sourceData = this._sourceDataById.get(name) || source?._data;
		const bounds = this._computeGeoJsonBounds(sourceData);
		if (!bounds) {
			return false;
		}
		return this.fitToBounds(bounds, options);
	}

	highlightFeature(sourceId, featureId) {
		if (!this._map || !this._isMapReady || !sourceId) {
			return false;
		}

		if (this._highlightState) {
			this._map.setFeatureState(this._highlightState, { highlighted: false });
			this._highlightState = null;
		}

		if (featureId === null || featureId === undefined) {
			return true;
		}

		const nextState = { source: sourceId, id: featureId };
		this._map.setFeatureState(nextState, { highlighted: true });
		this._highlightState = nextState;
		return true;
	}

	destroyMap() {
		if (!this._map) {
			return;
		}

		for (const [layerId, clickHandler] of this._layerClickHandlers.entries()) {
			this._map.off("click", layerId, clickHandler);
		}
		this._layerClickHandlers.clear();
		this._sourceDataById.clear();

		this._map.off("moveend", this._boundMoveEnd);
		this._map.remove();
		this._map = null;
		this._mapLibre = null;
		this._highlightState = null;
		this._isMapReady = false;
	}

	async _ensureMap() {
		if (this._map) {
			return;
		}

		const container = this.shadowRoot?.getElementById("map-root");
		if (!container) {
			return;
		}

		if (!this._mapLibre) {
			this._mapLibre = await loadMapLibreGl();
		}

		this._map = new this._mapLibre.Map({
			container,
			style: this._resolveStyleUrl(),
			center: this._parseCenter(),
			zoom: this._parseNumberAttr("zoom", 2),
			bearing: this._parseNumberAttr("bearing", 0),
			pitch: this._parseNumberAttr("pitch", 0),
			interactive: this.getBoolAttr("interactive") || !this.hasAttribute("interactive"),
		});

		this._map.on("load", () => {
			this._isMapReady = true;
			this.dispatchEvent(
				new CustomEvent("oc-map-ready", {
					bubbles: true,
					composed: true,
					detail: {
						center: this._map.getCenter(),
						zoom: this._map.getZoom(),
					},
				}),
			);
		});

		this._map.on("moveend", this._boundMoveEnd);
	}

	_emitMapError(error) {
		const detail = {
			message: error?.message || "Failed to initialize map.",
			error: error || null,
		};
		this.dispatchEvent(
			new CustomEvent("oc-map-error", {
				bubbles: true,
				composed: true,
				detail,
			}),
		);
	}

	_applyViewportConfig() {
		const center = this._parseCenter();
		const zoom = this._parseNumberAttr("zoom", null);
		const bearing = this._parseNumberAttr("bearing", null);
		const pitch = this._parseNumberAttr("pitch", null);

		this._map.easeTo({
			center,
			zoom: zoom ?? undefined,
			bearing: bearing ?? undefined,
			pitch: pitch ?? undefined,
			duration: 0,
		});
	}

	_onMoveEnd() {
		if (!this._map) {
			return;
		}
		const bounds = this._map.getBounds();
		this.dispatchEvent(
			new CustomEvent("oc-map-viewport-change", {
				bubbles: true,
				composed: true,
				detail: {
					center: this._map.getCenter(),
					zoom: this._map.getZoom(),
					bearing: this._map.getBearing(),
					pitch: this._map.getPitch(),
					bounds: bounds ? bounds.toArray() : null,
				},
			}),
		);
	}

	_resolveStyleUrl() {
		return this.getStringAttr("style-url") || "https://demotiles.maplibre.org/style.json";
	}

	_parseNumberAttr(name, fallback) {
		const parsed = this.getNumberAttr(name);
		return parsed === null ? fallback : parsed;
	}

	_parseCenter() {
		const centerRaw = this.getStringAttr("center");
		if (!centerRaw) {
			return [0, 0];
		}
		try {
			const parsed = JSON.parse(centerRaw);
			if (Array.isArray(parsed) && parsed.length >= 2) {
				return [Number(parsed[0]) || 0, Number(parsed[1]) || 0];
			}
		} catch (_error) {
			// Fall back to comma-separated parsing below.
		}
		const [lngRaw, latRaw] = centerRaw.split(",");
		const lng = Number(lngRaw);
		const lat = Number(latRaw);
		if (Number.isFinite(lng) && Number.isFinite(lat)) {
			return [lng, lat];
		}
		return [0, 0];
	}

	_computeGeoJsonBounds(geojson) {
		if (!geojson || typeof geojson !== "object") {
			return null;
		}

		const points = [];
		const collectCoordinates = (coordinates) => {
			if (!Array.isArray(coordinates) || coordinates.length === 0) {
				return;
			}
			if (typeof coordinates[0] === "number") {
				if (coordinates.length >= 2) {
					points.push([coordinates[0], coordinates[1]]);
				}
				return;
			}
			for (const next of coordinates) {
				collectCoordinates(next);
			}
		};

		const collectGeometry = (geometry) => {
			if (!geometry) {
				return;
			}
			if (geometry.type === "GeometryCollection") {
				for (const subGeometry of geometry.geometries || []) {
					collectGeometry(subGeometry);
				}
				return;
			}
			collectCoordinates(geometry.coordinates);
		};

		if (geojson.type === "FeatureCollection") {
			for (const feature of geojson.features || []) {
				collectGeometry(feature.geometry);
			}
		} else if (geojson.type === "Feature") {
			collectGeometry(geojson.geometry);
		} else {
			collectGeometry(geojson);
		}

		if (points.length === 0) {
			return null;
		}

		let minLng = Infinity;
		let minLat = Infinity;
		let maxLng = -Infinity;
		let maxLat = -Infinity;

		for (const [lng, lat] of points) {
			if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
				continue;
			}
			minLng = Math.min(minLng, lng);
			minLat = Math.min(minLat, lat);
			maxLng = Math.max(maxLng, lng);
			maxLat = Math.max(maxLat, lat);
		}

		if (!Number.isFinite(minLng) || !Number.isFinite(minLat)) {
			return null;
		}

		return [
			[minLng, minLat],
			[maxLng, maxLat],
		];
	}
}

if (!customElements.get("oc-map")) {
	customElements.define("oc-map", OcMapElement);
}

export { OcMapElement };
