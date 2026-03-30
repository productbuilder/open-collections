import { browserRendererStyles } from "../css/browser-renderers.css.js";
import { resolveItemPreviewUrl } from "../utils/preview-utils.js";
import "../../../../shared/ui/primitives/index.js";

const RENDER_CHUNK_SIZE = 40;

class OpenItemRowListElement extends HTMLElement {
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

	previewMarkup(item) {
		const url = resolveItemPreviewUrl(item);
		if (!url) {
			return '<span class="row-thumb-placeholder">No</span>';
		}
		return `<img class="row-thumb" src="${url}" alt="${item.title || item.id}" />`;
	}

	hasMedia(item) {
		return Boolean(String(item?.media?.url || "").trim());
	}

	rowMarkup(item, selectedIds) {
		return `
      <tr
        class="${this.model.focusedItemId === item.workspaceId ? "is-focused" : ""} ${selectedIds.has(item.workspaceId) ? "is-selected" : ""}"
        data-id="${item.workspaceId}"
      >
        <td>
          <input
            type="checkbox"
            aria-label="Select ${item.title || item.id}"
            data-select-id="${item.workspaceId}"
            ${selectedIds.has(item.workspaceId) ? "checked" : ""}
          />
        </td>
        <td>${this.previewMarkup(item)}</td>
        <td>${this.hasMedia(item) ? item.title || "(Untitled)" : "New item"}</td>
        <td>${item.id || ""}</td>
        <td>${item.media?.type || ""}</td>
        <td>${this.requiredFieldScore(item)}</td>
        <td>
          ${
				this.hasMedia(item)
					? `<button type="button" class="btn" data-open-id="${item.workspaceId}">View</button>`
					: `<button type="button" class="btn" data-upload-id="${item.workspaceId}">Upload image</button>
                 <button type="button" class="btn" data-url-id="${item.workspaceId}">Use image URL</button>`
			}
        </td>
      </tr>
    `;
	}

	bindDelegatedEvents() {
		const body = this.shadowRoot.querySelector("tbody");
		if (!body || body.dataset.bound === "true") {
			return;
		}
		body.dataset.bound = "true";

		body.addEventListener("click", (event) => {
			const target = event.target instanceof Element ? event.target : null;
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
			const input = target?.closest("input[data-select-id]");
			if (input) {
				event.stopPropagation();
				return;
			}
			const row = target?.closest("tr[data-id]");
			if (!row) {
				return;
			}
			this.dispatch("item-select", {
				workspaceId: row.getAttribute("data-id"),
			});
		});

		body.addEventListener("change", (event) => {
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

	renderRowsInChunks(items = [], selectedIds) {
		const body = this.shadowRoot.querySelector("tbody");
		if (!body) {
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
			body.insertAdjacentHTML(
				"beforeend",
				next.map((item) => this.rowMarkup(item, selectedIds)).join(""),
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
			this.shadowRoot.innerHTML = `<style>${browserRendererStyles}</style><open-collections-loading-skeleton variant="row-list" count="9"></open-collections-loading-skeleton>`;
			return;
		}
		if (items.length === 0) {
			this.shadowRoot.innerHTML = `<style>${browserRendererStyles}</style><div class="empty">This collection has no items yet. Add item to begin.</div>`;
			return;
		}

		this.shadowRoot.innerHTML = `
      <style>${browserRendererStyles}</style>
      <div class="row-table-wrap">
        <table class="row-table" aria-label="Collection items list">
          <thead>
            <tr>
              <th>Select</th><th>Media</th><th>Title</th><th>ID</th><th>Type</th><th>Completeness</th><th>Actions</th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>
      </div>
    `;

		this.bindDelegatedEvents();
		this.renderRowsInChunks(items, selectedIds);
	}
}

if (!customElements.get("open-item-row-list")) {
	customElements.define("open-item-row-list", OpenItemRowListElement);
}

export { OpenItemRowListElement };
