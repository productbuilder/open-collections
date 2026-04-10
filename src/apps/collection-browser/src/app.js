import {
	ComponentBase,
	normalizeCollection,
} from "../../../shared/library-core/src/index.js";
import {
	FILTER_OPTION_STATUS,
	createBrowseShellQueryState,
	normalizeBrowseShellQueryPatch,
	normalizeBrowseShellQueryState,
} from "../../../shared/data/query/browse-shell-query-contract.js";
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
import {
	appendBrowseFeedStreamChunk,
	buildBrowseFeedEntities,
	createBrowseFeedStreamSession,
	orderBrowseModeCards,
} from "./state/feed/index.js";
import { createFeedAppendScheduler } from "./rendering/feed-append-scheduler.js";
import { preserveScrollPosition } from "./rendering/scroll-preservation.js";
import {
	isShellListAdapterModeEnabled,
	shouldRunEmbeddedLegacyCollectionLoading,
} from "./shell-adapter-mode.js";
import "./components/browser-collection-browser.js";
import "./components/browser-manifest-controls.js";
import "./components/browser-metadata-panel.js";
import "./components/browser-viewer-dialog.js";

const ALL_MODE_INITIAL_CHUNK_SIZE = 24;
const ALL_MODE_APPEND_CHUNK_SIZE = 16;
const GENERIC_MEDIA_TYPES = new Set(["image", "video", "audio", "text", "application"]);

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

function toFilterOptionEntries(counts = new Map()) {
	return [...counts.entries()]
		.sort(([leftValue], [rightValue]) => leftValue.localeCompare(rightValue))
		.map(([value, count]) => ({
			value,
			label: value,
			count,
		}));
}

function collectTypeValues(item = {}) {
	const directType = String(item?.type || "").trim();
	if (directType) {
		return [directType];
	}
	const mediaType = String(item?.media?.type || "").trim().toLowerCase();
	if (!mediaType) {
		return [];
	}
	const slashIndex = mediaType.indexOf("/");
	if (slashIndex <= 0 || slashIndex >= mediaType.length - 1) {
		return [mediaType];
	}
	const subtype = mediaType.slice(slashIndex + 1).trim();
	const topLevel = mediaType.slice(0, slashIndex).trim();
	if (subtype && !GENERIC_MEDIA_TYPES.has(subtype)) {
		return [subtype];
	}
	return topLevel ? [topLevel] : [mediaType];
}

function normalizeTypeFilterToken(value = "") {
	return String(value ?? "").trim().toLowerCase();
}

function createActiveTypeFilterSet(queryState = {}) {
	const sourceTypes = Array.isArray(queryState?.filters?.types)
		? queryState.filters.types
		: Array.isArray(queryState?.query?.types)
			? queryState.query.types
			: [];
	const normalizedTypes = sourceTypes
		.map((value) => normalizeTypeFilterToken(value))
		.filter(Boolean);
	return new Set(normalizedTypes);
}

function itemMatchesActiveTypeFilters(item = {}, activeTypeFilters = new Set()) {
	if (!(activeTypeFilters instanceof Set) || activeTypeFilters.size === 0) {
		return true;
	}
	const typeValues = collectTypeValues(item).map((value) =>
		normalizeTypeFilterToken(value),
	);
	if (typeValues.length === 0) {
		return false;
	}
	return typeValues.some((value) => activeTypeFilters.has(value));
}

function filterItemsByActiveTypeFilters(items = [], queryState = {}) {
	if (!Array.isArray(items) || items.length === 0) {
		return [];
	}
	const activeTypeFilters = createActiveTypeFilterSet(queryState);
	if (activeTypeFilters.size === 0) {
		return items;
	}
	return items.filter((item) =>
		itemMatchesActiveTypeFilters(item, activeTypeFilters),
	);
}

