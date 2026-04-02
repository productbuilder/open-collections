import {
	ComponentBase,
	normalizeCollection,
} from "../../../shared/library-core/src/index.js";
import { ENTRY_VIEW_HEADERS } from "../../../shared/ui/app-foundation/entry-view-header-copy.js";
import "../../../shared/ui/primitives/section-header.js";
import { BROWSER_CONFIG } from "./config.js";
import { bindDomEvents, cacheDomElements } from "./controllers/dom-bindings.js";
import {
	announceManifestUrl,
	clearRecentManifestUrls,
	hydrateRecentManifestUrls,
	normalizeEmbeddedSourceCatalog,
	readRecentManifestUrls,
	rememberRecentManifestUrl,
	resolveEmbeddedSourceDescriptor,
	resolveStartupManifestUrl,
} from "./controllers/manifest-controller.js";
import {
	closeViewer,
	findSelectedItem,
	findViewerItem,
	isMobileViewport,
	openViewer,
	selectItem,
} from "./controllers/selection-controller.js";
import {
	buildCollectionBrowseCardModels,
	buildItemBrowseCardModels,
	buildSourceBrowseCardModels,
} from "./state/browse-model-builders.js";
import { buildBrowseFeedEntities } from "./state/feed/index.js";
import "./components/browser-collection-browser.js";
import "./components/browser-manifest-controls.js";
import "./components/browser-metadata-panel.js";
import "./components/browser-viewer-dialog.js";

function deriveItemPreviewUrl(item) {
	return String(item?.media?.thumbnailUrl || item?.media?.url || "").trim();
}

function derivePreviewImages(items = [], max = Number.POSITIVE_INFINITY) {
	const previews = [];
	const list = Array.isArray(items) ? items : [];
	const maxCount = Number.isFinite(Number(max))
		? Math.max(0, Number(max))
		: Number.POSITIVE_INFINITY;
	for (const item of list) {
		const previewUrl = deriveItemPreviewUrl(item);
		if (!previewUrl) {
			continue;
		}
		previews.push(previewUrl);
		if (previews.length >= maxCount) {
			break;
		}
	}
	return previews;
}

class TimemapBrowserElement extends ComponentBase {
	constructor() {
		super();
		this.state = {
			collection: null,
			manifestUrlInput: "",
			currentManifestUrl: "",
			recentManifestUrls: readRecentManifestUrls(),
			embeddedSources: [],
			embeddedSourceCards: [],
			activeEmbeddedSourceId: "",
			sourceType: "collection.json",
			viewMode: "items",
			embeddedNavStack: [],
			collectionsIndex: [],
			sourceItems: [],
			selectedCollectionManifestUrl: "",
			selectedItemId: null,
			viewerItemId: null,
			mobileMetadataOpen: false,
			statusText: "Load a collection manifest to browse.",
			statusTone: "neutral",
			isLoadingCollection: false,
		};
		this.shadow = this.attachShadow({ mode: "open" });
	}

	connectedCallback() {
		if (this.isEmbeddedRuntime()) {
			this.state.viewMode = "all";
			this.state.statusText =
				"Browse sources, collections, and items.";
		}
		this.renderShell();
		this.cacheDom();
		this._eventsBound = false;
		this.bindEvents();
		this.setStatus(this.state.statusText, this.state.statusTone);
		this.renderHeader();
		this.renderManifestControls();
		this.renderEmbeddedSourceControls();
		this.renderViewport();
		this.renderMetadata();
		this.syncMetadataPanelVisibility();
		if (this.isEmbeddedRuntime()) {
			void this.initializeEmbeddedSources();
			return;
		}
		void this.hydrateRecentStateAndInitialize();
	}

	async hydrateRecentStateAndInitialize() {
		await hydrateRecentManifestUrls(this);
		this.renderManifestControls();
		this.initializeStartupManifest();
	}

	disconnectedCallback() {
		if (this._handleWindowResize) {
			window.removeEventListener("resize", this._handleWindowResize);
			this._handleWindowResize = null;
		}
		this._eventsBound = false;
	}

	bindEvents() {
		bindDomEvents(this);
	}

	cacheDom() {
		this.dom = cacheDomElements(this.shadow);
	}

	isEmbeddedRuntime() {
		return (
			this.hasAttribute("data-workbench-embed") ||
			this.hasAttribute("data-shell-embed") ||
			this.getAttribute("data-oc-app-mode") === "embedded"
		);
	}

	captureEmbeddedNavContext() {
		return {
			viewMode: this.state.viewMode || "sources",
			activeEmbeddedSourceId: this.state.activeEmbeddedSourceId || "",
			selectedCollectionManifestUrl:
				this.state.selectedCollectionManifestUrl || "",
			selectedItemId: this.state.selectedItemId || null,
		};
	}

	pushEmbeddedNavContext() {
		if (!this.isEmbeddedRuntime()) {
			return;
		}
		const nextStack = Array.isArray(this.state.embeddedNavStack)
			? [...this.state.embeddedNavStack, this.captureEmbeddedNavContext()]
			: [this.captureEmbeddedNavContext()];
		this.state.embeddedNavStack = nextStack.slice(-24);
	}

	canGoBackEmbeddedNav() {
		return (
			this.isEmbeddedRuntime() &&
			Array.isArray(this.state.embeddedNavStack) &&
			this.state.embeddedNavStack.length > 0
		);
	}

