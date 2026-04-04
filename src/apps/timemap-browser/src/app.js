import { APP_RUNTIME_MODES } from "../../../shared/runtime/app-mount-contract.js";

class TimemapBrowserElement extends HTMLElement {
	static get observedAttributes() {
		return ["data-oc-app-mode", "data-shell-embed", "data-workbench-embed"];
	}

	constructor() {
		super();
		this.attachShadow({ mode: "open" });
	}

	connectedCallback() {
		this.render();
		this.applyRuntimePresentation();
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

	render() {
		this.shadowRoot.innerHTML = `<open-collections-timemap-browser-shell></open-collections-timemap-browser-shell>`;
	}
}

if (!customElements.get("timemap-browser")) {
	customElements.define("timemap-browser", TimemapBrowserElement);
}

export { TimemapBrowserElement };
