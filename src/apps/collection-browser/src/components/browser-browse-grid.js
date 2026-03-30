import "../../../../shared/ui/primitives/index.js";
import { browserRendererStyles } from "../css/browser-renderers.css.js";

const MODE_EMPTY = {
	all: {
		title: "No browse entities",
		message: "No sources, collections, or items are available yet.",
	},
	sources: {
		title: "No sources available",
		message: "Configure source entries to start browsing.",
	},
	collections: {
		title: "No collections available",
		message: "Choose a different source to browse collections.",
	},
	items: {
		title: "No items loaded",
		message: "Load a manifest to browse collection items.",
	},
};

class OpenBrowserBrowseGridElement extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.model = {
			viewMode: "items",
			allBrowseEntities: [],
			sourceCards: [],
			collectionCards: [],
			itemCards: [],
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


	scrollContainerStyles() {
		return `
			:host {
				display: block;
				height: 100%;
				min-height: 0;
			}

			.browser-scroll-container {
				height: 100%;
				min-height: 0;
				overflow-y: auto;
				overflow-x: hidden;
				overscroll-behavior: contain;
				-webkit-overflow-scrolling: touch;
				touch-action: pan-y;
			}

			oc-grid {
				display: block;
				min-height: 0;
			}

			.browse-cell {
				display: block;
				min-width: 0;
			}

			.browse-cell > oc-card-collections,
			.browse-cell > oc-card-collection,
			.browse-cell > oc-card-item {
				display: block;
			}
		`;
	}

	bindScrollDebug() {
		if (this._scrollContainer && this._boundScrollHandler) {
			this._scrollContainer.removeEventListener("scroll", this._boundScrollHandler);
		}
		this._scrollContainer = null;
		this._boundScrollHandler = null;
	}

	bindGridInteractions() {
		if (this._grid && this._boundGridClickHandler) {
			this._grid.removeEventListener("click", this._boundGridClickHandler);
		}
		const grid = this.shadowRoot?.getElementById("browseGrid");
		if (!grid) {
			this._grid = null;
			this._boundGridClickHandler = null;
			return;
		}

		this._grid = grid;
		this._boundGridClickHandler = (event) => {
			const cell = this.resolveGridCellFromEvent(event);
			if (!cell) {
				return;
			}
			const actionType = String(cell.dataset.actionType || "").trim();
			const actionValue = String(cell.dataset.actionValue || "").trim();
			if (!actionType || !actionValue) {
				return;
			}
			if (actionType === "source") {
				this.dispatch("source-open", { sourceId: actionValue });
				return;
			}
			if (actionType === "collection") {
				this.dispatch("collection-open", { manifestUrl: actionValue });
				return;
			}
			if (actionType === "item") {
				this.dispatch("item-open", { itemId: actionValue });
			}
		};

		grid.addEventListener("click", this._boundGridClickHandler);
	}

	resolveGridCellFromEvent(event) {
		const path = typeof event.composedPath === "function" ? event.composedPath() : [];
		for (const node of path) {
			if (!(node instanceof HTMLElement)) {
				continue;
			}
			if (node.classList?.contains("browse-cell")) {
				return node;
			}
		}
		return null;
	}

	disconnectedCallback() {
		if (this._scrollContainer && this._boundScrollHandler) {
			this._scrollContainer.removeEventListener("scroll", this._boundScrollHandler);
		}
		if (this._grid && this._boundGridClickHandler) {
			this._grid.removeEventListener("click", this._boundGridClickHandler);
		}
	}

	dispatch(name, detail = {}) {
		this.dispatchEvent(
			new CustomEvent(name, { detail, bubbles: true, composed: true }),
		);
	}

	normalizedMode() {
		return ["all", "sources", "collections", "items"].includes(
			this.model.viewMode,
		)
			? this.model.viewMode
			: "items";
	}

	entitiesForMode() {
		const mode = this.normalizedMode();
		const allBrowseEntities = Array.isArray(this.model.allBrowseEntities)
			? this.model.allBrowseEntities
			: [];
		const sourceCards = Array.isArray(this.model.sourceCards)
			? this.model.sourceCards
			: [];
		const collectionCards = Array.isArray(this.model.collectionCards)
			? this.model.collectionCards
			: [];
		const itemCards = Array.isArray(this.model.itemCards)
			? this.model.itemCards
			: [];
		if (mode === "all") {
			return allBrowseEntities.length
				? allBrowseEntities
				: [...sourceCards, ...collectionCards, ...itemCards];
		}
		if (mode === "sources") {
			return sourceCards;
		}
		if (mode === "collections") {
			return collectionCards;
		}
		return itemCards;
	}

	entityKind(entity = {}) {
		const browseKind = String(entity?.browseKind || "").trim();
		if (browseKind === "source" || browseKind === "collection") {
			return browseKind;
		}
		return "item";
	}

