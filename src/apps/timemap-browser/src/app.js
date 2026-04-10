import { APP_RUNTIME_MODES } from "../../../shared/runtime/app-mount-contract.js";
import {
	FILTER_OPTION_STATUS,
	normalizeBrowseShellQueryPatch,
	normalizeBrowseShellQueryState,
} from "../../../shared/data/query/browse-shell-query-contract.js";
import { createTimemapBrowserController } from "./controllers/timemap-browser-controller.js";
import {
	isShellMapAdapterModeEnabled,
	shouldRunLocalSpatialLoader,
} from "./shell-adapter-mode.js";

const VIEWPORT_REFRESH_THRESHOLDS = Object.freeze({
	center: 0.00035,
	zoom: 0.08,
	bearing: 0.75,
	pitch: 0.75,
	bbox: 0.0005,
	pixelSize: 2,
});

const VIEWPORT_STATE_THRESHOLDS = Object.freeze({
	center: 0.00008,
	zoom: 0.02,
	bearing: 0.35,
	pitch: 0.35,
	bbox: 0.00015,
	pixelSize: 1,
});

const PRESENTATION_ATTRIBUTES = [
	"show-top-chrome",
	"show-timeline",
	"show-detail-overlay",
	"show-filter-entry",
	"map-edge-to-edge",
	"embed-density",
	"map-clear-selection-on-background",
];

function absDelta(left, right) {
	const safeLeft = Number(left);
	const safeRight = Number(right);
	if (!Number.isFinite(safeLeft) || !Number.isFinite(safeRight)) {
		return Number.POSITIVE_INFINITY;
	}
	return Math.abs(safeLeft - safeRight);
}

