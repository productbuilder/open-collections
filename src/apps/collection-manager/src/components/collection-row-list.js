import { browserRendererStyles } from "../css/browser-renderers.css.js";

class OpenCollectionRowListElement extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.model = {
			collections: [],
			selectedCollectionId: null,
			selectedCollectionIds: [],
			availableConnections: [],
		};
	}

	update(data = {}) {
		this.model = { ...this.model, ...data };
		this.render();
	}

	connectedCallback() {
		this.render();
	}

	dispatch(name, detail = {}) {
		this.dispatchEvent(
			new CustomEvent(name, { detail, bubbles: true, composed: true }),
		);
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
		if (collections.length === 0) {
			this.shadowRoot.innerHTML = `<style>${browserRendererStyles}</style><div class="empty">No collections yet. Add a collection to begin.</div>`;
			return;
		}

		const rows = collections
			.map(
				(collection) => `
      <tr class="${this.model.selectedCollectionId === collection.id ? "is-focused" : ""} ${selectedIds.has(collection.id) ? "is-selected" : ""}" data-id="${collection.id}">
        <td>
          <input type="checkbox" aria-label="Select ${collection.title || collection.id}" data-select-id="${collection.id}" ${selectedIds.has(collection.id) ? "checked" : ""} />
        </td>
        <td>${collection.title || collection.id}</td>
        <td>${collection.id}</td>
        <td><span class="badge badge-assignment ${collection.assignmentState === "unassigned" ? "is-unassigned" : "is-assigned"}">${collection.assignmentLabel || "Unassigned draft"}</span></td>
        <td>
          <button type="button" class="btn" data-open-id="${collection.id}">Open</button>
          ${
					collection.assignmentState === "unassigned"
						? `<button type="button" class="btn btn-primary" data-assign-id="${collection.id}" ${this.model.availableConnections.length === 0 ? "disabled" : ""}>Assign</button>`
						: ""
				}
        </td>
      </tr>
    `,
			)
			.join("");

		this.shadowRoot.innerHTML = `
      <style>${browserRendererStyles}</style>
      <div class="row-table-wrap">
        <table class="row-table" aria-label="Collections list">
          <thead><tr><th>Select</th><th>Title</th><th>ID</th><th>Connection</th><th>Actions</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;

		this.shadowRoot.querySelectorAll("tbody tr[data-id]").forEach((row) => {
			row.addEventListener("click", () => {
				this.dispatch("collection-select", {
					collectionId: row.getAttribute("data-id"),
				});
			});
		});
		this.shadowRoot
			.querySelectorAll("input[data-select-id]")
			.forEach((input) => {
				input.addEventListener("click", (event) => {
					event.stopPropagation();
				});
				input.addEventListener("change", (event) => {
					event.stopPropagation();
					this.dispatch("collection-toggle-selected", {
						collectionId: input.getAttribute("data-select-id"),
						selected: event.target?.checked === true,
					});
				});
			});

		this.shadowRoot
			.querySelectorAll("button[data-open-id]")
			.forEach((button) => {
				button.addEventListener("click", (event) => {
					event.stopPropagation();
					this.dispatch("collection-open", {
						collectionId: button.getAttribute("data-open-id"),
					});
				});
			});
		this.shadowRoot
			.querySelectorAll("button[data-assign-id]")
			.forEach((button) => {
				button.addEventListener("click", (event) => {
					event.stopPropagation();
					this.dispatch("collection-assign-connection", {
						collectionId: button.getAttribute("data-assign-id"),
					});
				});
			});
	}
}

if (!customElements.get("open-collection-row-list")) {
	customElements.define(
		"open-collection-row-list",
		OpenCollectionRowListElement,
	);
}

export { OpenCollectionRowListElement };