	restoreEmbeddedNavContext(context = {}) {
		if (!context || typeof context !== "object") {
			return;
		}
		this.state.viewMode = context.viewMode || "sources";
		this.state.activeEmbeddedSourceId = context.activeEmbeddedSourceId || "";
		this.state.selectedCollectionManifestUrl =
			context.selectedCollectionManifestUrl || "";
		this.state.selectedItemId = context.selectedItemId || null;
		this.state.viewerItemId = null;
		this.state.mobileMetadataOpen = false;
		this.closeViewer();
		this.renderEmbeddedSourceControls();
		this.renderViewport();
		this.renderMetadata();
		this.renderViewer();
		this.syncMetadataPanelVisibility();
	}

	goBackInEmbeddedNav() {
		if (!this.canGoBackEmbeddedNav()) {
			return;
		}
		const stack = Array.isArray(this.state.embeddedNavStack)
			? [...this.state.embeddedNavStack]
			: [];
		const previous = stack.pop();
		this.state.embeddedNavStack = stack;
		this.restoreEmbeddedNavContext(previous);
	}

	renderEmbeddedSourceControls() {
		const allBtn = this.dom?.embeddedViewAllBtn;
		const sourcesBtn = this.dom?.embeddedViewSourcesBtn;
		const collectionsBtn = this.dom?.embeddedViewCollectionsBtn;
		const itemsBtn = this.dom?.embeddedViewItemsBtn;
		if (!allBtn && !sourcesBtn && !collectionsBtn && !itemsBtn) {
			return;
		}

		const canUseCollections = this.state.collectionsIndex.length > 0;
		const canUseItems = this.state.sourceItems.length > 0;
		const canUseAll =
			this.state.embeddedSourceCards.length > 0 ||
			this.state.collectionsIndex.length > 0 ||
			this.state.sourceItems.length > 0;
		if (allBtn) {
			allBtn.disabled = this.state.isLoadingCollection || !canUseAll;
			allBtn.dataset.active =
				this.state.viewMode === "all" ? "true" : "false";
		}
		if (sourcesBtn) {
			sourcesBtn.disabled = this.state.isLoadingCollection;
			sourcesBtn.dataset.active =
				this.state.viewMode === "sources" ? "true" : "false";
		}
		if (collectionsBtn) {
			collectionsBtn.disabled =
				this.state.isLoadingCollection || !canUseCollections;
			collectionsBtn.dataset.active =
				this.state.viewMode === "collections" ? "true" : "false";
		}
		if (itemsBtn) {
			itemsBtn.disabled = this.state.isLoadingCollection || !canUseItems;
			itemsBtn.dataset.active =
				this.state.viewMode === "items" ? "true" : "false";
		}
	}

	setEmbeddedViewMode(mode) {
		if (!this.isEmbeddedRuntime()) {
			return;
		}
		const nextMode =
			mode === "all"
				? "all"
				: mode === "sources"
				? "sources"
				: mode === "collections"
					? "collections"
					: "items";
		if (
			nextMode === "all" &&
			!(
				this.state.embeddedSourceCards.length ||
				this.state.collectionsIndex.length ||
				this.state.sourceItems.length
			)
		) {
			return;
		}
		if (nextMode === "collections" && !this.state.collectionsIndex.length) {
			return;
		}
		if (nextMode === "items" && !this.state.sourceItems.length) {
			return;
		}
		this.state.viewMode = nextMode;
		if (
			nextMode === "collections" &&
			this.state.sourceType === "source.json"
		) {
			this.state.selectedItemId = null;
		}
		this.renderEmbeddedSourceControls();
		this.renderViewport();
		this.renderMetadata();
	}

	async openSourceFromBrowse(sourceId = "") {
		if (!this.isEmbeddedRuntime()) {
			return;
		}
		if (this.state.viewMode === "all" || this.state.viewMode === "sources") {
			this.pushEmbeddedNavContext();
		}
		await this.loadEmbeddedSourceById(sourceId);
	}

	async openEmbeddedCollectionFromIndex(manifestUrl, options = {}) {
		if (!this.isEmbeddedRuntime()) {
			return;
		}
		const shouldPushHistory = options.pushHistory === true;
		if (shouldPushHistory) {
			this.pushEmbeddedNavContext();
		}
		const resolvedManifestUrl = String(manifestUrl || "").trim();
		if (!resolvedManifestUrl) {
			return;
		}

		this.state.selectedCollectionManifestUrl = resolvedManifestUrl;
		this.state.viewMode = "items";
		const focusedCollection = this.state.collectionsIndex.find(
			(entry) => entry.manifestUrl === resolvedManifestUrl,
		);
		if (focusedCollection?.collection) {
			this.state.collection = focusedCollection.collection;
			this.state.currentManifestUrl = resolvedManifestUrl;
			this.state.selectedItemId =
				focusedCollection.collection.items?.[0]?.id || null;
			this.state.viewerItemId = null;
			this.state.mobileMetadataOpen = false;
			this.setStatus(
				`Focused collection ${focusedCollection.label}.`,
				"ok",
			);
			this.renderEmbeddedSourceControls();
			this.renderViewport();
			this.renderMetadata();
			this.renderViewer();
			this.syncMetadataPanelVisibility();
			return;
		}
		this.renderEmbeddedSourceControls();
		this.setManifestInput(resolvedManifestUrl);
		await this.loadCollection({
			manifestUrl: resolvedManifestUrl,
			announceInput: false,
		});
	}

