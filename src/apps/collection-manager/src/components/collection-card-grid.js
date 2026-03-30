import { browserRendererStyles } from "../css/browser-renderers.css.js";
import "../../../../shared/ui/primitives/index.js";

const RENDER_CHUNK_SIZE = 30;

class OpenCollectionCardGridElement extends HTMLElement {
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

	cardMarkup(collection, selectedIds) {
		const isUnassigned = collection.assignmentState === "unassigned";
		const assignmentActionLabel = isUnassigned
			? "Assign connection"
			: "Reassign connection";
		return `
        <article class="asset-card ${this.model.selectedCollectionId === collection.id ? "is-focused" : ""} ${selectedIds.has(collection.id) ? "is-selected" : ""}" data-id="${collection.id}">
          <label class="selection-toggle" data-select-wrap="true" aria-label="Select ${collection.title || collection.id}">
            <input type="checkbox" data-select-id="${collection.id}" ${selectedIds.has(collection.id) ? "checked" : ""} />
            <span>Select</span>
          </label>
          <p class="card-title">${collection.title || collection.id}</p>
          <div class="badge-row">
            <span class="badge">${collection.id}</span>
            <span class="badge badge-assignment ${collection.assignmentState === "unassigned" ? "is-unassigned" : "is-assigned"}">${collection.assignmentLabel || "Unassigned draft"}</span>
          </div>
          <div class="card-actions"><button type="button" class="btn" data-open-id="${collection.id}">Open</button></div>
          <div class="card-actions"><button type="button" class="btn ${isUnassigned ? "btn-primary" : ""}" data-assign-id="${collection.id}" ${this.model.availableConnections.length === 0 ? "disabled" : ""}>${assignmentActionLabel}</button></div>
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
			const card = target?.closest(".asset-card[data-id]");
			if (!card) {
				return;
			}
			this.dispatch("collection-select", {
				collectionId: card.getAttribute("data-id"),
			});
		});

		grid.addEventListener("change", (event) => {
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

	renderCollectionsInChunks(collections = [], selectedIds) {
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
			const next = collections.slice(index, index + RENDER_CHUNK_SIZE);
			host.insertAdjacentHTML(
				"beforeend",
				next.map((collection) => this.cardMarkup(collection, selectedIds)).join(""),
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
			this.shadowRoot.innerHTML = `<style>${browserRendererStyles}</style><open-collections-loading-skeleton variant="card-grid" count="8"></open-collections-loading-skeleton>`;
			return;
		}
		if (collections.length === 0) {
			this.shadowRoot.innerHTML = `<style>${browserRendererStyles}</style><div class="asset-grid"><div class="empty">No collections yet. Add a collection to begin.</div></div>`;
			return;
		}

		this.shadowRoot.innerHTML = `<style>${browserRendererStyles}</style><div class="asset-grid"></div>`;
		this.bindDelegatedEvents();
		this.renderCollectionsInChunks(collections, selectedIds);
	}
}

if (!customElements.get("open-collection-card-grid")) {
	customElements.define(
		"open-collection-card-grid",
		OpenCollectionCardGridElement,
	);
}

export { OpenCollectionCardGridElement };
