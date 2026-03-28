import { layoutStyles } from "../css/layout.css.js";

class PbWorkspaceLayoutElement extends HTMLElement {
	static get observedAttributes() {
		return ["mobile-tree-open", "mobile-details-open"];
	}

	constructor() {
		super();
		this.attachShadow({ mode: "open" });
	}

	connectedCallback() {
		this.render();
		this.syncState();
	}

	attributeChangedCallback() {
		this.syncState();
	}

	syncState() {
		const shell = this.shadowRoot?.querySelector(".layout");
		if (!shell) {
			return;
		}
		shell.dataset.mobileTreeOpen =
			this.getAttribute("mobile-tree-open") === "true" ? "true" : "false";
		shell.dataset.mobileDetailsOpen =
			this.getAttribute("mobile-details-open") === "true"
				? "true"
				: "false";
	}

	render() {
		this.shadowRoot.innerHTML = `
      <style>${layoutStyles}</style>
      <section class="layout" data-mobile-tree-open="false" data-mobile-details-open="false">
        <aside class="tree-pane"><slot name="tree"></slot></aside>
        <main class="main-pane"><slot name="main"></slot></main>
        <aside class="details-pane"><slot name="details"></slot></aside>
      </section>
    `;
	}
}

if (!customElements.get("pb-workspace-layout")) {
	customElements.define("pb-workspace-layout", PbWorkspaceLayoutElement);
}
