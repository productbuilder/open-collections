import { paneLayoutStyles } from "../css/pane-layout.css.js";

const VALID_PLACEMENTS = new Set(["right", "bottom", "hidden"]);

class OpenPaneLayoutElement extends HTMLElement {
	static get observedAttributes() {
		return ["inspector-placement"];
	}

	constructor() {
		super();
		this.attachShadow({ mode: "open" });
	}

	connectedCallback() {
		this.render();
		this.applyPlacement();
	}

	attributeChangedCallback(name) {
		if (name === "inspector-placement") {
			this.applyPlacement();
		}
	}

	get inspectorPlacement() {
		return this.normalizePlacement(
			this.getAttribute("inspector-placement"),
		);
	}

	set inspectorPlacement(value) {
		this.setAttribute(
			"inspector-placement",
			this.normalizePlacement(value),
		);
	}

	normalizePlacement(value) {
		return VALID_PLACEMENTS.has(value) ? value : "right";
	}

	applyPlacement() {
		const layout = this.shadowRoot?.querySelector(".pane-layout");
		if (!layout) {
			return;
		}

		const placement = this.inspectorPlacement;
		layout.dataset.inspectorPlacement = placement;
	}

	render() {
		this.shadowRoot.innerHTML = `
      <style>${paneLayoutStyles}</style>
      <section class="pane-layout" data-inspector-placement="right">
        <div class="pane-main"><slot name="main"></slot></div>
        <div class="pane-inspector"><slot name="inspector"></slot></div>
      </section>
    `;
	}
}

if (!customElements.get("open-pane-layout")) {
	customElements.define("open-pane-layout", OpenPaneLayoutElement);
}

export { OpenPaneLayoutElement };