	async openCollectionFromBrowse(manifestUrl = "") {
		if (!this.isEmbeddedRuntime()) {
			return;
		}
		const shouldPush =
			this.state.viewMode === "all" || this.state.viewMode === "collections";
		await this.openEmbeddedCollectionFromIndex(manifestUrl, {
			pushHistory: shouldPush,
		});
	}

	async loadCollectionManifest(manifestUrl) {
		const response = await fetch(manifestUrl);
		if (!response.ok) {
			throw new Error(`Could not load manifest (${response.status}).`);
		}
		const json = await response.json();
		return normalizeCollection(json, { manifestUrl });
	}

	async hydrateCollectionsForSource(collections = []) {
		const entries = Array.isArray(collections) ? collections : [];
		const resolved = await Promise.all(
			entries.map(async (entry) => {
				const collection = await this.loadCollectionManifest(
					entry.manifestUrl,
				);
				return {
					...entry,
					collection,
				};
			}),
		);

		const sourceItems = [];
		for (const entry of resolved) {
			const collectionItems = Array.isArray(entry.collection?.items)
				? entry.collection.items
				: [];
			for (let index = 0; index < collectionItems.length; index += 1) {
				const item = collectionItems[index];
				sourceItems.push({
					...item,
					id: `${entry.id}::${item.id || `item-${index + 1}`}`,
					sourceCollectionId: entry.id,
					sourceCollectionTitle:
						entry.collection?.title || entry.label || "",
					sourceCollectionManifestUrl: entry.manifestUrl,
				});
			}
		}

		return {
			collectionsIndex: resolved,
			sourceItems,
		};
	}

	async buildEmbeddedCollectionsCatalog(sources = []) {
		const allEntries = [];
		for (const source of sources) {
			const descriptor = await resolveEmbeddedSourceDescriptor(source);
			if (descriptor.sourceType === "source.json") {
				const entries = Array.isArray(descriptor.collections)
					? descriptor.collections
					: [];
				for (const entry of entries) {
					allEntries.push({
						...entry,
						id: `${source.id}::${entry.id}`,
						sourceId: source.id,
						sourceLabel: source.label,
					});
				}
				continue;
			}

			const collection = await this.loadCollectionManifest(
				descriptor.manifestUrl,
			);
			allEntries.push({
				id: `${source.id}::single`,
				label: collection.title || source.label || "Collection",
				description: collection.description || "",
				manifestUrl: descriptor.manifestUrl,
				sourceId: source.id,
				sourceLabel: source.label,
			});
		}

		return this.hydrateCollectionsForSource(allEntries);
	}

	async buildEmbeddedSourceCard(source) {
		try {
			const descriptor = await resolveEmbeddedSourceDescriptor(source);
			if (descriptor.sourceType === "source.json") {
				const collections = Array.isArray(descriptor.collections)
					? descriptor.collections
					: [];
				const previewRows = [];
				for (const collectionEntry of collections.slice(0, 3)) {
					const manifestUrl = String(collectionEntry?.manifestUrl || "").trim();
					if (!manifestUrl) {
						continue;
					}
					try {
						const previewCollection = await this.loadCollectionManifest(
							manifestUrl,
						);
						const rowImages = derivePreviewImages(previewCollection.items);
						if (rowImages.length === 0) {
							continue;
						}
						previewRows.push({
							title: collectionEntry?.label || previewCollection?.title || "",
							images: rowImages,
						});
					} catch {
						// Keep source card rendering resilient when one collection preview fails.
					}
				}
				const previewImages = previewRows.flatMap((row) =>
					Array.isArray(row.images) ? row.images : [],
				);
				return {
					id: source.id,
					label: source.label,
					organizationName:
						descriptor.organizationName || descriptor.title || source.label || "",
					curatorName: descriptor.curatorName || "",
					placeName: descriptor.placeName || "",
					countryName: descriptor.countryName || "",
					countryCode: descriptor.countryCode || "",
					subtitle: "",
					countLabel: `${collections.length} collection${collections.length === 1 ? "" : "s"}`,
					previewRows,
					previewImages,
					sourceType: descriptor.sourceType,
				};
			}

			const collection = await this.loadCollectionManifest(
				descriptor.manifestUrl,
			);
			const items = Array.isArray(collection.items) ? collection.items : [];
			return {
				id: source.id,
				label: source.label,
				organizationName: source.organizationName || source.label || "",
				curatorName: source.curatorName || "",
				placeName: source.placeName || "",
				countryName: source.countryName || "",
				countryCode: source.countryCode || "",
				subtitle: "",
				countLabel: `${items.length} item${items.length === 1 ? "" : "s"}`,
				previewRows: [],
				previewImages: derivePreviewImages(items, 3),
				sourceType: descriptor.sourceType,
			};
		} catch {
			return {
				id: source.id,
				label: source.label,
				organizationName: source.organizationName || source.label || "",
				curatorName: source.curatorName || "",
				placeName: source.placeName || "",
				countryName: source.countryName || "",
				countryCode: source.countryCode || "",
				subtitle: "",
				countLabel: "",
				previewRows: [],
				previewImages: [],
				sourceType: source.sourceType,
			};
		}
	}

