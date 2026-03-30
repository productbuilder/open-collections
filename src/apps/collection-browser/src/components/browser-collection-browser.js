import { browserStyles } from "../css/browser.css.js";
import "../../../../shared/ui/primitives/index.js";

class OpenBrowserCollectionBrowserElement extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.model = {
			allBrowseEntities: [],
			sourceCards: [],
			collectionCards: [],
			itemCards: [],
		};
	}

	connectedCallback() {
		this.render();
	}

	update(data = {}) {
		this.model = { ...this.model, ...data };
		this.render();
	}

	renderCards() {
		const cards = [
			...this.safeArray(this.model.sourceCards),
			...this.safeArray(this.model.collectionCards),
			...this.safeArray(this.model.itemCards),
		];
		if (cards.length > 0) {
			return cards;
		}
		return this.safeArray(this.model.allBrowseEntities);
	}

	safeArray(value) {
		return Array.isArray(value) ? value.filter(Boolean) : [];
	}

	entityKind(entity = {}) {
		const browseKind = String(entity?.browseKind || "").trim();
		if (browseKind === "source" || browseKind === "collection") {
			return browseKind;
		}
		return "item";
	}

	buildCard(entity = {}) {
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
			});
			return card;
		}

		const card = document.createElement("oc-card-item");
		card.update({
			title: entity.title || entity.id || "Item",
			subtitle: entity.subtitle || "",
			previewImages: Array.isArray(entity.previewImages)
				? entity.previewImages
				: [],
			previewUrl: entity.previewUrl || entity.item?.media?.thumbnailUrl || "",
			actionLabel: entity.actionLabel || "",
		});
		return card;
	}

	render() {
		this.shadowRoot.innerHTML = `
      <style>${browserStyles}</style>
      <div class="root">
        <div class="header">Browser</div>
        <div id="scrollContainer" class="scroll-container">
          <oc-grid id="browseGrid"></oc-grid>
        </div>
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

		for (const entity of this.renderCards()) {
			grid.appendChild(this.buildCard(entity));
		}
	}
}

if (!customElements.get("open-browser-collection-browser")) {
	customElements.define(
		"open-browser-collection-browser",
		OpenBrowserCollectionBrowserElement,
	);
}

export { OpenBrowserCollectionBrowserElement };
