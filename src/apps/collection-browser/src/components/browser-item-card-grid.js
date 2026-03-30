import { browserRendererStyles } from "../css/browser-renderers.css.js";
import "../../../../shared/ui/primitives/index.js";

const RENDER_CHUNK_SIZE = 36;

class OpenBrowserItemCardGridElement extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.model = {
			items: [],
			itemCards: [],
			selectedItemId: null,
			isLoading: false,
		};
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

	previewMarkup(itemCard) {
		const mediaUrl =
			itemCard.previewUrl ||
			itemCard.item?.media?.thumbnailUrl ||
			itemCard.item?.media?.url ||
			"";
		const mediaType = String(
			itemCard.mediaType || itemCard.item?.media?.type || "",
		).toLowerCase();

		if (!mediaUrl) {
			return '<div class="thumb-placeholder">No preview</div>';
		}

		if (mediaType.includes("video")) {
			return `<video class="thumb" src="${mediaUrl}" muted playsinline preload="metadata"></video>`;
		}

		return `<img class="thumb" src="${mediaUrl}" alt="${itemCard.title || itemCard.id}" />`;
	}

	findElementInPath(event, selector) {
		const path = Array.isArray(event.composedPath?.())
			? event.composedPath()
			: [];
		for (const node of path) {
			if (node instanceof Element && node.matches(selector)) {
				return node;
			}
		}
		return null;
	}

	cardMarkup(itemCard) {
		return `
      <article
        class="asset-card ${(itemCard.active === true || this.model.selectedItemId === itemCard.id) ? "is-focused" : ""}"
        role="button"
        tabindex="0"
        data-item-id="${itemCard.id}"
        aria-label="Select ${itemCard.title || itemCard.id}"
      >
        <div class="thumb-frame">${this.previewMarkup(itemCard)}</div>
        <h3 class="card-title">${itemCard.title || itemCard.id}</h3>
        <p class="meta">${itemCard.subtitle || "License not set"}</p>
      </article>
    `;
	}

	bindDelegatedEvents() {
		const grid = this.shadowRoot.querySelector("#itemGrid");
		if (!grid || grid.dataset.bound === "true") {
			return;
		}

		grid.dataset.bound = "true";
		grid.addEventListener("click", (event) => {
			const card = this.findElementInPath(event, "[data-item-id]");
			if (!card) {
				return;
			}
			this.dispatch("item-open", {
				itemId: card.getAttribute("data-item-id") || "",
			});
		});

		grid.addEventListener("keydown", (event) => {
			if (event.key !== "Enter" && event.key !== " ") {
				return;
			}
			const card = this.findElementInPath(event, "[data-item-id]");
			if (!card) {
				return;
			}
			event.preventDefault();
			this.dispatch("item-open", {
				itemId: card.getAttribute("data-item-id") || "",
			});
		});
	}

	renderItemsInChunks(items = []) {
		const host = this.shadowRoot.querySelector("#itemGrid");
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
		const itemCards = Array.isArray(this.model.itemCards)
			? this.model.itemCards
			: [];
		const items = itemCards.length
			? itemCards
			: (Array.isArray(this.model.items) ? this.model.items : []).map(
					(item, index) => ({
						browseKind: "item",
						id: item?.id || `item-${index + 1}`,
						title: item?.title || item?.id || `item-${index + 1}`,
						subtitle: item?.license
							? `License: ${item.license}`
							: "License not set",
						previewUrl:
							item?.media?.thumbnailUrl || item?.media?.url || "",
						mediaType: item?.media?.type || "",
						active: this.model.selectedItemId === item?.id,
						item,
					}),
				);
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

		this.shadowRoot.innerHTML = `<style>${browserRendererStyles}</style><oc-grid id="itemGrid"></oc-grid>`;
		const grid = this.shadowRoot.getElementById("itemGrid");
		grid?.update({
			mode: "grid",
			columnsDesktop: 6,
			columnsTablet: 4,
			columnsMobile: 2,
			gap: "0.7rem",
		});
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