	async hydrateEmbeddedSourceCards(sources = []) {
		const cards = await Promise.all(
			sources.map((source) => this.buildEmbeddedSourceCard(source)),
		);
		this.state.embeddedSourceCards = cards;
		this.renderViewport();
	}

	getVisibleCollections() {
		const collections = Array.isArray(this.state.collectionsIndex)
			? this.state.collectionsIndex
			: [];
		if (!this.isEmbeddedRuntime()) {
			return collections;
		}
		const activeSourceId = String(this.state.activeEmbeddedSourceId || "").trim();
		if (!activeSourceId) {
			return collections;
		}
		return collections.filter(
			(entry) => String(entry.sourceId || "").trim() === activeSourceId,
		);
	}

	getCurrentItems() {
		if (this.isEmbeddedRuntime()) {
			if (this.state.selectedCollectionManifestUrl) {
				const focusedCollection = this.state.collectionsIndex.find(
					(entry) =>
						entry.manifestUrl ===
						this.state.selectedCollectionManifestUrl,
				);
				return focusedCollection?.collection?.items || [];
			}
			const sourceItems = Array.isArray(this.state.sourceItems)
				? this.state.sourceItems
				: [];
			const activeSourceId = String(this.state.activeEmbeddedSourceId || "").trim();
			if (!activeSourceId) {
				return sourceItems;
			}
			return sourceItems.filter(
				(item) => String(item.sourceCollectionId || "").startsWith(`${activeSourceId}::`),
			);
		}
		return this.state.collection?.items || [];
	}

	openItemFromCard(itemId) {
		if (!itemId) {
			return;
		}
		this.selectItem(itemId);
		this.openViewer(itemId);
	}

	openMetadataFromViewer() {
		const itemId = this.state.viewerItemId;
		if (!itemId) {
			return;
		}
		this.selectItem(itemId);
		if (this.isMobileViewport()) {
			this.openMobileMetadataPanel();
		} else {
			this.dom.browserViewport?.setDesktopInspectorOpen?.(true);
		}
		this.closeViewer();
	}

	async initializeEmbeddedSources() {
		const configuredSources = normalizeEmbeddedSourceCatalog(
			BROWSER_CONFIG.embeddedSourceCatalog,
		);
		this.state.embeddedSources = configuredSources;
		const multiCollectionSources = configuredSources.filter(
			(source) => source.sourceType === "source.json",
		);
		this.state.embeddedSourceCards = multiCollectionSources.map((source) => ({
			id: source.id,
			label: source.label,
			organizationName: source.organizationName || source.label || "",
			curatorName: source.curatorName || "",
			placeName: source.placeName || "",
			countryName: source.countryName || "",
			countryCode: source.countryCode || "",
			subtitle: "",
			countLabel: "",
			previewRows: [],
			previewImages: [],
			sourceType: source.sourceType,
		}));

		if (!configuredSources.length) {
			this.setStatus("No embedded browser sources configured.", "warn");
			this.renderEmbeddedSourceControls();
			this.renderViewport();
			return;
		}

		this.state.activeEmbeddedSourceId =
			this.state.activeEmbeddedSourceId || multiCollectionSources[0]?.id || "";
		this.state.viewMode = "all";
		this.state.embeddedNavStack = [];
		this.renderEmbeddedSourceControls();
		this.renderViewport();
		void this.hydrateEmbeddedSourceCards(multiCollectionSources);
		try {
			const hydratedCatalog =
				await this.buildEmbeddedCollectionsCatalog(configuredSources);
			this.state.collectionsIndex = hydratedCatalog.collectionsIndex;
			this.state.sourceItems = hydratedCatalog.sourceItems;
			this.state.selectedCollectionManifestUrl = "";
			this.state.selectedItemId = null;
			this.state.viewerItemId = null;
			this.setStatus(
				`Loaded ${this.state.collectionsIndex.length} collections with ${this.state.sourceItems.length} total items.`,
				"ok",
			);
			this.renderEmbeddedSourceControls();
			this.renderViewport();
			this.renderMetadata();
			this.renderViewer();
			this.syncMetadataPanelVisibility();
		} catch (error) {
			this.setStatus(`Source load failed: ${error.message}`, "warn");
		}
	}

	async loadEmbeddedSourceById(sourceId) {
		if (!this.isEmbeddedRuntime()) {
			return;
		}

		const source = this.state.embeddedSources.find(
			(entry) => entry.id === sourceId,
		);
		if (!source) {
			this.setStatus("Selected source is not available.", "warn");
			return;
		}

		this.state.activeEmbeddedSourceId = source.id;
		this.state.viewMode = "collections";
		this.state.selectedCollectionManifestUrl = "";
		this.state.selectedItemId = null;
		this.state.viewerItemId = null;
		this.state.mobileMetadataOpen = false;
		this.closeViewer();
		this.setStatus(`Browsing collections from ${source.label}.`, "ok");
		this.renderEmbeddedSourceControls();
		this.renderViewport();
		this.renderMetadata();
		this.renderViewer();
		this.syncMetadataPanelVisibility();
	}

