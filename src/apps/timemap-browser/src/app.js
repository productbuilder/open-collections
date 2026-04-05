import { APP_RUNTIME_MODES } from "../../../shared/runtime/app-mount-contract.js";
import { createTimemapBrowserController } from "./controllers/timemap-browser-controller.js";

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
		this.handleMapViewportChange = this.onMapViewportChange.bind(this);
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
	}

	onMapViewportChange(event) {
		const viewport = event?.detail || {};
		this.controller.setViewport(viewport);
		if (this.viewportRefreshTimer) {
			clearTimeout(this.viewportRefreshTimer);
		}
		this.viewportRefreshTimer = setTimeout(() => {
			this.viewportRefreshTimer = null;
			this.controller.initializeSpatialData();
		}, 280);
	}

	render() {
		this.shadowRoot.innerHTML = `<open-collections-timemap-browser-shell></open-collections-timemap-browser-shell>`;
	}
}

if (!customElements.get("timemap-browser")) {
	customElements.define("timemap-browser", TimemapBrowserElement);
}

export { TimemapBrowserElement };
