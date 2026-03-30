import {
	ComponentBase,
	normalizeCollection,
} from "../../../shared/library-core/src/index.js";
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
	buildAllBrowseEntities,
	buildCollectionBrowseCardModels,
	buildItemBrowseCardModels,
	buildSourceBrowseCardModels,
} from "./state/browse-model-builders.js";
import "./components/browser-collection-browser.js";
import "./components/browser-manifest-controls.js";
import "./components/browser-metadata-panel.js";
import "./components/browser-viewer-dialog.js";

function deriveItemPreviewUrl(item) {
	return String(item?.media?.thumbnailUrl || item?.media?.url || "").trim();
}

function derivePreviewImages(items = [], max = 3) {
	const previews = [];
	const list = Array.isArray(items) ? items : [];
	for (const item of list) {
		const previewUrl = deriveItemPreviewUrl(item);
		if (!previewUrl) {
			continue;
		}
		previews.push(previewUrl);
		if (previews.length >= max) {
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
			this.state.viewMode = "sources";
			this.state.statusText = "Select a source to start browsing.";
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

	renderEmbeddedSourceControls() {
		const allBtn = this.dom?.embeddedViewAllBtn;
		const sourcesBtn = this.dom?.embeddedViewSourcesBtn;
		const collectionsBtn = this.dom?.embeddedViewCollectionsBtn;
		const itemsBtn = this.dom?.embeddedViewItemsBtn;
		const backBtn = this.dom?.embeddedBackToCollectionsBtn;
		const activeSourceLabel = this.dom?.embeddedActiveSource;
		if (!allBtn && !sourcesBtn && !collectionsBtn && !itemsBtn && !backBtn) {
			return;
		}

		if (activeSourceLabel) {
			const activeSource =
				this.state.embeddedSources.find(
					(source) => source.id === this.state.activeEmbeddedSourceId,
				) || null;
			activeSourceLabel.textContent = activeSource
				? `Source: ${activeSource.label}`
				: "Source: none selected";
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
		if (backBtn) {
			const showBack =
				this.state.viewMode === "items" &&
				Boolean(this.state.selectedCollectionManifestUrl);
			backBtn.hidden = !showBack;
			backBtn.disabled = this.state.isLoadingCollection;
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
			this.state.sourceType === "collections.json"
		) {
			this.state.selectedItemId = null;
		}
		this.renderEmbeddedSourceControls();
		this.renderViewport();
		this.renderMetadata();
	}

	async openEmbeddedCollectionFromIndex(manifestUrl) {
		if (!this.isEmbeddedRuntime()) {
			return;
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

	backToCollectionsView() {
		if (!this.isEmbeddedRuntime()) {
			return;
		}
		this.state.selectedCollectionManifestUrl = "";
		this.state.viewMode = "collections";
		this.state.selectedItemId = null;
		this.state.viewerItemId = null;
		this.closeViewer();
		this.renderEmbeddedSourceControls();
		this.renderViewport();
		this.renderMetadata();
	}

	async loadCollectionManifest(manifestUrl) {
		const response = await fetch(manifestUrl);
		if (!response.ok) {
			throw new Error(`Could not load manifest (${response.status}).`);
		}
		const json = await response.json();
		return normalizeCollection(json);
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
			if (descriptor.sourceType === "collections.json") {
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
		const fallbackSubtitle =
			source.sourceType === "collections.json"
				? "Multi-collection source"
				: "Single collection source";
		try {
			const descriptor = await resolveEmbeddedSourceDescriptor(source);
			if (descriptor.sourceType === "collections.json") {
				const collections = Array.isArray(descriptor.collections)
					? descriptor.collections
					: [];
				const firstManifestUrl = collections[0]?.manifestUrl || "";
				let previewImages = [];
				if (firstManifestUrl) {
					try {
						const previewCollection = await this.loadCollectionManifest(
							firstManifestUrl,
						);
						previewImages = derivePreviewImages(previewCollection.items, 3);
					} catch {
						// Keep source card rendering resilient when preview hydration fails.
					}
				}
				return {
					id: source.id,
					label: source.label,
					subtitle: fallbackSubtitle,
					countLabel: `${collections.length} collection${collections.length === 1 ? "" : "s"}`,
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
				subtitle: collection.title || fallbackSubtitle,
				countLabel: `${items.length} item${items.length === 1 ? "" : "s"}`,
				previewImages: derivePreviewImages(items, 3),
				sourceType: descriptor.sourceType,
			};
		} catch {
			return {
				id: source.id,
				label: source.label,
				subtitle: fallbackSubtitle,
				countLabel: "",
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
			return Array.isArray(this.state.sourceItems)
				? this.state.sourceItems
				: [];
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
			(source) => source.sourceType === "collections.json",
		);
		this.state.embeddedSourceCards = multiCollectionSources.map((source) => ({
			id: source.id,
			label: source.label,
			subtitle: "Multi-collection source",
			countLabel: "",
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
		this.state.viewMode = multiCollectionSources.length ? "sources" : "collections";
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
		this.setStatus(`Browsing collections from ${source.label}.`, "ok");
		this.renderEmbeddedSourceControls();
		this.renderViewport();
		this.renderMetadata();
		this.renderViewer();
		this.syncMetadataPanelVisibility();
	}

	renderShell() {
		const isEmbedded = this.isEmbeddedRuntime();
		const toolbarTemplate = isEmbedded
			? `
            <div class="embedded-source-controls" slot="toolbar">
              <span id="embeddedActiveSource" class="embedded-source-chip">Source: none selected</span>
            </div>
            <div class="embedded-view-toggle" slot="toolbar">
              <span class="embedded-view-label">Browse</span>
              <div class="embedded-view-buttons" role="group" aria-label="Browser browse level">
                <button id="embeddedViewAllBtn" class="embedded-view-btn" type="button">All</button>
                <button id="embeddedViewSourcesBtn" class="embedded-view-btn" type="button">Sources</button>
                <button id="embeddedViewCollectionsBtn" class="embedded-view-btn" type="button">Collections</button>
                <button id="embeddedViewItemsBtn" class="embedded-view-btn" type="button">Items</button>
              </div>
              <button id="embeddedBackToCollectionsBtn" class="embedded-back-btn" type="button" hidden>Back to collections</button>
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
          color: #111827;
          background: #f3f5f8;
        }

        * {
          box-sizing: border-box;
        }

        .app-shell {
          height: min(100dvh, 100vh);
          min-height: 640px;
          background: #f3f5f8;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .browser-header {
          background: #ffffff;
          border-bottom: 1px solid #e5e7eb;
          padding: 0.85rem 1rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }

        .brand {
          display: grid;
          gap: 0.35rem;
          min-width: 0;
        }

        .title {
          margin: 0;
          font-size: 1rem;
          font-weight: 700;
          color: #111827;
        }

        .context {
          margin: 0;
          font-size: 0.83rem;
          color: #64748b;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 100%;
        }

        .manifest {
          margin: 0;
          font-size: 0.8rem;
          color: #94a3b8;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 100%;
        }

        .header-meta {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .mode-chip {
          display: inline-flex;
          align-items: center;
          border-radius: 999px;
          border: 1px solid #cbd5e1;
          padding: 0.1rem 0.5rem;
          font-size: 0.72rem;
          line-height: 1.2;
          font-weight: 700;
          color: #334155;
          background: #f8fafc;
          white-space: nowrap;
        }

        .header-status {
          display: inline-flex;
          align-items: center;
          min-height: 1.9rem;
          padding: 0.2rem 0.65rem;
          border-radius: 999px;
          border: 1px solid #cbd5e1;
          background: #f8fafc;
          color: #475569;
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
          padding: 0.95rem;
          display: grid;
          grid-template-rows: minmax(0, 1fr);
        }

        .embedded-source-controls {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          min-width: 0;
          max-width: 100%;
        }

        .embedded-view-toggle {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          min-width: 0;
        }

        .embedded-view-label {
          font-size: 0.78rem;
          color: #475569;
          font-weight: 700;
        }

        .embedded-source-chip {
          display: inline-flex;
          align-items: center;
          border: 1px solid #cbd5e1;
          background: #ffffff;
          color: #334155;
          border-radius: 8px;
          padding: 0.36rem 0.58rem;
          font-size: 0.79rem;
          font-weight: 600;
          min-height: 1.95rem;
          white-space: nowrap;
          max-width: 26rem;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .embedded-view-buttons {
          display: inline-flex;
          align-items: center;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          overflow: hidden;
          background: #ffffff;
        }

        .embedded-view-btn {
          border: 0;
          border-right: 1px solid #cbd5e1;
          background: #ffffff;
          color: #0f172a;
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
          background: #e8f2ff;
          color: #0f4f90;
        }

        .embedded-back-btn {
          border: 1px solid #cbd5e1;
          background: #ffffff;
          color: #0f172a;
          border-radius: 8px;
          padding: 0.38rem 0.65rem;
          font: inherit;
          font-size: 0.79rem;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
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

          .title {
            font-size: 0.9rem;
          }

          .context {
            font-size: 0.78rem;
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
            padding: 0.75rem;
          }

          .embedded-source-controls {
            width: 100%;
          }

          .embedded-view-toggle {
            width: 100%;
            justify-content: space-between;
            flex-wrap: wrap;
          }

          .embedded-source-chip {
            width: 100%;
            max-width: 100%;
          }

          .embedded-view-buttons {
            flex: 1 1 auto;
          }

          .embedded-view-btn {
            flex: 1 1 auto;
          }

          .embedded-back-btn {
            width: 100%;
          }
        }
      </style>
      <div class="app-shell">
        <header class="browser-header">
          <div class="brand">
            <h1 class="title">Open Collections Browser</h1>
            <p id="browserContext" class="context">Read-only browsing for Open Collections manifests.</p>
            <p id="browserManifest" class="manifest" hidden></p>
          </div>
          <div class="header-meta">
            <span class="mode-chip">Read-only</span>
            <span id="browserHeaderStatus" class="header-status" data-tone="neutral">Load a collection manifest to browse.</span>
          </div>
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
		const collectionTitle = this.state.collection?.title?.trim();
		const itemCount = this.state.collection?.items?.length || 0;
		const contextText = collectionTitle
			? `${collectionTitle} (${itemCount} item${itemCount === 1 ? "" : "s"})`
			: "Read-only browsing for Open Collections manifests.";
		const manifestText = this.state.currentManifestUrl || "";
		return { contextText, manifestText };
	}

	viewportModel() {
		const items = this.getCurrentItems();
		const collections = Array.isArray(this.state.collectionsIndex)
			? this.state.collectionsIndex
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
		const allBrowseEntities = buildAllBrowseEntities({
			sourceCards,
			collectionCards,
			itemCards,
		});
		if (this.isEmbeddedRuntime() && this.state.viewMode === "all") {
			return {
				viewportTitle: "All",
				viewportSubtitle: `${allBrowseEntities.length} browse entit${allBrowseEntities.length === 1 ? "y" : "ies"} across sources, collections, and items.`,
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
			return {
				viewportTitle: "Collections",
				viewportSubtitle:
					collections.length > 0
						? `${collections.length} collection${collections.length === 1 ? "" : "s"} available. Select one to browse items.`
						: "No collections found in this source.",
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
			? `${items.length} item${items.length === 1 ? "" : "s"} in ${focusedCollection.label}. Use Back to collections to return.`
			: this.isEmbeddedRuntime()
				? `${items.length} item${items.length === 1 ? "" : "s"} across all collections.`
				: items.length > 0
					? `${items.length} item${items.length === 1 ? "" : "s"} available. Select a card to open media.`
					: "Load a collection to browse its items.";

		return {
			viewportTitle: "Items",
			viewportSubtitle: subtitle,
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
		const context = this.dom?.browserContext;
		const manifest = this.dom?.browserManifest;
		const status = this.dom?.browserHeaderStatus;
		const model = this.headerModel();

		if (context) {
			context.textContent = model.contextText;
		}

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
		this.dom.viewerDialog?.setItem(item);
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
			const collection = normalizeCollection(json);
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
