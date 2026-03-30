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
			card.update({
				title: entity.title || "Source",
				subtitle: entity.subtitle || "Source",
				countLabel: entity.countLabel || "",
				previewRows: Array.isArray(entity.previewRows) ? entity.previewRows : [],
				previewImages: Array.isArray(entity.previewImages)
					? entity.previewImages
					: [],
				actionLabel: entity.actionLabel || "Browse",
				actionValue: entity.actionValue || entity.id || "",
				active: entity.active === true,
			});
			card.addEventListener("oc-card-activate", (event) => {
				const sourceId = String(
					event.detail?.value || entity.actionValue || entity.id || "",
				).trim();
				if (sourceId) {
					this.dispatch("source-open", { sourceId });
				}
			});
			return card;
		}
		if (kind === "collection") {
			const card = document.createElement("oc-card-collection");
			card.update({
				title: entity.title || "Collection",
				subtitle: entity.subtitle || "Select to browse this collection.",
				countLabel: entity.countLabel || "",
				previewImages: Array.isArray(entity.previewImages)
					? entity.previewImages
					: [],
				placeholderLabel: "Collection",
				actionLabel: entity.actionLabel || "Open",
				actionValue: entity.actionValue || entity.manifestUrl || "",
				active: entity.active === true,
			});
			card.addEventListener("oc-card-activate", (event) => {
				const manifestUrl = String(
					event.detail?.value ||
						entity.actionValue ||
						entity.manifestUrl ||
						"",
				).trim();
				if (manifestUrl) {
					this.dispatch("collection-open", { manifestUrl });
				}
			});
			return card;
		}

		const card = document.createElement("oc-card-item");
		card.update({
			title: entity.title || entity.id || "Item",
			subtitle: entity.subtitle || "License not set",
			previewImages: Array.isArray(entity.previewImages)
				? entity.previewImages
				: [],
			previewUrl: entity.previewUrl || entity.item?.media?.thumbnailUrl || "",
			actionLabel: entity.actionLabel || "Open item",
			actionValue: entity.actionValue || entity.id || "",
			active: entity.active === true,
		});
		card.addEventListener("oc-card-activate", (event) => {
			const itemId = String(
				event.detail?.value || entity.actionValue || entity.id || "",
			).trim();
			if (itemId) {
				this.dispatch("item-open", { itemId });
			}
		});
		return card;
	}

	buildGridCell(entity = {}) {
		const kind = this.entityKind(entity);
		const wrapper = document.createElement("div");
		wrapper.className = `browse-cell kind-${kind}`;
		wrapper.dataset.browseKind = kind;
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
			<oc-grid id="browseGrid">
				${Array.from({ length: 8 })
					.map(() => '<oc-skeleton-card variant="item"></oc-skeleton-card>')
					.join("")}
			</oc-grid>
		`;
		this.shadowRoot.getElementById("browseGrid")?.update({
			mode: "grid",
			columnsDesktop: 6,
			columnsTablet: 4,
			columnsMobile: 2,
			gap: "0.62rem",
		});
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
			<style>
				:host {
					display: block;
					min-height: 0;
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
			</style>
			<oc-grid id="browseGrid"></oc-grid>
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
		for (const entity of entities) {
			grid.appendChild(this.buildGridCell(entity));
		}
	}
}

if (!customElements.get("open-browser-browse-grid")) {
	customElements.define("open-browser-browse-grid", OpenBrowserBrowseGridElement);
}

export { OpenBrowserBrowseGridElement };
