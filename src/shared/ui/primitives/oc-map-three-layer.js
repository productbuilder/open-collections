/**
 * `oc-map-three-layer` — shared Three.js companion primitive for `oc-map`.
 *
 * This first prototype proves synced MapLibre + Three alignment with anchored test objects.
 * It intentionally does not implement 3D tiles, cards/story logic, relation lines, or custom buildings yet.
 */

import { BaseElement } from "../app-foundation/base-element.js";
import { appFoundationTokenStyles } from "../app-foundation/tokens.css.js";

const THREE_VERSION = "0.161.0";
const THREE_MODULE_URL = `https://cdn.jsdelivr.net/npm/three@${THREE_VERSION}/build/three.module.js`;

let threeLoadPromise = null;

const ocMapThreeLayerStyles = `
	${appFoundationTokenStyles}

	:host {
		display: none;
	}
`;

function createLayerError(message) {
	const error = new Error(message);
	error.name = "OcMapThreeLayerError";
	return error;
}

async function loadThreeJs() {
	if (window.__ocThreeModule) {
		return window.__ocThreeModule;
	}

	if (!threeLoadPromise) {
		threeLoadPromise = import(THREE_MODULE_URL)
			.then((module) => {
				window.__ocThreeModule = module;
				return module;
			})
			.catch((error) => {
				threeLoadPromise = null;
				throw error;
			});
	}

	return threeLoadPromise;
}

class OcMapThreeLayerElement extends BaseElement {
	static get observedAttributes() {
		return ["for", "layer-id"];
	}

	constructor() {
		super();
		this._mapElement = null;
		this._map = null;
		this._three = null;
		this._scene = null;
		this._camera = null;
		this._renderer = null;
		this._layerId = this._resolveLayerId();
		this._anchorsById = new Map();
		this._anchorMeshesById = new Map();
		this._mapReadyHandler = this._onMapReady.bind(this);
		this._isDisposed = false;
		this._isLayerAttached = false;
	}

	renderStyles() {
		return ocMapThreeLayerStyles;
	}

	renderTemplate() {
		return `<slot></slot>`;
	}

	onFirstConnected() {
		this._connectToMap().catch((error) => {
			this._emitError(error);
		});
	}

	onDisconnected() {
		this._detachFromMap();
		this._disposeThree();
	}

	onAttributeChanged(name, oldValue, newValue) {
		if (oldValue === newValue) {
			return;
		}

		if (name === "for") {
			this._detachFromMap();
			this._disposeThree();
			this._connectToMap().catch((error) => {
				this._emitError(error);
			});
			return;
		}

		if (name === "layer-id") {
			const previousLayerId = this._layerId;
			this._layerId = this._resolveLayerId();
			if (
				this._map &&
				this._isLayerAttached &&
				previousLayerId !== this._layerId
			) {
				this._map.removeLayer(previousLayerId);
				this._isLayerAttached = false;
				this._registerCustomLayer();
			}
		}
	}