function hasMeaningfulViewportDelta(
	nextViewport,
	previousViewport,
	thresholds = VIEWPORT_REFRESH_THRESHOLDS,
) {
	if (!previousViewport) {
		return true;
	}
	if (
		absDelta(nextViewport.center?.lng, previousViewport.center?.lng) >=
			thresholds.center ||
		absDelta(nextViewport.center?.lat, previousViewport.center?.lat) >=
			thresholds.center ||
		absDelta(nextViewport.zoom, previousViewport.zoom) >= thresholds.zoom ||
		absDelta(nextViewport.bearing, previousViewport.bearing) >= thresholds.bearing ||
		absDelta(nextViewport.pitch, previousViewport.pitch) >= thresholds.pitch
	) {
		return true;
	}

	const nextBbox = nextViewport.bbox;
	const previousBbox = previousViewport.bbox;
	if (!nextBbox || !previousBbox) {
		return false;
	}

	if (
		absDelta(nextBbox.west, previousBbox.west) >= thresholds.bbox ||
		absDelta(nextBbox.south, previousBbox.south) >= thresholds.bbox ||
		absDelta(nextBbox.east, previousBbox.east) >= thresholds.bbox ||
		absDelta(nextBbox.north, previousBbox.north) >= thresholds.bbox
	) {
		return true;
	}

	return (
		absDelta(nextViewport.pixelSize?.width, previousViewport.pixelSize?.width) >=
			thresholds.pixelSize ||
		absDelta(nextViewport.pixelSize?.height, previousViewport.pixelSize?.height) >=
			thresholds.pixelSize
	);
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

function normalizeFilterOptionEntries(entries = []) {
	if (!Array.isArray(entries)) {
		return [];
	}
	const normalized = new Map();
	for (const entry of entries) {
		const value = String(
			(entry && typeof entry === "object" ? entry.value : entry) ?? "",
		)
			.trim();
		if (!value) {
			continue;
		}
		const sourceCount =
			entry && typeof entry === "object" ? Number(entry.count) : Number.NaN;
		normalized.set(value, {
			value,
			label:
				(entry && typeof entry === "object" && String(entry.label ?? "").trim()) ||
				value,
			count: Number.isFinite(sourceCount) ? sourceCount : null,
		});
	}
	return [...normalized.values()].sort((left, right) =>
		left.value.localeCompare(right.value),
	);
}

function collectTypeValues(properties = {}) {
	const resolvedType = String(properties.type ?? "").trim();
	if (resolvedType) {
		return [resolvedType];
	}
	return [];
}

function createTypeFilterSet(query = {}) {
	const sourceTypes = Array.isArray(query?.types) ? query.types : [];
	const normalizedTypes = sourceTypes
		.map((value) => String(value ?? "").trim())
		.filter(Boolean);
	return new Set(normalizedTypes);
}

function featureMatchesTypeFilters(feature, activeTypeFilters) {
	if (!(activeTypeFilters instanceof Set) || activeTypeFilters.size === 0) {
		return true;
	}
	const featureTypes = collectTypeValues(feature?.properties || {});
	if (!Array.isArray(featureTypes) || featureTypes.length === 0) {
		return false;
	}
	return featureTypes.some((value) => activeTypeFilters.has(String(value).trim()));
}

function toUtcRangeFromTemporalBound(value, { isEndBound = false } = {}) {
	if (value === null || value === undefined || value === "") {
		return null;
	}
	const text = String(value).trim();
	if (!text) {
		return null;
	}

	const dateMatch = text.match(
		/^(?<year>[-+]?\d{1,6})(?:-(?<month>\d{2})(?:-(?<day>\d{2}))?)?$/,
	);
	if (dateMatch?.groups) {
		const year = Number(dateMatch.groups.year);
		const month = dateMatch.groups.month ? Number(dateMatch.groups.month) : null;
		const day = dateMatch.groups.day ? Number(dateMatch.groups.day) : null;

		if (!Number.isInteger(year)) {
			return null;
		}

		if (month === null) {
			return isEndBound
				? Date.UTC(year, 11, 31, 23, 59, 59, 999)
				: Date.UTC(year, 0, 1, 0, 0, 0, 0);
		}

		if (!Number.isInteger(month) || month < 1 || month > 12) {
			return null;
		}

		if (day === null) {
			if (isEndBound) {
				const monthEndDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
				return Date.UTC(year, month - 1, monthEndDay, 23, 59, 59, 999);
			}
			return Date.UTC(year, month - 1, 1, 0, 0, 0, 0);
		}

		if (!Number.isInteger(day) || day < 1 || day > 31) {
			return null;
		}
		const monthEndDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
		if (day > monthEndDay) {
			return null;
		}

		const normalized = isEndBound
			? Date.UTC(year, month - 1, day, 23, 59, 59, 999)
			: Date.UTC(year, month - 1, day, 0, 0, 0, 0);
		if (!Number.isFinite(normalized) || Number.isNaN(normalized)) {
			return null;
		}
		return normalized;
	}

	return null;
}

function resolveActiveTimeRangeBounds(query = {}) {
	const source = query?.timeRange && typeof query.timeRange === "object" ? query.timeRange : {};
	const hasRawStart = source.start !== null && source.start !== undefined && source.start !== "";
	const hasRawEnd = source.end !== null && source.end !== undefined && source.end !== "";
	if (!hasRawStart && !hasRawEnd) {
		return null;
	}

	const start = hasRawStart
		? toUtcRangeFromTemporalBound(source.start, { isEndBound: false })
		: Number.NEGATIVE_INFINITY;
	const end = hasRawEnd
		? toUtcRangeFromTemporalBound(source.end, { isEndBound: true })
		: Number.POSITIVE_INFINITY;
	if (!Number.isFinite(start) && start !== Number.NEGATIVE_INFINITY) {
		return null;
	}
	if (!Number.isFinite(end) && end !== Number.POSITIVE_INFINITY) {
		return null;
	}
	if (start > end) {
		return null;
	}
	return { start, end };
}

function featureMatchesTimeRange(feature, activeTimeRangeBounds) {
	if (!activeTimeRangeBounds) {
		return true;
	}
	const properties = feature?.properties || {};
	// First-pass policy: when time-range filtering is active, unknown temporal
	// features are excluded so the map reflects only records with comparable ranges.
	if (properties.timeKnown !== true) {
		return false;
	}

	const featureStart = Number(properties.timeStart);
	const featureEnd = Number(properties.timeEnd);
	if (!Number.isFinite(featureStart) || !Number.isFinite(featureEnd)) {
		return false;
	}

	return (
		featureEnd >= activeTimeRangeBounds.start &&
		featureStart <= activeTimeRangeBounds.end
	);
}

function filterMapVisibleFeatures(features = [], query = {}) {
	if (!Array.isArray(features) || features.length === 0) {
		return [];
	}
	const activeTypeFilters = createTypeFilterSet(query);
	const activeTimeRangeBounds = resolveActiveTimeRangeBounds(query);
	if (activeTypeFilters.size === 0 && !activeTimeRangeBounds) {
		return features;
	}
	return features.filter(
		(feature) =>
			featureMatchesTypeFilters(feature, activeTypeFilters) &&
			featureMatchesTimeRange(feature, activeTimeRangeBounds),
	);
}

function hasFeatureWithId(features = [], featureId) {
	if (!featureId || !Array.isArray(features)) {
		return false;
	}
	return features.some((feature) => {
		const candidateId = feature?.id ?? feature?.properties?.id ?? null;
		return candidateId === featureId;
	});
}

function buildFilterOptionsFromFeatures(features = []) {
	const typeCounts = new Map();
	const incrementCount = (counts, value) => {
		const normalized = String(value ?? "").trim();
		if (!normalized) {
			return;
		}
		counts.set(normalized, (counts.get(normalized) || 0) + 1);
	};

	for (const feature of features) {
		const properties = feature?.properties || {};
		const uniqueTypes = new Set(collectTypeValues(properties));
		for (const typeValue of uniqueTypes) {
			incrementCount(typeCounts, typeValue);
		}
	}

	return {
		types: toFilterOptionEntries(typeCounts),
		categories: [],
	};
}

function resolveFilterOptions(spatialResponse = {}) {
	const featureDerivedOptions = buildFilterOptionsFromFeatures(
		spatialResponse?.features || [],
	);
	const normalizedFeatureTypes = normalizeFilterOptionEntries(
		featureDerivedOptions.types,
	);

	return {
		types: normalizedFeatureTypes,
		categories: [],
	};
}

function resolveCanonicalShellFilterOptions(projection = {}) {
	const filterOptions =
		projection?.filterOptions && typeof projection.filterOptions === "object"
			? projection.filterOptions
			: {};
	return {
		types: normalizeFilterOptionEntries(filterOptions.types),
		categories: normalizeFilterOptionEntries(filterOptions.categories),
	};
}

function resolveFilterOptionsStatus({ spatialStatus = "idle", options = {} } = {}) {
	if (spatialStatus === "loading" || spatialStatus === "idle") {
		return FILTER_OPTION_STATUS.LOADING;
	}
	const hasOptions =
		Array.isArray(options.types) && options.types.length > 0;
	return hasOptions ? FILTER_OPTION_STATUS.READY : FILTER_OPTION_STATUS.EMPTY;
}

class TimemapBrowserElement extends HTMLElement {
	static get observedAttributes() {
		return [
			"data-oc-app-mode",
			"data-shell-embed",
			"data-workbench-embed",
			...PRESENTATION_ATTRIBUTES,
		];
	}

	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.controller = createTimemapBrowserController();
		this.unsubscribeState = null;
		this.viewportRefreshTimer = null;
		this.viewportStateTimer = null;
		this.lastSpatialRefreshViewport = null;
		this.pendingSpatialRefreshViewport = null;
		this.lastViewportStateUpdate = null;
		this.pendingViewportStateUpdate = null;
		this.handleMapViewportChange = this.onMapViewportChange.bind(this);
		this.handleMapFeatureClick = this.onMapFeatureClick.bind(this);
		this.handleClearSelection = this.onClearSelection.bind(this);
		this.handleFilterPatch = this.onFilterPatch.bind(this);
		this.handleTimeRangePatch = this.onTimeRangePatch.bind(this);
		this.handleShellMapProjection = this.onShellMapProjection.bind(this);
		this.handleShellRuntimeState = this.onShellRuntimeState.bind(this);
		this.filterRefreshTimer = null;
		this.timeRangeRefreshTimer = null;
		this._latestShellMapProjection = null;
	}

	connectedCallback() {
		this.render();
		this.applyRuntimePresentation();
		this.syncShellPresentationConfig();
		this.bindState();
		this.bindMapEvents();
		if (this.isShellMapAdapterMode()) {
			this.controller.setStatus({
				tone: "neutral",
				text: "Waiting for shell map projection...",
			});
			return;
		}
		if (
			shouldRunLocalSpatialLoader({
				embeddedRuntime: this.isEmbeddedRuntime(),
				shellMapAdapterAttribute: this.hasAttribute("data-shell-map-adapter"),
			})
		) {
			this.controller.initializeSpatialData();
		}
	}

	disconnectedCallback() {
		if (this.unsubscribeState) {
			this.unsubscribeState();
			this.unsubscribeState = null;
		}
		this.unbindMapEvents();
		if (this.viewportRefreshTimer) {
			clearTimeout(this.viewportRefreshTimer);
			this.viewportRefreshTimer = null;
		}
		if (this.viewportStateTimer) {
			clearTimeout(this.viewportStateTimer);
			this.viewportStateTimer = null;
		}
		if (this.filterRefreshTimer) {
			clearTimeout(this.filterRefreshTimer);
			this.filterRefreshTimer = null;
		}
		if (this.timeRangeRefreshTimer) {
			clearTimeout(this.timeRangeRefreshTimer);
			this.timeRangeRefreshTimer = null;
		}
		this.pendingSpatialRefreshViewport = null;
		this.pendingViewportStateUpdate = null;
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (oldValue === newValue) {
			return;
		}
		if (
			name === "data-oc-app-mode" ||
			name === "data-shell-embed" ||
			name === "data-workbench-embed"
		) {
			this.applyRuntimePresentation();
		}
		if (
			name === "data-oc-app-mode" ||
			name === "data-shell-embed" ||
			name === "data-workbench-embed" ||
			PRESENTATION_ATTRIBUTES.includes(name)
		) {
			this.syncShellPresentationConfig();
		}
	}

	isEmbeddedRuntime() {
		const runtimeMode =
			this.dataset?.ocAppMode || this.getAttribute("data-oc-app-mode");
		if (runtimeMode === APP_RUNTIME_MODES.EMBEDDED) {
			return true;
		}
		return (
			this.hasAttribute("data-shell-embed") ||
			this.hasAttribute("data-workbench-embed")
		);
	}

	isShellMapAdapterMode() {
		return isShellMapAdapterModeEnabled({
			embeddedRuntime: this.isEmbeddedRuntime(),
			shellMapAdapterAttribute: this.hasAttribute("data-shell-map-adapter"),
		});
	}

	applyRuntimePresentation() {
		this.toggleAttribute("data-app-presentation-embedded", this.isEmbeddedRuntime());
	}

	resolvePresentationConfig() {
		const embedded = this.isEmbeddedRuntime();
		const defaults = {
			showTopChrome: !embedded,
			showTimeline: true,
			showDetailOverlay: true,
			showFilterEntry: true,
			mapEdgeToEdge: true,
			embedDensity: embedded ? "compact" : "comfortable",
			mapClearSelectionOnBackground: null,
		};

		const resolveBoolean = (attributeName, fallbackValue) => {
			if (!this.hasAttribute(attributeName)) {
				return fallbackValue;
			}
			const rawValue = this.getAttribute(attributeName);
			if (rawValue === "false") {
				return false;
			}
			if (rawValue === "true" || rawValue === "") {
				return true;
			}
			return fallbackValue;
		};

		const rawEmbedDensity = this.getAttribute("embed-density");
		const embedDensity =
			rawEmbedDensity === "compact" || rawEmbedDensity === "comfortable"
				? rawEmbedDensity
				: defaults.embedDensity;

		return {
			embedded,
			showTopChrome: resolveBoolean("show-top-chrome", defaults.showTopChrome),
			showTimeline: resolveBoolean("show-timeline", defaults.showTimeline),
			showDetailOverlay: resolveBoolean(
				"show-detail-overlay",
				defaults.showDetailOverlay,
			),
			showFilterEntry: resolveBoolean(
				"show-filter-entry",
				defaults.showFilterEntry,
			),
			mapEdgeToEdge: resolveBoolean("map-edge-to-edge", defaults.mapEdgeToEdge),
			embedDensity,
			mapClearSelectionOnBackground: resolveBoolean(
				"map-clear-selection-on-background",
				defaults.mapClearSelectionOnBackground,
			),
		};
	}

	syncShellPresentationConfig() {
		const shellElement = this.shadowRoot.querySelector(
			"open-collections-timemap-browser-shell",
		);
		if (!shellElement) {
			return;
		}
		const config = this.resolvePresentationConfig();
		shellElement.presentation = config;
		for (const attributeName of PRESENTATION_ATTRIBUTES) {
			if (this.hasAttribute(attributeName)) {
				shellElement.setAttribute(attributeName, this.getAttribute(attributeName) ?? "");
			} else {
				shellElement.removeAttribute(attributeName);
			}
		}
		shellElement.setAttribute("embed-density", config.embedDensity);
	}

	bindState() {
		const shellElement = this.shadowRoot.querySelector(
			"open-collections-timemap-browser-shell",
		);
		if (!shellElement) {
			return;
		}

		if (this.unsubscribeState) {
			this.unsubscribeState();
		}

		this.unsubscribeState = this.controller.subscribe((nextState) => {
			const responseFeatures = Array.isArray(nextState.spatial?.response?.features)
				? nextState.spatial.response.features
				: [];
			const shellAdapterMode = this.isShellMapAdapterMode();
			const mapVisibleFeatures = shellAdapterMode
				? responseFeatures
				: filterMapVisibleFeatures(responseFeatures, nextState.query);
			const didFilterSelectedFeature =
				Boolean(nextState.selectedFeatureId) &&
				!hasFeatureWithId(mapVisibleFeatures, nextState.selectedFeatureId);
			if (didFilterSelectedFeature) {
				this.controller.setSelectedFeature(null);
			}
			const projectedState = {
				...nextState,
				timeRange: {
					...(nextState.query?.timeRange || {}),
				},
				timelineSourceFeatures: responseFeatures,
				hoveredFeatureId:
					nextState.hoveredFeatureId &&
					!hasFeatureWithId(mapVisibleFeatures, nextState.hoveredFeatureId)
						? null
						: nextState.hoveredFeatureId,
				selectedFeatureId: didFilterSelectedFeature
					? null
					: nextState.selectedFeatureId,
				spatial: {
					...nextState.spatial,
					response: {
						...(nextState.spatial?.response || {}),
						features: mapVisibleFeatures,
					},
				},
			};
			shellElement.state = projectedState;
			const options =
				shellAdapterMode && this._latestShellMapProjection
					? resolveCanonicalShellFilterOptions(this._latestShellMapProjection)
					: resolveFilterOptions(nextState.spatial?.response);
			const normalizedPayload = normalizeBrowseShellQueryState({
				source: {
					app: "timemap-browser",
					mode: "map",
				},
				query: nextState.query,
				filters: {
					text: nextState.query?.text,
					types: nextState.query?.types,
					categories: [],
				},
				options,
				status: {
					loading:
						nextState?.spatial?.status === "loading" ||
						nextState?.spatial?.status === "idle",
					filterOptions: resolveFilterOptionsStatus({
						spatialStatus: nextState?.spatial?.status,
						options,
					}),
				},
			});
			this.dispatchEvent(
				new CustomEvent("browse-query-state", {
					bubbles: true,
					composed: true,
					detail: normalizedPayload,
				}),
			);
		});
	}

	bindMapEvents() {
		const shellElement = this.shadowRoot.querySelector(
			"open-collections-timemap-browser-shell",
		);
		if (!shellElement) {
			return;
		}
		shellElement.addEventListener(
			"timemap-browser-map-viewport-change",
			this.handleMapViewportChange,
		);
		shellElement.addEventListener(
			"timemap-browser-map-feature-click",
			this.handleMapFeatureClick,
		);
		shellElement.addEventListener(
			"timemap-browser-clear-selection",
			this.handleClearSelection,
		);
		this.addEventListener("timemap-browser-time-range-patch", this.handleTimeRangePatch);
		this.addEventListener("browse-query-patch", this.handleFilterPatch);
		this.addEventListener(
			"browse-shell-map-projection",
			this.handleShellMapProjection,
		);
		this.addEventListener(
			"browse-shell-runtime-state",
			this.handleShellRuntimeState,
		);
	}

	unbindMapEvents() {
		const shellElement = this.shadowRoot.querySelector(
			"open-collections-timemap-browser-shell",
		);
		if (!shellElement) {
			return;
		}
		shellElement.removeEventListener(
			"timemap-browser-map-viewport-change",
			this.handleMapViewportChange,
		);
		shellElement.removeEventListener(
			"timemap-browser-map-feature-click",
			this.handleMapFeatureClick,
		);
		shellElement.removeEventListener(
			"timemap-browser-clear-selection",
			this.handleClearSelection,
		);
		this.removeEventListener(
			"timemap-browser-time-range-patch",
			this.handleTimeRangePatch,
		);
		this.removeEventListener("browse-query-patch", this.handleFilterPatch);
		this.removeEventListener(
			"browse-shell-map-projection",
			this.handleShellMapProjection,
		);
		this.removeEventListener(
			"browse-shell-runtime-state",
			this.handleShellRuntimeState,
		);
	}

	onMapViewportChange(event) {
		const viewport = event?.detail || {};
		this.queueViewportStateUpdate(viewport);
		if (this.isShellMapAdapterMode()) {
			return;
		}

		const refreshBaseline =
			this.pendingSpatialRefreshViewport || this.lastSpatialRefreshViewport;
		if (!hasMeaningfulViewportDelta(viewport, refreshBaseline)) {
			return;
		}

		this.pendingSpatialRefreshViewport = viewport;
		if (this.viewportRefreshTimer) {
			clearTimeout(this.viewportRefreshTimer);
		}
		this.viewportRefreshTimer = setTimeout(() => {
			this.viewportRefreshTimer = null;
			if (!this.pendingSpatialRefreshViewport) {
				return;
			}
			this.lastSpatialRefreshViewport = this.pendingSpatialRefreshViewport;
			this.pendingSpatialRefreshViewport = null;
			this.controller.initializeSpatialData();
		}, 280);
	}

	onMapFeatureClick(event) {
		const featureId = event?.detail?.featureId || null;
		this.controller.setSelectedFeature(featureId);
	}

	onClearSelection() {
		this.controller.setSelectedFeature(null);
	}

	onFilterPatch(event) {
		const detail =
			event?.detail && typeof event.detail === "object" ? event.detail : {};
		const currentQuery = this.controller.getState()?.query;
		const normalizedPatch = normalizeBrowseShellQueryPatch(detail, currentQuery);
		const explicitTimeRange =
			detail?.timeRange && typeof detail.timeRange === "object"
				? detail.timeRange
				: detail?.query?.timeRange && typeof detail.query.timeRange === "object"
					? detail.query.timeRange
					: null;
		this.controller.setFilters(normalizedPatch.filters);
		if (explicitTimeRange) {
			this.controller.setTimeRange(explicitTimeRange);
		}
		this.queueFilterRefresh();
	}

	onTimeRangePatch(event) {
		const detail =
			event?.detail && typeof event.detail === "object" ? event.detail : {};
		this.setTimeRange(detail);
		if (this.isShellMapAdapterMode()) {
			this.dispatchEvent(
				new CustomEvent("browse-query-patch", {
					bubbles: true,
					composed: true,
					detail: {
						timeRange: detail,
					},
				}),
			);
		}
	}

	setTimeRange(timeRange = {}) {
		this.controller.setTimeRange(timeRange);
		this.queueTimeRangeRefresh();
	}

	queueFilterRefresh() {
		if (this.isShellMapAdapterMode()) {
			return;
		}
		if (this.filterRefreshTimer) {
			clearTimeout(this.filterRefreshTimer);
		}
		this.filterRefreshTimer = setTimeout(() => {
			this.filterRefreshTimer = null;
			this.controller.initializeSpatialData();
		}, 120);
	}

	queueTimeRangeRefresh() {
		if (this.isShellMapAdapterMode()) {
			return;
		}
		if (this.timeRangeRefreshTimer) {
			clearTimeout(this.timeRangeRefreshTimer);
		}
		this.timeRangeRefreshTimer = setTimeout(() => {
			this.timeRangeRefreshTimer = null;
			this.controller.initializeSpatialData();
		}, 120);
	}

	queueViewportStateUpdate(viewport) {
		const stateBaseline =
			this.pendingViewportStateUpdate || this.lastViewportStateUpdate;
		if (
			!hasMeaningfulViewportDelta(
				viewport,
				stateBaseline,
				VIEWPORT_STATE_THRESHOLDS,
			)
		) {
			return;
		}

		this.pendingViewportStateUpdate = viewport;
		if (this.viewportStateTimer) {
			return;
		}

		this.viewportStateTimer = setTimeout(() => {
			this.viewportStateTimer = null;
			if (!this.pendingViewportStateUpdate) {
				return;
			}
			this.lastViewportStateUpdate = this.pendingViewportStateUpdate;
			this.pendingViewportStateUpdate = null;
			this.controller.setViewport(this.lastViewportStateUpdate);
		}, 72);
	}

	onShellRuntimeState(event) {
		if (!this.isShellMapAdapterMode()) {
			return;
		}
		const detail =
			event?.detail && typeof event.detail === "object" ? event.detail : {};
		const diagnosticsSummary =
			detail?.diagnosticsSummary && typeof detail.diagnosticsSummary === "object"
				? detail.diagnosticsSummary
				: {};
		const status = String(diagnosticsSummary.ingestionStatus || "").trim();
		if (status === "idle" || status === "loading") {
			this.controller.setStatus({
				tone: "neutral",
				text: "Loading shell map data...",
			});
		} else if (status === "error") {
			this.controller.setStatus({
				tone: "critical",
				text: "Shell map ingestion failed.",
			});
		}
	}

	onShellMapProjection(event) {
		if (!this.isShellMapAdapterMode()) {
			return;
		}
		const detail =
			event?.detail && typeof event.detail === "object" ? event.detail : {};
		const projection =
			detail?.projection && typeof detail.projection === "object"
				? detail.projection
				: null;
		if (!projection || typeof projection.response !== "object") {
			return;
		}
		this._latestShellMapProjection = projection;
		const filteredVisibleItems = Number(projection?.diagnostics?.filteredVisibleItems || 0);
		const totalGeoreferencedItems = Number(
			projection?.diagnostics?.totalGeoreferencedItems || 0,
		);
		this.controller.setSpatialResponse(projection.response, {
			tone: "positive",
			text: `Shell map projection ready (${filteredVisibleItems} visible features from ${totalGeoreferencedItems} georeferenced items).`,
		});
	}

	render() {
		this.shadowRoot.innerHTML = `<open-collections-timemap-browser-shell></open-collections-timemap-browser-shell>`;
	}
}

if (!customElements.get("timemap-browser")) {
	customElements.define("timemap-browser", TimemapBrowserElement);
}

export { TimemapBrowserElement };
