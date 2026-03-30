import { browserStyles } from "../css/browser.css.js";
import "../../../../shared/ui/panels/index.js";
import "./browser-collection-card-grid.js";
import "./browser-item-card-grid.js";

class OpenBrowserCollectionBrowserElement extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.model = {
			viewportTitle: "Collection items",
			viewportSubtitle: "Load a collection to browse its items.",
			viewMode: "items",
			collections: [],
			selectedCollectionManifestUrl: "",
			items: [],
			selectedItemId: null,
			isLoading: false,
			desktopInspectorOpen: false,
		};
	}

	connectedCallback() {
		this.render();
		this.bindEvents();
		this.renderFrame();
		this.renderBody();
		this.syncInspectorState();
	}

	update(data = {}) {
		this.model = { ...this.model, ...data };
		if (!this.shadowRoot?.getElementById("viewportPanel")) {
			return;
		}
		this.renderFrame();
		this.renderBody();
		this.syncInspectorState();
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
		const renderer =
			this.model.viewMode === "collections"
				? document.createElement("open-browser-collection-card-grid")
				: document.createElement("open-browser-item-card-grid");

		if (this.model.viewMode === "collections") {
			renderer.update({
				collections: this.model.collections,
				selectedManifestUrl: this.model.selectedCollectionManifestUrl,
			});
		} else {
			renderer.update({
				items: this.model.items,
				selectedItemId: this.model.selectedItemId,
				isLoading: this.model.isLoading,
			});
		}
		host.appendChild(renderer);
	}

	bindEvents() {
		const toggle = this.shadowRoot.getElementById("inspectorToggle");
		toggle?.addEventListener("click", () => {
			this.model.desktopInspectorOpen = !this.model.desktopInspectorOpen;
			this.syncInspectorState();
		});
	}

	syncInspectorState() {
		const layout = this.shadowRoot.getElementById("viewportLayout");
		const toggle = this.shadowRoot.getElementById("inspectorToggle");
		if (layout) {
			layout.classList.toggle(
				"is-inspector-open",
				Boolean(this.model.desktopInspectorOpen),
			);
		}
		if (toggle) {
			const isOpen = Boolean(this.model.desktopInspectorOpen);
			toggle.textContent = isOpen ? "Hide details" : "Show details";
			toggle.setAttribute("aria-expanded", String(isOpen));
		}
	}

	setDesktopInspectorOpen(open = true) {
		this.model.desktopInspectorOpen = Boolean(open);
		this.syncInspectorState();
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
          <button
            id="inspectorToggle"
            class="btn inspector-toggle"
            type="button"
            slot="toolbar-actions"
            aria-expanded="false"
            aria-controls="browserInspector"
          >
            Show details
          </button>
          <section id="viewportLayout" class="viewport-layout">
            <section class="viewport-region">
              <div id="browserHost" class="browser-host"></div>
            </section>
            <aside id="browserInspector" class="viewport-inspector">
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