	renderShell() {
		const isEmbedded = this.isEmbeddedRuntime();
		const entryHeader = ENTRY_VIEW_HEADERS.browse;
		const toolbarTemplate = isEmbedded
			? `
            <div class="embedded-view-toggle" slot="toolbar">
              <div class="embedded-view-buttons" role="group" aria-label="Browser browse level">
                <button id="embeddedViewAllBtn" class="embedded-view-btn" type="button">All</button>
                <button id="embeddedViewSourcesBtn" class="embedded-view-btn" type="button">Sources</button>
                <button id="embeddedViewCollectionsBtn" class="embedded-view-btn" type="button">Collections</button>
                <button id="embeddedViewItemsBtn" class="embedded-view-btn" type="button">Items</button>
              </div>
            </div>
          `
			: `<open-browser-manifest-controls id="manifestControls" slot="toolbar"></open-browser-manifest-controls>`;

		this.shadow.innerHTML = `
      <style>
        :host {
          display: block;
          height: 100%;
          min-height: 0;
          overflow: hidden;
          font-family: "Segoe UI", Tahoma, sans-serif;
          --oc-browser-bg-app: #e7e7e3;
          --oc-browser-bg-card: #fffdfa;
          --oc-browser-bg-card-soft: #f7f4f1;
          --oc-browser-border: #d9d5d0;
          --oc-browser-border-strong: #c8c1b8;
          --oc-browser-divider: #e2d8cd;
          --oc-browser-surface-muted: #eeebe7;
          --oc-browser-placeholder-fill: #e8e4de;
          --oc-browser-placeholder-border: #d6d0c7;
          --oc-browser-text: #2e2924;
          --oc-browser-text-muted: #6c6258;
          --oc-browser-accent: #756c64;
          --oc-browser-accent-soft: #ece7e1;
          --oc-browser-focus-ring: #91857a;
          color: var(--oc-browser-text, #2e2924);
          background: var(--oc-browser-bg-app, #e7e7e3);
        }

        * {
          box-sizing: border-box;
        }

        .app-shell {
          height: min(100dvh, 100vh);
          min-height: 640px;
          background: var(--oc-browser-bg-app, #e7e7e3);
          border: 1px solid var(--oc-browser-border, #d9d5d0);
          border-radius: 10px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .browser-header {
          background: var(--oc-browser-bg-card, #fffdfa);
          border-bottom: 1px solid var(--oc-browser-divider, #e2d8cd);
          padding: 1rem 1rem 0.75rem;
          display: grid;
          gap: 0.75rem;
        }

        .manifest {
          margin: 0;
          font-size: 0.8rem;
          color: var(--oc-browser-text-muted, #6c6258);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 100%;
        }

        .header-meta {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .mode-chip {
          display: inline-flex;
          align-items: center;
          border-radius: 999px;
          border: 1px solid var(--oc-browser-border, #d9d5d0);
          padding: 0.1rem 0.5rem;
          font-size: 0.72rem;
          line-height: 1.2;
          font-weight: 700;
          color: var(--oc-browser-text-muted, #6c6258);
          background: var(--oc-browser-surface-muted, #eee5dc);
          white-space: nowrap;
        }

        .header-status {
          display: inline-flex;
          align-items: center;
          min-height: 1.9rem;
          padding: 0.2rem 0.65rem;
          border-radius: 999px;
          border: 1px solid var(--oc-browser-border, #d9d5d0);
          background: var(--oc-browser-surface-muted, #eee5dc);
          color: var(--oc-browser-text-muted, #6c6258);
          font-size: 0.8rem;
          font-weight: 600;
          max-width: min(100%, 32rem);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .header-status[data-tone="ok"] {
          background: #ecfdf3;
          border-color: #86efac;
          color: #166534;
        }

        .header-status[data-tone="warn"] {
          background: #fff7ed;
          border-color: #fdba74;
          color: #9a3412;
        }

        .shell {
          flex: 1;
          min-height: 0;
          /* padding: 0.95rem; */
          display: grid;
          grid-template-rows: minmax(0, 1fr);
          overflow: hidden;
        }

        .shell > open-browser-collection-browser {
          display: block;
          min-height: 0;
          height: 100%;
        }

        .embedded-view-toggle {
          display: inline-flex;
          align-items: center;
          width: 100%;
          min-width: 0;
          margin-bottom: 0.3rem;
        }

        .embedded-view-buttons {
          display: flex;
          align-items: center;
          width: 100%;
          border: 1px solid var(--oc-browser-border, #d9d5d0);
          border-radius: 8px;
          overflow: hidden;
          background: var(--oc-browser-bg-card, #fffdfa);
        }

        .embedded-view-btn {
          border: 0;
          border-right: 1px solid var(--oc-browser-border, #d9d5d0);
          background: var(--oc-browser-bg-card, #fffdfa);
          color: var(--oc-browser-text, #2e2924);
          padding: 0.38rem 0.7rem;
          font: inherit;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
        }

        .embedded-view-btn:last-child {
          border-right: 0;
        }

        .embedded-view-btn[data-active="true"] {
          background: var(--oc-browser-accent-soft, #ece7e1);
          color: var(--oc-browser-accent, #756c64);
        }

        :host([data-workbench-embed]) .app-shell,
        :host([data-shell-embed]) .app-shell,
        :host([data-oc-app-mode="embedded"]) .app-shell {
          height: 100%;
          min-height: 0;
          border: 0;
          border-radius: 0;
        }

        :host([data-workbench-embed]) .shell,
        :host([data-shell-embed]) .shell,
        :host([data-oc-app-mode="embedded"]) .shell {
          min-height: 0;
        }

        :host([data-workbench-embed]) .browser-header,
        :host([data-shell-embed]) .browser-header,
        :host([data-oc-app-mode="embedded"]) .browser-header {
          display: none;
        }

        @media (max-width: 760px) {
          .app-shell {
            border: 0;
            border-radius: 0;
            min-height: 100dvh;
          }

          .browser-header {
            padding: 0.55rem 0.7rem;
            gap: 0.55rem;
            align-items: center;
          }

          .manifest {
            display: none;
          }

          .header-meta {
            row-gap: 0.35rem;
          }

          .mode-chip {
            font-size: 0.68rem;
          }

          .header-status {
            max-width: 100%;
            font-size: 0.75rem;
            min-height: 1.75rem;
          }

          .shell {
            /* padding: 0.75rem; */
          }

          .embedded-view-toggle {
            width: 100%;
          }

          .embedded-view-buttons {
            flex: 1 1 100%;
          }

          .embedded-view-btn {
            flex: 1 1 25%;
            min-width: 0;
          }

        }
      </style>
      <div class="app-shell">
        <header id="browserHeader" class="browser-header">
          <open-collections-section-header
            id="browserEntryTitle"
            heading-level="1"
            title="${entryHeader.title}"
            description="${entryHeader.subtitle}"
          >
            <div slot="actions" class="header-meta">
              <span class="mode-chip">Read-only</span>
              <span id="browserHeaderStatus" class="header-status" data-tone="neutral">Load a collection manifest to browse.</span>
            </div>
          </open-collections-section-header>
          <p id="browserManifest" class="manifest" hidden></p>
        </header>
        <div class="shell">
          <open-browser-collection-browser id="browserViewport">
            ${toolbarTemplate}
            <open-browser-metadata-panel id="metadataPanel" slot="inspector"></open-browser-metadata-panel>
          </open-browser-collection-browser>
          <open-browser-viewer-dialog id="viewerDialog"></open-browser-viewer-dialog>
        </div>
      </div>
    `;
	}

