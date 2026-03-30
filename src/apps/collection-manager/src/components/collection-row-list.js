import { browserRendererStyles } from "../css/browser-renderers.css.js";
import "../../../../shared/ui/primitives/index.js";

const RENDER_CHUNK_SIZE = 45;

class OpenCollectionRowListElement extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.model = {
			collections: [],
			selectedCollectionId: null,
			selectedCollectionIds: [],
			availableConnections: [],
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

	rowMarkup(collection, selectedIds) {
		const isUnassigned = collection.assignmentState === "unassigned";
		const assignmentActionLabel = isUnassigned
			? "Assign connection"
			: "Reassign connection";
		return `
      <tr class="${this.model.selectedCollectionId === collection.id ? "is-focused" : ""} ${selectedIds.has(collection.id) ? "is-selected" : ""}" data-id="${collection.id}">
        <td>
          <input type="checkbox" aria-label="Select ${collection.title || collection.id}" data-select-id="${collection.id}" ${selectedIds.has(collection.id) ? "checked" : ""} />
        </td>
        <td>${collection.title || collection.id}</td>
        <td>${collection.id}</td>
        <td><span class="badge badge-assignment ${collection.assignmentState === "unassigned" ? "is-unassigned" : "is-assigned"}">${collection.assignmentLabel || "Unassigned draft"}</span></td>
        <td>
          <button type="button" class="btn" data-open-id="${collection.id}">Open</button>
          <button type="button" class="btn ${isUnassigned ? "btn-primary" : ""}" data-assign-id="${collection.id}" ${this.model.availableConnections.length === 0 ? "disabled" : ""}>${assignmentActionLabel}</button>
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
				this.dispatch("collection-open", {
					collectionId: openButton.getAttribute("data-open-id"),
				});
				return;
			}
			const assignButton = target?.closest("button[data-assign-id]");
			if (assignButton) {
				event.stopPropagation();
				this.dispatch("collection-assign-connection", {
					collectionId: assignButton.getAttribute("data-assign-id"),
				});
				return;
			}
			const checkbox = target?.closest("input[data-select-id]");
			if (checkbox) {
				event.stopPropagation();
				return;
			}
			const row = target?.closest("tr[data-id]");
			if (!row) {
				return;
			}
			this.dispatch("collection-select", {
				collectionId: row.getAttribute("data-id"),
			});
		});

		body.addEventListener("change", (event) => {
			const target = event.target instanceof Element ? event.target : null;
			const input = target?.closest("input[data-select-id]");
			if (!input) {
				return;
			}
			event.stopPropagation();
			this.dispatch("collection-toggle-selected", {
				collectionId: input.getAttribute("data-select-id"),
				selected: input.checked === true,
			});
		});
	}

	renderRowsInChunks(collections = [], selectedIds) {
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
			const next = collections.slice(index, index + RENDER_CHUNK_SIZE);
			body.insertAdjacentHTML(
				"beforeend",
				next.map((collection) => this.rowMarkup(collection, selectedIds)).join(""),
			);
			index += RENDER_CHUNK_SIZE;
			if (index < collections.length) {
				this._renderFrame = window.requestAnimationFrame(renderChunk);
			}
		};
		renderChunk();
	}

	render() {
		const collections = Array.isArray(this.model.collections)
			? this.model.collections
			: [];
		const selectedIds = new Set(
			Array.isArray(this.model.selectedCollectionIds)
				? this.model.selectedCollectionIds
				: [],
		);
		this.cancelChunkedRender();
		if (this.model.isLoading) {
			this.shadowRoot.innerHTML = `<style>${browserRendererStyles}</style><open-collections-loading-skeleton variant="row-list" count="8"></open-collections-loading-skeleton>`;
			return;
		}
		if (collections.length === 0) {
			this.shadowRoot.innerHTML = `<style>${browserRendererStyles}</style><div class="empty">No collections yet. Add a collection to begin.</div>`;
			return;
		}

		this.shadowRoot.innerHTML = `
      <style>${browserRendererStyles}</style>
      <div class="row-table-wrap">
        <table class="row-table" aria-label="Collections list">
          <thead><tr><th>Select</th><th>Title</th><th>ID</th><th>Connection</th><th>Actions</th></tr></thead>
          <tbody></tbody>
        </table>
      </div>
    `;

		this.bindDelegatedEvents();
		this.renderRowsInChunks(collections, selectedIds);
	}
}

if (!customElements.get("open-collection-row-list")) {
	customElements.define(
		"open-collection-row-list",
		OpenCollectionRowListElement,
	);
}

export { OpenCollectionRowListElement };