class CollectionBrowserElement extends ComponentBase {
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
			// Explicit source scope set by user navigation; empty = cross-source browse.
			explicitEmbeddedSourceId: "",
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
			hasResolvedFilterOptionData: false,
			browseShellQuery: createBrowseShellQueryState(),
			shellListProjection: null,
			shellAllModeFeedState: {
				key: "",
				renderedCount: 0,
				exhausted: true,
			},
			allModeFeedSession: null,
			isAppendingAllModeFeedChunk: false,
		};
		// Temporary feed diagnostics: tracks last payload signature to avoid noisy logs.
		this.lastBrowseDiagnosticsSignature = "";
		this.shadow = this.attachShadow({ mode: "open" });
		this.handleBrowseQueryPatch = this.onBrowseQueryPatch.bind(this);
		this.handleShellListProjection = this.onShellListProjection.bind(this);
		this.handleShellRuntimeState = this.onShellRuntimeState.bind(this);
		this.allModeAppendScheduler = createFeedAppendScheduler();
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
		this.addEventListener("browse-query-patch", this.handleBrowseQueryPatch);
		this.addEventListener("browse-shell-list-projection", this.handleShellListProjection);
		this.addEventListener("browse-shell-runtime-state", this.handleShellRuntimeState);
		this.setStatus(this.state.statusText, this.state.statusTone);
		this.renderHeader();
		this.renderManifestControls();
		this.renderEmbeddedSourceControls();
		this.renderViewport();
		this.renderMetadata();
		this.syncMetadataPanelVisibility();
		const embeddedRuntime = this.isEmbeddedRuntime();
		const shellListAdapterMode = this.isShellListAdapterMode();
		if (embeddedRuntime) {
			if (shellListAdapterMode) {
				this.state.isLoadingCollection = true;
				this.state.hasResolvedFilterOptionData = false;
				this.setStatus("Waiting for shell data...", "neutral");
				this.renderViewport();
				return;
			}
			if (
				shouldRunEmbeddedLegacyCollectionLoading({
					embeddedRuntime,
					shellListAdapterAttribute: this.hasAttribute("data-shell-list-adapter"),
				})
			) {
				void this.initializeEmbeddedSources();
			}
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
		this.removeEventListener("browse-query-patch", this.handleBrowseQueryPatch);
		this.removeEventListener("browse-shell-list-projection", this.handleShellListProjection);
		this.removeEventListener("browse-shell-runtime-state", this.handleShellRuntimeState);
		if (this._handleWindowResize) {
			window.removeEventListener("resize", this._handleWindowResize);
			this._handleWindowResize = null;
		}
		this._eventsBound = false;
		this.allModeAppendScheduler.cancel();
	}

	onBrowseQueryPatch(event) {
		const detail =
			event?.detail && typeof event.detail === "object" ? event.detail : {};
		this.applyBrowseQueryPatch(detail);
		this.renderViewport();
	}

	applyBrowseQueryPatch(patch = {}) {
		const normalizedPatch = normalizeBrowseShellQueryPatch(
			patch,
			this.state.browseShellQuery?.query,
		);
		this.state.browseShellQuery = normalizeBrowseShellQueryState(
			{
				...this.state.browseShellQuery,
				query: normalizedPatch.query,
				filters: normalizedPatch.filters,
			},
			this.state.browseShellQuery || createBrowseShellQueryState(),
		);
	}

	isShellListAdapterMode() {
		return isShellListAdapterModeEnabled({
			embeddedRuntime: this.isEmbeddedRuntime(),
			shellListAdapterAttribute: this.hasAttribute("data-shell-list-adapter"),
		});
	}

	onShellRuntimeState(event) {
		if (!this.isShellListAdapterMode()) {
			return;
		}
		const detail =
			event?.detail && typeof event.detail === "object" ? event.detail : {};
		const diagnosticsSummary =
			detail?.diagnosticsSummary && typeof detail.diagnosticsSummary === "object"
				? detail.diagnosticsSummary
				: {};
		const status = String(diagnosticsSummary.ingestionStatus || "").trim();
		if (status === "loading" || status === "idle") {
			this.state.isLoadingCollection = true;
			this.state.hasResolvedFilterOptionData = false;
			this.setStatus("Loading shell browser data...", "neutral");
			this.renderEmbeddedSourceControls();
			this.renderViewport();
			return;
		}
		if (status === "error") {
			this.state.isLoadingCollection = false;
			this.state.hasResolvedFilterOptionData = true;
			this.setStatus("Shell browser data failed to load.", "warn");
			this.renderEmbeddedSourceControls();
			this.renderViewport();
			return;
		}
	}

	onShellListProjection(event) {
		if (!this.isShellListAdapterMode()) {
			return;
		}
		const detail =
			event?.detail && typeof event.detail === "object" ? event.detail : {};
		const projection =
			detail?.projection && typeof detail.projection === "object"
				? detail.projection
				: null;
		if (!projection) {
			return;
		}
		this.state.shellListProjection = projection;
		const projectionModel =
			projection?.model && typeof projection.model === "object"
				? projection.model
				: {};
		const incomingSessionKey = String(projectionModel.allFeedSessionKey || "").trim();
		const incomingInitialCount = Array.isArray(projectionModel.allBrowseEntities)
			? projectionModel.allBrowseEntities.length
			: 0;
		const incomingExhausted = Boolean(projectionModel.allFeedExhausted);
		const previousSessionKey = String(
			this.state.shellAllModeFeedState?.key || "",
		).trim();
		if (incomingSessionKey && incomingSessionKey !== previousSessionKey) {
			this.state.shellAllModeFeedState = {
				key: incomingSessionKey,
				renderedCount: incomingInitialCount,
				exhausted: incomingExhausted,
			};
		} else if (!incomingSessionKey) {
			this.state.shellAllModeFeedState = {
				key: "",
				renderedCount: incomingInitialCount,
				exhausted: true,
			};
		}
		this.state.isLoadingCollection = false;
		this.state.hasResolvedFilterOptionData = true;
		const totals = projection?.total?.filtered || projection?.diagnostics?.filteredTotals || {};
		const filteredItemCount = Number(totals.items || 0);
		this.setStatus(
			`Shell browse data ready (${filteredItemCount} item${filteredItemCount === 1 ? "" : "s"} visible).`,
			"ok",
		);
		this.renderEmbeddedSourceControls();
		this.renderViewport();
		this.renderMetadata();
		this.renderViewer();
		this.syncMetadataPanelVisibility();
	}

	buildAllModeFeedSessionKey({
		browseContext = {},
		sourceCards = [],
		collectionCards = [],
		itemCards = [],
	} = {}) {
		const sourceKeys = sourceCards.map((card) => String(card?.actionValue || card?.id || "").trim());
		const collectionKeys = collectionCards.map((card) =>
			String(card?.actionValue || card?.manifestUrl || card?.id || "").trim(),
		);
		const itemKeys = itemCards.map((card) => String(card?.actionValue || card?.id || "").trim());
		return JSON.stringify({
			scope: String(browseContext.scope || "").trim(),
			sourceScopeId: String(browseContext.sourceScopeId || "").trim(),
			selectedCollectionManifestUrl: String(
				browseContext.selectedCollectionManifestUrl || "",
			).trim(),
			sourceKeys,
			collectionKeys,
			itemKeys,
		});
	}

	buildAllModeExposureNamespace({ browseContext = {} } = {}) {
		return JSON.stringify({
			scope: String(browseContext.scope || "").trim(),
			sourceScopeId: String(browseContext.sourceScopeId || "").trim(),
			selectedCollectionManifestUrl: String(
				browseContext.selectedCollectionManifestUrl || "",
			).trim(),
		});
	}

	resolveAllModeFeedEntities({
		browseContext = {},
		sourceCards = [],
		collectionCards = [],
		itemCards = [],
	} = {}) {
		const sessionKey = this.buildAllModeFeedSessionKey({
			browseContext,
			sourceCards,
			collectionCards,
			itemCards,
		});
		const hasMatchingSession =
			this.state.allModeFeedSession &&
			String(this.state.allModeFeedSession.key || "") === sessionKey;
		if (!hasMatchingSession) {
			const exposureNamespace = this.buildAllModeExposureNamespace({
				browseContext,
			});
			const session = createBrowseFeedStreamSession({
				mode: "all",
				sourceCards,
				collectionCards,
				itemCards,
				exposureNamespace,
			});
			const initialChunk = appendBrowseFeedStreamChunk(session, {
				count: ALL_MODE_INITIAL_CHUNK_SIZE,
			});
			this.state.allModeFeedSession = {
				key: sessionKey,
				session,
				renderedEntities: initialChunk,
				exhausted: Boolean(session?.exhausted),
			};
		}

		return {
			sessionKey,
			entities: Array.isArray(this.state.allModeFeedSession?.renderedEntities)
				? this.state.allModeFeedSession.renderedEntities
				: [],
			exhausted: Boolean(this.state.allModeFeedSession?.exhausted),
		};
	}

	appendNextAllModeFeedChunk() {
		if (this.isShellListAdapterMode()) {
			const projection = this.state.shellListProjection;
			const model =
				projection?.model && typeof projection.model === "object"
					? projection.model
					: null;
			if (!model || this.state.viewMode !== "all") {
				return;
			}
			const fullEntities = Array.isArray(model.fullAllBrowseEntities)
				? model.fullAllBrowseEntities
				: [];
			if (!fullEntities.length) {
				return;
			}
			const feedState =
				this.state.shellAllModeFeedState &&
				typeof this.state.shellAllModeFeedState === "object"
					? this.state.shellAllModeFeedState
					: { key: "", renderedCount: 0, exhausted: true };
			if (feedState.exhausted) {
				this.state.isAppendingAllModeFeedChunk = false;
				return;
			}
			const currentCount = Number(feedState.renderedCount || 0);
			const nextCount = Math.min(
				fullEntities.length,
				currentCount + ALL_MODE_APPEND_CHUNK_SIZE,
			);
			this.state.shellAllModeFeedState = {
				...feedState,
				renderedCount: nextCount,
				exhausted: nextCount >= fullEntities.length,
			};
			this.state.isAppendingAllModeFeedChunk = false;
			this.renderViewport();
			return;
		}
		const activeSession = this.state.allModeFeedSession;
		if (
			!activeSession ||
			!activeSession.session ||
			activeSession.exhausted ||
			this.state.viewMode !== "all" ||
			this.state.isAppendingAllModeFeedChunk
		) {
			return;
		}
		this.state.isAppendingAllModeFeedChunk = true;
		const nextChunk = appendBrowseFeedStreamChunk(activeSession.session, {
			count: ALL_MODE_APPEND_CHUNK_SIZE,
		});
		if (nextChunk.length > 0) {
			activeSession.renderedEntities = [
				...(activeSession.renderedEntities || []),
				...nextChunk,
			];
		}
		activeSession.exhausted = Boolean(activeSession.session.exhausted);
		this.state.isAppendingAllModeFeedChunk = false;
		if (nextChunk.length > 0 || activeSession.exhausted) {
			this.renderViewport();
		}
	}

	requestAppendNextAllModeFeedChunk() {
		if (this.state.isAppendingAllModeFeedChunk) {
			return;
		}
		this.state.isAppendingAllModeFeedChunk = true;
		this.renderViewport();
		this.allModeAppendScheduler.request(() => {
			this.appendNextAllModeFeedChunk();
		});
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
			explicitEmbeddedSourceId: this.state.explicitEmbeddedSourceId || "",
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
		this.state.explicitEmbeddedSourceId =
			context.explicitEmbeddedSourceId || "";
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

		const shellProjection = this.state.shellListProjection;
		const shellSourceCount = Array.isArray(shellProjection?.sourceCards)
			? shellProjection.sourceCards.length
			: 0;
		const shellCollectionCount = Array.isArray(shellProjection?.collectionCards)
			? shellProjection.collectionCards.length
			: 0;
		const shellItemCount = Array.isArray(shellProjection?.itemCards)
			? shellProjection.itemCards.length
			: 0;
		const canUseCollections = this.isShellListAdapterMode()
			? shellCollectionCount > 0
			: this.state.collectionsIndex.length > 0;
		const canUseItems = this.isShellListAdapterMode()
			? shellItemCount > 0
			: this.state.sourceItems.length > 0;
		const canUseAll = this.isShellListAdapterMode()
			? shellSourceCount > 0 || shellCollectionCount > 0 || shellItemCount > 0
			: this.state.embeddedSourceCards.length > 0 ||
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
		const shellProjection = this.state.shellListProjection;
		const shellSourceCount = Array.isArray(shellProjection?.sourceCards)
			? shellProjection.sourceCards.length
			: 0;
		const shellCollectionCount = Array.isArray(shellProjection?.collectionCards)
			? shellProjection.collectionCards.length
			: 0;
		const shellItemCount = Array.isArray(shellProjection?.itemCards)
			? shellProjection.itemCards.length
			: 0;
		if (
			nextMode === "all" &&
			!(
				this.isShellListAdapterMode()
					? shellSourceCount || shellCollectionCount || shellItemCount
					: this.state.embeddedSourceCards.length ||
						this.state.collectionsIndex.length ||
						this.state.sourceItems.length
			)
		) {
			return;
		}
		if (
			nextMode === "collections" &&
			!(
				this.isShellListAdapterMode()
					? shellCollectionCount
					: this.state.collectionsIndex.length
			)
		) {
			return;
		}
		if (
			nextMode === "items" &&
			!(
				this.isShellListAdapterMode() ? shellItemCount : this.state.sourceItems.length
			)
		) {
			return;
		}
		this.state.viewMode = nextMode;
		if (nextMode === "sources") {
			// Sources mode is always global; clear drill-scoped context before rendering.
			this.state.explicitEmbeddedSourceId = "";
			this.state.selectedCollectionManifestUrl = "";
			this.state.selectedItemId = null;
			this.state.viewerItemId = null;
			this.state.mobileMetadataOpen = false;
			this.closeViewer();
			if (this.isShellListAdapterMode()) {
				this.applyBrowseQueryPatch({
					sourceIds: [],
					collectionManifestUrls: [],
				});
			}
		}
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
		if (this.isShellListAdapterMode()) {
			this.applyBrowseQueryPatch({
				sourceIds: [sourceId],
			});
			this.state.viewMode = "collections";
			this.renderEmbeddedSourceControls();
			this.renderViewport();
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
		if (focusedCollection?.sourceId) {
			// Keep startup/default source selection separate from explicit browse scope.
			const scopedSourceId = String(focusedCollection.sourceId).trim();
			this.state.activeEmbeddedSourceId = scopedSourceId;
			this.state.explicitEmbeddedSourceId = scopedSourceId;
		}
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
		if (this.isShellListAdapterMode()) {
			this.applyBrowseQueryPatch({
				collectionManifestUrls: [manifestUrl],
			});
			this.state.viewMode = "items";
			this.renderEmbeddedSourceControls();
			this.renderViewport();
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
						sourceTitle: descriptor.title || source.label || "",
						sourceDisplayName:
							descriptor.organizationName ||
							descriptor.title ||
							source.label ||
							"",
						sourceOrganizationName:
							descriptor.organizationName || source.organizationName || "",
						sourceCuratorName:
							descriptor.curatorName || source.curatorName || "",
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
				sourceTitle: descriptor.title || source.label || "",
				sourceDisplayName:
					source.organizationName ||
					descriptor.organizationName ||
					descriptor.title ||
					source.label ||
					"",
				sourceOrganizationName:
					source.organizationName || descriptor.organizationName || "",
				sourceCuratorName:
					source.curatorName || descriptor.curatorName || "",
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
		return this.buildBrowseCandidatePools().collections;
	}

	resolveExplicitEmbeddedSourceId() {
		const explicitSourceId = String(
			this.state.explicitEmbeddedSourceId || "",
		).trim();
		const selectedManifestUrl = String(
			this.state.selectedCollectionManifestUrl || "",
		).trim();
		if (selectedManifestUrl) {
			const selectedCollection = this.state.collectionsIndex.find(
				(entry) => String(entry?.manifestUrl || "").trim() === selectedManifestUrl,
			);
			const selectedCollectionSourceId = String(
				selectedCollection?.sourceId || "",
			).trim();
			if (selectedCollectionSourceId) {
				return selectedCollectionSourceId;
			}
		}
		return explicitSourceId;
	}

	getCurrentItems() {
		if (this.isShellListAdapterMode()) {
			const modelItems = this.state.shellListProjection?.model?.items;
			return Array.isArray(modelItems) ? modelItems : [];
		}
		return this.buildBrowseCandidatePools().items;
	}

	resolveBrowseContext() {
		if (!this.isEmbeddedRuntime()) {
			return {
				scope: "collection",
				sourceScopeId: "",
				selectedCollectionManifestUrl: "",
				selectedCollection: null,
			};
		}

		const selectedManifestUrl = String(
			this.state.selectedCollectionManifestUrl || "",
		).trim();
		const selectedCollection = selectedManifestUrl
			? this.state.collectionsIndex.find(
					(entry) => String(entry?.manifestUrl || "").trim() === selectedManifestUrl,
				) || null
			: null;
		const selectedCollectionSourceId = String(
			selectedCollection?.sourceId || "",
		).trim();
		const sourceScopeId =
			selectedCollectionSourceId || this.resolveExplicitEmbeddedSourceId();
		const scope = selectedManifestUrl
			? "collection"
			: sourceScopeId
				? "source"
				: "all";
		return {
			scope,
			sourceScopeId,
			selectedCollectionManifestUrl: selectedManifestUrl,
			selectedCollection,
		};
	}

	buildBrowseCandidatePools(context = this.resolveBrowseContext()) {
		const collectionsIndex = Array.isArray(this.state.collectionsIndex)
			? this.state.collectionsIndex
			: [];
		const sourceItems = Array.isArray(this.state.sourceItems)
			? this.state.sourceItems
			: [];
		const sourceCards = Array.isArray(this.state.embeddedSourceCards)
			? this.state.embeddedSourceCards
			: [];

		if (!this.isEmbeddedRuntime()) {
			return {
				sources: [],
				collections: collectionsIndex,
				items: this.state.collection?.items || [],
			};
		}

		const collections = context.sourceScopeId
			? collectionsIndex.filter(
					(entry) => String(entry.sourceId || "").trim() === context.sourceScopeId,
				)
			: collectionsIndex;
		const items =
			context.scope === "collection"
				? context.selectedCollection?.collection?.items || []
				: context.sourceScopeId
					? sourceItems.filter((item) =>
							String(item.sourceCollectionId || "").startsWith(
								`${context.sourceScopeId}::`,
							),
						)
					: sourceItems;
		return {
			sources: sourceCards,
			collections,
			items,
		};
	}

	resolveGlobalSourceCards() {
		if (!this.isEmbeddedRuntime()) {
			return [];
		}
		const baseSources = Array.isArray(this.state.embeddedSources)
			? this.state.embeddedSources
			: [];
		const hydratedCardsById = new Map(
			(Array.isArray(this.state.embeddedSourceCards)
				? this.state.embeddedSourceCards
				: []
			).map((card) => [String(card?.id || "").trim(), card]),
		);
		return baseSources.map((source) => {
			const sourceId = String(source?.id || "").trim();
			const hydratedCard = hydratedCardsById.get(sourceId);
			return {
				id: sourceId,
				label: source?.label || hydratedCard?.label || "Source",
				organizationName:
					hydratedCard?.organizationName ||
					source?.organizationName ||
					source?.label ||
					"Source",
				curatorName: hydratedCard?.curatorName || source?.curatorName || "",
				placeName: hydratedCard?.placeName || source?.placeName || "",
				countryName: hydratedCard?.countryName || source?.countryName || "",
				countryCode: hydratedCard?.countryCode || source?.countryCode || "",
				subtitle: hydratedCard?.subtitle || "",
				countLabel: hydratedCard?.countLabel || "",
				previewRows: Array.isArray(hydratedCard?.previewRows)
					? hydratedCard.previewRows
					: [],
				previewImages: Array.isArray(hydratedCard?.previewImages)
					? hydratedCard.previewImages
					: [],
				sourceType: source?.sourceType || hydratedCard?.sourceType || "",
			};
		});
	}

	openItemFromCard(itemId) {
		if (!itemId) {
			return;
		}
		if (this.isEmbeddedRuntime()) {
			const sourceItem = Array.isArray(this.state.sourceItems)
				? this.state.sourceItems.find((item) => item?.id === itemId)
				: null;
			if (sourceItem?.sourceCollectionManifestUrl) {
				this.state.selectedCollectionManifestUrl = String(
					sourceItem.sourceCollectionManifestUrl,
				).trim();
			}
			const sourceIdFromItem = String(
				sourceItem?.sourceCollectionId || "",
			)
				.split("::")[0]
				.trim();
			if (sourceIdFromItem) {
				this.state.activeEmbeddedSourceId = sourceIdFromItem;
				this.state.explicitEmbeddedSourceId = sourceIdFromItem;
			}
		}
		this.preserveViewportScroll(() => {
			this.selectItem(itemId);
			this.openViewer(itemId);
		});
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
		this.state.hasResolvedFilterOptionData = false;
		this.state.isLoadingCollection = true;
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
			this.state.isLoadingCollection = false;
			this.state.hasResolvedFilterOptionData = true;
			this.renderEmbeddedSourceControls();
			this.renderViewport();
			return;
		}

		this.state.activeEmbeddedSourceId =
			this.state.activeEmbeddedSourceId || multiCollectionSources[0]?.id || "";
		this.state.explicitEmbeddedSourceId = "";
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
		} finally {
			this.state.isLoadingCollection = false;
			this.state.hasResolvedFilterOptionData = true;
			this.renderEmbeddedSourceControls();
			this.renderViewport();
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
		this.state.explicitEmbeddedSourceId = source.id;
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

          :host([data-workbench-embed]) .app-shell,
          :host([data-shell-embed]) .app-shell,
          :host([data-oc-app-mode="embedded"]) .app-shell {
            min-height: 0;
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

	resolveEntityId(entity = {}) {
		return String(
			entity?.id ||
				entity?.actionValue ||
				entity?.manifestUrl ||
				entity?.sourceCollectionManifestUrl ||
				"",
		).trim();
	}

	computeUniqueEntityCount(entities = []) {
		const uniqueIds = new Set();
		for (const entity of Array.isArray(entities) ? entities : []) {
			const entityId = this.resolveEntityId(entity);
			if (entityId) {
				uniqueIds.add(entityId);
			}
		}
		return uniqueIds.size;
	}

	buildAllModeEntityKey(entity = {}) {
		const entityType = String(entity?.entityType || entity?.type || "unknown").trim();
		const entityId = this.resolveEntityId(entity) || "__missing_id__";
		return `${entityType}::${entityId}`;
	}

	logBrowseDiagnostics({
		browseContext = {},
		sourceCards = [],
		collectionCards = [],
		itemCards = [],
		allBrowseEntities = [],
		allFeedSessionKey = "",
		allFeedExhausted = false,
	} = {}) {
		if (!BROWSER_CONFIG.enableBrowseDiagnostics) {
			return;
		}
		const allEntities = Array.isArray(allBrowseEntities) ? allBrowseEntities : [];
		const allRenderedCount = allEntities.length;
		const allUniqueKeys = new Set(allEntities.map((entity) => this.buildAllModeEntityKey(entity)));
		const allUniqueRenderedCount = allUniqueKeys.size;
		const diagnostics = {
			scope: String(browseContext.scope || "").trim(),
			sourceScopeId: String(browseContext.sourceScopeId || "").trim(),
			selectedCollectionManifestUrl: String(
				browseContext.selectedCollectionManifestUrl || "",
			).trim(),
			sourceCount: this.computeUniqueEntityCount(sourceCards),
			collectionCount: this.computeUniqueEntityCount(collectionCards),
			itemCount: this.computeUniqueEntityCount(itemCards),
			allModeRenderedCount: allRenderedCount,
			allModeUniqueRenderedCount: allUniqueRenderedCount,
			allModeDuplicateCount: Math.max(0, allRenderedCount - allUniqueRenderedCount),
			allModeHasDuplicates: allRenderedCount > allUniqueRenderedCount,
			allModeFeedExhausted: Boolean(allFeedExhausted),
		};
		const signature = JSON.stringify({
			...diagnostics,
			allFeedSessionKey: String(allFeedSessionKey || "").trim(),
		});
		if (signature === this.lastBrowseDiagnosticsSignature) {
			return;
		}
		this.lastBrowseDiagnosticsSignature = signature;
		console.info("[collection-browser] temporary feed diagnostics", diagnostics);
	}

	viewportModel() {
		if (this.isShellListAdapterMode()) {
			const projection = this.state.shellListProjection;
			if (!projection || typeof projection !== "object") {
				return {
					viewportTitle: "Browse and collect",
					viewportSubtitle: "Loading shell browser data...",
					showBack: false,
					viewMode: this.state.viewMode || "all",
					sourceCards: [],
					collectionCards: [],
					itemCards: [],
					allBrowseEntities: [],
					fullAllBrowseEntities: [],
					allFeedSessionKey: "",
					allFeedExhausted: true,
					isAppendingAllFeedChunk: false,
					sources: [],
					collections: [],
					items: [],
					selectedCollectionManifestUrl: "",
					selectedItemId: this.state.selectedItemId,
					isLoading: this.state.isLoadingCollection,
				};
			}
			const model =
				projection?.model && typeof projection.model === "object"
					? projection.model
					: {};
			if ((this.state.viewMode || model.viewMode || "all") === "sources") {
				const sourceCards = Array.isArray(model.sourceCardsForSourcesMode)
					? model.sourceCardsForSourcesMode
					: Array.isArray(model.sourceCards)
						? model.sourceCards
						: [];
				return {
					...model,
					viewportTitle: "Sources",
					viewportSubtitle:
						sourceCards.length > 0
							? `${sourceCards.length} source${sourceCards.length === 1 ? "" : "s"} available. Select one to continue.`
							: "No sources available.",
					showBack: false,
					viewMode: "sources",
					sourceCards,
					collectionCards: [],
					itemCards: [],
					sources: sourceCards,
					collections: [],
					items: [],
					selectedCollectionManifestUrl: "",
					selectedItemId: null,
					isLoading: this.state.isLoadingCollection,
				};
			}
			if ((this.state.viewMode || model.viewMode || "all") === "all") {
				const fullEntities = Array.isArray(model.fullAllBrowseEntities)
					? model.fullAllBrowseEntities
					: Array.isArray(model.allBrowseEntities)
						? model.allBrowseEntities
						: [];
				const feedState =
					this.state.shellAllModeFeedState &&
					typeof this.state.shellAllModeFeedState === "object"
						? this.state.shellAllModeFeedState
						: { key: "", renderedCount: 0, exhausted: true };
				const renderedCount = Math.max(
					0,
					Math.min(
						fullEntities.length,
						Number(feedState.renderedCount || model.allBrowseEntities?.length || 0),
					),
				);
				return {
					...model,
					allBrowseEntities: fullEntities.slice(0, renderedCount),
					allFeedExhausted:
						feedState.exhausted || renderedCount >= fullEntities.length,
					isAppendingAllFeedChunk: this.state.isAppendingAllModeFeedChunk,
					viewMode: this.state.viewMode || model.viewMode || "all",
					isLoading: this.state.isLoadingCollection,
					selectedItemId: this.state.selectedItemId || model.selectedItemId || null,
				};
			}
			return {
				...model,
				viewMode: this.state.viewMode || model.viewMode || "all",
				isLoading: this.state.isLoadingCollection,
				selectedItemId: this.state.selectedItemId || model.selectedItemId || null,
			};
		}
		// Resolve one current browse context and derive all mode slices from it.
		const browseContext = this.resolveBrowseContext();
		const candidatePools = this.buildBrowseCandidatePools(browseContext);
		const { sources, collections, items } = candidatePools;
		const filteredItems = filterItemsByActiveTypeFilters(
			items,
			this.state.browseShellQuery,
		);
		// Sources mode is intentionally global/top-level for now.
		const globalSourceCards = this.resolveGlobalSourceCards();
		const sourceCards = buildSourceBrowseCardModels(sources, {
			activeSourceId: this.state.activeEmbeddedSourceId || "",
		});
		const sourceCardsForSourcesMode = buildSourceBrowseCardModels(
			globalSourceCards,
			{
				activeSourceId: this.state.activeEmbeddedSourceId || "",
			},
		);
		const collectionCards = buildCollectionBrowseCardModels(collections, {
			selectedManifestUrl: this.state.selectedCollectionManifestUrl || "",
		});
		const itemCards = buildItemBrowseCardModels(filteredItems, {
			selectedItemId: this.state.selectedItemId,
		});
		const allModeExposureNamespace = this.buildAllModeExposureNamespace({
			browseContext,
		});
		const orderedCollectionCards = orderBrowseModeCards({
			mode: "collections",
			collectionCards,
			exposureNamespace: allModeExposureNamespace,
		});
		const orderedItemCards = orderBrowseModeCards({
			mode: "items",
			itemCards,
			exposureNamespace: allModeExposureNamespace,
		});
		const fullAllBrowseEntities = buildBrowseFeedEntities({
			mode: "all",
			sourceCards,
			collectionCards: orderedCollectionCards,
			itemCards: orderedItemCards,
			exposureNamespace: allModeExposureNamespace,
		});
		let allBrowseEntities = fullAllBrowseEntities;
		let allModeRenderedEntities = [];
		let allFeedSessionKey = "";
		let allFeedExhausted = false;
		if (this.state.viewMode === "all") {
			const allFeed = this.resolveAllModeFeedEntities({
				browseContext,
				sourceCards,
				collectionCards: orderedCollectionCards,
				itemCards: orderedItemCards,
			});
			allBrowseEntities = allFeed.entities;
			allModeRenderedEntities = allFeed.entities;
			allFeedSessionKey = allFeed.sessionKey;
			allFeedExhausted = allFeed.exhausted;
		} else {
			this.state.allModeFeedSession = null;
			this.state.isAppendingAllModeFeedChunk = false;
		}
		this.logBrowseDiagnostics({
			browseContext,
			sourceCards,
			collectionCards: orderedCollectionCards,
			itemCards: orderedItemCards,
			allBrowseEntities: allModeRenderedEntities,
			allFeedSessionKey,
			allFeedExhausted,
		});
		const showBackInViewport =
			this.canGoBackEmbeddedNav() &&
			(this.state.viewMode === "collections" ||
				this.state.viewMode === "items");
		const explicitScopedSourceId = browseContext.sourceScopeId;
		const activeSource = explicitScopedSourceId
			? this.state.embeddedSources.find(
					(source) => source.id === explicitScopedSourceId,
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
				collectionCards: orderedCollectionCards,
				itemCards: orderedItemCards,
				allBrowseEntities,
				fullAllBrowseEntities,
				allFeedSessionKey,
				allFeedExhausted,
				isAppendingAllFeedChunk: this.state.isAppendingAllModeFeedChunk,
				activeSourceId: this.state.activeEmbeddedSourceId || "",
				collections,
				selectedCollectionManifestUrl:
					this.state.selectedCollectionManifestUrl || "",
				items: filteredItems,
				selectedItemId: this.state.selectedItemId,
				isLoading: this.state.isLoadingCollection,
			};
		}
		if (this.isEmbeddedRuntime() && this.state.viewMode === "sources") {
			return {
				viewportTitle: "Sources",
				viewportSubtitle:
					sourceCardsForSourcesMode.length > 0
						? `${sourceCardsForSourcesMode.length} source${sourceCardsForSourcesMode.length === 1 ? "" : "s"} available. Select one to continue.`
						: "No sources available.",
				showBack: showBackInViewport,
				viewMode: "sources",
				sources: globalSourceCards,
				sourceCards: sourceCardsForSourcesMode,
				collectionCards: [],
				itemCards: [],
				allBrowseEntities,
				fullAllBrowseEntities,
				activeSourceId: this.state.activeEmbeddedSourceId || "",
				collections: [],
				selectedCollectionManifestUrl: "",
				items: [],
				selectedItemId: null,
				isLoading: false,
			};
		}
		if (this.isEmbeddedRuntime() && this.state.viewMode === "collections") {
			const isSourceScoped = Boolean(explicitScopedSourceId);
			const scopedCollectionsTitle =
				isSourceScoped && activeSource?.label
					? activeSource.label
					: "Collections";
			const scopedCollectionsSubtitle =
				isSourceScoped && activeSource?.label
					? collections.length > 0
						? `${collections.length} collection${collections.length === 1 ? "" : "s"} in this source.`
						: "No collections found in this source."
					: collections.length > 0
						? `${collections.length} collection${collections.length === 1 ? "" : "s"} available. Select one to browse items.`
						: "No collections found.";
			return {
				viewportTitle: scopedCollectionsTitle,
				viewportSubtitle: scopedCollectionsSubtitle,
				showBack: showBackInViewport,
				viewMode: "collections",
				sources: [],
				sourceCards: [],
				collectionCards: orderedCollectionCards,
				itemCards: [],
				allBrowseEntities,
				fullAllBrowseEntities,
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
			? `${filteredItems.length} item${filteredItems.length === 1 ? "" : "s"}`
			: this.isEmbeddedRuntime()
				? `${filteredItems.length} item${filteredItems.length === 1 ? "" : "s"} across all collections.`
				: filteredItems.length > 0
					? `${filteredItems.length} item${filteredItems.length === 1 ? "" : "s"} available. Select a card to open media.`
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
			itemCards: orderedItemCards,
			allBrowseEntities,
			fullAllBrowseEntities,
			activeSourceId: this.state.activeEmbeddedSourceId || "",
			collections: [],
			selectedCollectionManifestUrl:
				this.state.selectedCollectionManifestUrl || "",
			items: filteredItems,
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

	emitQueryState(model = {}) {
		if (this.isShellListAdapterMode()) {
			const projection = this.state.shellListProjection || {};
			const types = Array.isArray(projection?.filterOptions?.types)
				? projection.filterOptions.types
				: [];
			const options = {
				types: types.map((entry) => ({
					value: String(entry?.value || "").trim(),
					label: String(entry?.label || entry?.value || "").trim(),
					count: Number.isFinite(Number(entry?.count))
						? Number(entry.count)
						: null,
				})).filter((entry) => entry.value),
				categories: [],
			};
			const currentQueryState =
				this.state.browseShellQuery || createBrowseShellQueryState();
			const optionsStatus = this.state.isLoadingCollection
				? FILTER_OPTION_STATUS.LOADING
				: options.types.length
					? FILTER_OPTION_STATUS.READY
					: FILTER_OPTION_STATUS.EMPTY;
			const normalizedState = normalizeBrowseShellQueryState(
				{
					source: {
						app: "collection-browser",
						mode: "collection",
					},
					query: currentQueryState.query,
					filters: currentQueryState.filters,
					options,
					status: {
						loading: this.state.isLoadingCollection,
						filterOptions: optionsStatus,
					},
				},
				currentQueryState,
			);
			this.state.browseShellQuery = normalizedState;
			this.dispatchEvent(
				new CustomEvent("browse-query-state", {
					bubbles: true,
					composed: true,
					detail: normalizedState,
				}),
			);
			return;
		}
		const renderedEntities = Array.isArray(model.allBrowseEntities)
			? model.allBrowseEntities
			: [];
		const renderedItemCards = renderedEntities
			.filter((entity) => String(entity?.browseKind || "").trim() === "item")
			.map((entity) => entity?.item)
			.filter(Boolean);
		const directItemCards = Array.isArray(model.itemCards)
			? model.itemCards.map((card) => card?.item).filter(Boolean)
			: [];
		const itemsFromModel = Array.isArray(model.items) ? model.items : [];
		const items =
			directItemCards.length > 0
				? directItemCards
				: itemsFromModel.length > 0
					? itemsFromModel
					: renderedItemCards;
		const typeCounts = new Map();
		const incrementCount = (counts, value) => {
			const normalized = String(value ?? "").trim();
			if (!normalized) {
				return;
			}
			counts.set(normalized, (counts.get(normalized) || 0) + 1);
		};

		for (const item of items) {
			const uniqueTypes = new Set(collectTypeValues(item));
			for (const typeValue of uniqueTypes) {
				incrementCount(typeCounts, typeValue);
			}
		}

		const options = {
			types: toFilterOptionEntries(typeCounts),
			categories: [],
		};
		const currentQueryState =
			this.state.browseShellQuery || createBrowseShellQueryState();
		const hasOptions = options.types.length > 0;
		const hasResolvedFilterOptions =
			this.state.hasResolvedFilterOptionData ||
			!this.state.isLoadingCollection;
		if (hasResolvedFilterOptions && !this.state.hasResolvedFilterOptionData) {
			this.state.hasResolvedFilterOptionData = true;
		}
		const optionsStatus = !hasResolvedFilterOptions
			? FILTER_OPTION_STATUS.LOADING
			: hasOptions
				? FILTER_OPTION_STATUS.READY
				: FILTER_OPTION_STATUS.EMPTY;
		const normalizedState = normalizeBrowseShellQueryState(
			{
				source: {
					app: "collection-browser",
					mode: "collection",
				},
				query: currentQueryState.query,
				filters: currentQueryState.filters,
				options,
				status: {
					loading: this.state.isLoadingCollection,
					filterOptions: optionsStatus,
				},
			},
			currentQueryState,
		);
		this.state.browseShellQuery = normalizedState;
		this.dispatchEvent(
			new CustomEvent("browse-query-state", {
				bubbles: true,
				composed: true,
				detail: normalizedState,
			}),
		);
	}

	renderViewport() {
		const model = this.viewportModel();
		this.dom?.browserViewport?.update(model);
		this.emitQueryState(model);
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

	captureViewportScrollPosition() {
		return typeof this.dom?.browserViewport?.captureScrollPosition === "function"
			? this.dom.browserViewport.captureScrollPosition()
			: 0;
	}

	restoreViewportScrollPosition(scrollTop = 0) {
		if (typeof this.dom?.browserViewport?.restoreScrollPosition === "function") {
			this.dom.browserViewport.restoreScrollPosition(scrollTop);
		}
	}

	preserveViewportScroll(run) {
		preserveScrollPosition({
			capture: () => this.captureViewportScrollPosition(),
			restore: (scrollTop) => this.restoreViewportScrollPosition(scrollTop),
			run,
		});
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
		this.state.hasResolvedFilterOptionData = false;
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
			this.state.hasResolvedFilterOptionData = true;
			this.renderManifestControls();
			this.renderEmbeddedSourceControls();
			this.renderViewport();
		}
	}
}

if (!customElements.get("collection-browser")) {
	customElements.define("collection-browser", CollectionBrowserElement);
}