	initializeStartupManifest() {
		const startupManifestUrl = resolveStartupManifestUrl(
			this,
			BROWSER_CONFIG.defaultManifestUrl,
		);
		if (!startupManifestUrl) {
			return;
		}
		this.setManifestInput(startupManifestUrl);
		this.loadCollection({
			manifestUrl: startupManifestUrl,
			announceInput: false,
		});
	}

	setManifestInput(manifestUrl) {
		this.state.manifestUrlInput = String(manifestUrl || "").trim();
		this.renderManifestControls();
		this.renderEmbeddedSourceControls();
	}

	setStatus(text, tone = "neutral") {
		this.state.statusText = text;
		this.state.statusTone = tone;
		this.renderHeader();
		this.renderManifestControls();
		this.renderEmbeddedSourceControls();
	}

	isMobileViewport() {
		return isMobileViewport();
	}

	openMobileMetadataPanel() {
		this.state.mobileMetadataOpen = true;
		this.syncMetadataPanelVisibility();
	}

	closeMobileMetadataPanel() {
		this.state.mobileMetadataOpen = false;
		this.syncMetadataPanelVisibility();
	}

	syncMetadataPanelVisibility() {
		this.dom.metadataPanel?.setMobileOpen(
			this.isMobileViewport() && this.state.mobileMetadataOpen,
		);
	}

	headerModel() {
		const manifestText = this.state.currentManifestUrl || "";
		return { manifestText };
	}

	isNestedContextualView() {
		return (
			this.canGoBackEmbeddedNav() &&
			(this.state.viewMode === "collections" ||
				this.state.viewMode === "items")
		);
	}

	renderEntryHeaderVisibility() {
		const browserHeader = this.dom?.browserHeader;
		if (!browserHeader) {
			return;
		}
		browserHeader.hidden = this.isNestedContextualView();
	}

