import "../../../../shared/ui/primitives/index.js";

class OpenCollectionCardSurfaceElement extends HTMLElement {
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

	renderCell(collection, selectedIds) {
		const isSelected = selectedIds.has(collection.id);
		const isFocused = this.model.selectedCollectionId === collection.id;
		const isUnassigned = collection.assignmentState === "unassigned";
		const canAssign = (this.model.availableConnections || []).length > 0;
		const wrapper = document.createElement("article");
		wrapper.className = "browse-cell kind-collection";
		wrapper.dataset.collectionId = collection.id || "";
		wrapper.setAttribute("data-span-cols", "2");
		wrapper.setAttribute("data-span-rows", "1");

		const card = document.createElement("oc-card-collection");
		card.update({
			title: collection.title || collection.id || "Collection",
			subtitle:
				collection.assignmentLabel || "Select to browse this collection.",
			countLabel: collection.countLabel || "",
			previewImages: Array.isArray(collection.previewImages)
				? collection.previewImages
				: [],
			actionLabel: "Open",
			actionValue: collection.id || "",
			active: isFocused || isSelected,
		});

		const controls = document.createElement("div");
		controls.className = "card-controls";
		controls.innerHTML = `
			<label class="selection-toggle">
				<input type="checkbox" data-select-id="${collection.id}" ${isSelected ? "checked" : ""} />
				<span>Select</span>
			</label>
			<button type="button" class="btn" data-open-id="${collection.id}">Open</button>
			<button type="button" class="btn ${isUnassigned ? "btn-primary" : ""}" data-assign-id="${collection.id}" ${canAssign ? "" : "disabled"}>
				${isUnassigned ? "Assign connection" : "Reassign connection"}
			</button>
		`;

		wrapper.append(card, controls);
		return wrapper;
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

		if (this.model.isLoading) {
			this.shadowRoot.innerHTML = `
				<open-collections-loading-skeleton variant="card-grid" count="8"></open-collections-loading-skeleton>
			`;
			return;
		}

		if (collections.length === 0) {
			this.shadowRoot.innerHTML = `
				<open-collections-empty-state title="No collections yet" message="Add a collection to begin."></open-collections-empty-state>
			`;
			return;
		}

		this.shadowRoot.innerHTML = `
			<style>
				:host { display: block; min-height: 0; }
				* { box-sizing: border-box; }
				oc-grid { display: block; min-height: 0; }
				.browse-cell { display: grid; gap: 0.45rem; min-width: 0; align-content: start; }
				.card-controls { display: flex; flex-wrap: wrap; gap: 0.4rem; align-items: center; }
				.selection-toggle {
					display: inline-flex;
					align-items: center;
					gap: 0.3rem;
					padding: 0.2rem 0.5rem;
					border-radius: 999px;
					border: 1px solid #d6d9dd;
					background: #fff;
					font-size: 0.72rem;
					font-weight: 600;
					color: #475569;
				}
				.selection-toggle input { margin: 0; }
			</style>
			<oc-grid id="collectionGrid"></oc-grid>
		`;

		const grid = this.shadowRoot.getElementById("collectionGrid");
		grid?.update({
			mode: "grid",
			columnsDesktop: 6,
			columnsTablet: 4,
			columnsMobile: 2,
			gap: "0.62rem",
		});

		for (const collection of collections) {
			grid?.append(this.renderCell(collection, selectedIds));
		}

		grid?.addEventListener("click", (event) => {
			const target = event.target instanceof Element ? event.target : null;
			if (!target) {
				return;
			}
			const assignBtn = target.closest("[data-assign-id]");
			if (assignBtn) {
				event.stopPropagation();
				this.dispatch("collection-assign-connection", {
					collectionId: assignBtn.getAttribute("data-assign-id"),
				});
				return;
			}
			const openBtn = target.closest("[data-open-id]");
			if (openBtn) {
				event.stopPropagation();
				this.dispatch("collection-open", {
					collectionId: openBtn.getAttribute("data-open-id"),
				});
				return;
			}
			const cell = target.closest(".browse-cell[data-collection-id]");
			if (!cell) {
				return;
			}
			this.dispatch("collection-select", {
				collectionId: cell.getAttribute("data-collection-id"),
			});
		});

		grid?.addEventListener("change", (event) => {
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
}

if (!customElements.get("open-collection-card-surface")) {
	customElements.define(
		"open-collection-card-surface",
		OpenCollectionCardSurfaceElement,
	);
}

export { OpenCollectionCardSurfaceElement };
