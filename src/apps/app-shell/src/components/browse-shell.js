import {
	FILTER_OPTION_STATUS,
	createBrowseShellQueryState,
	normalizeBrowseShellQueryPatch,
	normalizeBrowseShellQueryState,
} from "../../../../shared/data/query/browse-shell-query-contract.js";
import { createBrowseShellRuntime } from "./browse-shell-runtime.js";
import { buildListSurfaceBridgePayload } from "./list-surface-bridge.js";
import { buildMapSurfaceBridgePayload } from "./map-surface-bridge.js";
import { createBrowseProjectionCache } from "./projection-cache.js";
import { renderCloseIcon } from "../../../../shared/components/icons.js";
import "../../../../shared/ui/primitives/open-collections-browse-header.js";

const BROWSE_MODES = Object.freeze({
	LIST: "collection",
	MAP: "map",
});

function normalizeBrowseMode(value, fallback = BROWSE_MODES.LIST) {
	const normalized = String(value || "")
		.trim()
		.toLowerCase();
	if (normalized === BROWSE_MODES.MAP) {
		return BROWSE_MODES.MAP;
	}
	if (normalized === BROWSE_MODES.LIST || normalized === "list") {
		return BROWSE_MODES.LIST;
	}
	return fallback;
}

function escapeAttribute(value) {
	return String(value ?? "")
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");
}

function toText(value) {
	return String(value ?? "").trim();
}

function toUniqueStringList(value) {
	if (!Array.isArray(value)) {
		return [];
	}
	const unique = new Set();
	for (const entry of value) {
		const text = toText(entry);
		if (text) {
			unique.add(text);
		}
	}
	return [...unique];
}

function normalizeFilterOptionEntries(value) {
	if (!Array.isArray(value)) {
		return [];
	}
	return value
		.map((entry) => {
			if (!entry || typeof entry !== "object") {
				return null;
			}
			const normalizedValue = toText(entry.value);
			if (!normalizedValue) {
				return null;
			}
			const count = Number(entry.count);
			return {
				value: normalizedValue,
				label: toText(entry.label) || normalizedValue,
				count: Number.isFinite(count) ? count : null,
				children: normalizeFilterOptionEntries(entry.children),
			};
		})
		.filter(Boolean);
}

function setElementProperty(element, key, value) {
	if (!element || !key) {
		return;
	}
	if (Object.prototype.hasOwnProperty.call(element, key)) {
		const ownValue = element[key];
		delete element[key];
		if (ownValue !== undefined && value === undefined) {
			element[key] = ownValue;
			return;
		}
	}
	element[key] = value;
}

function countActiveFilters(filterState = {}) {
	const typeCount = toUniqueStringList(filterState?.types).length;
	const mediaTypeCount = toUniqueStringList(filterState?.mediaTypes).length;
	const categoryCount = toUniqueStringList(filterState?.categories).length;
	const hasTimeStart = toText(filterState?.timeRange?.start).length > 0;
	const hasTimeEnd = toText(filterState?.timeRange?.end).length > 0;
	const timeCount = hasTimeStart || hasTimeEnd ? 1 : 0;
	return typeCount + mediaTypeCount + categoryCount + timeCount;
}

