import { browserStyles } from "../css/browser.css.js";
import "../../../../shared/ui/panels/index.js";
import "./browser-item-card-grid.js";

class OpenBrowserCollectionBrowserElement extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.model = {
			viewportTitle: "Collection items",
			viewportSubtitle: "Load a collection to browse its items.",
			items: [],
			selectedItemId: null,
		};
	}

	connectedCallback() {
		this.render();
		this.renderFrame();
		this.renderBody();
	}

	update(data = {}) {
		this.model = { ...this.model, ...data };
		if (!this.shadowRoot?.getElementById("viewportPanel")) {
			return;
		}
		this.renderFrame();
		this.renderBody();
	}

	renderFrame() {
		const sectionPanel = this.shadowRoot.getElementById("viewportPanel");
		if (!sectionPanel) {
			return;
		}

		sectionPanel.setAttribute(
			"title",
			this.model.viewportTitle || "Collection items",
		);
		sectionPanel.setAttribute("subtitle", this.model.viewportSubtitle || "");
	}

	renderBody() {
		const host = this.shadowRoot.getElementById("browserHost");
		if (!host) {
			return;
		}
		host.innerHTML = "";
		const renderer = document.createElement("open-browser-item-card-grid");
		renderer.update({
			items: this.model.items,
			selectedItemId: this.model.selectedItemId,
		});
		host.appendChild(renderer);
	}

	render() {
		this.shadowRoot.innerHTML = `
      <style>${browserStyles}</style>
      <section class="viewport-panel" aria-label="Collection browser">
        <open-collections-panel-chrome
          id="viewportPanel"
          title="Collection items"
          subtitle="Load a collection to browse its items."
        >
          <slot name="toolbar" slot="toolbar"></slot>
          <section class="viewport-layout">
            <section class="viewport-region">
              <div id="browserHost" class="browser-host"></div>
            </section>
            <aside class="viewport-inspector">
              <slot class="inspector-slot" name="inspector"></slot>
            </aside>
          </section>
        </open-collections-panel-chrome>
      </section>
    `;
	}
}

if (!customElements.get("open-browser-collection-browser")) {
	customElements.define(
		"open-browser-collection-browser",
		OpenBrowserCollectionBrowserElement,
	);
}

export { OpenBrowserCollectionBrowserElement };
