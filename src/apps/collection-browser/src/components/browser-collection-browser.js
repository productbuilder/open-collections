import { browserStyles } from "../css/browser.css.js";
import { backButtonStyles, renderBackButton } from "../../../../shared/components/back-button.js";
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
	}

	connectedCallback() {
		this.render();
		this.bindPreviewFailureEvents();
	}

	disconnectedCallback() {
		if (this._grid && this._boundGridClickHandler) {
			this._grid.removeEventListener("click", this._boundGridClickHandler);
		}
		this.teardownAllModeAppendObserver();
		this._grid = null;
		this._boundGridClickHandler = null;
	}

	update(data = {}) {
		this.model = { ...this.model, ...data };
		if (!this.model.isAppendingAllFeedChunk) {
			this._allModeAppendRequestPending = false;
		}
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
				return allBrowseEntities.filter((entity) =>
					this.shouldRenderEntity(entity),
				);
			}
			return [...sourceCards, ...collectionCards, ...itemCards].filter(
				(entity) => this.shouldRenderEntity(entity),
			);
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
			entity?.previewUrl || entity?.item?.media?.thumbnailUrl || entity?.item?.media?.url || "",
		).trim();
		return `${actionValue}|${previewUrl}`;
	}

	shouldRenderEntity(entity = {}) {
		const kind = this.entityKind(entity);
		if (kind !== "item") {
			return true;
		}
		const previewUrl = String(
			entity?.previewUrl || entity?.item?.media?.thumbnailUrl || entity?.item?.media?.url || "",
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
			const cardCell = target.closest(".browse-cell.kind-item");
			cardCell?.remove();
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
		const rows = Array.isArray(previewRows) ? previewRows.slice(0, 3) : [];
		return rows.map((row) => {
			if (Array.isArray(row)) {
				return row.filter(Boolean);
			}
			if (row && typeof row === "object" && Array.isArray(row.images)) {
				return row.images.filter(Boolean);
			}
			return [];
		});
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
		const updateSubtitle = () => {
			const subtitleElement = card.shadowRoot?.querySelector(".subtitle");
			if (subtitleElement) {
				subtitleElement.textContent = subtitleText;
			}
		};
		updateSubtitle();
		queueMicrotask(updateSubtitle);
		requestAnimationFrame(updateSubtitle);
	}

	itemTileConfig(entity = {}) {
		const variant = String(entity.itemTileVariant || entity.tileVariant || "").trim();
		if (variant === "1x2" || variant === "tile-1x2") {
			return { className: "tile-1x2", cols: 1, rows: 2, colsMobile: 1, rowsMobile: 2 };
		}
		if (variant === "1x1" || variant === "tile-1x1") {
			return { className: "tile-1x1", cols: 1, rows: 1, colsMobile: 1, rowsMobile: 1 };
		}
		return { className: "tile-2x1", cols: 2, rows: 1, colsMobile: 2, rowsMobile: 1 };
	}

	buildCard(entity = {}) {
		const kind = this.entityKind(entity);
		if (kind === "source") {
			const card = document.createElement("grid5-card-source");
			const sourceTitle = String(
				entity.organizationName || entity.title || "",
			).trim();
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
			const manifestUrl = String(
				entity.actionValue || entity.manifestUrl || "",
			).trim();
			card.update({
				title: entity.title || "Collection",
				countLabel: entity.countLabel || "",
				previewImages: Array.isArray(entity.previewImages)
					? entity.previewImages
					: [],
				actionLabel: "Open collection",
				actionValue: manifestUrl,
				disabled: Boolean(entity.disabled),
			});
			this.applyCollectionSubtitle(
				card,
				this.resolveCollectionSubtitle(entity),
			);
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
		if (kind === "source") {
			wrapper.style.setProperty("--oc-span-cols", "2");
			wrapper.style.setProperty("--oc-span-rows", "2");
			wrapper.style.setProperty("--oc-span-cols-mobile", "2");
			wrapper.style.setProperty("--oc-span-rows-mobile", "2");
		} else if (kind === "collection") {
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
				if (!isVisible) {
					return;
				}
				if (
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
				rootMargin: "0px 0px 480px 0px",
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
				this.render();
			});
		}
	}

	render() {
		const previousMode = this._lastRenderMode || "";
		const previousSessionKey = this._lastAllFeedSessionKey || "";
		const currentMode = this.normalizedMode();
		const currentSessionKey = String(this.model.allFeedSessionKey || "").trim();
		const shouldPreserveScroll =
			currentMode === "all" &&
			previousMode === "all" &&
			currentSessionKey &&
			currentSessionKey === previousSessionKey;
		const priorScrollTop = shouldPreserveScroll
			? Number(this.shadowRoot?.getElementById("scrollContainer")?.scrollTop || 0)
			: 0;

		this.shadowRoot.innerHTML = `
      <style>${backButtonStyles}</style>
      <style>${browserStyles}</style>
      <div class="root">
        <div class="sticky-chrome">
          <header class="header" aria-label="Browser header">
            <div class="header-top">
              ${this.model.showBack ? renderBackButton({ id: "panelBackBtn" }) : ""}
              <div class="header-copy">
                <h2 class="title">${this.model.viewportTitle || "Browser"}</h2>
                <p class="subtitle">${this.model.viewportSubtitle || "Browse available entities."}</p>
              </div>
            </div>
          </header>
          ${this.renderToggleBar()}
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

		const grid = this.shadowRoot.getElementById("browseGrid");
		if (!grid) {
			return;
		}

		for (const entity of this.renderCards()) {
			// TODO(perf): Virtualize/window item cells so only in-viewport rows are mounted.
			grid.appendChild(this.buildGridCell(entity));
		}
		this.shadowRoot.getElementById("scrollContainer").scrollTop = priorScrollTop;

		const backBtn = this.shadowRoot.getElementById("panelBackBtn");
		backBtn?.addEventListener("click", () => {
			this.dispatch("panel-back");
		});

		this.bindToggleEvents();
		this.bindGridInteractions();
		this.bindAllModeAppendObserver();
		this._lastRenderMode = currentMode;
		this._lastAllFeedSessionKey = currentSessionKey;
	}
}

if (!customElements.get("open-browser-collection-browser")) {
	customElements.define(
		"open-browser-collection-browser",
		OpenBrowserCollectionBrowserElement,
	);
}

export { OpenBrowserCollectionBrowserElement };