	createCard(entity = {}) {
		const kind = this.entityKind(entity);
		if (kind === "source") {
			const card = document.createElement("oc-card-collections");
			const sourceId = String(entity.actionValue || entity.id || "").trim();
			card.update({
				title: entity.title || "Source",
				subtitle: entity.subtitle || "Source",
				countLabel: entity.countLabel || "",
				previewRows: Array.isArray(entity.previewRows) ? entity.previewRows : [],
				previewImages: Array.isArray(entity.previewImages)
					? entity.previewImages
					: [],
				actionLabel: entity.actionLabel || "Browse",
				actionValue: sourceId,
				active: entity.active === true,
			});
			return card;
		}
		if (kind === "collection") {
			const card = document.createElement("oc-card-collection");
			const manifestUrl = String(entity.actionValue || entity.manifestUrl || "").trim();
			card.update({
				title: entity.title || "Collection",
				subtitle: entity.subtitle || "Select to browse this collection.",
				countLabel: entity.countLabel || "",
				previewImages: Array.isArray(entity.previewImages)
					? entity.previewImages
					: [],
				placeholderLabel: "Collection",
				actionLabel: entity.actionLabel || "Open",
				actionValue: manifestUrl,
				active: entity.active === true,
			});
			return card;
		}

		const card = document.createElement("oc-card-item");
		const itemId = String(entity.actionValue || entity.id || "").trim();
		card.update({
			title: entity.title || entity.id || "Item",
			subtitle: entity.subtitle || "",
			previewImages: Array.isArray(entity.previewImages)
				? entity.previewImages
				: [],
			previewUrl: entity.previewUrl || entity.item?.media?.thumbnailUrl || "",
			actionLabel: entity.actionLabel || "",
			actionValue: itemId,
			active: entity.active === true,
		});
		return card;
	}

	buildGridCell(entity = {}) {
		const kind = this.entityKind(entity);
		const actionValue = String(
			entity.actionValue || (kind === "collection" ? entity.manifestUrl : entity.id) || "",
		).trim();
		const wrapper = document.createElement("div");
		wrapper.className = `browse-cell kind-${kind}`;
		wrapper.dataset.browseKind = kind;
		wrapper.dataset.actionType = kind;
		wrapper.dataset.actionValue = actionValue;
		if (kind === "source") {
			wrapper.setAttribute("data-span-cols", "2");
			wrapper.setAttribute("data-span-rows", "2");
			wrapper.setAttribute("data-span-cols-mobile", "2");
			wrapper.setAttribute("data-span-rows-mobile", "2");
		} else if (kind === "collection") {
			wrapper.setAttribute("data-span-cols", "2");
			wrapper.setAttribute("data-span-rows", "1");
			wrapper.setAttribute("data-span-cols-mobile", "2");
			wrapper.setAttribute("data-span-rows-mobile", "1");
		} else {
			wrapper.setAttribute("data-span-cols", "1");
			wrapper.setAttribute("data-span-rows", "1");
			wrapper.setAttribute("data-span-cols-mobile", "1");
			wrapper.setAttribute("data-span-rows-mobile", "1");
		}
		wrapper.appendChild(this.createCard(entity));
		return wrapper;
	}

	renderLoading() {
		this.shadowRoot.innerHTML = `
			<style>${browserRendererStyles}</style>
			<style>${this.scrollContainerStyles()}</style>
			<div id="browserScrollContainer" class="browser-scroll-container">
				<oc-grid id="browseGrid">
					${Array.from({ length: 8 })
						.map(() => '<oc-skeleton-card variant="item"></oc-skeleton-card>')
						.join("")}
				</oc-grid>
			</div>
		`;
		const grid = this.shadowRoot.getElementById("browseGrid");
		grid?.update({
			mode: "grid",
			columnsDesktop: 6,
			columnsTablet: 4,
			columnsMobile: 2,
			gap: "0.62rem",
		});
		this.bindScrollDebug();
		this.bindGridInteractions();
	}

	renderEmpty(mode) {
		const empty = MODE_EMPTY[mode] || MODE_EMPTY.items;
		this.shadowRoot.innerHTML = `
			<style>${browserRendererStyles}</style>
			<open-collections-empty-state
				title="${empty.title}"
				message="${empty.message}"
			></open-collections-empty-state>
		`;
		this.bindScrollDebug();
	}

	render() {
		const mode = this.normalizedMode();
		const entities = this.entitiesForMode().filter(
			(entity) => entity && typeof entity === "object",
		);

		if (this.model.isLoading && mode === "items") {
			this.renderLoading();
			return;
		}
		if (entities.length === 0) {
			this.renderEmpty(mode);
			return;
		}

		this.shadowRoot.innerHTML = `
			<style>${browserRendererStyles}</style>
			<style>${this.scrollContainerStyles()}</style>
			<div id="browserScrollContainer" class="browser-scroll-container">
				<oc-grid id="browseGrid"></oc-grid>
			</div>
		`;
		const grid = this.shadowRoot.getElementById("browseGrid");
		if (!grid) {
			return;
		}
		grid.update({
			mode: "grid",
			columnsDesktop: 6,
			columnsTablet: 4,
			columnsMobile: 2,
			gap: "0.62rem",
		});
		this.bindScrollDebug();
		this.bindGridInteractions();
		for (const entity of entities) {
			grid.appendChild(this.buildGridCell(entity));
		}
	}
}

if (!customElements.get("open-browser-browse-grid")) {
	customElements.define("open-browser-browse-grid", OpenBrowserBrowseGridElement);
}

export { OpenBrowserBrowseGridElement };