class OpenCollectionsBrowseShellElement extends HTMLElement {
	static get observedAttributes() {
		return [
			"browse-mode",
			"default-browse-mode",
			"data-workbench-embed",
			"data-shell-embed",
			"data-oc-app-mode",
			"map-default-center-lat",
			"map-default-center-lng",
			"map-default-zoom",
			"map-default-bounds",
		];
	}

	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.state = {
			browseMode: normalizeBrowseMode(
				this.getAttribute("default-browse-mode"),
				BROWSE_MODES.LIST,
			),
			filterPanelOpen: false,
			filterState: {
				text: "",
				types: [],
				mediaTypes: [],
				categories: [],
				timeRange: {
					start: "",
					end: "",
				},
			},
			filterOptions: {
				types: [],
				mediaTypes: [],
			},
			filterOptionsStatus: FILTER_OPTION_STATUS.LOADING,
			filteredResultCount: null,
			listBrowseModeState: {
				activeMode: "all",
				disabledModes: {
					all: false,
					sources: false,
					collections: false,
					items: false,
				},
			},
		};
		this._browseQueryState = createBrowseShellQueryState();
		this._lastProjectionQuerySignature = JSON.stringify(
			this._browseQueryState?.query || {},
		);
		this._activeMapViewport = null;
		this._lastListProjectionDiagnostics = null;
		this._lastMapProjectionDiagnostics = null;
		this._lastProjectionCacheStats = null;
		this._filterInputTimer = null;
		this._shellSearchTimer = null;
		this.shellRuntime = createBrowseShellRuntime({
			baseUrl:
				typeof window !== "undefined" && window.location?.href
					? window.location.href
					: "http://localhost/",
			fetchImpl: typeof fetch === "function" ? fetch.bind(globalThis) : undefined,
		});
		this.projectionCache = createBrowseProjectionCache({
			buildListPayload: ({ runtimeStore, browseQueryState, viewMode }) =>
				buildListSurfaceBridgePayload({
					runtimeStore,
					browseQueryState,
					viewMode,
				}),
			buildMapPayload: ({ runtimeStore, browseQueryState, viewport }) =>
				buildMapSurfaceBridgePayload({
					runtimeStore,
					browseQueryState,
					viewport,
				}),
		});
	}

	connectedCallback() {
		this.render();
		this.bindEvents();
		this.initializeShellStartupIngestion();
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (oldValue === newValue) {
			return;
		}
		if (name === "browse-mode" || name === "default-browse-mode") {
			if (!this.hasAttribute("browse-mode") && name === "default-browse-mode") {
				this.state.browseMode = normalizeBrowseMode(
					newValue,
					this.state.browseMode || BROWSE_MODES.LIST,
				);
			}
		}
		this.render();
	}

	bindEvents() {
		if (this._isBound) {
			return;
		}
		this._isBound = true;
		this.shadowRoot.addEventListener("click", (event) => {
			const element = event.target instanceof Element ? event.target : null;
			if (!element) {
				return;
			}
			if (
				element instanceof HTMLDialogElement &&
				element.matches('[data-bind="filter-dialog"]')
			) {
				this.closeFilterPanel();
				return;
			}
			const typeModeButton = element.closest('[data-action="browse-type-mode"]');
			if (typeModeButton instanceof HTMLElement) {
				const nextMode = toText(typeModeButton.getAttribute("data-mode")).toLowerCase();
				if (nextMode) {
					this.dispatchBrowseTypeModeChange(nextMode);
				}
				return;
			}
			if (element.closest('[data-action="close-filter-panel"]')) {
				this.closeFilterPanel();
			}
		});
		this.shadowRoot.addEventListener("filters-click", () => {
			this.openFilterPanel();
			this.dispatchEvent(
				new CustomEvent("browse-shell-filter-entry", {
					bubbles: true,
					composed: true,
				}),
			);
		});
		this.shadowRoot.addEventListener("view-mode-change", (event) => {
			const target = event.target;
			if (!(target instanceof HTMLElement) || target.tagName.toLowerCase() !== "open-collections-browse-header") {
				return;
			}
			const nextMode = normalizeBrowseMode(event?.detail?.mode, this.currentBrowseMode());
			if (nextMode === this.currentBrowseMode()) {
				return;
			}
			this.setAttribute("browse-mode", nextMode);
			this.dispatchEvent(
				new CustomEvent("browse-shell-mode-change", {
					detail: { mode: nextMode },
					bubbles: true,
					composed: true,
				}),
			);
		});
		this.shadowRoot.addEventListener("search-change", (event) => {
			const target = event.target;
			if (!(target instanceof HTMLElement) || target.tagName.toLowerCase() !== "open-collections-browse-header") {
				return;
			}
			const nextText = toText(event?.detail?.value).trim();
			this.state.filterState = {
				...this.state.filterState,
				text: nextText,
			};
			if (this._shellSearchTimer) {
				clearTimeout(this._shellSearchTimer);
			}
			this._shellSearchTimer = setTimeout(() => {
				this._shellSearchTimer = null;
				this.sendBrowseQueryPatchToActiveChild({ text: nextText });
			}, 120);
		});
		this.shadowRoot.addEventListener("search-focus", (event) => {
			const target = event.target;
			if (!(target instanceof HTMLElement) || target.tagName.toLowerCase() !== "open-collections-browse-header") {
				return;
			}
			this.dispatchEvent(
				new CustomEvent("browse-shell-search-entry", {
					bubbles: true,
					composed: true,
				}),
			);
		});
		const handleBrowseQueryState = (event) => {
			const detail =
				event?.detail && typeof event.detail === "object" ? event.detail : {};
			const normalizedState = normalizeBrowseShellQueryState(detail);
			const previousSignature = this._lastProjectionQuerySignature;
			this._browseQueryState = normalizedState;
			this._lastProjectionQuerySignature = JSON.stringify(
				normalizedState?.query || {},
			);
			this.state.filterState = {
				text: toText(normalizedState.filters.text).trim(),
				types: toUniqueStringList(normalizedState.filters.types),
				mediaTypes: toUniqueStringList(normalizedState.filters.mediaTypes),
				categories: toUniqueStringList(normalizedState.filters.categories),
				timeRange: {
					start: toText(normalizedState.query?.timeRange?.start),
					end: toText(normalizedState.query?.timeRange?.end),
				},
			};
			this.state.filterOptions = {
				types: normalizeFilterOptionEntries(normalizedState.options.types),
				mediaTypes: normalizeFilterOptionEntries(
					normalizedState.options.mediaTypes,
				),
			};
			this.state.filterOptionsStatus = normalizedState.status.filterOptions;
			this.syncShellSearchState();
			this.syncFilterPanelState();
			if (previousSignature !== this._lastProjectionQuerySignature) {
				this.publishProjectionToActiveChild();
			}
		};
		this.shadowRoot.addEventListener("browse-query-state", handleBrowseQueryState);
		this.shadowRoot.addEventListener("browse-query-patch", (event) => {
			const detail =
				event?.detail && typeof event.detail === "object" ? event.detail : {};
			const normalizedPatch = normalizeBrowseShellQueryPatch(
				detail,
				this._browseQueryState?.query,
			);
			this._browseQueryState = normalizeBrowseShellQueryState(
				{
					...this._browseQueryState,
					query: normalizedPatch.query,
					filters: normalizedPatch.filters,
				},
				this._browseQueryState,
			);
			this._lastProjectionQuerySignature = JSON.stringify(
				this._browseQueryState?.query || {},
			);
			this.syncShellSearchState();
			this.syncFilterPanelState();
			this.publishProjectionToActiveChild();
		});
		this.shadowRoot.addEventListener(
			"timemap-browser-map-viewport-change",
			(event) => {
				if (this.currentBrowseMode() !== BROWSE_MODES.MAP) {
					return;
				}
				const detail =
					event?.detail && typeof event.detail === "object" ? event.detail : null;
				this._activeMapViewport = detail;
				this.publishMapProjectionToActiveChild();
			},
		);
		this.shadowRoot.addEventListener(
			"browse-shell-embedded-view-mode-state",
			(event) => {
				const detail =
					event?.detail && typeof event.detail === "object" ? event.detail : {};
				const activeMode = toText(detail.activeMode).toLowerCase();
				this.state.listBrowseModeState = {
					activeMode:
						activeMode === "all" ||
						activeMode === "sources" ||
						activeMode === "collections" ||
						activeMode === "items"
							? activeMode
							: this.state.listBrowseModeState?.activeMode || "all",
					disabledModes: {
						all: Boolean(detail?.disabledModes?.all),
						sources: Boolean(detail?.disabledModes?.sources),
						collections: Boolean(detail?.disabledModes?.collections),
						items: Boolean(detail?.disabledModes?.items),
					},
				};
				this.syncListBrowseTypeControls();
			},
		);
		this.shadowRoot.addEventListener("oc-filter-panel-change", (event) => {
			const detail =
				event?.detail && typeof event.detail === "object" ? event.detail : {};
			if (this._filterInputTimer) {
				clearTimeout(this._filterInputTimer);
			}
			this._filterInputTimer = setTimeout(() => {
				this._filterInputTimer = null;
				this.sendBrowseQueryPatchToActiveChild(detail);
			}, 120);
		});
		this.shadowRoot.addEventListener("oc-filter-panel-submit", () => {
			this.closeFilterPanel();
		});
		this.shadowRoot.addEventListener("oc-filter-panel-clear", () => {
			const clearedFilters = {
				text: "",
				types: [],
				mediaTypes: [],
				categories: [],
				timeRange: {
					start: null,
					end: null,
				},
			};
			this.state.filterState = { ...clearedFilters };
			this._browseQueryState = normalizeBrowseShellQueryState(
				{
					...this._browseQueryState,
					query: {
						...(this._browseQueryState?.query || {}),
						...clearedFilters,
					},
					filters: clearedFilters,
				},
				this._browseQueryState,
			);
			this._lastProjectionQuerySignature = JSON.stringify(
				this._browseQueryState?.query || {},
			);
			this.syncShellSearchState();
			this.syncFilterPanelState();
			this.sendBrowseQueryPatchToActiveChild(clearedFilters);
		});
		this.shadowRoot.addEventListener("close", (event) => {
			const target = event?.target;
			if (
				target instanceof HTMLDialogElement &&
				target.matches('[data-bind="filter-dialog"]')
			) {
				this.state.filterPanelOpen = false;
			}
		});
	}

	dispatchBrowseTypeModeChange(mode = "") {
		if (this.currentBrowseMode() !== BROWSE_MODES.LIST) {
			return;
		}
		const nextMode = toText(mode).toLowerCase();
		if (!["all", "sources", "collections", "items"].includes(nextMode)) {
			return;
		}
		const activeChildElement = this.getActiveChildElement();
		if (!activeChildElement || activeChildElement.tagName.toLowerCase() !== "collection-browser") {
			return;
		}
		activeChildElement.dispatchEvent(
			new CustomEvent("browse-shell-view-mode-change", {
				detail: { mode: nextMode },
			}),
		);
	}

	renderListBrowseTypeControls() {
		const currentState = this.state.listBrowseModeState || {};
		const activeMode = toText(currentState.activeMode).toLowerCase() || "all";
		const disabledModes = currentState.disabledModes || {};
		const modes = [
			{ mode: "all", label: "All" },
			{ mode: "sources", label: "Sources" },
			{ mode: "collections", label: "Collections" },
			{ mode: "items", label: "Items" },
		];
		return `
			<div class="browse-type-row" role="toolbar" aria-label="Browse types">
				${modes
					.map(
						({ mode, label }) => `
							<button
								type="button"
								class="browse-type-chip"
								data-action="browse-type-mode"
								data-mode="${mode}"
								data-active="${mode === activeMode ? "true" : "false"}"
								${disabledModes[mode] ? "disabled" : ""}
							>
								${label}
							</button>
						`,
					)
					.join("")}
			</div>
		`;
	}

	openFilterPanel() {
		this.state.filterPanelOpen = true;
		this.syncFilterPanelState();
		const dialog = this.shadowRoot.querySelector('[data-bind="filter-dialog"]');
		if (!dialog) {
			return;
		}
		if (!dialog.open && typeof dialog.showModal === "function") {
			dialog.showModal();
		} else if (!dialog.open) {
			dialog.setAttribute("open", "open");
		}
	}

	closeFilterPanel() {
		this.state.filterPanelOpen = false;
		const dialog = this.shadowRoot.querySelector('[data-bind="filter-dialog"]');
		if (dialog?.open && typeof dialog.close === "function") {
			dialog.close();
		}
	}

	syncFilterPanelState() {
		const filterPanel = this.shadowRoot.querySelector("open-collections-filter-panel");
		if (!filterPanel) {
			return;
		}
		setElementProperty(filterPanel, "filterState", this.state.filterState);
		setElementProperty(filterPanel, "filterOptions", this.state.filterOptions);
		setElementProperty(
			filterPanel,
			"filterOptionsStatus",
			this.state.filterOptionsStatus,
		);
		setElementProperty(filterPanel, "resultCount", this.state.filteredResultCount);
	}

	syncShellSearchState() {
		const header = this.shadowRoot.querySelector("open-collections-browse-header");
		if (!header) {
			return;
		}
		const nextValue = toText(this.state.filterState?.text).trim();
		if (header.searchValue !== nextValue) {
			header.searchValue = nextValue;
		}
		header.filterCount = countActiveFilters({
			types: this.state.filterState?.types,
			mediaTypes: this.state.filterState?.mediaTypes,
			categories: this.state.filterState?.categories,
			timeRange: this.state.filterState?.timeRange,
		});
		header.viewMode = this.currentBrowseMode() === BROWSE_MODES.MAP ? "map" : "list";
		header.searchPlaceholder = "Search";
	}

	syncListBrowseTypeControls() {
		const controls = this.shadowRoot.querySelectorAll(
			'[data-action="browse-type-mode"]',
		);
		if (!controls.length) {
			return;
		}
		const currentState = this.state.listBrowseModeState || {};
		const activeMode = toText(currentState.activeMode).toLowerCase() || "all";
		const disabledModes = currentState.disabledModes || {};
		for (const control of controls) {
			if (!(control instanceof HTMLButtonElement)) {
				continue;
			}
			const mode = toText(control.getAttribute("data-mode")).toLowerCase();
			control.dataset.active = mode === activeMode ? "true" : "false";
			control.disabled = Boolean(disabledModes[mode]);
		}
	}

	sendBrowseQueryPatchToActiveChild(filterPatch = {}) {
		const targetSelector =
			this.currentBrowseMode() === BROWSE_MODES.MAP
				? "timemap-browser"
				: "collection-browser";
		const activeChildElement = this.shadowRoot.querySelector(targetSelector);
		if (!activeChildElement) {
			return;
		}
		const normalizedPatch = normalizeBrowseShellQueryPatch(
			filterPatch,
			this._browseQueryState?.query,
		);
		this._browseQueryState = normalizeBrowseShellQueryState(
			{
				...this._browseQueryState,
				query: normalizedPatch.query,
				filters: normalizedPatch.filters,
			},
			this._browseQueryState,
		);
		this._lastProjectionQuerySignature = JSON.stringify(
			this._browseQueryState?.query || {},
		);
		activeChildElement.dispatchEvent(
			new CustomEvent("browse-query-patch", {
				detail: normalizedPatch,
			}),
		);
		this.publishProjectionToActiveChild();
	}

	getActiveChildElement() {
		const targetSelector =
			this.currentBrowseMode() === BROWSE_MODES.MAP
				? "timemap-browser"
				: "collection-browser";
		return this.shadowRoot.querySelector(targetSelector);
	}

	emitRuntimeCompatibilityState() {
		const compatibilityState = this.shellRuntime.getCompatibilityState();
		const activeChildElement = this.getActiveChildElement();
		if (activeChildElement) {
			activeChildElement.dispatchEvent(
				new CustomEvent("browse-shell-runtime-state", {
					detail: compatibilityState,
				}),
			);
		}
		this.dispatchEvent(
			new CustomEvent("browse-shell-runtime-state", {
				detail: compatibilityState,
				bubbles: true,
				composed: true,
			}),
		);
		this.emitShellDiagnostics();
	}

	emitShellDiagnostics() {
		const runtimeSummary = this.shellRuntime.getDiagnosticsSummary();
		const cacheStats = this.projectionCache.getStats();
		this._lastProjectionCacheStats = cacheStats;
		const detail = {
			modelVersion: "browser-diagnostics-v1",
			kind: "shell-status",
			ingestionStatus: runtimeSummary.ingestionStatus,
			runtime: runtimeSummary,
			performance: {
				projectionCache: cacheStats,
			},
			projections: {
				list: this._lastListProjectionDiagnostics,
				map: this._lastMapProjectionDiagnostics,
			},
		};
		this.dispatchEvent(
			new CustomEvent("browse-shell-diagnostics", {
				detail,
				bubbles: true,
				composed: true,
			}),
		);
	}

	initializeShellStartupIngestion() {
		this.shellRuntime.initializeOwnership();
		this.emitRuntimeCompatibilityState();
		this.publishProjectionToActiveChild();
		void this.shellRuntime.runStartupIngestionOnce().then((result) => {
			const summary = this.shellRuntime.getDiagnosticsSummary();
			console.info("[browse-shell] startup ingestion summary", {
				ingestionStatus: summary.ingestionStatus,
				sourcesIngested: summary.sourcesIngested,
				collectionsIngested: summary.collectionsIngested,
				itemsIngested: summary.itemsIngested,
				warningCount: summary.warningCount,
				failureCount: summary.failureCount,
				fetchRequestCount: summary.fetchRequestCount,
				fetchNetworkCount: summary.fetchNetworkCount,
				fetchDedupedHitCount: summary.fetchDedupedHitCount,
				normalizeCount: summary.normalizeCount,
			});
			if (
				Array.isArray(result?.failures) &&
				result.failures.length > 0
			) {
				console.warn("[browse-shell] startup ingestion failures", result.failures);
			}
			this.emitRuntimeCompatibilityState();
			this.publishProjectionToActiveChild();
		});
	}

	publishProjectionToActiveChild() {
		this.publishListProjectionToActiveChild();
		this.publishMapProjectionToActiveChild();
	}

	publishListProjectionToActiveChild() {
		if (this.currentBrowseMode() !== BROWSE_MODES.LIST) {
			return;
		}
		const activeChildElement = this.getActiveChildElement();
		if (!activeChildElement || activeChildElement.tagName.toLowerCase() !== "collection-browser") {
			return;
		}
		const runtimeStore = this.shellRuntime.getRuntimeStore();
		if (!runtimeStore) {
			return;
		}
		try {
			const listProjection = this.projectionCache.getListProjection({
				runtimeStore,
				browseQueryState: this._browseQueryState,
				viewMode: "all",
			});
			const payload = {
				...listProjection.payload,
				compatibility: {
					...(listProjection.payload?.compatibility || {}),
					diagnostics: {
						...(listProjection.payload?.compatibility?.diagnostics || {}),
						cache: {
							layer: "list",
							...listProjection.cache,
						},
					},
				},
			};
			const listResultCount = Number(payload?.projection?.total?.filtered?.items);
			this.state.filteredResultCount = Number.isFinite(listResultCount)
				? Math.max(0, Math.floor(listResultCount))
				: null;
			this.syncFilterPanelState();
			activeChildElement.dispatchEvent(
				new CustomEvent("browse-shell-list-projection", {
					detail: payload,
				}),
			);
			this._lastListProjectionDiagnostics =
				payload?.projection?.diagnostics?.structured || payload?.projection?.diagnostics || null;
			this.dispatchEvent(
				new CustomEvent("browse-shell-list-projection", {
					detail: payload,
					bubbles: true,
					composed: true,
				}),
			);
			this.emitShellDiagnostics();
		} catch (error) {
			console.warn("[browse-shell] list projection bridge failed", error);
		}
	}

	publishMapProjectionToActiveChild() {
		if (this.currentBrowseMode() !== BROWSE_MODES.MAP) {
			return;
		}
		const activeChildElement = this.getActiveChildElement();
		if (!activeChildElement || activeChildElement.tagName.toLowerCase() !== "timemap-browser") {
			return;
		}
		const runtimeStore = this.shellRuntime.getRuntimeStore();
		if (!runtimeStore) {
			return;
		}
		try {
			const mapProjection = this.projectionCache.getMapProjection({
				runtimeStore,
				browseQueryState: this._browseQueryState,
				viewport: this._activeMapViewport,
			});
			const payload = {
				...mapProjection.payload,
				compatibility: {
					...(mapProjection.payload?.compatibility || {}),
					diagnostics: {
						...(mapProjection.payload?.compatibility?.diagnostics || {}),
						cache: {
							layer: "map",
							...mapProjection.cache,
						},
					},
				},
			};
			const mapResultCount = Number(payload?.projection?.total?.filtered?.items);
			this.state.filteredResultCount = Number.isFinite(mapResultCount)
				? Math.max(0, Math.floor(mapResultCount))
				: this.state.filteredResultCount;
			this.syncFilterPanelState();
			activeChildElement.dispatchEvent(
				new CustomEvent("browse-shell-map-projection", {
					detail: payload,
				}),
			);
			this._lastMapProjectionDiagnostics =
				payload?.projection?.diagnostics?.structured || payload?.projection?.diagnostics || null;
			this.dispatchEvent(
				new CustomEvent("browse-shell-map-projection", {
					detail: payload,
					bubbles: true,
					composed: true,
				}),
			);
			this.emitShellDiagnostics();
		} catch (error) {
			console.warn("[browse-shell] map projection bridge failed", error);
		}
	}

	currentBrowseMode() {
		if (this.hasAttribute("browse-mode")) {
			return normalizeBrowseMode(
				this.getAttribute("browse-mode"),
				this.state.browseMode || BROWSE_MODES.LIST,
			);
		}
		return normalizeBrowseMode(this.state.browseMode, BROWSE_MODES.LIST);
	}

	renderChildApp(mode) {
		const embeddedAttrs = this.hasAttribute("data-workbench-embed")
			? ' data-workbench-embed="true"'
			: "";
		const shellEmbedAttrs = ' data-shell-embed="true"';
		const appModeAttr = this.getAttribute("data-oc-app-mode");
		const appMode = appModeAttr
			? ` data-oc-app-mode="${appModeAttr.replaceAll('"', "&quot;")}"`
			: "";
		const mapDefaultAttrs = [
			"map-default-center-lat",
			"map-default-center-lng",
			"map-default-zoom",
			"map-default-bounds",
		]
			.map((name) => {
				if (!this.hasAttribute(name)) {
					return "";
				}
				const value = this.getAttribute(name);
				return value === null
					? ""
					: ` ${name}="${escapeAttribute(value)}"`;
			})
			.join("");
		if (mode === BROWSE_MODES.MAP) {
			return `<timemap-browser data-shell-map-adapter="true"${embeddedAttrs}${shellEmbedAttrs}${appMode}${mapDefaultAttrs} show-top-chrome="false" show-filter-entry="false" map-edge-to-edge="true"></timemap-browser>`;
		}
		return `<collection-browser data-shell-list-adapter="true"${embeddedAttrs}${shellEmbedAttrs}${appMode}></collection-browser>`;
	}

	render() {
		const browseMode = this.currentBrowseMode();

		this.shadowRoot.innerHTML = `
			<style>
				:host {
					display: block;
					height: 100%;
					min-height: 0;
					background: #e7e7e3;
					color: #2e2924;
				}
				.browse-shell {
					display: grid;
					grid-template-rows: auto auto minmax(0, 1fr);
					height: 100%;
					min-height: 0;
				}
				.control-strip {
					display: grid;
					grid-template-columns: minmax(0, 1fr);
					gap: 0.62rem;
					padding: 0.72rem 0.9rem 0.56rem;
					background: #ecebe7;
					z-index: 1;
				}
				.browse-type-row {
					display: flex;
					align-items: center;
					gap: 0.5rem;
					flex-wrap: wrap;
				}
				.browse-type-chip {
					border: 1px solid #d1ccc4;
					border-radius: 999px;
					background: #fffdfa;
					color: #2e2924;
					font: inherit;
					font-size: 0.87rem;
					line-height: 1;
					padding: 0.45rem 0.8rem;
					font-weight: 600;
					cursor: pointer;
				}
				.browse-type-chip[data-active="true"] {
					border-color: #756c64;
					background: #ece7e1;
					color: #756c64;
				}
				.browse-type-chip:disabled {
					opacity: 0.5;
					cursor: not-allowed;
				}
				.control-divider {
					height: 1px;
					background: #d8d5cf;
				}
				open-collections-browse-header {
					width: 100%;
					min-width: 0;
				}
				.app-viewport {
					height: 100%;
					min-height: 0;
					overflow: hidden;
				}
				.app-viewport > collection-browser,
				.app-viewport > timemap-browser {
					display: block;
					height: 100%;
					min-height: 0;
				}
				.app-viewport > timemap-browser {
					--timemap-shell-bottom-inset: var(--oc-shell-mobile-nav-offset, 0px);
				}
				button:focus-visible {
					outline: 2px solid #6b7280;
					outline-offset: 1px;
				}
				.filter-dialog {
					inline-size: min(32rem, calc(100vw - 1.2rem));
					max-inline-size: min(32rem, calc(100vw - 1.2rem));
					border: 1px solid #d7e0ea;
					border-radius: 1rem;
					padding: 0;
					background: #ffffff;
					box-shadow: 0 20px 45px rgba(15, 23, 42, 0.28);
				}
				.filter-dialog::backdrop {
					background: rgba(15, 23, 42, 0.42);
				}
				.filter-dialog-shell {
					display: grid;
					grid-template-rows: auto minmax(0, 1fr);
					block-size: min(80dvh, 42rem);
					min-height: 0;
				}
				.filter-dialog-header {
					display: flex;
					align-items: center;
					justify-content: space-between;
					gap: 0.75rem;
					padding: 0.82rem 1rem;
					border-bottom: 1px solid #dbe3ed;
					background: #ffffff;
				}
				.filter-dialog-title {
					margin: 0;
					font-size: 1rem;
					font-weight: 700;
					color: #0f172a;
				}
				.icon-btn {
					width: 2rem;
					height: 2rem;
					display: inline-grid;
					place-items: center;
					border: 1px solid #cbd5e1;
					background: #ffffff;
					color: #1f2937;
					border-radius: 0.55rem;
					padding: 0;
					cursor: pointer;
				}
				.filter-dialog-panel {
					min-height: 0;
				}
				.icon-btn .icon-close {
					width: 1rem;
					height: 1rem;
					fill: currentColor;
				}
				.browse-shell[data-mode="map"] {
					grid-template-rows: minmax(0, 1fr);
					position: relative;
					background: transparent;
				}
				.browse-shell[data-mode="map"] .app-viewport {
					position: relative;
				}
				.browse-shell[data-mode="map"] .control-strip {
					display: flex;
					flex-direction: column;
					align-items: stretch;
					gap: 0.45rem;
					position: absolute;
					top: calc(env(safe-area-inset-top, 0px) + 0.75rem);
					left: 0.75rem;
					right: 0.75rem;
					background: transparent;
					border-bottom: none;
					padding: 0;
					margin: 0;
					pointer-events: none;
					z-index: 8;
				}
				.browse-shell[data-mode="map"] .control-divider {
					display: none;
				}
				.browse-shell[data-mode="map"] open-collections-browse-header {
					pointer-events: auto;
				}

				@media (max-width: 760px) {
					:host {
						--browse-filter-mobile-nav-offset: var(--oc-shell-mobile-nav-offset, 0px);
					}
					.control-strip {
						padding: 0.62rem 0.62rem 0.5rem;
					}
					.browse-shell[data-mode="map"] .control-strip {
						top: calc(env(safe-area-inset-top, 0px) + 0.62rem);
						left: 0.62rem;
						right: 0.62rem;
					}
					.filter-dialog {
						inline-size: 100%;
						max-inline-size: 100%;
						border: none;
						border-radius: 1rem 1rem 0 0;
						margin: auto 0 var(--browse-filter-mobile-nav-offset);
						max-height: none;
						block-size: min(80dvh, 42rem);
						box-sizing: border-box;
						overflow-x: clip;
						transform: translateY(calc(100% + var(--browse-filter-mobile-nav-offset)));
						opacity: 0;
						transition:
							transform 230ms cubic-bezier(0.2, 0.8, 0.2, 1),
							opacity 170ms ease;
						box-shadow: 0 -10px 32px rgba(15, 23, 42, 0.25);
					}
					.filter-dialog-panel {
						--oc-filter-panel-footer-safe-area: 0px;
					}
					.filter-dialog[open] {
						transform: translateY(0);
						opacity: 1;
					}
					.filter-dialog::backdrop {
						background: linear-gradient(
							to top,
							transparent 0,
							transparent var(--browse-filter-mobile-nav-offset),
							rgba(15, 23, 42, 0.36) var(--browse-filter-mobile-nav-offset),
							rgba(15, 23, 42, 0.36) 100%
						);
					}
				}
			</style>
			<section class="browse-shell" data-mode="${browseMode}" aria-label="Browse mode shell">
				<div class="control-strip" aria-label="Browse controls">
					<open-collections-browse-header></open-collections-browse-header>
					${browseMode === BROWSE_MODES.LIST ? this.renderListBrowseTypeControls() : ""}
				</div>
				<div class="control-divider" aria-hidden="true"></div>
				<div class="app-viewport">${this.renderChildApp(browseMode)}</div>
			</section>
			<dialog class="filter-dialog" data-bind="filter-dialog">
				<div class="filter-dialog-shell">
					<header class="filter-dialog-header">
						<h2 class="filter-dialog-title">Filters</h2>
						<button class="icon-btn" type="button" data-action="close-filter-panel" aria-label="Close filters">
							${renderCloseIcon("icon icon-close")}
						</button>
					</header>
					<open-collections-filter-panel class="filter-dialog-panel" show-text-search="false" show-panel-header="false"></open-collections-filter-panel>
				</div>
			</dialog>
		`;
		this.syncShellSearchState();
		this.syncListBrowseTypeControls();
		this.syncFilterPanelState();
		this.emitRuntimeCompatibilityState();
		this.publishProjectionToActiveChild();
	}
}

if (!customElements.get("open-collections-browse-shell")) {
	customElements.define(
		"open-collections-browse-shell",
		OpenCollectionsBrowseShellElement,
	);
}

export { OpenCollectionsBrowseShellElement };
