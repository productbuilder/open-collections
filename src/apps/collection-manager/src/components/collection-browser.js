import { browserStyles } from "../css/browser.css.js";
import "../../../../shared/ui/panels/index.js";
import "../../../../shared/ui/primitives/index.js";

const VALID_MANAGER_MODES = ["sources", "collections", "items"];

class OpenCollectionsBrowserElement extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.model = {
			viewportTitle: "Collections",
			managerMode: "collections",
			sourceCards: [],
			collections: [],
			items: [],
		};
	}

	connectedCallback() {
		this.render();
		this.bindEvents();
		this.renderFrame();
		this.renderBody();
	}

	disconnectedCallback() {
		const scroll = this.shadowRoot?.getElementById("browserScroll");
		if (scroll && this._boundGridClickHandler) {
			scroll.removeEventListener("click", this._boundGridClickHandler);
		}
	}

	dispatch(name, detail = {}) {
		this.dispatchEvent(
			new CustomEvent(name, { detail, bubbles: true, composed: true }),
		);
	}

	getManagerMode() {
		const mode = String(this.model.managerMode || "").trim();
		return VALID_MANAGER_MODES.includes(mode) ? mode : "collections";
	}

	setManagerMode(mode) {
		const normalizedMode = VALID_MANAGER_MODES.includes(mode)
			? mode
			: "collections";
		if (normalizedMode === this.getManagerMode()) {
			return;
		}
		this.model.managerMode = normalizedMode;
		this.dispatch("manager-mode-change", { mode: normalizedMode });
		this.renderFrame();
		this.renderBody();
	}

	update(data = {}) {
		this.model = {
			...this.model,
			...data,
		};
		if (!this.shadowRoot?.getElementById("panelShell")) {
			return;
		}
		this.renderFrame();
		this.renderBody();
	}

	setSourceOptions() {}

	setCollectionOptions() {}

	setDropTargetActive() {}

	setPublishActionState() {}

	setWorkingStatus() {}

	renderFrame() {
		const panelShell = this.shadowRoot?.getElementById("panelShell");
		const managerModeToggle = this.shadowRoot?.getElementById("managerModeToggle");
		if (!panelShell || !managerModeToggle) {
			return;
		}

		panelShell.setAttribute("title", this.model.viewportTitle || "Collections");
		panelShell.setAttribute("show-back", "false");
		panelShell.removeAttribute("subtitle");

		const managerMode = this.getManagerMode();
		managerModeToggle
			.querySelectorAll("button[data-manager-mode]")
			.forEach((button) => {
				const isActive = button.getAttribute("data-manager-mode") === managerMode;
				button.setAttribute("data-active", isActive ? "true" : "false");
				button.setAttribute("aria-pressed", isActive ? "true" : "false");
			});
	}

	renderSourceCard(entity = {}) {
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
			actionValue: entity.id || "",
			active: entity.active === true,
		});
		return card;
	}

	renderCollectionCard(entity = {}) {
		const card = document.createElement("oc-card-collection");
		const actionValue = String(entity.manifestUrl || entity.id || "").trim();
		card.update({
			title: entity.title || entity.name || "Collection",
			subtitle: entity.subtitle || "Open this collection.",
			countLabel: entity.countLabel || "",
			previewImages: Array.isArray(entity.previewImages)
				? entity.previewImages
				: [],
			actionLabel: entity.actionLabel || "Open",
			actionValue,
			active: entity.active === true,
		});
		return card;
	}

	renderItemCard(entity = {}) {
		const card = document.createElement("oc-card-item");
		const actionValue = String(entity.id || entity.itemId || "").trim();
		card.update({
			title: entity.title || entity.label || entity.id || "Item",
			subtitle: entity.subtitle || "",
			countLabel: entity.countLabel || "",
			previewImages: Array.isArray(entity.previewImages)
				? entity.previewImages
				: [],
			previewUrl: entity.previewUrl || entity.item?.media?.thumbnailUrl || "",
			actionLabel: entity.actionLabel || "",
			actionValue,
			active: entity.active === true,
		});
		return card;
	}

	createGridCell({ kind, actionValue, spanCols = 1, spanRows = 1, card }) {
		const wrapper = document.createElement("div");
		wrapper.className = `browse-cell kind-${kind}`;
		wrapper.dataset.actionType = kind;
		wrapper.dataset.actionValue = actionValue;
		wrapper.setAttribute("data-span-cols", String(spanCols));
		wrapper.setAttribute("data-span-rows", String(spanRows));
		wrapper.append(card);
		return wrapper;
	}

	renderBody() {
		const browserScroll = this.shadowRoot?.getElementById("browserScroll");
		if (!browserScroll) {
			return;
		}
		browserScroll.innerHTML = "";

		const mode = this.getManagerMode();
		browserScroll.innerHTML = '<div class="grid-host"><oc-grid id="managerGrid"></oc-grid></div>';
		const grid = browserScroll.querySelector("#managerGrid");
		grid?.update({
			mode: "grid",
			columnsDesktop: 6,
			columnsTablet: 4,
			columnsMobile: 2,
			gap: "0.62rem",
		});

		if (mode === "sources") {
			for (const source of Array.isArray(this.model.sourceCards)
				? this.model.sourceCards
				: []) {
				grid?.append(
					this.createGridCell({
						kind: "source",
						actionValue: source.id || "",
						spanCols: 2,
						spanRows: 2,
						card: this.renderSourceCard(source),
					}),
				);
			}
			return;
		}

		if (mode === "collections") {
			for (const collection of Array.isArray(this.model.collections)
				? this.model.collections
				: []) {
				const actionValue = String(
					collection.manifestUrl || collection.id || "",
				).trim();
				grid?.append(
					this.createGridCell({
						kind: "collection",
						actionValue,
						spanCols: 2,
						spanRows: 1,
						card: this.renderCollectionCard(collection),
					}),
				);
			}
			return;
		}

		for (const item of Array.isArray(this.model.items) ? this.model.items : []) {
			const actionValue = String(item.id || item.itemId || "").trim();
			grid?.append(
				this.createGridCell({
					kind: "item",
					actionValue,
					spanCols: 1,
					spanRows: 1,
					card: this.renderItemCard(item),
				}),
			);
		}
	}

	bindEvents() {
		this.shadowRoot
			.querySelectorAll("button[data-manager-mode]")
			.forEach((button) => {
				button.addEventListener("click", () => {
					this.setManagerMode(button.getAttribute("data-manager-mode"));
				});
			});

		const browserScroll = this.shadowRoot.getElementById("browserScroll");
		this._boundGridClickHandler = (event) => {
			const path =
				typeof event.composedPath === "function" ? event.composedPath() : [];
			const cell = path.find(
				(node) =>
					node instanceof HTMLElement &&
					node.classList?.contains("browse-cell"),
			);
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
		browserScroll?.addEventListener("click", this._boundGridClickHandler);
	}

	render() {
		this.shadowRoot.innerHTML = `
      <style>${browserStyles}</style>
      <section class="viewport-panel" aria-label="Collection browser">
        <open-collections-panel-chrome id="panelShell" title="Collections" show-back="false">
		  <div class="manager-mode-toggle" id="managerModeToggle" role="toolbar" aria-label="Manager mode" slot="subheader">
			<button type="button" class="mode-toggle" data-manager-mode="sources" data-active="false" aria-pressed="false">Sources</button>
			<button type="button" class="mode-toggle" data-manager-mode="collections" data-active="true" aria-pressed="true">Collections</button>
			<button type="button" class="mode-toggle" data-manager-mode="items" data-active="false" aria-pressed="false">Items</button>
		  </div>
          <div class="asset-wrap">
			<div id="browserScroll" class="scroll-container"></div>
          </div>
        </open-collections-panel-chrome>
      </section>
    `;
	}
}

if (!customElements.get("open-collections-browser")) {
	customElements.define(
		"open-collections-browser",
		OpenCollectionsBrowserElement,
	);
}

export { OpenCollectionsBrowserElement };
