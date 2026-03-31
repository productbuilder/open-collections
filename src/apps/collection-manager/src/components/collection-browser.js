import { browserStyles } from "../css/browser.css.js?v=20260322-titlebar-center";
import "./view-toggle.js";
import "./collection-card-surface.js";
import "./collection-row-list.js";
import "./item-card-grid.js";
import "./item-row-list.js";
import "../../../../shared/ui/panels/index.js";
import "../../../../shared/ui/primitives/index.js";
import {
	getPlatformType,
	PLATFORM_TYPES,
} from "../../../../shared/platform/index.js";
import {
	renderDeselectIcon,
	renderTrashIcon,
} from "../../../../shared/components/icons.js";

class OpenCollectionsBrowserElement extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.model = {
			currentLevel: "collections",
			viewportTitle: "Collections",
			workingStatus: {
				label: "Draft",
				tone: "neutral",
			},
			assetCountText: "No assets loaded.",
			collections: [],
			items: [],
			sourceCards: [],
			selectedCollectionId: null,
			selectedCollectionIds: [],
			deletableSelectedCollectionCount: 0,
			focusedItemId: null,
			selectedItemIds: [],
			openedCollectionId: null,
			dropTargetActive: false,
			desktopFileDropEnabled: true,
			publishAction: {
				label: "Publish collection",
				visible: false,
				disabled: true,
				reason: "Select a collection to publish.",
			},
			viewModes: {
				collections: "cards",
				items: "cards",
			},
			managerMode: "collections",
			onboarding: {
				visible: false,
			},
			availableConnections: [],
			connectionActionLabel: "Add connection",
			activeSourceLabel: "Select connection",
			workspaceContextText: "",
			statusText: "No connections yet.",
			statusTone: "neutral",
			isLoading: false,
		};
	}

	connectedCallback() {
		this.model.desktopFileDropEnabled = this.detectDesktopFileDropSupport();
		this.mediaQueryList =
			typeof window !== "undefined" &&
			typeof window.matchMedia === "function"
				? window.matchMedia("(max-width: 760px)")
				: null;
		this.handleViewportChange = () => this.renderFrame();
		this.render();
		this.bindEvents();
		this.mediaQueryList?.addEventListener?.(
			"change",
			this.handleViewportChange,
		);
		this.renderFrame();
		this.renderBody();
		this.setDropTargetActive(this.model.dropTargetActive);
	}

	getManagerMode() {
		if (this.model.currentLevel === "items") {
			return "items";
		}
		const mode = String(this.model.managerMode || "").trim();
		return ["sources", "collections", "items"].includes(mode)
			? mode
			: "collections";
	}

	detectDesktopFileDropSupport() {
		return getPlatformType() !== PLATFORM_TYPES.CAPACITOR;
	}

	disconnectedCallback() {
		this.mediaQueryList?.removeEventListener?.(
			"change",
			this.handleViewportChange,
		);
	}

	bindEvents() {
		this.shadowRoot
			.getElementById("panelShell")
			?.addEventListener("panel-back", () => {
				this.dispatch("back-to-collections");
			});

		this.shadowRoot
			.getElementById("addImagesBtn")
			?.addEventListener("click", () => {
				if (this.model.currentLevel === "collections") {
					this.dispatch("add-collection");
					return;
				}
				this.dispatch("add-item");
			});
		this.shadowRoot.addEventListener("click", (event) => {
			const target =
				event.target instanceof Element
					? event.target.closest("button")
					: null;
			if (!target) {
				return;
			}
			if (target.id === "addExampleCollectionBtn") {
				this.dispatch("add-example-collection");
			} else if (target.id === "addConnectionBtn") {
				this.dispatch("add-connection");
			} else if (target.id === "createCollectionEmptyBtn") {
				this.dispatch("add-collection");
			}
		});
		this.shadowRoot
			.getElementById("publishCollectionBtn")
			?.addEventListener("click", () => {
				this.dispatch("publish-collection");
			});

		this.shadowRoot
			.getElementById("viewToggle")
			?.addEventListener("view-mode-change", (event) => {
				this.setCurrentViewMode(event.detail?.mode || "cards");
			});
		this.shadowRoot
			.getElementById("deleteSelectedBtn")
			?.addEventListener("click", () => {
				if (this.model.currentLevel === "collections") {
					this.dispatch("delete-selected-collections");
					return;
				}
				this.dispatch("delete-selected-items");
			});
		this.shadowRoot
			.getElementById("clearSelectionBtn")
			?.addEventListener("click", () => {
				if (this.model.currentLevel === "collections") {
					this.dispatch("clear-collection-selection");
					return;
				}
				this.dispatch("clear-item-selection");
			});

		this.shadowRoot
			.getElementById("imageFileInput")
			?.addEventListener("change", (event) => {
				const files = Array.from(event.target?.files || []);
				if (files.length > 0) {
					this.dispatch("files-selected", { files });
				}
				event.target.value = "";
			});

		const assetWrap = this.shadowRoot.getElementById("assetWrap");
		if (!this.model.desktopFileDropEnabled) {
			return;
		}
		assetWrap?.addEventListener("dragenter", (event) => {
			event.preventDefault();
			this.dispatch("drop-target-change", { active: true });
		});
		assetWrap?.addEventListener("dragover", (event) => {
			event.preventDefault();
			this.dispatch("drop-target-change", { active: true });
		});
		assetWrap?.addEventListener("dragleave", (event) => {
			event.preventDefault();
			if (
				!event.relatedTarget ||
				!assetWrap.contains(event.relatedTarget)
			) {
				this.dispatch("drop-target-change", { active: false });
			}
		});
		assetWrap?.addEventListener("drop", (event) => {
			event.preventDefault();
			this.dispatch("drop-target-change", { active: false });
			const files = Array.from(event.dataTransfer?.files || []);
			if (files.length > 0) {
				this.dispatch("files-selected", { files });
			}
		});
	}

	dispatch(name, detail = {}) {
		this.dispatchEvent(
			new CustomEvent(name, { detail, bubbles: true, composed: true }),
		);
	}

	setSourceOptions(options, selectedValue = "all") {
		void options;
		void selectedValue;
	}

	setCollectionOptions(options, selectedValue = "all") {
		void options;
		void selectedValue;
	}

	setDropTargetActive(active) {
		this.model.dropTargetActive =
			this.model.desktopFileDropEnabled && Boolean(active);
		const overlay = this.shadowRoot?.getElementById("assetDropOverlay");
		if (overlay) {
			overlay.classList.toggle("is-active", this.model.dropTargetActive);
		}
	}

	setPublishActionState(action = {}) {
		this.model.publishAction = {
			...this.model.publishAction,
			...action,
		};
		this.renderFrame();
	}

	setWorkingStatus(status = {}) {
		this.model.workingStatus = {
			...this.model.workingStatus,
			...status,
		};
		this.renderFrame();
	}

	getCurrentViewMode() {
		const level =
			this.model.currentLevel === "items" ? "items" : "collections";
		return this.model.viewModes?.[level] || "cards";
	}

	setCurrentViewMode(mode) {
		const normalizedMode = mode === "rows" ? "rows" : "cards";
		const level =
			this.model.currentLevel === "items" ? "items" : "collections";
		this.model.viewModes = {
			...this.model.viewModes,
			[level]: normalizedMode,
		};
		this.dispatch("view-mode-change", { level, mode: normalizedMode });
		this.renderBody();
		this.renderFrame();
	}

	setManagerMode(mode) {
		const normalizedMode = ["sources", "collections", "items"].includes(mode)
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
		const viewModes = data.viewModes
			? { ...this.model.viewModes, ...data.viewModes }
			: this.model.viewModes;
		this.model = {
			...this.model,
			...data,
			viewModes,
		};
		if (!this.shadowRoot?.getElementById("panelShell")) {
			return;
		}
		this.renderFrame();
		this.renderBody();
		this.setDropTargetActive(this.model.dropTargetActive);
	}

	renderFrame() {
		const panelShell = this.shadowRoot.getElementById("panelShell");
		const addBtn = this.shadowRoot.getElementById("addImagesBtn");
		const viewToggle = this.shadowRoot.getElementById("viewToggle");
		const selectionStatus =
			this.shadowRoot.getElementById("selectionStatus");
		const deleteSelectedBtn =
			this.shadowRoot.getElementById("deleteSelectedBtn");
		const clearSelectionBtn =
			this.shadowRoot.getElementById("clearSelectionBtn");
		const publishBtn = this.shadowRoot.getElementById(
			"publishCollectionBtn",
		);
		const managerModeToggle =
			this.shadowRoot.getElementById("managerModeToggle");
		if (
			!panelShell ||
			!addBtn ||
			!viewToggle ||
			!selectionStatus ||
			!deleteSelectedBtn ||
			!clearSelectionBtn ||
			!publishBtn ||
			!managerModeToggle
		) {
			return;
		}

		const isCollectionsView = this.model.currentLevel === "collections";

		panelShell.setAttribute(
			"title",
			this.model.viewportTitle || "Collections",
		);
		if (isCollectionsView) {
			panelShell.removeAttribute("subtitle");
			panelShell.setAttribute("show-back", "false");
		} else {
			const subtitle = this.model.assetCountText || "No assets loaded.";
			if (subtitle) {
				panelShell.setAttribute("subtitle", subtitle);
			} else {
				panelShell.removeAttribute("subtitle");
			}
			panelShell.setAttribute("show-back", "true");
		}
		if (isCollectionsView && this.model.workingStatus?.label) {
			panelShell.setAttribute(
				"status-label",
				this.model.workingStatus.label,
			);
			panelShell.setAttribute(
				"status-tone",
				this.model.workingStatus.tone || "neutral",
			);
		} else {
			panelShell.removeAttribute("status-label");
			panelShell.removeAttribute("status-tone");
		}
		addBtn.textContent =
			this.model.currentLevel === "collections"
				? "Add collection"
				: "Add item";
		viewToggle.setAttribute("mode", this.getCurrentViewMode());
		const managerMode = this.getManagerMode();
		managerModeToggle
			.querySelectorAll("button[data-manager-mode]")
			.forEach((button) => {
				const isActive =
					button.getAttribute("data-manager-mode") === managerMode;
				button.setAttribute("data-active", isActive ? "true" : "false");
				button.setAttribute("aria-pressed", isActive ? "true" : "false");
			});
		const publishAction = this.model.publishAction || {};
		publishBtn.textContent = publishAction.label || "Publish collection";
		publishBtn.hidden = publishAction.visible === false;
		publishBtn.disabled = publishAction.disabled !== false;
		const publishReason = publishAction.reason || "";
		if (publishReason) {
			publishBtn.title = publishReason;
			publishBtn.setAttribute(
				"aria-label",
				`${publishBtn.textContent}. ${publishReason}`,
			);
		} else {
			publishBtn.removeAttribute("title");
			publishBtn.setAttribute("aria-label", publishBtn.textContent);
		}
		const overlay = this.shadowRoot.getElementById("assetDropOverlay");
		if (overlay) {
			overlay.hidden = !this.model.desktopFileDropEnabled;
		}

		const isItemsView = this.model.currentLevel === "items";
		const selectedItemCount = Array.isArray(this.model.selectedItemIds)
			? this.model.selectedItemIds.length
			: 0;
		const selectedCollectionCount = Array.isArray(
			this.model.selectedCollectionIds,
		)
			? this.model.selectedCollectionIds.length
			: 0;
		const deletableSelectedCollectionCount = Number.isFinite(
			this.model.deletableSelectedCollectionCount,
		)
			? this.model.deletableSelectedCollectionCount
			: 0;

		if (isItemsView) {
			const showSelectionToolbar = selectedItemCount > 0;
			selectionStatus.hidden = !showSelectionToolbar;
			deleteSelectedBtn.hidden = !showSelectionToolbar;
			clearSelectionBtn.hidden = !showSelectionToolbar;
			selectionStatus.textContent = `${selectedItemCount} selected`;
			deleteSelectedBtn.textContent = "Delete selected";
			clearSelectionBtn.textContent = "Clear selection";
			deleteSelectedBtn.disabled = false;
			return;
		}

		selectionStatus.hidden = selectedCollectionCount === 0;
		selectionStatus.textContent = `#${selectedCollectionCount}`;
		deleteSelectedBtn.hidden = false;
		deleteSelectedBtn.innerHTML = renderTrashIcon(
			"icon icon-trash delete-icon",
		);
		deleteSelectedBtn.setAttribute(
			"aria-label",
			"Delete selected collections",
		);
		deleteSelectedBtn.setAttribute("title", "Delete selected collections");
		deleteSelectedBtn.disabled = deletableSelectedCollectionCount === 0;
		clearSelectionBtn.hidden = selectedCollectionCount === 0;
		clearSelectionBtn.innerHTML = renderDeselectIcon(
			"icon icon-deselect clear-selection-icon",
		);
		clearSelectionBtn.setAttribute("aria-label", "Clear selected collections");
		clearSelectionBtn.setAttribute("title", "Clear selected collections");
	}

	renderBody() {
		const host = this.shadowRoot.getElementById("browserHost");
		if (!host) {
			return;
		}
		host.innerHTML = "";

		if (this.model.onboarding?.visible) {
			host.innerHTML = `
        <open-collections-section-panel
          class="onboarding-panel"
          title="Start your first collection workspace"
          description="Choose how you want to begin."
          heading-level="3"
          surface
        >
          <open-collections-empty-state
            class="onboarding-empty-callout"
            title="No active workspace yet"
            message="Connect a source, create a new collection, or load the example to get started."
            compact
          ></open-collections-empty-state>
          <div class="onboarding-actions">
            <button class="btn" id="addExampleCollectionBtn" type="button">Add example collection</button>
            <button class="btn" id="addConnectionBtn" type="button">${this.model.connectionActionLabel || "Add connection"}</button>
            <button class="btn btn-primary" id="createCollectionEmptyBtn" type="button">Create collection</button>
          </div>
        </open-collections-section-panel>
      `;
			return;
		}

		const managerMode = this.getManagerMode();
		const level = managerMode === "items" ? "items" : "collections";
		const mode = this.getCurrentViewMode();

		if (managerMode === "sources") {
			const sourceCards = Array.isArray(this.model.sourceCards)
				? this.model.sourceCards
				: [];
			if (sourceCards.length === 0) {
				host.innerHTML = `<open-collections-empty-state title="No sources available" message="Add or connect a source to start managing collections."></open-collections-empty-state>`;
				return;
			}
			host.innerHTML = `<div class="grid-host"><oc-grid id="sourceGrid"></oc-grid></div>`;
			const grid = host.querySelector("#sourceGrid");
			grid?.update({
				mode: "grid",
				columnsDesktop: 6,
				columnsTablet: 4,
				columnsMobile: 2,
				gap: "0.62rem",
			});
			for (const source of sourceCards) {
				const wrapper = document.createElement("div");
				wrapper.className = "browse-cell kind-source";
				wrapper.dataset.actionType = "source";
				wrapper.dataset.actionValue = source.id || "";
				wrapper.setAttribute("data-span-cols", "2");
				wrapper.setAttribute("data-span-rows", "2");
				wrapper.setAttribute("data-span-cols-mobile", "2");
				wrapper.setAttribute("data-span-rows-mobile", "2");
				const card = document.createElement("oc-card-collections");
				card.update({
					title: source.title || "Source",
					subtitle: source.subtitle || "",
					countLabel: source.countLabel || "",
					previewRows: Array.isArray(source.previewRows)
						? source.previewRows
						: [],
					previewImages: Array.isArray(source.previewImages)
						? source.previewImages
						: [],
					actionLabel: "Browse",
					actionValue: source.id || "",
					active: source.active === true,
				});
				wrapper.append(card);
				grid?.append(wrapper);
			}
			return;
		}

		if (managerMode === "items" && !this.model.openedCollectionId) {
			host.innerHTML = `<open-collections-empty-state title="No collection open" message="Open a collection first to manage its items."></open-collections-empty-state>`;
			return;
		}

		const componentTag =
			level === "collections"
				? mode === "rows"
					? "open-collection-row-list"
					: "open-collection-card-surface"
				: mode === "rows"
					? "open-item-row-list"
					: "open-item-card-grid";

		const renderer = document.createElement(componentTag);
		if (level === "collections") {
			renderer.update({
				collections: this.model.collections,
				selectedCollectionId: this.model.selectedCollectionId,
				selectedCollectionIds: this.model.selectedCollectionIds,
				availableConnections: this.model.availableConnections,
				isLoading: this.model.isLoading,
			});
		} else {
			renderer.update({
				items: this.model.items,
				focusedItemId: this.model.focusedItemId,
				selectedItemIds: this.model.selectedItemIds,
				isLoading: this.model.isLoading,
			});
		}
		host.appendChild(renderer);
	}

	render() {
		this.shadowRoot.innerHTML = `
      <style>${browserStyles}</style>
      <section class="viewport-panel" aria-label="Collection browser">
        <open-collections-panel-chrome id="panelShell" title="Collections" show-back="false">
          <div class="viewport-actions viewport-title-actions" slot="header-actions">
            <button class="btn btn-primary" id="publishCollectionBtn" type="button" hidden disabled>Publish collection</button>
            <input id="imageFileInput" type="file" accept=".jpg,.jpeg,.png,.webp,.gif" multiple hidden />
          </div>
		  <div class="manager-mode-toggle" id="managerModeToggle" role="toolbar" aria-label="Manager mode" slot="subheader">
			<button type="button" class="mode-toggle" data-manager-mode="sources" data-active="false" aria-pressed="false">Sources</button>
			<button type="button" class="mode-toggle" data-manager-mode="collections" data-active="true" aria-pressed="true">Collections</button>
			<button type="button" class="mode-toggle" data-manager-mode="items" data-active="false" aria-pressed="false">Items</button>
		  </div>
          <div class="viewport-actions viewport-toolbar-main" slot="toolbar">
            <open-view-toggle id="viewToggle" mode="cards"></open-view-toggle>
            <button class="icon-btn delete-action-btn" id="deleteSelectedBtn" type="button" hidden aria-label="Delete selected collections"></button>
            <span id="selectionStatus" class="selection-status" hidden>#0</span>
			<button class="btn clear-selection-btn" id="clearSelectionBtn" type="button" hidden>Clear selection</button>
          </div>
          <div class="viewport-actions viewport-toolbar-actions" slot="toolbar-actions">
            <button class="btn" id="addImagesBtn" type="button">Add item</button>
          </div>
          <div id="assetWrap" class="asset-wrap">
            <div id="assetDropOverlay" class="drop-overlay">Drop image files to add them to this collection draft</div>
			<div id="browserScroll" class="scroll-container">
				<div id="browserHost" class="browser-host"></div>
			</div>
          </div>
        </open-collections-panel-chrome>
      </section>
    `;

		this.shadowRoot
			.querySelectorAll("button[data-manager-mode]")
			.forEach((button) => {
				button.addEventListener("click", () => {
					this.setManagerMode(button.getAttribute("data-manager-mode"));
				});
			});

		this.shadowRoot
			.getElementById("browserHost")
			?.addEventListener("click", (event) => {
				const path =
					typeof event.composedPath === "function"
						? event.composedPath()
						: [];
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
				if (actionType === "source" && actionValue) {
					this.dispatch("source-open", { sourceId: actionValue });
				}
			});
	}
}

if (!customElements.get("open-collections-browser")) {
	customElements.define(
		"open-collections-browser",
		OpenCollectionsBrowserElement,
	);
}

export { OpenCollectionsBrowserElement };
