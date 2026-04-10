import { browserStyles } from "../css/browser.css.js";
import {
	backButtonStyles,
	renderBackButton,
} from "../../../../shared/components/back-button.js";
import {
	computeAllModePatchPlan,
	getEntityRenderKey,
	normalizeSourceCardPreviewRows,
} from "./browser-collection-browser-rendering.js";
import "../../../../shared/ui/primitives/grid5-card-source.js";
import "../../../../shared/ui/primitives/grid5-card-collection.js";
import "../../../../shared/ui/primitives/grid5-card-item.js";

const VALID_MODES = ["all", "sources", "collections", "items"];

class OpenBrowserCollectionBrowserElement extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.failedItemPreviewKeys = new Set();
		this.model = {
			viewportTitle: "Browser",
			viewportSubtitle: "Browse available entities.",
			viewMode: "items",
			allBrowseEntities: [],
			allFeedSessionKey: "",
			allFeedExhausted: false,
			isAppendingAllFeedChunk: false,
			sourceCards: [],
			collectionCards: [],
			itemCards: [],
		};
		this._renderedGridKeys = [];
		this._boundHostClick = null;
	}

	connectedCallback() {
		this.renderShell();
		this.bindPreviewFailureEvents();
		this.bindHostEvents();
		this.renderModel();
	}

	disconnectedCallback() {
		this.teardownAllModeAppendObserver();
		if (this._boundHostClick) {
			this.shadowRoot?.removeEventListener("click", this._boundHostClick);
		}
		this._boundHostClick = null;
	}

	update(data = {}) {
		this.model = { ...this.model, ...data };
		if (!this.model.isAppendingAllFeedChunk) {
			this._allModeAppendRequestPending = false;
		}
		this.renderModel();
	}

	renderShell() {
		this.shadowRoot.innerHTML = `
      <style>${backButtonStyles}</style>
      <style>${browserStyles}</style>
      <div class="root">
        <div class="sticky-chrome">
          <header class="header" aria-label="Browser header">
            <div class="header-top">
              <span id="backButtonSlot"></span>
              <div class="header-copy">
                <h2 id="viewportTitle" class="title">Browser</h2>
                <p id="viewportSubtitle" class="subtitle">Browse available entities.</p>
              </div>
            </div>
          </header>
          <div id="toggleBar" class="toggle-bar" role="toolbar" aria-label="Browse mode"></div>
        </div>
        <div class="scroll-container-wrapper">
          <div id="scrollContainer" class="scroll-container">
            <div class="grid-host">
              <div id="browseGrid" class="browse-grid"></div>
              <div id="allModeFeedSentinel" aria-hidden="true"></div>
            </div>
          </div>
        </div>
      </div>
    `;
		this._titleElement = this.shadowRoot.getElementById("viewportTitle");
		this._subtitleElement = this.shadowRoot.getElementById("viewportSubtitle");
		this._toggleBar = this.shadowRoot.getElementById("toggleBar");
		this._backButtonSlot = this.shadowRoot.getElementById("backButtonSlot");
		this._grid = this.shadowRoot.getElementById("browseGrid");
	}

	bindHostEvents() {
		if (this._boundHostClick) {
			return;
		}
		this._boundHostClick = (event) => {
			const target = event.target instanceof Element ? event.target : null;
			if (!target) {
				return;
			}
			const modeButton = target.closest(".mode-toggle[data-mode]");
			if (modeButton) {
				const mode = String(modeButton.getAttribute("data-mode") || "").trim();
				if (!VALID_MODES.includes(mode) || mode === this.normalizedMode()) {
					return;
				}
				const modeChangeEvent = new CustomEvent("view-mode-change", {
					bubbles: true,
					composed: true,
					cancelable: true,
					detail: { mode },
				});
				const shouldApplyLocally = this.dispatchEvent(modeChangeEvent);
				if (!shouldApplyLocally) {
					return;
				}
				this.model.viewMode = mode;
				this.renderModel();
				return;
			}

			if (target.closest("#panelBackBtn")) {
				this.dispatch("panel-back");
				return;
			}

			const cell = target.closest(".browse-cell");
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
		this.shadowRoot.addEventListener("click", this._boundHostClick);
	}

	safeArray(value) {
		return Array.isArray(value) ? value.filter(Boolean) : [];
	}

	normalizedMode() {
		return VALID_MODES.includes(this.model.viewMode) ? this.model.viewMode : "items";
	}

	renderCards() {
		const mode = this.normalizedMode();
		const sourceCards = this.safeArray(this.model.sourceCards);
		const collectionCards = this.safeArray(this.model.collectionCards);
		const itemCards = this.safeArray(this.model.itemCards);
		const allBrowseEntities = this.safeArray(this.model.allBrowseEntities);

		if (mode === "all") {
			const preferred =
				allBrowseEntities.length > 0
					? allBrowseEntities
					: [...sourceCards, ...collectionCards, ...itemCards];
			return preferred.filter((entity) => this.shouldRenderEntity(entity));
		}
		if (mode === "sources") {
			return sourceCards.filter((entity) => this.shouldRenderEntity(entity));
		}
		if (mode === "collections") {
			return collectionCards.filter((entity) => this.shouldRenderEntity(entity));
		}
		const preferred = itemCards.length > 0 ? itemCards : allBrowseEntities;
		return preferred.filter((entity) => this.shouldRenderEntity(entity));
	}

	entityKind(entity = {}) {
		const browseKind = String(entity?.browseKind || "").trim();
		if (browseKind === "source" || browseKind === "collection") {
			return browseKind;
		}
		return "item";
	}

	itemPreviewFailureKey(entity = {}) {
		const actionValue = String(entity?.actionValue || entity?.id || "").trim();
		const previewUrl = String(
			entity?.previewUrl ||
				entity?.item?.media?.thumbnailUrl ||
				entity?.item?.media?.url ||
				"",
		).trim();
		return `${actionValue}|${previewUrl}`;
	}

	shouldRenderEntity(entity = {}) {
		const kind = this.entityKind(entity);
		if (kind !== "item") {
			return true;
		}
		const previewUrl = String(
			entity?.previewUrl ||
				entity?.item?.media?.thumbnailUrl ||
				entity?.item?.media?.url ||
				"",
		).trim();
		if (!previewUrl) {
			return false;
		}
		return !this.failedItemPreviewKeys.has(this.itemPreviewFailureKey(entity));
	}

	bindPreviewFailureEvents() {
		if (this._boundPreviewFailureEvents) {
			return;
		}
		this._boundPreviewFailureEvents = true;
		this.addEventListener("oc-card-preview-error", (event) => {
			const detail = event.detail || {};
			if (String(detail.browseKind || "") !== "item") {
				return;
			}
			const actionValue = String(detail.actionValue || "").trim();
			const previewUrl = String(detail.previewUrl || "").trim();
			if (!actionValue || !previewUrl) {
				return;
			}
			this.failedItemPreviewKeys.add(`${actionValue}|${previewUrl}`);
			const target = event.target;
			if (!(target instanceof Element)) {
				return;
			}
			target.closest(".browse-cell.kind-item")?.remove();
		});
	}

	firstTextPart(value = "") {
		const text = String(value || "").trim();
		if (!text) {
			return "";
		}
		return (
			text
				.split(/\s*[\u00B7,|]\s*/)
				.map((part) => part.trim())
				.find(Boolean) || ""
		);
	}

	secondTextPart(value = "") {
		const text = String(value || "").trim();
		if (!text) {
			return "";
		}
		const parts = text
			.split(/\s*[\u00B7,|]\s*/)
			.map((part) => part.trim())
			.filter(Boolean);
		return parts.length > 1 ? parts[1] : "";
	}

	normalizeSourcePreviewRows(previewRows = []) {
		return normalizeSourceCardPreviewRows(previewRows);
	}

	resolveCollectionSubtitle(entity = {}) {
		return (
			String(entity.sourceDisplayName || "").trim() ||
			String(entity.sourceTitle || "").trim() ||
			String(entity.sourceLabel || "").trim() ||
			String(entity.sourceOrganizationName || "").trim() ||
			String(entity.sourceCuratorName || "").trim() ||
			"Collection"
		);
	}

	applyCollectionSubtitle(card, subtitle) {
		const subtitleText = String(subtitle || "").trim();
		if (!subtitleText) {
			return;
		}
		const subtitleElement = card.shadowRoot?.querySelector(".subtitle");
		if (subtitleElement && subtitleElement.textContent !== subtitleText) {
			subtitleElement.textContent = subtitleText;
		}
	}

	itemTileConfig(entity = {}) {
		const variant = String(entity.itemTileVariant || entity.tileVariant || "").trim();
		if (variant === "1x2" || variant === "tile-1x2") {
			return {
				className: "tile-1x2",
				cols: 1,
				rows: 2,
				colsMobile: 1,
				rowsMobile: 2,
			};
		}
		if (variant === "1x1" || variant === "tile-1x1") {
			return {
				className: "tile-1x1",
				cols: 1,
				rows: 1,
				colsMobile: 1,
				rowsMobile: 1,
			};
		}
		return {
			className: "tile-2x1",
			cols: 2,
			rows: 1,
			colsMobile: 2,
			rowsMobile: 1,
		};
	}

	buildCard(entity = {}) {
		const kind = this.entityKind(entity);
		if (kind === "source") {
			const card = document.createElement("grid5-card-source");
			const sourceTitle = String(entity.organizationName || entity.title || "").trim();
			const subtitleText = String(entity.subtitle || "").trim();
			const placeName = String(
				entity.placeName || this.firstTextPart(subtitleText) || "",
			).trim();
			const countryName = String(
				entity.countryName || this.secondTextPart(subtitleText) || "",
			).trim();
			const sourceId = String(entity.actionValue || entity.id || "").trim();
			card.update({
				organizationName: sourceTitle || "Source",
				curatorName: String(entity.curatorName || "").trim(),
				placeName,
				countryName,
				countryCode: String(entity.countryCode || "").trim(),
				descriptor: String(entity.descriptor || "Source").trim() || "Source",
				countLabel: entity.countLabel || "",
				actionLabel: "Open source",
				actionValue: sourceId,
				logoLabel: String(entity.logoLabel || sourceTitle || "").trim(),
				previewRows: this.normalizeSourcePreviewRows(entity.previewRows),
				disabled: Boolean(entity.disabled),
			});
			card.classList.add("tile-2x2");
			return card;
		}

		if (kind === "collection") {
			const card = document.createElement("grid5-card-collection");
			const manifestUrl = String(entity.actionValue || entity.manifestUrl || "").trim();
			card.update({
				title: entity.title || "Collection",
				countLabel: entity.countLabel || "",
				previewImages: Array.isArray(entity.previewImages) ? entity.previewImages : [],
				actionLabel: "Open collection",
				actionValue: manifestUrl,
				disabled: Boolean(entity.disabled),
			});
			this.applyCollectionSubtitle(card, this.resolveCollectionSubtitle(entity));
			card.classList.add("tile-2x2");
			return card;
		}

		const card = document.createElement("grid5-card-item");
		const actionValue = String(entity.actionValue || entity.id || "").trim();
		card.update({
			title: entity.title || entity.id || "Item",
			subtitle: entity.subtitle || "",
			previewUrl: entity.previewUrl || entity.item?.media?.thumbnailUrl || "",
			actionLabel: "View item",
			actionValue,
			disabled: Boolean(entity.disabled),
		});
		card.classList.add(this.itemTileConfig(entity).className);
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
		wrapper.dataset.entityKey = getEntityRenderKey(entity);
		if (kind === "source" || kind === "collection") {
			wrapper.style.setProperty("--oc-span-cols", "2");
			wrapper.style.setProperty("--oc-span-rows", "2");
			wrapper.style.setProperty("--oc-span-cols-mobile", "2");
			wrapper.style.setProperty("--oc-span-rows-mobile", "2");
		} else {
			const tile = this.itemTileConfig(entity);
			wrapper.style.setProperty("--oc-span-cols", String(tile.cols));
			wrapper.style.setProperty("--oc-span-rows", String(tile.rows));
			wrapper.style.setProperty("--oc-span-cols-mobile", String(tile.colsMobile));
			wrapper.style.setProperty("--oc-span-rows-mobile", String(tile.rowsMobile));
		}
		wrapper.appendChild(this.buildCard(entity));
		return wrapper;
	}

	dispatch(name, detail = {}) {
		this.dispatchEvent(
			new CustomEvent(name, { detail, bubbles: true, composed: true }),
		);
	}

	captureScrollPosition() {
		const root = this.shadowRoot?.querySelector(".root");
		return root ? Number(root.scrollTop || 0) : 0;
	}

	restoreScrollPosition(scrollTop = 0) {
		const root = this.shadowRoot?.querySelector(".root");
		if (!root) {
			return;
		}
		root.scrollTop = Math.max(0, Number(scrollTop) || 0);
	}

	teardownAllModeAppendObserver() {
		if (this._allModeAppendObserver) {
			this._allModeAppendObserver.disconnect();
		}
		this._allModeAppendObserver = null;
		this._allModeSentinel = null;
	}

	bindAllModeAppendObserver() {
		this.teardownAllModeAppendObserver();
		const mode = this.normalizedMode();
		if (mode !== "all" || this.model.allFeedExhausted) {
			return;
		}
		const root = this.shadowRoot?.getElementById("scrollContainer");
		const sentinel = this.shadowRoot?.getElementById("allModeFeedSentinel");
		if (!root || !sentinel || typeof IntersectionObserver !== "function") {
			return;
		}

		this._allModeSentinel = sentinel;
		this._allModeAppendObserver = new IntersectionObserver(
			(entries) => {
				const isVisible = entries.some((entry) => entry.isIntersecting);
				if (
					!isVisible ||
					this._allModeAppendRequestPending ||
					this.model.isAppendingAllFeedChunk ||
					this.model.allFeedExhausted
				) {
					return;
				}
				this._allModeAppendRequestPending = true;
				this.dispatch("all-feed-append-request");
			},
			{
				root,
				rootMargin: "0px 0px 320px 0px",
				threshold: 0,
			},
		);
		this._allModeAppendObserver.observe(sentinel);
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

	updateHeader() {
		if (this._titleElement) {
			const nextTitle = this.model.viewportTitle || "Browser";
			if (this._titleElement.textContent !== nextTitle) {
				this._titleElement.textContent = nextTitle;
			}
		}
		if (this._subtitleElement) {
			const nextSubtitle = this.model.viewportSubtitle || "Browse available entities.";
			if (this._subtitleElement.textContent !== nextSubtitle) {
				this._subtitleElement.textContent = nextSubtitle;
			}
		}
		if (this._backButtonSlot) {
			if (this.model.showBack) {
				this._backButtonSlot.hidden = false;
				this._backButtonSlot.innerHTML = renderBackButton({ id: "panelBackBtn" });
			} else {
				this._backButtonSlot.hidden = true;
				this._backButtonSlot.innerHTML = "";
			}
		}
	}

	updateToggleBar() {
		if (!this._toggleBar) {
			return;
		}
		const currentMode = this.normalizedMode();
		const nextMarkup = VALID_MODES.map(
			(entry) => `
        <button
          type="button"
          class="mode-toggle"
          data-mode="${entry}"
          data-active="${entry === currentMode ? "true" : "false"}"
        >
          ${this.modeButtonLabel(entry)}
        </button>
      `,
		).join("");
		if (this._toggleBar.innerHTML !== nextMarkup) {
			this._toggleBar.innerHTML = nextMarkup;
		}
	}

	clearGrid() {
		if (this._grid) {
			this._grid.replaceChildren();
		}
		this._renderedGridKeys = [];
	}

	appendGridEntities(entities = []) {
		if (!this._grid || !Array.isArray(entities) || entities.length === 0) {
			return;
		}
		const fragment = document.createDocumentFragment();
		for (const entity of entities) {
			fragment.appendChild(this.buildGridCell(entity));
			this._renderedGridKeys.push(getEntityRenderKey(entity));
		}
		this._grid.appendChild(fragment);
	}

	renderGridEntities(entities = []) {
		const currentMode = this.normalizedMode();
		const nextSessionKey = String(this.model.allFeedSessionKey || "").trim();
		if (currentMode === "all") {
			const plan = computeAllModePatchPlan({
				previousSessionKey: this._lastAllFeedSessionKey || "",
				nextSessionKey,
				previousEntities: this._lastRenderedEntities || [],
				nextEntities: entities,
			});
			if (plan.mode === "append") {
				this.appendGridEntities(plan.appendEntities);
			} else if (plan.mode === "preserve") {
				// Keep existing DOM and observer state.
			} else {
				this.clearGrid();
				this.appendGridEntities(entities);
			}
			this._lastAllFeedSessionKey = nextSessionKey;
		} else {
			this._lastAllFeedSessionKey = "";
			this.clearGrid();
			this.appendGridEntities(entities);
		}
		this._lastRenderedEntities = [...entities];
	}

	renderModel() {
		this.updateHeader();
		this.updateToggleBar();
		const entities = this.renderCards().filter(
			(entity) => entity && typeof entity === "object",
		);
		this.renderGridEntities(entities);
		this.bindAllModeAppendObserver();
	}
}

if (!customElements.get("open-browser-collection-browser")) {
	customElements.define(
		"open-browser-collection-browser",
		OpenBrowserCollectionBrowserElement,
	);
}

export { OpenBrowserCollectionBrowserElement };
