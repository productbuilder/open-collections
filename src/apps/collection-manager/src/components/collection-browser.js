import { browserStyles } from "../css/browser.css.js?v=20260322-titlebar-center";
import "./view-toggle.js";
import "./collection-row-list.js";
import "./item-row-list.js";
import "../../../../shared/ui/panels/index.js";
import "../../../../shared/ui/primitives/index.js";
import { resolveItemPreviewUrl } from "../utils/preview-utils.js";
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
		this.installScrollDiagnostics();
		this.reportScrollDiagnostics("connected");
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

	requiredFieldScore(item) {
		const checks = [
			Boolean(item?.id),
			Boolean(item?.title),
			Boolean(item?.media?.url),
			Boolean(item?.license),
		];
		return `${checks.filter(Boolean).length}/${checks.length}`;
	}

	buildSourceGridCell(source = {}) {
		const wrapper = document.createElement("article");
		wrapper.className = "browse-cell kind-source";
		wrapper.dataset.actionType = "source";
		wrapper.dataset.actionValue = source.id || "";
		wrapper.setAttribute("role", "button");
		wrapper.setAttribute("tabindex", "0");
		wrapper.setAttribute("data-span-cols", "2");
		wrapper.setAttribute("data-span-rows", "2");
		wrapper.setAttribute("data-span-cols-mobile", "2");
		wrapper.setAttribute("data-span-rows-mobile", "2");
		const card = document.createElement("oc-card-collections");
		card.update({
			title: source.title || "Source",
			subtitle: source.subtitle || "",
			countLabel: source.countLabel || "",
			previewRows: Array.isArray(source.previewRows) ? source.previewRows : [],
			previewImages: Array.isArray(source.previewImages)
				? source.previewImages
				: [],
			actionLabel: "Browse",
			actionValue: source.id || "",
			active: source.active === true,
		});
		wrapper.append(card);
		return wrapper;
	}

	buildCollectionGridCell(collection = {}, selectedCollectionIds = new Set()) {
		const isSelected = selectedCollectionIds.has(collection.id);
		const isFocused = this.model.selectedCollectionId === collection.id;
		const isUnassigned = collection.assignmentState === "unassigned";
		const canAssign = (this.model.availableConnections || []).length > 0;
		const wrapper = document.createElement("article");
		wrapper.className = "browse-cell kind-collection";
		wrapper.dataset.actionType = "collection";
		wrapper.dataset.actionValue = collection.id || "";
		wrapper.setAttribute("role", "button");
		wrapper.setAttribute("tabindex", "0");
		wrapper.setAttribute("data-span-cols", "2");
		wrapper.setAttribute("data-span-rows", "1");
		wrapper.setAttribute("data-span-cols-mobile", "2");
		wrapper.setAttribute("data-span-rows-mobile", "1");

		const card = document.createElement("oc-card-collection");
		card.update({
			title: collection.title || collection.id || "Collection",
			subtitle:
				collection.assignmentLabel || "Select to browse this collection.",
			countLabel: collection.countLabel || "",
			previewImages: Array.isArray(collection.previewImages)
				? collection.previewImages
				: [],
			actionLabel: "",
			actionValue: collection.id || "",
			active: isFocused || isSelected,
		});

		const controls = document.createElement("div");
		controls.className = "browse-cell-controls";
		controls.innerHTML = `
			<label class="selection-toggle" data-select-wrap="true">
				<input type="checkbox" data-select-collection-id="${collection.id || ""}" ${isSelected ? "checked" : ""} />
				<span>Select</span>
			</label>
			<button type="button" class="btn ${isUnassigned ? "btn-primary" : ""}" data-assign-id="${collection.id || ""}" ${canAssign ? "" : "disabled"}>
				${isUnassigned ? "Assign connection" : "Reassign connection"}
			</button>
		`;

		wrapper.append(card, controls);
		return wrapper;
	}

	buildItemGridCell(item = {}, selectedItemIds = new Set()) {
		const workspaceId = String(item.workspaceId || "").trim();
		const hasMedia = Boolean(String(item?.media?.url || "").trim());
		const isSelected = selectedItemIds.has(workspaceId);
		const wrapper = document.createElement("article");
		wrapper.className = "browse-cell kind-item";
		wrapper.dataset.actionType = "item";
		wrapper.dataset.actionValue = workspaceId;
		wrapper.setAttribute("role", "button");
		wrapper.setAttribute("tabindex", "0");
		wrapper.setAttribute("data-span-cols", "1");
		wrapper.setAttribute("data-span-rows", "1");
		wrapper.setAttribute("data-span-cols-mobile", "1");
		wrapper.setAttribute("data-span-rows-mobile", "1");

		const card = document.createElement("oc-card-item");
		card.update({
			title: item.title || item.id || "Item",
			subtitle: item.license ? `License: ${item.license}` : "",
			countLabel: `Completeness ${this.requiredFieldScore(item)}`,
			previewUrl: resolveItemPreviewUrl(item),
			previewImages: [],
			actionLabel: "Select",
			actionValue: workspaceId,
			active: false,
			disabled: false,
		});

		const controls = document.createElement("div");
		controls.className = "browse-cell-controls";
		controls.innerHTML = `
			<label class="selection-toggle" data-select-wrap="true">
				<input type="checkbox" data-select-item-id="${workspaceId}" ${isSelected ? "checked" : ""} />
				<span>Select</span>
			</label>
			${
				hasMedia
					? `<button type="button" class="btn" data-open-id="${workspaceId}">View</button>`
					: `<button type="button" class="btn" data-upload-id="${workspaceId}">Upload image</button>
               <button type="button" class="btn" data-url-id="${workspaceId}">Use image URL</button>`
			}
		`;

		wrapper.append(card, controls);
		return wrapper;
	}

	renderCardGrid(browserScroll, managerMode) {
		browserScroll.innerHTML =
			`<div class="grid-host"><oc-grid id="managerGrid"></oc-grid></div>`;
		const grid = browserScroll.querySelector("#managerGrid");
		grid?.update({
			mode: "grid",
			columnsDesktop: 6,
			columnsTablet: 4,
			columnsMobile: 2,
			gap: "0.62rem",
		});

		if (managerMode === "sources") {
			for (const source of Array.isArray(this.model.sourceCards)
				? this.model.sourceCards
				: []) {
				grid?.append(this.buildSourceGridCell(source));
			}
			return;
		}

		if (managerMode === "collections") {
			const selectedCollectionIds = new Set(
				Array.isArray(this.model.selectedCollectionIds)
					? this.model.selectedCollectionIds
					: [],
			);
			for (const collection of Array.isArray(this.model.collections)
				? this.model.collections
				: []) {
				grid?.append(
					this.buildCollectionGridCell(collection, selectedCollectionIds),
				);
			}
			return;
		}

		const selectedItemIds = new Set(
			Array.isArray(this.model.selectedItemIds)
				? this.model.selectedItemIds
				: [],
		);
		for (const item of Array.isArray(this.model.items) ? this.model.items : []) {
			grid?.append(this.buildItemGridCell(item, selectedItemIds));
		}
	}

	disconnectedCallback() {
		this.mediaQueryList?.removeEventListener?.(
			"change",
			this.handleViewportChange,
		);
		this.removeScrollDiagnostics();
	}

	collectElementScrollState(element) {
		if (!(element instanceof Element)) {
			return null;
		}
		const style = window.getComputedStyle(element);
		return {
			id: element.id || "",
			tag: element.tagName?.toLowerCase() || "",
			className:
				typeof element.className === "string" ? element.className : "",
			overflowY: style.overflowY,
			overflowX: style.overflowX,
			clientHeight: element.clientHeight,
			scrollHeight: element.scrollHeight,
			scrollTop: element.scrollTop ?? 0,
		};
	}

	collectAncestorStates(element, maxDepth = 6) {
		const states = [];
		let current = element instanceof Element ? element.parentElement : null;
		let depth = 0;
		while (current && depth < maxDepth) {
			states.push(this.collectElementScrollState(current));
			current = current.parentElement;
			depth += 1;
		}
		return states.filter(Boolean);
	}

	reportScrollDiagnostics(trigger = "manual") {
		const browserScroll = this.shadowRoot?.getElementById("browserScroll");
		const assetWrap = this.shadowRoot?.getElementById("assetWrap");
		const panelShell = this.shadowRoot?.getElementById("panelShell");
		const panelContent = panelShell?.shadowRoot?.querySelector(".panel-content");
		const viewportPanel = this.shadowRoot?.querySelector(".viewport-panel");
		const payload = {
			trigger,
			managerMode: this.getManagerMode(),
			viewMode: this.getCurrentViewMode(),
			scrollOwnerCandidate: this.collectElementScrollState(browserScroll),
			assetWrap: this.collectElementScrollState(assetWrap),
			viewportPanel: this.collectElementScrollState(viewportPanel),
			panelContent: this.collectElementScrollState(panelContent),
			ancestorsOfBrowserScroll: this.collectAncestorStates(browserScroll),
		};
		console.info("[collection-browser][scroll-diag]", payload);
	}

	installScrollDiagnostics() {
		if (this._scrollDiagnosticsInstalled) {
			return;
		}
		const browserScroll = this.shadowRoot?.getElementById("browserScroll");
		if (!browserScroll) {
			return;
		}
		this._scrollDiagnosticsInstalled = true;
		this._handleBrowserScroll = () => this.reportScrollDiagnostics("browserScroll:scroll");
		browserScroll.addEventListener("scroll", this._handleBrowserScroll, {
			passive: true,
		});
	}

	removeScrollDiagnostics() {
		const browserScroll = this.shadowRoot?.getElementById("browserScroll");
		if (browserScroll && this._handleBrowserScroll) {
			browserScroll.removeEventListener("scroll", this._handleBrowserScroll);
		}
		this._scrollDiagnosticsInstalled = false;
		this._handleBrowserScroll = null;
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
		this.shadowRoot
			.getElementById("addTimeComparerBtn")
			?.addEventListener("click", () => {
				this.dispatch("add-time-comparer-item");
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
		this.reportScrollDiagnostics(`manager-mode:${normalizedMode}`);
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
		this.reportScrollDiagnostics("update");
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
		const addTimeComparerBtn =
			this.shadowRoot.getElementById("addTimeComparerBtn");
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
		panelShell.removeAttribute("status-label");
		panelShell.removeAttribute("status-tone");
		addBtn.textContent =
			this.model.currentLevel === "collections"
				? "Add collection"
				: "Add item";
		if (addTimeComparerBtn) {
			addTimeComparerBtn.hidden = this.model.currentLevel !== "items";
		}
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
			deleteSelectedBtn.innerHTML = renderTrashIcon(
				"icon icon-trash delete-icon",
			);
			deleteSelectedBtn.setAttribute(
				"aria-label",
				"Delete selected items",
			);
			deleteSelectedBtn.setAttribute("title", "Delete selected items");
			clearSelectionBtn.innerHTML = renderDeselectIcon(
				"icon icon-deselect clear-selection-icon",
			);
			clearSelectionBtn.setAttribute(
				"aria-label",
				"Clear selected items",
			);
			clearSelectionBtn.setAttribute("title", "Clear selected items");
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
		const browserScroll = this.shadowRoot.getElementById("browserScroll");
		if (!browserScroll) {
			return;
		}
		browserScroll.innerHTML = "";

		if (this.model.onboarding?.visible) {
			browserScroll.innerHTML = `
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
		const sourceCards = Array.isArray(this.model.sourceCards)
			? this.model.sourceCards
			: [];

		if (managerMode === "sources") {
			if (sourceCards.length === 0) {
				browserScroll.innerHTML = `<open-collections-empty-state title="No sources available" message="Add or connect a source to start managing collections."></open-collections-empty-state>`;
				return;
			}
		}

		if (managerMode === "items" && !this.model.openedCollectionId) {
			browserScroll.innerHTML = `<open-collections-empty-state title="No collection open" message="Open a collection first to manage its items."></open-collections-empty-state>`;
			return;
		}

		if (mode === "cards") {
			this.renderCardGrid(browserScroll, managerMode);
			this.reportScrollDiagnostics("render-body");
			return;
		}

		const componentTag =
			level === "collections"
				? "open-collection-row-list"
				: "open-item-row-list";

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
		browserScroll.appendChild(renderer);
		this.reportScrollDiagnostics("render-body");
	}

	render() {
		this.shadowRoot.innerHTML = `
      <style>${browserStyles}</style>
      <section class="viewport-panel" aria-label="Collection browser">
        <open-collections-panel-chrome id="panelShell" title="Collections" show-back="false">
		  <div class="manager-mode-toggle" id="managerModeToggle" role="toolbar" aria-label="Manager mode" slot="subheader">
			<button type="button" class="mode-toggle" data-manager-mode="sources" data-active="false" aria-pressed="false">Sources</button>
			<button type="button" class="mode-toggle" data-manager-mode="collections" data-active="true" aria-pressed="true">Collections</button>
		  </div>
          <div class="viewport-actions viewport-toolbar-main" slot="toolbar">
            <open-view-toggle id="viewToggle" mode="cards"></open-view-toggle>
            <button class="icon-btn delete-action-btn" id="deleteSelectedBtn" type="button" hidden aria-label="Delete selected collections"></button>
			<button class="btn clear-selection-btn" id="clearSelectionBtn" type="button" hidden>Clear selection</button>
			<span id="selectionStatus" class="selection-status" hidden>#0</span>
          </div>
          <div class="viewport-actions viewport-toolbar-actions" slot="toolbar-actions">
            <button class="btn" id="addTimeComparerBtn" type="button" hidden>Add time comparer</button>
            <button class="btn" id="addImagesBtn" type="button">Add item</button>
          </div>
          <div id="assetWrap" class="asset-wrap">
            <div id="assetDropOverlay" class="drop-overlay">Drop image files to add them to this collection draft</div>
			<div id="browserScroll" class="scroll-container">
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
			.getElementById("browserScroll")
			?.addEventListener("click", (event) => {
				const target = event.target instanceof Element ? event.target : null;
				if (!target) {
					return;
				}
				const assignBtn = target.closest("button[data-assign-id]");
				if (assignBtn) {
					event.stopPropagation();
					this.dispatch("collection-assign-connection", {
						collectionId: assignBtn.getAttribute("data-assign-id") || "",
					});
					return;
				}
				const openBtn = target.closest("button[data-open-id]");
				if (openBtn) {
					event.stopPropagation();
					this.dispatch("item-view", {
						workspaceId: openBtn.getAttribute("data-open-id") || "",
					});
					return;
				}
				const uploadBtn = target.closest("button[data-upload-id]");
				if (uploadBtn) {
					event.stopPropagation();
					this.dispatch("attach-media-upload", {
						itemId: uploadBtn.getAttribute("data-upload-id") || "",
					});
					return;
				}
				const urlBtn = target.closest("button[data-url-id]");
				if (urlBtn) {
					event.stopPropagation();
					this.dispatch("attach-media-url", {
						itemId: urlBtn.getAttribute("data-url-id") || "",
					});
					return;
				}
				const selectWrap = target.closest("[data-select-wrap]");
				if (selectWrap) {
					event.stopPropagation();
					return;
				}
				const cell = target.closest(".browse-cell[data-action-type]");
				if (!cell) {
					return;
				}
				const actionType = String(cell.dataset.actionType || "").trim();
				const actionValue = String(cell.dataset.actionValue || "").trim();
				if (actionType === "source" && actionValue) {
					this.dispatch("source-open", { sourceId: actionValue });
					return;
				}
				if (actionType === "collection" && actionValue) {
					this.dispatch("collection-open", { collectionId: actionValue });
					return;
				}
				if (actionType === "item" && actionValue) {
					this.dispatch("item-select", { workspaceId: actionValue });
				}
			});

		this.shadowRoot
			.getElementById("browserScroll")
			?.addEventListener("change", (event) => {
				const target = event.target instanceof Element ? event.target : null;
				if (!target) {
					return;
				}
				const collectionInput = target.closest("input[data-select-collection-id]");
				if (collectionInput) {
					event.stopPropagation();
					this.dispatch("collection-toggle-selected", {
						collectionId:
							collectionInput.getAttribute("data-select-collection-id") || "",
						selected: collectionInput.checked === true,
					});
					return;
				}
				const itemInput = target.closest("input[data-select-item-id]");
				if (itemInput) {
					event.stopPropagation();
					this.dispatch("item-toggle-selected", {
						workspaceId: itemInput.getAttribute("data-select-item-id") || "",
						selected: itemInput.checked === true,
					});
				}
			});

		this.shadowRoot
			.getElementById("browserScroll")
			?.addEventListener("keydown", (event) => {
				if (event.key !== "Enter" && event.key !== " ") {
					return;
				}
				const target = event.target instanceof Element ? event.target : null;
				if (!target || target.closest("button, input, label")) {
					return;
				}
				const cell = target.closest(".browse-cell[data-action-type]");
				if (!cell) {
					return;
				}
				event.preventDefault();
				const actionType = String(cell.dataset.actionType || "").trim();
				const actionValue = String(cell.dataset.actionValue || "").trim();
				if (actionType === "source" && actionValue) {
					this.dispatch("source-open", { sourceId: actionValue });
					return;
				}
				if (actionType === "collection" && actionValue) {
					this.dispatch("collection-open", { collectionId: actionValue });
					return;
				}
				if (actionType === "item" && actionValue) {
					this.dispatch("item-select", { workspaceId: actionValue });
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
