import { browserRendererStyles } from "../css/browser-renderers.css.js";
import "../../../../shared/ui/primitives/index.js";

class OpenBrowserCollectionCardGridElement extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.model = {
			collections: [],
			selectedManifestUrl: "",
		};
	}

	connectedCallback() {
		this.render();
	}

	update(data = {}) {
		this.model = { ...this.model, ...data };
		this.render();
	}

	dispatch(name, detail = {}) {
		this.dispatchEvent(
			new CustomEvent(name, { detail, bubbles: true, composed: true }),
		);
	}

	cardMarkup(entry) {
		const isActive =
			this.model.selectedManifestUrl &&
			this.model.selectedManifestUrl === entry.manifestUrl;
		return `
      <article
        class="asset-card ${isActive ? "is-focused" : ""}"
        role="button"
        tabindex="0"
        data-manifest-url="${entry.manifestUrl}"
        aria-label="Open ${entry.label}"
      >
        <div class="thumb-frame">
          <div class="thumb-placeholder">Collection</div>
        </div>
        <h3 class="card-title">${entry.label}</h3>
        <p class="meta">${entry.description || "Select to browse this collection."}</p>
        <p class="meta">${entry.collection?.items?.length || 0} item${(entry.collection?.items?.length || 0) === 1 ? "" : "s"}</p>
      </article>
    `;
	}

	bindDelegatedEvents() {
		const grid = this.shadowRoot.querySelector(".asset-grid");
		if (!grid || grid.dataset.bound === "true") {
			return;
		}

		grid.dataset.bound = "true";
		grid.addEventListener("click", (event) => {
			const target = event.target instanceof Element ? event.target : null;
			const card = target?.closest("[data-manifest-url]");
			if (!card) {
				return;
			}
			this.dispatch("collection-open", {
				manifestUrl: card.getAttribute("data-manifest-url") || "",
			});
		});

		grid.addEventListener("keydown", (event) => {
			if (event.key !== "Enter" && event.key !== " ") {
				return;
			}
			const target = event.target instanceof Element ? event.target : null;
			const card = target?.closest("[data-manifest-url]");
			if (!card) {
				return;
			}
			event.preventDefault();
			this.dispatch("collection-open", {
				manifestUrl: card.getAttribute("data-manifest-url") || "",
			});
		});
	}

	render() {
		const collections = Array.isArray(this.model.collections)
			? this.model.collections
			: [];
		if (collections.length === 0) {
			this.shadowRoot.innerHTML = `
        <style>${browserRendererStyles}</style>
        <open-collections-empty-state
          title="No collections available"
          message="Choose a different source to browse collections."
        ></open-collections-empty-state>
      `;
			return;
		}

		this.shadowRoot.innerHTML = `
      <style>${browserRendererStyles}</style>
      <div class="asset-grid">
        ${collections.map((entry) => this.cardMarkup(entry)).join("")}
      </div>
    `;
		this.bindDelegatedEvents();
	}
}

if (!customElements.get("open-browser-collection-card-grid")) {
	customElements.define(
		"open-browser-collection-card-grid",
		OpenBrowserCollectionCardGridElement,
	);
}

export { OpenBrowserCollectionCardGridElement };
