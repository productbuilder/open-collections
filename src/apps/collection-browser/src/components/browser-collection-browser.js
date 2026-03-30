import { browserStyles } from "../css/browser.css.js";
import "../../../../shared/ui/panels/index.js";
import "./browser-browse-grid.js";

class OpenBrowserCollectionBrowserElement extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.model = {
			viewportTitle: "Collection items",
			viewportSubtitle: "Load a collection to browse its items.",
			showBack: false,
			viewMode: "sources",
			allBrowseEntities: [],
			sources: [],
			sourceCards: [],
			activeSourceId: "",
			collections: [],
			collectionCards: [],
			selectedCollectionManifestUrl: "",
			items: [],
			itemCards: [],
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
		sectionPanel.setAttribute(
			"show-back",
			this.model.showBack ? "true" : "false",
		);
	}

	renderBody() {
		const renderer = this.shadowRoot.getElementById("browserHost");
		if (!renderer) {
			return;
		}
		renderer.update({
			viewMode: this.model.viewMode,
			allBrowseEntities: this.model.allBrowseEntities,
			sourceCards: this.model.sourceCards,
			collectionCards: this.model.collectionCards,
			itemCards: this.model.itemCards,
			isLoading: this.model.isLoading,
		});
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
            <open-browser-browse-grid id="browserHost" class="browser-host"></open-browser-browse-grid>
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
