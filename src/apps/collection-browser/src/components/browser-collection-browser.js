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
		const title = this.shadowRoot.getElementById("viewportTitle");
		const subtitle = this.shadowRoot.getElementById("viewportSubtitle");
		if (!sectionPanel || !title || !subtitle) {
			return;
		}

		sectionPanel.setAttribute(
			"title",
			this.model.viewportTitle || "Collection items",
		);
		title.textContent = this.model.viewportTitle || "Collection items";
		subtitle.textContent = this.model.viewportSubtitle || "";
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
        <open-collections-section-panel
          id="viewportPanel"
          title="Collection items"
          description="Load a collection to browse its items."
          heading-level="2"
          surface
        >
          <slot name="toolbar" slot="actions"></slot>
          <section class="viewport-layout">
            <section class="viewport-region">
              <div class="viewport-summary">
                <h3 id="viewportTitle" class="viewport-title">Collection items</h3>
                <p id="viewportSubtitle" class="viewport-subtitle">Load a collection to browse its items.</p>
              </div>
              <div id="browserHost" class="browser-host"></div>
            </section>
            <aside class="viewport-inspector">
              <slot class="inspector-slot" name="inspector"></slot>
            </aside>
          </section>
        </open-collections-section-panel>
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
