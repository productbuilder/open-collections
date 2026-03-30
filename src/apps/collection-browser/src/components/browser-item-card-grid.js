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
		this._boundGrid = null;
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

	bindDelegatedEvents() {
		const grid = this.shadowRoot.querySelector("#itemGrid");
		if (!grid || this._boundGrid === grid) {
			return;
		}
		this._boundGrid = grid;
		grid.addEventListener("oc-card-activate", (event) => {
			const itemId = String(event.detail?.value || "").trim();
			if (!itemId) {
				return;
			}
			this.dispatch("item-open", { itemId });
		});
	}

	createItemCard(itemCard) {
		const card = document.createElement("oc-card-item");
		card.update({
			title: itemCard.title || itemCard.id || "Item",
			subtitle: itemCard.subtitle || "License not set",
			previewImages: [],
			previewUrl:
				itemCard.previewUrl ||
				itemCard.item?.media?.thumbnailUrl ||
				itemCard.item?.media?.url ||
				"",
			actionLabel: "Open item",
			actionValue: itemCard.id || "",
			active:
				itemCard.active === true ||
				this.model.selectedItemId === itemCard.id,
		});
		return card;
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
			const fragment = document.createDocumentFragment();
			for (const item of nextItems) {
				fragment.appendChild(this.createItemCard(item));
			}
			host.appendChild(fragment);
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
