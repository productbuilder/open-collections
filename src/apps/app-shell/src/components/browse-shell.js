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

const BROWSE_MODES = Object.freeze({
	LIST: "collection",
	MAP: "map",
});

const BROWSE_MODE_OPTIONS = Object.freeze([
	{
		key: BROWSE_MODES.LIST,
		label: "List",
		icon: '<path d="M6 7h12M6 12h12M6 17h12"></path>',
	},
	{
		key: BROWSE_MODES.MAP,
		label: "Map",
		icon: '<path d="M3.75 6.25 9 4.25l6 2 5.25-2v13.5L15 19.75l-6-2-5.25 2V6.25Z"></path><path d="M9 4.25v13.5M15 6.25v13.5"></path>',
	},
]);

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
				categories: [],
			},
			filterOptions: {
				types: [],
			},
			filterOptionsStatus: FILTER_OPTION_STATUS.LOADING,
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

			const modeButton = element.closest("button[data-browse-mode]");
			if (modeButton) {
				const nextMode = normalizeBrowseMode(
					modeButton?.dataset?.browseMode,
					this.currentBrowseMode(),
				);
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
				return;
			}

			if (element.closest('[data-action="filter-entry"]')) {
				this.openFilterPanel();
				this.dispatchEvent(
					new CustomEvent("browse-shell-filter-entry", {
						bubbles: true,
						composed: true,
					}),
				);
				return;
			}

			if (element.closest('[data-action="close-filter-panel"]')) {
				this.closeFilterPanel();
			}
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
				text: toText(normalizedState.filters.text),
				types: toUniqueStringList(normalizedState.filters.types),
				categories: toUniqueStringList(normalizedState.filters.categories),
			};
			this.state.filterOptions = {
				types: normalizeFilterOptionEntries(normalizedState.options.types),
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
		this.shadowRoot.addEventListener("input", (event) => {
			const target = event.target;
			if (!(target instanceof HTMLInputElement)) {
				return;
			}
			if (target.matches('[data-bind="shell-search-input"]')) {
				const nextText = String(target.value ?? "").trim();
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
			}
		});
		this.shadowRoot.addEventListener("focusin", (event) => {
			const target = event.target;
			if (
				target instanceof HTMLInputElement &&
				target.matches('[data-bind="shell-search-input"]')
			) {
				this.dispatchEvent(
					new CustomEvent("browse-shell-search-entry", {
						bubbles: true,
						composed: true,
					}),
				);
			}
		});
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
		this.shadowRoot.addEventListener("oc-filter-panel-clear", () => {
			const clearedFilters = {
				text: "",
				types: [],
				categories: [],
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
	}

	syncShellSearchState() {
		const searchInput = this.shadowRoot.querySelector(
			'[data-bind="shell-search-input"]',
		);
		if (!searchInput) {
			return;
		}
		const nextValue = String(this.state.filterState?.text ?? "");
		if (searchInput.value !== nextValue) {
			searchInput.value = nextValue;
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
		const shellEmbedAttrs = this.hasAttribute("data-shell-embed")
			? ' data-shell-embed="true"'
			: "";
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

	renderModeButton(option, currentMode) {
		const isActive = option.key === currentMode;
		return `
			<button
				class="mode-button"
				type="button"
				role="tab"
				aria-selected="${isActive ? "true" : "false"}"
				data-active="${isActive ? "true" : "false"}"
				data-browse-mode="${option.key}"
			>
				<svg class="mode-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${option.icon}</svg>
				<span class="mode-label">${option.label}</span>
			</button>
		`;
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
					grid-template-rows: auto minmax(0, 1fr);
					height: 100%;
					min-height: 0;
				}
				.control-strip {
					display: grid;
					grid-template-columns: minmax(0, 1fr);
					gap: 0.45rem;
					padding: 0.45rem 0.5rem;
					background: #ecebe7;
					border-bottom: 1px solid #d8d5cf;
					z-index: 1;
				}
				.control-row {
					display: grid;
					align-items: center;
					min-width: 0;
				}
				.control-row--primary {
					grid-template-columns: minmax(0, 1fr);
				}
				.control-row--secondary {
					grid-template-columns: minmax(0, 1fr) auto;
					gap: 0.45rem;
				}
				.search-entry,
				.filter-entry,
				.mode-button {
					border: 1px solid #cbc6be;
					background: #ffffff;
					color: inherit;
					font: inherit;
					line-height: 1;
					
				}
				.search-entry,
				.filter-entry {
					display: inline-flex;
					align-items: center;
					gap: 0.42rem;
					block-size: 2rem;
					padding: 0 0.65rem;
					border-radius: 0.65rem;
					font-size: 0.82rem;
					font-weight: 540;
					
				}
				.search-entry {
					inline-size: 100%;
					justify-content: flex-start;
					min-inline-size: 0;
					box-sizing:border-box;
				}
				.search-entry-input {
					min-inline-size: 0;
					inline-size: 100%;
					border: none;
					background: transparent;
					color: #2e2924;
					font: inherit;
					font-size: 0.82rem;
					font-weight: 540;
					outline: none;
				}
				.search-entry-input::placeholder {
					color: #6b6258;
				}
				.filter-entry {
					inline-size: fit-content;
					justify-self: start;
				}
				.mode-switch {
					display: inline-flex;
					align-items: center;
					padding: 0.12rem;
					border-radius: 999px;
					background: #ffffff;
					border: 1px solid #d4d4cf;
					gap: 0.15rem;
				}
				.mode-button {
					display: inline-flex;
					align-items: center;
					gap: 0.3rem;
					block-size: 1.8rem;
					padding: 0 0.55rem;
					border-radius: 999px;
					border-color: transparent;
					background: transparent;
					font-size: 0.78rem;
					font-weight: 620;
					color: #514a43;
				}
				.mode-button[data-active="true"] {
					background: #2f2f2a;
					color: #ffffff;
				}
				.mode-icon,
				.entry-icon {
					inline-size: 0.9rem;
					block-size: 0.9rem;
					stroke: currentColor;
					stroke-width: 1.8;
					fill: none;
					stroke-linecap: round;
					stroke-linejoin: round;
					flex-shrink: 0;
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
					inline-size: min(30rem, calc(100vw - 1.2rem));
					max-inline-size: min(30rem, calc(100vw - 1.2rem));
					border: 1px solid #cbd5e1;
					border-radius: 0.95rem;
					padding: 0;
					background: #f8fafc;
					box-shadow: 0 20px 45px rgba(15, 23, 42, 0.33);
				}
				.filter-dialog::backdrop {
					background: rgba(15, 23, 42, 0.42);
				}
				.filter-dialog-shell {
					display: grid;
					gap: 0.72rem;
					padding: 0.82rem;
				}
				.filter-dialog-header {
					display: flex;
					justify-content: flex-end;
				}
				.close-filter-button {
					border: 1px solid #cbd5e1;
					background: #ffffff;
					color: #1f2937;
					border-radius: 999px;
					padding: 0.3rem 0.62rem;
					font: inherit;
					font-size: 0.78rem;
					font-weight: 600;
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
					top: 0.6rem;
					left: 0.6rem;
					right: 0.6rem;
					background: transparent;
					border-bottom: none;
					padding: 0;
					margin: 0;
					pointer-events: none;
					z-index: 8;
				}
				.browse-shell[data-mode="map"] .control-row {
					pointer-events: auto;
					background: transparent;
				}
				.browse-shell[data-mode="map"] .search-entry,
				.browse-shell[data-mode="map"] .filter-entry,
				.browse-shell[data-mode="map"] .mode-switch {
					box-shadow: 0 2px 10px rgba(45, 42, 38, 0.16);
					border-color: rgba(65, 61, 56, 0.2);
					background: rgba(255, 255, 255, 0.96);
					backdrop-filter: blur(6px);
				}
				.browse-shell[data-mode="map"] .search-entry,
				.browse-shell[data-mode="map"] .filter-entry {
					block-size: 2.2rem;
					border-radius: 999px;
				}
				.browse-shell[data-mode="map"] .mode-switch {
					padding: 0.16rem;
				}
				.browse-shell[data-mode="map"] .mode-button {
					block-size: 1.9rem;
				}

				@media (max-width: 760px) {
					.control-strip {
						gap: 0.38rem;
						padding: 0.42rem;
					}
					.control-row--secondary {
						gap: 0.35rem;
					}
					.search-entry,
					.filter-entry {
						block-size: 1.9rem;
						font-size: 0.78rem;
					}
					.mode-switch {
						justify-self: end;
					}
					.mode-button {
						block-size: 1.7rem;
						font-size: 0.75rem;
						padding: 0 0.46rem;
					}
					.browse-shell[data-mode="map"] .control-strip {
						top: 0.45rem;
						left: 0.45rem;
						right: 0.45rem;
					}
					.browse-shell[data-mode="map"] .search-entry,
					.browse-shell[data-mode="map"] .filter-entry {
						block-size: 2.05rem;
					}
					.filter-dialog {
						inline-size: calc(100vw - 0.6rem);
						max-inline-size: calc(100vw - 0.6rem);
						margin: auto;
						border-radius: 1rem;
					}
				}
			</style>
			<section class="browse-shell" data-mode="${browseMode}" aria-label="Browse mode shell">
				<div class="control-strip" aria-label="Browse controls">
					<div class="control-row control-row--primary">
						<label class="search-entry" aria-label="Search browse results">
							<svg class="entry-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="11" cy="11" r="6"></circle><path d="m16 16 5 5"></path></svg>
							<input
								data-bind="shell-search-input"
								class="search-entry-input"
								type="search"
								placeholder="Search titles, places, and sources"
								value="${escapeAttribute(this.state.filterState.text)}"
							>
						</label>
					</div>
					<div class="control-row control-row--secondary">
						<button class="filter-entry" type="button" data-action="filter-entry" aria-label="Open browse filters">
							<svg class="entry-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 5h18M7 12h10M10 19h4"></path></svg>
							<span>Filters</span>
						</button>
						<div class="mode-switch" role="tablist" aria-label="Browse mode">
							${BROWSE_MODE_OPTIONS.map((option) => this.renderModeButton(option, browseMode)).join("")}
						</div>
					</div>
				</div>
				<div class="app-viewport">${this.renderChildApp(browseMode)}</div>
			</section>
			<dialog class="filter-dialog" data-bind="filter-dialog">
				<div class="filter-dialog-shell">
					<header class="filter-dialog-header">
						<button class="close-filter-button" type="button" data-action="close-filter-panel">Done</button>
					</header>
					<open-collections-filter-panel show-text-search="false"></open-collections-filter-panel>
				</div>
			</dialog>
		`;
		this.syncShellSearchState();
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