	viewportModel() {
		const items = this.getCurrentItems();
		const collections = this.getVisibleCollections();
		const allCollections = Array.isArray(this.state.collectionsIndex)
			? this.state.collectionsIndex
			: [];
		const allItems = Array.isArray(this.state.sourceItems)
			? this.state.sourceItems
			: [];
		const sources = Array.isArray(this.state.embeddedSourceCards)
			? this.state.embeddedSourceCards
			: [];
		const sourceCards = buildSourceBrowseCardModels(sources, {
			activeSourceId: this.state.activeEmbeddedSourceId || "",
		});
		const collectionCards = buildCollectionBrowseCardModels(collections, {
			selectedManifestUrl: this.state.selectedCollectionManifestUrl || "",
		});
		const itemCards = buildItemBrowseCardModels(items, {
			selectedItemId: this.state.selectedItemId,
		});
		const allCollectionCards = buildCollectionBrowseCardModels(allCollections, {
			selectedManifestUrl: this.state.selectedCollectionManifestUrl || "",
		});
		const allItemCards = buildItemBrowseCardModels(allItems, {
			selectedItemId: this.state.selectedItemId,
		});
		const allBrowseEntities = buildBrowseFeedEntities({
			mode: "all",
			sourceCards,
			collectionCards: allCollectionCards,
			itemCards: allItemCards,
		});
		const showBackInViewport =
			this.canGoBackEmbeddedNav() &&
			(this.state.viewMode === "collections" ||
				this.state.viewMode === "items");
		const activeSource = this.state.activeEmbeddedSourceId
			? this.state.embeddedSources.find(
					(source) => source.id === this.state.activeEmbeddedSourceId,
				) || null
			: null;
		if (this.isEmbeddedRuntime() && this.state.viewMode === "all") {
			return {
				viewportTitle: "Browse and collect",
				viewportSubtitle: "Across multiple collections",
				showBack: showBackInViewport,
				viewMode: "all",
				sources,
				sourceCards,
				collectionCards,
				itemCards,
				allBrowseEntities,
				activeSourceId: this.state.activeEmbeddedSourceId || "",
				collections,
				selectedCollectionManifestUrl:
					this.state.selectedCollectionManifestUrl || "",
				items,
				selectedItemId: this.state.selectedItemId,
				isLoading: this.state.isLoadingCollection,
			};
		}
		if (this.isEmbeddedRuntime() && this.state.viewMode === "sources") {
			return {
				viewportTitle: "Sources",
				viewportSubtitle:
					sources.length > 0
						? `${sources.length} source${sources.length === 1 ? "" : "s"} available. Select one to continue.`
						: "No sources available.",
				showBack: showBackInViewport,
				viewMode: "sources",
				sources,
				sourceCards,
				collectionCards: [],
				itemCards: [],
				allBrowseEntities,
				activeSourceId: this.state.activeEmbeddedSourceId || "",
				collections: [],
				selectedCollectionManifestUrl: "",
				items: [],
				selectedItemId: null,
				isLoading: false,
			};
		}
		if (this.isEmbeddedRuntime() && this.state.viewMode === "collections") {
			const scopedCollectionsTitle =
				showBackInViewport && activeSource?.label
					? activeSource.label
					: "Collections";
			const scopedCollectionsSubtitle =
				showBackInViewport && activeSource?.label
					? collections.length > 0
						? `${collections.length} collection${collections.length === 1 ? "" : "s"} in this source.`
						: "No collections found in this source."
					: collections.length > 0
						? `${collections.length} collection${collections.length === 1 ? "" : "s"} available. Select one to browse items.`
						: "No collections found in this source.";
			return {
				viewportTitle: scopedCollectionsTitle,
				viewportSubtitle: scopedCollectionsSubtitle,
				showBack: showBackInViewport,
				viewMode: "collections",
				sources: [],
				sourceCards: [],
				collectionCards,
				itemCards: [],
				allBrowseEntities,
				activeSourceId: this.state.activeEmbeddedSourceId || "",
				collections,
				selectedCollectionManifestUrl:
					this.state.selectedCollectionManifestUrl || "",
				items: [],
				selectedItemId: null,
				isLoading: false,
			};
		}

		const focusedCollection = this.state.selectedCollectionManifestUrl
			? this.state.collectionsIndex.find(
					(entry) =>
						entry.manifestUrl ===
						this.state.selectedCollectionManifestUrl,
				)
			: null;
		const subtitle = focusedCollection
			? `${items.length} item${items.length === 1 ? "" : "s"}`
			: this.isEmbeddedRuntime()
				? `${items.length} item${items.length === 1 ? "" : "s"} across all collections.`
				: items.length > 0
					? `${items.length} item${items.length === 1 ? "" : "s"} available. Select a card to open media.`
					: "Load a collection to browse its items.";
		const scopedItemsTitle =
			showBackInViewport && focusedCollection?.label
				? focusedCollection.label
				: "Items";

		return {
			viewportTitle: scopedItemsTitle,
			viewportSubtitle: subtitle,
			showBack: showBackInViewport,
			viewMode: "items",
			sources: [],
			sourceCards: [],
			collectionCards: [],
			itemCards,
			allBrowseEntities,
			activeSourceId: this.state.activeEmbeddedSourceId || "",
			collections: [],
			selectedCollectionManifestUrl:
				this.state.selectedCollectionManifestUrl || "",
			items,
			selectedItemId: this.state.selectedItemId,
			isLoading: this.state.isLoadingCollection,
		};
	}

