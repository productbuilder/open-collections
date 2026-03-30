import { browserRendererStyles } from "../css/browser-renderers.css.js";
import "../../../../shared/ui/primitives/index.js";

const RENDER_CHUNK_SIZE = 36;

class OpenBrowserItemCardGridElement extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.model = { items: [], selectedItemId: null, isLoading: false };
		this._renderFrame = 0;
		this._renderToken = 0;
	}

	connectedCallback() {
		this.render();
	}

	disconnectedCallback() {
		this.cancelChunkedRender();
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

	cancelChunkedRender() {
		this._renderToken += 1;
		if (this._renderFrame) {
			window.cancelAnimationFrame(this._renderFrame);
			this._renderFrame = 0;
		}
	}

	previewMarkup(item) {
		const mediaUrl = item.media?.thumbnailUrl || item.media?.url || "";
		const mediaType = (item.media?.type || "").toLowerCase();

		if (!mediaUrl) {
			return '<div class="thumb-placeholder">No preview</div>';
		}

		if (mediaType.includes("video")) {
			return `<video class="thumb" src="${mediaUrl}" muted playsinline preload="metadata"></video>`;
		}

		return `<img class="thumb" src="${mediaUrl}" alt="${item.title || item.id}" />`;
	}

	cardMarkup(item) {
		return `
      <article
        class="asset-card ${this.model.selectedItemId === item.id ? "is-focused" : ""}"
        role="button"
        tabindex="0"
        data-item-id="${item.id}"
        aria-label="Select ${item.title || item.id}"
      >
        <div class="thumb-frame">${this.previewMarkup(item)}</div>
        <h3 class="card-title">${item.title || item.id}</h3>
        <p class="meta">${item.license ? `License: ${item.license}` : "License not set"}</p>
        <div class="card-actions">
          <button type="button" class="btn" data-view-id="${item.id}">View</button>
        </div>
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
			const viewButton = target?.closest("[data-view-id]");
			if (viewButton) {
				event.stopPropagation();
				this.dispatch("item-view", {
					itemId: viewButton.getAttribute("data-view-id") || "",
				});
				return;
			}
			const card = target?.closest("[data-item-id]");
			if (!card) {
				return;
			}
			this.dispatch("item-select", {
				itemId: card.getAttribute("data-item-id") || "",
			});
		});

		grid.addEventListener("keydown", (event) => {
			if (event.key !== "Enter" && event.key !== " ") {
				return;
			}
			const target = event.target instanceof Element ? event.target : null;
			const card = target?.closest("[data-item-id]");
			if (!card) {
				return;
			}
			event.preventDefault();
			this.dispatch("item-select", {
				itemId: card.getAttribute("data-item-id") || "",
			});
		});
	}

	renderItemsInChunks(items = []) {
		const host = this.shadowRoot.querySelector(".asset-grid");
		if (!host) {
			return;
		}

		this.cancelChunkedRender();
		const token = this._renderToken;
		let index = 0;

		const renderChunk = () => {
			if (token !== this._renderToken) {
				return;
			}
			const nextItems = items.slice(index, index + RENDER_CHUNK_SIZE);
			host.insertAdjacentHTML(
				"beforeend",
				nextItems.map((item) => this.cardMarkup(item)).join(""),
			);
			index += RENDER_CHUNK_SIZE;
			if (index < items.length) {
				this._renderFrame = window.requestAnimationFrame(renderChunk);
			}
		};

		renderChunk();
	}

	render() {
		const items = Array.isArray(this.model.items) ? this.model.items : [];
		this.cancelChunkedRender();
		if (this.model.isLoading) {
			this.shadowRoot.innerHTML = `
				<style>${browserRendererStyles}</style>
				<open-collections-loading-skeleton variant="card-grid" count="8"></open-collections-loading-skeleton>
			`;
			return;
		}
		if (items.length === 0) {
			this.shadowRoot.innerHTML = `
				<style>${browserRendererStyles}</style>
				<open-collections-empty-state
					title="No items loaded"
					message="Load a manifest to browse collection items."
				></open-collections-empty-state>
			`;
			return;
		}

		this.shadowRoot.innerHTML = `<style>${browserRendererStyles}</style><div class="asset-grid"></div>`;
		this.bindDelegatedEvents();
		this.renderItemsInChunks(items);
	}
}

if (!customElements.get("open-browser-item-card-grid")) {
	customElements.define(
		"open-browser-item-card-grid",
		OpenBrowserItemCardGridElement,
	);
}

export { OpenBrowserItemCardGridElement };
