import { browserStyles } from "../css/browser.css.js";
import { backButtonStyles, renderBackButton } from "../../../../shared/components/back-button.js";
import "../../../../shared/ui/primitives/index.js";

const VALID_MODES = ["all", "sources", "collections", "items"];

class OpenBrowserCollectionBrowserElement extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.model = {
			viewportTitle: "Browser",
			viewportSubtitle: "Browse available entities.",
			viewMode: "items",
			allBrowseEntities: [],
			sourceCards: [],
			collectionCards: [],
			itemCards: [],
		};
	}

	connectedCallback() {
		this.render();
	}

	disconnectedCallback() {
		if (this._grid && this._boundGridClickHandler) {
			this._grid.removeEventListener("click", this._boundGridClickHandler);
		}
		this._grid = null;
		this._boundGridClickHandler = null;
	}

	update(data = {}) {
		this.model = { ...this.model, ...data };
		this.render();
	}

	safeArray(value) {
		return Array.isArray(value) ? value.filter(Boolean) : [];
	}

	normalizedMode() {
		return VALID_MODES.includes(this.model.viewMode)
			? this.model.viewMode
			: "items";
	}

	renderCards() {
		const mode = this.normalizedMode();
		const sourceCards = this.safeArray(this.model.sourceCards);
		const collectionCards = this.safeArray(this.model.collectionCards);
		const itemCards = this.safeArray(this.model.itemCards);
		const allBrowseEntities = this.safeArray(this.model.allBrowseEntities);

		if (mode === "all") {
			if (allBrowseEntities.length > 0) {
				return allBrowseEntities;
			}
			return [...sourceCards, ...collectionCards, ...itemCards];
		}
		if (mode === "sources") {
			return sourceCards;
		}
		if (mode === "collections") {
			return collectionCards;
		}
		return itemCards.length > 0 ? itemCards : allBrowseEntities;
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
		} else if (kind === "collection") {
			wrapper.setAttribute("data-span-cols", "2");
			wrapper.setAttribute("data-span-rows", "1");
		} else {
			wrapper.setAttribute("data-span-cols", "1");
			wrapper.setAttribute("data-span-rows", "1");
		}
		wrapper.appendChild(this.buildCard(entity));
		return wrapper;
	}

	dispatch(name, detail = {}) {
		this.dispatchEvent(
			new CustomEvent(name, { detail, bubbles: true, composed: true }),
		);
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

	modeButtonLabel(mode) {
		if (mode === "all") {
			return "All";
		}
		if (mode === "sources") {
			return "Sources";
		}
		if (mode === "collections") {
			return "Collections";
		}
		return "Items";
	}

	renderToggleBar() {
		const mode = this.normalizedMode();
		return `
			<div class="toggle-bar" role="toolbar" aria-label="Browse mode">
				${VALID_MODES.map(
					(entry) => `
						<button
							type="button"
							class="mode-toggle"
							data-mode="${entry}"
							data-active="${entry === mode ? "true" : "false"}"
						>
							${this.modeButtonLabel(entry)}
						</button>
					`,
				).join("")}
			</div>
		`;
	}

	bindToggleEvents() {
		const buttons = this.shadowRoot.querySelectorAll(".mode-toggle[data-mode]");
		for (const button of buttons) {
			button.addEventListener("click", () => {
				const mode = String(button.dataset.mode || "").trim();
				if (!VALID_MODES.includes(mode) || mode === this.normalizedMode()) {
					return;
				}
				this.model.viewMode = mode;
				this.render();
			});
		}
	}

	render() {
		this.shadowRoot.innerHTML = `
      <style>${backButtonStyles}</style>
      <style>${browserStyles}</style>
      <div class="root">
        <header class="header" aria-label="Browser header">
          ${this.model.showBack ? renderBackButton({ id: "panelBackBtn" }) : ""}
          <h2 class="title">${this.model.viewportTitle || "Browser"}</h2>
          <p class="subtitle">${this.model.viewportSubtitle || "Browse available entities."}</p>
        </header>
        ${this.renderToggleBar()}
        <div class="scroll-container-wrapper">
          <div id="scrollContainer" class="scroll-container">
            <div class="grid-host">
              <oc-grid id="browseGrid"></oc-grid>
            </div>
          </div>
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
			grid.appendChild(this.buildGridCell(entity));
		}

		const backBtn = this.shadowRoot.getElementById("panelBackBtn");
		backBtn?.addEventListener("click", () => {
			this.dispatch("panel-back");
		});

		this.bindToggleEvents();
		this.bindGridInteractions();
	}
}

if (!customElements.get("open-browser-collection-browser")) {
	customElements.define(
		"open-browser-collection-browser",
		OpenBrowserCollectionBrowserElement,
	);
}

export { OpenBrowserCollectionBrowserElement };