	metadataModel() {
		if (
			this.isEmbeddedRuntime() &&
			(this.state.viewMode === "all" ||
				this.state.viewMode === "sources" ||
				this.state.viewMode === "collections")
		) {
			const emptyText =
				this.state.viewMode === "all"
					? "Use All to jump between sources, collections, and items."
					: this.state.viewMode === "sources"
					? "Select a source to browse collections and items."
					: "Select a collection to browse its items and metadata.";
			return {
				title: "Metadata",
				contextText: "Read-only details for the selected item.",
				fields: [],
				emptyText,
				mobileOpen:
					this.isMobileViewport() && this.state.mobileMetadataOpen,
			};
		}

		const selected = findSelectedItem(this);
		if (selected) {
			return {
				title: "Metadata",
				contextText: `${selected.title || selected.id} - Read-only metadata`,
				fields: [
					["Title", selected.title || ""],
					["Identifier", selected.id || ""],
					[
						"Collection",
						selected.sourceCollectionTitle || "",
					],
					["Description", selected.description || ""],
					["Creator", selected.creator || ""],
					["Date", selected.date || ""],
					["Location", selected.location || ""],
					["License", selected.license || ""],
					["Attribution", selected.attribution || ""],
					["Source", selected.source || ""],
					["Media URL", selected.media?.url || ""],
				].map(([label, value]) => ({ label, value: value || "-" })),
				mobileOpen:
					this.isMobileViewport() && this.state.mobileMetadataOpen,
			};
		}

		const collection = this.state.collection;
		if (collection) {
			return {
				title: "Metadata",
				contextText: `${collection.title || "Collection"} - Collection overview`,
				fields: [
					["Title", collection.title || ""],
					["Description", collection.description || ""],
					["Publisher", collection.publisher || ""],
					["License", collection.license || ""],
					["Items", String(collection.items?.length || 0)],
					["Manifest URL", this.state.currentManifestUrl || ""],
				].map(([label, value]) => ({ label, value: value || "-" })),
				mobileOpen:
					this.isMobileViewport() && this.state.mobileMetadataOpen,
			};
		}

		return {
			title: "Metadata",
			contextText: "Read-only details for the selected item.",
			fields: [],
			emptyText:
				"Load a collection, then click a card to inspect metadata.",
			mobileOpen:
				this.isMobileViewport() && this.state.mobileMetadataOpen,
		};
	}

	renderManifestControls() {
		this.dom?.manifestControls?.update({
			currentManifestUrl: this.state.manifestUrlInput,
			recentManifestUrls: this.state.recentManifestUrls,
			statusText: this.state.statusText,
			statusTone: this.state.statusTone,
			isLoading: this.state.isLoadingCollection,
		});
	}

	renderHeader() {
		const manifest = this.dom?.browserManifest;
		const status = this.dom?.browserHeaderStatus;
		const model = this.headerModel();
		this.renderEntryHeaderVisibility();

		if (manifest) {
			const hasManifest = Boolean(model.manifestText);
			manifest.hidden = !hasManifest;
			manifest.textContent = hasManifest
				? `Manifest: ${model.manifestText}`
				: "";
		}

		if (status) {
			status.textContent = this.state.statusText || "";
			status.dataset.tone = this.state.statusTone || "neutral";
		}
	}

	renderViewport() {
		this.dom?.browserViewport?.update(this.viewportModel());
		this.renderEntryHeaderVisibility();
	}

	renderMetadata() {
		this.dom?.metadataPanel?.setView(this.metadataModel());
	}

	renderViewer() {
		const item = findViewerItem(this);
		if (!item) {
			this.closeViewer();
			return;
		}
		this.dom.viewerDialog?.setItem({
			...item,
			__collectionItems: this.state.collection?.items || [],
			__manifestUrl: this.state.currentManifestUrl || "",
		});
	}

	selectItem(itemId) {
		selectItem(this, itemId);
	}

	openViewer(itemId) {
		openViewer(this, itemId);
	}

	closeViewer() {
		closeViewer(this);
	}

	clearRecentManifestUrls() {
		clearRecentManifestUrls(this);
	}

	async loadCollection({
		manifestUrl: explicitManifestUrl,
		announceInput = true,
	} = {}) {
		const manifestUrl = String(
			explicitManifestUrl || this.state.manifestUrlInput || "",
		).trim();
		if (!manifestUrl) {
			this.setStatus("Enter a manifest URL.", "warn");
			return;
		}

		this.state.manifestUrlInput = manifestUrl;
		if (announceInput) {
			announceManifestUrl(this, manifestUrl);
		}

		this.setStatus("Loading collection...", "neutral");
		this.state.isLoadingCollection = true;
		this.renderManifestControls();
		this.renderEmbeddedSourceControls();
		this.renderViewport();
		try {
			const response = await fetch(manifestUrl);
			if (!response.ok) {
				this.setStatus(
					`Could not load manifest (${response.status}).`,
					"warn",
				);
				return;
			}

			const json = await response.json();
			const collection = normalizeCollection(json, { manifestUrl });
			this.state.collection = collection;
			this.state.currentManifestUrl = manifestUrl;
			this.state.selectedItemId = collection.items[0]?.id || null;
			this.state.viewerItemId = null;
			this.state.mobileMetadataOpen = false;
			if (!this.isEmbeddedRuntime()) {
				rememberRecentManifestUrl(this, manifestUrl);
			}
			this.setStatus(
				`Loaded ${collection.title} (${collection.items.length} items).`,
				"ok",
			);
			announceManifestUrl(this, manifestUrl);
			this.renderManifestControls();
			this.renderEmbeddedSourceControls();
			this.renderViewport();
			this.renderMetadata();
			this.renderViewer();
			this.syncMetadataPanelVisibility();
		} catch (error) {
			this.setStatus(`Load failed: ${error.message}`, "warn");
		} finally {
			this.state.isLoadingCollection = false;
			this.renderManifestControls();
			this.renderEmbeddedSourceControls();
			this.renderViewport();
		}
	}
}

if (!customElements.get("timemap-browser")) {
	customElements.define("timemap-browser", TimemapBrowserElement);
}
