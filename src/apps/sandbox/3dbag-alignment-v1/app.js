import "../../../shared/ui/primitives/index.js";
import "./oc-3dbag-layer.js";

class Oc3DBagAlignmentSandboxElement extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this._statusEl = null;
		this._selectionEl = null;
		this._viewerLinkEl = null;
		this._boundLayerStatus = this._onLayerStatus.bind(this);
		this._boundActivate = this._onBuildingActivate.bind(this);
	}

	connectedCallback() {
		this._render();
		this._statusEl = this.shadowRoot.getElementById("status");
		this._selectionEl = this.shadowRoot.getElementById("selection");
		this._viewerLinkEl = this.shadowRoot.getElementById("viewer-link");
		this.shadowRoot.addEventListener("oc-3dbag-layer-status", this._boundLayerStatus);
		this.shadowRoot.addEventListener("oc-3dbag-building-activate", this._boundActivate);
	}

	disconnectedCallback() {
		this.shadowRoot?.removeEventListener("oc-3dbag-layer-status", this._boundLayerStatus);
		this.shadowRoot?.removeEventListener("oc-3dbag-building-activate", this._boundActivate);
	}

	_onLayerStatus(event) {
		const detail = event.detail || {};
		this._statusEl.textContent = `Strategy: ${detail.strategy}. BBOX: ${detail.bbox?.map((v) => v.toFixed(5)).join(", ")}. Features: ${detail.featureCount}.`;
		if (detail.bagViewerUrl) {
			this._viewerLinkEl.href = detail.bagViewerUrl;
			this._viewerLinkEl.hidden = false;
		}
	}

	_onBuildingActivate(event) {
		const bagPandId = event.detail?.bagPandId || "(missing BAG pand id)";
		this._selectionEl.textContent = `Selected BAG pand: ${bagPandId}`;
	}

	_render() {
		this.shadowRoot.innerHTML = `
			<style>
				:host {
					display: block;
					min-block-size: 100vh;
					background: #020617;
					color: #e2e8f0;
					font-family: Inter, ui-sans-serif, system-ui, sans-serif;
				}
				main {
					display: grid;
					grid-template-rows: auto 1fr;
					min-block-size: 100vh;
				}
				header {
					display: grid;
					gap: 8px;
					padding: 12px;
					background: rgb(15 23 42 / 94%);
					border-bottom: 1px solid rgb(148 163 184 / 28%);
				}
				h1 { margin: 0; font-size: 16px; }
				p, .status, .selection {
					margin: 0;
					font-size: 12px;
					color: #cbd5e1;
				}
				a { color: #7dd3fc; }
				oc-map { --oc-map-height: calc(100vh - 150px); }
			</style>
			<main>
				<header>
					<h1>3DBAG Alignment Sandbox (v1)</h1>
					<p>
						Uses shared <code>oc-map</code> and an <code>oc-3dbag-layer</code> component,
						with the public 3DBAG OGC <code>/collections/pand/items</code> endpoint strategy.
					</p>
					<p id="status" class="status">Waiting for initial 3DBAG layer fetch…</p>
					<p id="selection" class="selection">Selected BAG pand: none</p>
					<a id="viewer-link" href="#" target="_blank" rel="noreferrer" hidden>Open matching location in official 3DBAG viewer</a>
				</header>
				<oc-map
					id="map"
					center-lng="4.8933"
					center-lat="52.3728"
					zoom="16"
					style-url="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
				></oc-map>
				<oc-3dbag-layer
					for="map"
					rdx="192647.49226594163"
					rdy="444371.34647845256"
					debug
				></oc-3dbag-layer>
			</main>
		`;
	}
}

if (!customElements.get("oc-3dbag-alignment-sandbox")) {
	customElements.define("oc-3dbag-alignment-sandbox", Oc3DBagAlignmentSandboxElement);
}