	setAnchors(items = []) {
		const normalized = Array.isArray(items) ? items : [];
		this._anchorsById.clear();
		for (const item of normalized) {
			if (!item || !item.id) {
				continue;
			}
			const lng = Number(item.lng);
			const lat = Number(item.lat);
			if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
				continue;
			}
			this._anchorsById.set(String(item.id), {
				id: String(item.id),
				lng,
				lat,
				altitude: Number(item.altitude) || 0,
				kind: item.kind || "box",
			});
		}
		this._syncAnchorMeshes();
		if (this._map) {
			this._map.triggerRepaint();
		}
	}

	clearScene() {
		this._anchorsById.clear();
		this._syncAnchorMeshes();
		if (this._map) {
			this._map.triggerRepaint();
		}
	}

	async _connectToMap() {
		this._isDisposed = false;
		this._mapElement = this._resolveMapElement();
		if (!this._mapElement) {
			throw createLayerError(
				"Unable to locate target <oc-map>. Add a for attribute or place this element near an oc-map.",
			);
		}

		this._mapElement.addEventListener("oc-map-ready", this._mapReadyHandler);

		if (this._mapElement.mapInstance) {
			await this._onMapReady();
		}
	}

	_detachFromMap() {
		if (this._mapElement) {
			this._mapElement.removeEventListener(
				"oc-map-ready",
				this._mapReadyHandler,
			);
		}
		if (this._map && this._isLayerAttached && this._map.getLayer(this._layerId)) {
			this._map.removeLayer(this._layerId);
		}
		this._mapElement = null;
		this._map = null;
		this._isLayerAttached = false;
	}

	async _onMapReady() {
		if (this._isDisposed || !this._mapElement?.mapInstance) {
			return;
		}
		this._map = this._mapElement.mapInstance;
		if (!this._map) {
			return;
		}

		await this._ensureThreeSetup();
		this._registerCustomLayer();
		this._syncAnchorMeshes();

		this.dispatchEvent(
			new CustomEvent("oc-map-three-layer-ready", {
				bubbles: true,
				composed: true,
				detail: {
					layerId: this._layerId,
					anchorCount: this._anchorsById.size,
				},
			}),
		);
	}

	async _ensureThreeSetup() {
		if (this._three && this._scene && this._camera) {
			return;
		}
		this._three = await loadThreeJs();
		this._camera = new this._three.Camera();
		this._scene = new this._three.Scene();
		const light = new this._three.DirectionalLight(0xffffff, 1);
		light.position.set(0, -70, 100);
		this._scene.add(light);
		const ambient = new this._three.AmbientLight(0xffffff, 0.4);
		this._scene.add(ambient);
	}

	_registerCustomLayer() {
		if (!this._map || !this._scene || !this._camera || this._isLayerAttached) {
			return;
		}
		if (this._map.getLayer(this._layerId)) {
			this._isLayerAttached = true;
			return;
		}

		const customLayer = {
			id: this._layerId,
			type: "custom",
			renderingMode: "3d",
			onAdd: (_map, gl) => {
				this._renderer = new this._three.WebGLRenderer({
					canvas: this._map.getCanvas(),
					context: gl,
					antialias: true,
				});
				this._renderer.autoClear = false;
			},
			render: (_gl, matrix) => {
				if (!this._renderer || !this._camera || !this._scene) {
					return;
				}

				this._camera.projectionMatrix = new this._three.Matrix4().fromArray(
					matrix,
				);
				this._renderer.resetState();
				this._renderer.render(this._scene, this._camera);
				this._map.triggerRepaint();
			},
		};

		this._map.addLayer(customLayer);
		this._isLayerAttached = true;
	}

	_syncAnchorMeshes() {
		if (!this._three || !this._scene || !this._map || !window.maplibregl) {
			return;
		}
		const mapLibre = window.maplibregl;

		const seenAnchorIds = new Set(this._anchorsById.keys());
		for (const [id, mesh] of this._anchorMeshesById.entries()) {
			if (seenAnchorIds.has(id)) {
				continue;
			}
			this._scene.remove(mesh);
			mesh.geometry?.dispose?.();
			mesh.material?.dispose?.();
			this._anchorMeshesById.delete(id);
		}

		for (const anchor of this._anchorsById.values()) {
			const mercator = mapLibre.MercatorCoordinate.fromLngLat(
				[anchor.lng, anchor.lat],
				anchor.altitude,
			);
			const unitsPerMeter = mercator.meterInMercatorCoordinateUnits();
			const existingMesh = this._anchorMeshesById.get(anchor.id);
			const mesh = existingMesh || this._createMesh(anchor.kind);
			mesh.position.set(mercator.x, mercator.y, mercator.z);
			mesh.scale.setScalar(unitsPerMeter * 18);
			if (!existingMesh) {
				this._scene.add(mesh);
				this._anchorMeshesById.set(anchor.id, mesh);
			}
		}
	}

	_createMesh(kind = "box") {
		const geometry =
			kind === "pillar"
				? new this._three.BoxGeometry(1, 1, 5)
				: new this._three.BoxGeometry(1, 1, 1);
		const material = new this._three.MeshStandardMaterial({
			color: kind === "pillar" ? "#e879f9" : "#f59e0b",
			roughness: 0.4,
			metalness: 0.1,
		});
		return new this._three.Mesh(geometry, material);
	}

	_disposeThree() {
		this._isDisposed = true;
		for (const mesh of this._anchorMeshesById.values()) {
			mesh.geometry?.dispose?.();
			mesh.material?.dispose?.();
		}
		this._anchorMeshesById.clear();
		this._anchorsById.clear();
		this._renderer?.dispose?.();
		this._renderer = null;
		this._scene = null;
		this._camera = null;
		this._three = null;
	}

	_resolveMapElement() {
		const targetId = this.getStringAttr("for");
		const root = this.getRootNode?.();
		if (targetId) {
			if (root && typeof root.getElementById === "function") {
				const inRoot = root.getElementById(targetId);
				if (inRoot?.tagName?.toLowerCase() === "oc-map") {
					return inRoot;
				}
			}
			const byDocument = document.getElementById(targetId);
			if (byDocument?.tagName?.toLowerCase() === "oc-map") {
				return byDocument;
			}
		}

		if (this.parentElement?.tagName?.toLowerCase() === "oc-map") {
			return this.parentElement;
		}
		const inParent = this.parentElement?.querySelector("oc-map");
		if (inParent) {
			return inParent;
		}
		const nearestSibling = this.previousElementSibling;
		if (nearestSibling?.tagName?.toLowerCase() === "oc-map") {
			return nearestSibling;
		}
		return this.closest("main, section, article, div")?.querySelector("oc-map") || null;
	}

	_resolveLayerId() {
		return this.getStringAttr("layer-id") || `oc-map-three-layer-${this.id || "default"}`;
	}

	_emitError(error) {
		this.dispatchEvent(
			new CustomEvent("oc-map-three-layer-error", {
				bubbles: true,
				composed: true,
				detail: {
					message:
						error?.message ||
						"Failed to initialize oc-map-three-layer integration.",
					error: error || null,
				},
			}),
		);
	}
}

if (!customElements.get("oc-map-three-layer")) {
	customElements.define("oc-map-three-layer", OcMapThreeLayerElement);
}

export { OcMapThreeLayerElement };
