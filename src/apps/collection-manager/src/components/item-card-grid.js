import { browserRendererStyles } from "../css/browser-renderers.css.js";
import { resolveItemPreviewUrl } from "../utils/preview-utils.js";
import "../../../../shared/ui/primitives/index.js";

const RENDER_CHUNK_SIZE = 30;

class OpenItemCardGridElement extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.model = {
			items: [],
			focusedItemId: null,
			selectedItemIds: [],
			isLoading: false,
		};
		this._renderFrame = 0;
		this._renderToken = 0;
	}

	update(data = {}) {
		this.model = { ...this.model, ...data };
		this.render();
	}

	connectedCallback() {
		this.render();
	}

	disconnectedCallback() {
		this.cancelChunkedRender();
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

	requiredFieldScore(item) {
		const checks = [
			Boolean(item.id),
			Boolean(item.title),
			Boolean(item.media && item.media.url),
			Boolean(item.license),
		];
		return `${checks.filter(Boolean).length}/${checks.length}`;
	}

	createPreviewMarkup(item) {
		const mediaType = (item.media?.type || "").toLowerCase();
		const url = resolveItemPreviewUrl(item);

		if (!url) {
			return '<div class="thumb-frame"><div class="thumb-placeholder">No preview</div></div>';
		}
		if (mediaType.includes("video")) {
			return `<div class="thumb-frame"><video class="thumb" src="${url}" muted playsinline preload="metadata"></video></div>`;
		}
		return `<div class="thumb-frame"><img class="thumb" src="${url}" alt="${item.title || item.id}" /></div>`;
	}

	hasMedia(item) {
		return Boolean(String(item?.media?.url || "").trim());
	}

	cardMarkup(item, selectedIds) {
		return `
      <article
        class="asset-card ${this.model.focusedItemId === item.workspaceId ? "is-focused" : ""} ${selectedIds.has(item.workspaceId) ? "is-selected" : ""}"
        role="button"
        tabindex="0"
        data-id="${item.workspaceId}"
      >
        <label class="selection-toggle" data-select-wrap="true" aria-label="Select ${item.title || item.id}">
          <input type="checkbox" data-select-id="${item.workspaceId}" ${selectedIds.has(item.workspaceId) ? "checked" : ""} />
          <span>Select</span>
        </label>
        ${this.createPreviewMarkup(item)}
        <p class="card-title">${this.hasMedia(item) ? item.title || "(Untitled)" : "New item"}</p>
        <div class="badge-row"><span class="badge">Completeness ${this.requiredFieldScore(item)}</span></div>
        <div class="card-actions">
          ${
				this.hasMedia(item)
					? `<button type="button" class="btn" data-open-id="${item.workspaceId}">View</button>`
					: `<button type="button" class="btn" data-upload-id="${item.workspaceId}">Upload image</button>
                 <button type="button" class="btn" data-url-id="${item.workspaceId}">Use image URL</button>`
			}
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
			const selectWrap = target?.closest("[data-select-wrap]");
			if (selectWrap) {
				event.stopPropagation();
				return;
			}
			const openButton = target?.closest("button[data-open-id]");
			if (openButton) {
				event.stopPropagation();
				this.dispatch("item-view", {
					workspaceId: openButton.getAttribute("data-open-id"),
				});
				return;
			}
			const uploadButton = target?.closest("button[data-upload-id]");
			if (uploadButton) {
				event.stopPropagation();
				this.dispatch("attach-media-upload", {
					itemId: uploadButton.getAttribute("data-upload-id"),
				});
				return;
			}
			const urlButton = target?.closest("button[data-url-id]");
			if (urlButton) {
				event.stopPropagation();
				this.dispatch("attach-media-url", {
					itemId: urlButton.getAttribute("data-url-id"),
				});
				return;
			}
			const card = target?.closest(".asset-card[data-id]");
			if (!card) {
				return;
			}
			this.dispatch("item-select", {
				workspaceId: card.getAttribute("data-id"),
			});
		});

		grid.addEventListener("change", (event) => {
			const target = event.target instanceof Element ? event.target : null;
			const input = target?.closest("input[data-select-id]");
			if (!input) {
				return;
			}
			event.stopPropagation();
			this.dispatch("item-toggle-selected", {
				workspaceId: input.getAttribute("data-select-id"),
				selected: input.checked === true,
			});
		});
	}

	renderItemsInChunks(items = [], selectedIds) {
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
			const next = items.slice(index, index + RENDER_CHUNK_SIZE);
			host.insertAdjacentHTML(
				"beforeend",
				next.map((item) => this.cardMarkup(item, selectedIds)).join(""),
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
		const selectedIds = new Set(
			Array.isArray(this.model.selectedItemIds)
				? this.model.selectedItemIds
				: [],
		);
		this.cancelChunkedRender();
		if (this.model.isLoading) {
			this.shadowRoot.innerHTML = `<style>${browserRendererStyles}</style><open-collections-loading-skeleton variant="card-grid" count="10"></open-collections-loading-skeleton>`;
			return;
		}
		if (items.length === 0) {
			this.shadowRoot.innerHTML = `<style>${browserRendererStyles}</style><div class="empty">This collection has no items yet. Add item to begin.</div>`;
			return;
		}

		this.shadowRoot.innerHTML = `<style>${browserRendererStyles}</style><div class="asset-grid"></div>`;
		this.bindDelegatedEvents();
		this.renderItemsInChunks(items, selectedIds);
	}
}

if (!customElements.get("open-item-card-grid")) {
	customElements.define("open-item-card-grid", OpenItemCardGridElement);
}

export { OpenItemCardGridElement };
