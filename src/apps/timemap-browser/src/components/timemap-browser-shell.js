const timemapBrowserShellStyles = `
	:host {
		display: block;
		block-size: 100%;
		min-block-size: 0;
		color: #0f172a;
		font-family: Inter, "Segoe UI", Roboto, Arial, sans-serif;
		--timeline-reserved-space: 5.2rem;
		--timemap-shell-bottom-inset: 0px;
		--timemap-shell-overlay-inline-inset: clamp(0.85rem, 2.8vw, 1.4rem);
		--timemap-shell-overlay-top-offset: clamp(0.45rem, 1.6vh, 0.75rem);
		--timemap-shell-overlay-bottom-offset: clamp(0.4rem, 1.2vh, 0.7rem);
		--timemap-shell-overlay-detail-rail-gap: clamp(0.7rem, 2vh, 1rem);
		--timemap-shell-overlay-safe-top: env(safe-area-inset-top, 0px);
		--timemap-shell-overlay-safe-bottom: env(safe-area-inset-bottom, 0px);
		--timemap-shell-overlay-safe-inline-start: env(safe-area-inset-left, 0px);
		--timemap-shell-overlay-safe-inline-end: env(safe-area-inset-right, 0px);
		--timemap-shell-overlay-desktop-max-inline-size: none;
	}

	.shell {
		position: relative;
		inline-size: 100%;
		block-size: 100%;
		min-block-size: 0;
		overflow: hidden;
		background: #0b1120;
	}

	:host(:not([data-embedded])) {
		min-block-size: 100dvh;
	}

	:host(:not([data-embedded])) .shell {
		min-block-size: 100dvh;
	}

	.map-stage {
		position: absolute;
		inset: 0;
		z-index: 0;
	}

	.map-wrap,
	.map-wrap oc-map {
		inline-size: 100%;
		block-size: 100%;
	}

	.map-wrap oc-map {
		--oc-map-height: 100%;
		--oc-radius-md: 0px;
		--oc-border-width-sm: 0px;
		--oc-border-default: transparent;
	}

	.overlay-region {
		position: absolute;
		inset-inline-start: max(
			var(--timemap-shell-overlay-safe-inline-start),
			var(--timemap-shell-overlay-inline-inset)
		);
		inset-inline-end: max(
			var(--timemap-shell-overlay-safe-inline-end),
			var(--timemap-shell-overlay-inline-inset)
		);
		display: flex;
		justify-content: center;
		pointer-events: none;
	}

	.top-overlay {
		inset-block-start: calc(
			var(--timemap-shell-overlay-safe-top) + var(--timemap-shell-overlay-top-offset)
		);
		z-index: 4;
	}

	.bottom-overlay {
		inset-block-end: calc(
			var(--timemap-shell-overlay-safe-bottom) +
				var(--timemap-shell-overlay-bottom-offset) +
				var(--timemap-shell-bottom-inset, 0px)
		);
		z-index: 2;
	}

	.detail-overlay {
		inset-block-end: calc(
			var(--timeline-reserved-space, 5.2rem) +
				var(--timemap-shell-overlay-safe-bottom) +
				var(--timemap-shell-overlay-bottom-offset) +
				var(--timemap-shell-bottom-inset, 0px) +
				var(--timemap-shell-overlay-detail-rail-gap)
		);
		z-index: 4;
	}

	.top-chrome,
	.detail-shell {
		pointer-events: auto;
		border: 1px solid rgba(148, 163, 184, 0.38);
		backdrop-filter: blur(10px);
		background: rgba(248, 250, 252, 0.9);
		box-shadow: 0 16px 34px rgba(15, 23, 42, 0.22);
	}

	.top-chrome {
		inline-size: 100%;
		max-inline-size: var(--timemap-shell-overlay-desktop-max-inline-size);
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto auto;
		gap: 0.35rem;
		align-items: center;
		padding: 0.32rem 0.38rem;
		border-radius: 0.95rem;
	}

	.top-title {
		margin: 0;
		font-size: 0.78rem;
		line-height: 1.2;
		font-weight: 700;
		letter-spacing: 0.01em;
		text-transform: uppercase;
		color: #1e293b;
	}

	.chrome-note {
		margin: 0.06rem 0 0;
		font-size: 0.74rem;
		line-height: 1.2;
		color: #475569;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.top-primary {
		display: flex;
		align-items: center;
		gap: 0.2rem;
		padding-inline-start: 0.18rem;
		min-inline-size: 0;
	}

	.top-actions {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		justify-self: end;
		flex-shrink: 0;
	}

	.action-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-block-size: 1.95rem;
		padding: 0.28rem 0.62rem;
		border-radius: 0.65rem;
		border: 1px solid rgba(100, 116, 139, 0.48);
		background: rgba(255, 255, 255, 0.92);
		color: #0f172a;
		font-size: 0.74rem;
		font-weight: 650;
		line-height: 1;
		cursor: pointer;
		white-space: nowrap;
	}

	.action-button:hover {
		border-color: #475569;
		background: #ffffff;
	}

	.action-button--primary {
		background: rgba(14, 116, 144, 0.12);
		border-color: rgba(14, 116, 144, 0.45);
		color: #0f172a;
	}

	.timeline-shell {
		pointer-events: auto;
		inline-size: 100%;
		min-inline-size: min(100%, 24rem);
		max-inline-size: none;
		box-sizing: border-box;
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		align-items: stretch;
		gap: 0.2rem;
		padding: 0.48rem 0.7rem;
		border-radius: 1rem;
		border: 1px solid rgba(100, 116, 139, 0.35);
		backdrop-filter: blur(9px);
		background: linear-gradient(180deg, rgba(248, 250, 252, 0.96), rgba(241, 245, 249, 0.9));
		box-shadow: 0 -8px 26px rgba(15, 23, 42, 0.2);
	}

	.timeline-pill {
		inline-size: 2.2rem;
		block-size: 0.26rem;
		border-radius: 999px;
		background: rgba(100, 116, 139, 0.45);
		margin: 0 auto 0.08rem;
	}

	.timeline-note {
		margin: 0;
		font-size: 0.76rem;
		line-height: 1.32;
		color: #1e293b;
	}

	.timeline-slider {
		--oc-time-range-slider-accent: #0f766e;
		display: block;
		inline-size: 100%;
		min-inline-size: min(100%, 23rem);
		min-block-size: 9.8rem;
	}

	.detail-shell {
		inline-size: 100%;
		max-inline-size: var(--timemap-shell-overlay-desktop-max-inline-size);
		max-block-size: min(52vh, 26rem);
		overflow: auto;
		margin-inline: 0;
		padding: 0.65rem 0.72rem 0.75rem;
		border-radius: 1rem;
	}

	.detail-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		margin-block-end: 0.4rem;
	}

	.detail-heading {
		margin: 0;
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: #475569;
	}

	.detail-card {
		display: grid;
		gap: 0.56rem;
		padding: 0.15rem 0 0.1rem;
	}

	.detail-card__title {
		margin: 0;
		font-size: 1.07rem;
		line-height: 1.18;
		color: #0f172a;
	}

	.detail-card__subtitle {
		margin: -0.2rem 0 0;
		font-size: 0.8rem;
		line-height: 1.3;
		color: #475569;
	}

	.detail-card__media {
		inline-size: 100%;
		max-block-size: 11rem;
		object-fit: cover;
		border-radius: 0.65rem;
		border: 1px solid rgba(148, 163, 184, 0.35);
		background: rgba(226, 232, 240, 0.45);
	}

	.detail-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.32rem;
	}

	.detail-chip {
		display: inline-flex;
		align-items: center;
		min-block-size: 1.4rem;
		padding: 0.12rem 0.45rem;
		border-radius: 999px;
		border: 1px solid rgba(100, 116, 139, 0.35);
		background: rgba(255, 255, 255, 0.74);
		color: #334155;
		font-size: 0.7rem;
		font-weight: 600;
	}

	.detail-grid {
		display: grid;
		gap: 0.32rem;
	}

	.detail-row {
		margin: 0;
		font-size: 0.82rem;
		line-height: 1.35;
		color: #334155;
	}

	.detail-label {
		font-weight: 700;
		color: #0f172a;
	}

	.detail-empty {
		margin: 0;
		font-size: 0.85rem;
		line-height: 1.4;
		color: #475569;
	}

	.detail-actions {
		display: flex;
		gap: 0.4rem;
	}

	.sr-only {
		position: absolute;
		inline-size: 1px;
		block-size: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	:host([data-embed-density="compact"]) .top-chrome,
	:host([data-embed-density="compact"]) .timeline-shell,
	:host([data-embed-density="compact"]) .detail-shell {
		box-shadow: 0 8px 20px rgba(15, 23, 42, 0.18);
	}

	:host([data-embed-density="compact"]) {
		--timeline-reserved-space: 4.8rem;
	}

	:host([data-embedded]) .top-overlay {
		display: none;
	}

	@media (max-width: 767px) {
		:host {
			--timeline-reserved-space: 4.5rem;
		}

		.top-chrome {
			inline-size: 100%;
			grid-template-columns: minmax(0, 1fr) auto;
			padding: 0.32rem;
		}

		.top-primary {
			grid-column: 1 / -1;
			order: 0;
		}

		.top-actions {
			order: 1;
		}

		.timeline-shell {
			border-radius: 0.9rem;
			padding-block-end: 0.52rem;
		}

		.detail-shell {
			max-block-size: min(58vh, 26rem);
			border-radius: 1rem 1rem 0.7rem 0.7rem;
		}
	}

	@media (min-width: 768px) {
		:host {
			--timemap-shell-overlay-desktop-max-inline-size: 44rem;
		}
	}
`;

function formatTimeRange(timeRange = {}) {
	if (!timeRange.start && !timeRange.end) {
		return "Not set";
	}
	if (timeRange.start && timeRange.end) {
		return `${timeRange.start} to ${timeRange.end}`;
	}
	return timeRange.start ? `From ${timeRange.start}` : `Until ${timeRange.end}`;
}

function toFiniteYearFromUtcTimestamp(value) {
	const parsed = Number(value);
	if (!Number.isFinite(parsed)) {
		return null;
	}
	const year = new Date(parsed).getUTCFullYear();
	return Number.isFinite(year) ? year : null;
}

function toFiniteYearBound(value) {
	if (value === null || value === undefined || value === "") {
		return null;
	}
	const text = String(value).trim();
	if (!text) {
		return null;
	}
	if (/^[-+]?\d{1,6}$/.test(text)) {
		const year = Number(text);
		return Number.isFinite(year) ? year : null;
	}
	const match = text.match(/^(?<year>[-+]?\d{1,6})(?:-\d{2}(?:-\d{2})?)?$/);
	if (!match?.groups?.year) {
		return null;
	}
	const year = Number(match.groups.year);
	return Number.isFinite(year) ? year : null;
}

function deriveTemporalFeatureYearDomain(features = []) {
	if (!Array.isArray(features) || features.length === 0) {
		return null;
	}
	let minYear = Number.POSITIVE_INFINITY;
	let maxYear = Number.NEGATIVE_INFINITY;
	for (const feature of features) {
		const properties = feature?.properties || {};
		if (properties.timeKnown !== true) {
			continue;
		}
		const startYear = toFiniteYearFromUtcTimestamp(properties.timeStart);
		const endYear = toFiniteYearFromUtcTimestamp(properties.timeEnd);
		if (!Number.isFinite(startYear) || !Number.isFinite(endYear)) {
			continue;
		}
		minYear = Math.min(minYear, startYear, endYear);
		maxYear = Math.max(maxYear, startYear, endYear);
	}
	if (!Number.isFinite(minYear) || !Number.isFinite(maxYear)) {
		return null;
	}
	return {
		min: minYear,
		max: maxYear,
	};
}

function resolveActiveTimeRangeYears(state = {}, domain = null) {
	if (!domain) {
		return null;
	}
	const queryTimeRange =
		state.query?.timeRange && typeof state.query.timeRange === "object"
			? state.query.timeRange
			: null;
	const stateTimeRange =
		state.timeRange && typeof state.timeRange === "object" ? state.timeRange : null;
	const sourceRange = queryTimeRange || stateTimeRange || {};
	const parsedStart = toFiniteYearBound(sourceRange.start);
	const parsedEnd = toFiniteYearBound(sourceRange.end);
	const startYear = Number.isFinite(parsedStart) ? parsedStart : domain.min;
	const endYear = Number.isFinite(parsedEnd) ? parsedEnd : domain.max;
	return {
		start: Math.min(startYear, endYear),
		end: Math.max(startYear, endYear),
	};
}

function getVisibleOverlayCount(visibleOverlays = {}) {
	return Object.values(visibleOverlays).filter(Boolean).length;
}

function toBboxFromBounds(bounds) {
	if (!Array.isArray(bounds) || bounds.length < 2) {
		return null;
	}
	const [southWest, northEast] = bounds;
	if (!Array.isArray(southWest) || !Array.isArray(northEast)) {
		return null;
	}
	return {
		west: Number(southWest[0]),
		south: Number(southWest[1]),
		east: Number(northEast[0]),
		north: Number(northEast[1]),
	};
}

function toFeatureCollection(features) {
	return {
		type: "FeatureCollection",
		features,
	};
}

function toPointCoordinateKey(feature) {
	const coordinates = feature?.geometry?.coordinates;
	if (!Array.isArray(coordinates) || coordinates.length < 2) {
		return null;
	}
	const [lng, lat] = coordinates;
	if (!Number.isFinite(Number(lng)) || !Number.isFinite(Number(lat))) {
		return null;
	}
	return `${Number(lng).toFixed(6)}:${Number(lat).toFixed(6)}`;
}

function getPointFeatureVisibilityDiagnostics(features = []) {
	const pointFeatures = features.filter((feature) => feature?.geometry?.type === "Point");
	if (pointFeatures.length === 0) {
		return {
			pointFeatureCount: 0,
			uniqueCoordinateCount: 0,
			overlappingItemCount: 0,
			overlapGroupCount: 0,
		};
	}
	const coordinateCounts = new Map();
	for (const feature of pointFeatures) {
		const coordinateKey = toPointCoordinateKey(feature);
		if (!coordinateKey) {
			continue;
		}
		coordinateCounts.set(coordinateKey, (coordinateCounts.get(coordinateKey) || 0) + 1);
	}

	let uniqueCoordinateCount = 0;
	let overlappingItemCount = 0;
	let overlapGroupCount = 0;
	for (const count of coordinateCounts.values()) {
		uniqueCoordinateCount += 1;
		if (count > 1) {
			overlappingItemCount += count;
			overlapGroupCount += 1;
		}
	}

	return {
		pointFeatureCount: pointFeatures.length,
		uniqueCoordinateCount,
		overlappingItemCount,
		overlapGroupCount,
	};
}

function toDeterministicRadians(value) {
	const normalized = String(value || "");
	let hash = 0;
	for (let index = 0; index < normalized.length; index += 1) {
		hash = (hash * 31 + normalized.charCodeAt(index)) >>> 0;
	}
	return ((hash % 360) * Math.PI) / 180;
}

function offsetPointCoordinates(lng, lat, index, total) {
	if (!Number.isFinite(lng) || !Number.isFinite(lat) || total <= 1) {
		return [lng, lat];
	}
	const radiusMeters = 14;
	const degreesPerMeter = 1 / 111320;
	const latOffsetDegrees = radiusMeters * degreesPerMeter;
	const latRadians = (lat * Math.PI) / 180;
	const lonDivisor = Math.max(Math.cos(latRadians), 0.2);
	const lonOffsetDegrees = latOffsetDegrees / lonDivisor;
	const stepRadians = (Math.PI * 2) / total;
	const startRadians = toDeterministicRadians(`${lng}:${lat}:${total}`);
	const angleRadians = startRadians + index * stepRadians;
	return [
		lng + Math.cos(angleRadians) * lonOffsetDegrees,
		lat + Math.sin(angleRadians) * latOffsetDegrees,
	];
}

function applyPointOverlapOffsets(pointFeatures = []) {
	const pointGroupsByCoordinate = new Map();
	const passthroughFeatures = [];
	for (const feature of pointFeatures) {
		const coordinateKey = toPointCoordinateKey(feature);
		if (!coordinateKey) {
			passthroughFeatures.push(feature);
			continue;
		}
		if (!pointGroupsByCoordinate.has(coordinateKey)) {
			pointGroupsByCoordinate.set(coordinateKey, []);
		}
		pointGroupsByCoordinate.get(coordinateKey).push(feature);
	}

	const adjustedPointFeatures = [];
	for (const group of pointGroupsByCoordinate.values()) {
		const groupSize = group.length;
		for (const [index, feature] of group.entries()) {
			const coordinates = Array.isArray(feature.geometry?.coordinates)
				? feature.geometry.coordinates
				: [];
			const [lng, lat] = coordinates;
			const [offsetLng, offsetLat] = offsetPointCoordinates(
				Number(lng),
				Number(lat),
				index,
				groupSize,
			);
			adjustedPointFeatures.push({
				...feature,
				geometry: {
					...feature.geometry,
					coordinates: [offsetLng, offsetLat],
				},
				properties: {
					...(feature.properties || {}),
					overlapCount: groupSize,
					overlapIndex: index,
					originalCoordinates: [Number(lng), Number(lat)],
				},
			});
		}
	}
	return [...adjustedPointFeatures, ...passthroughFeatures];
}

function toMapFeature(feature, fallbackId) {
	if (!feature || typeof feature !== "object" || !feature.geometry) {
		return null;
	}
	return {
		type: "Feature",
		id: feature.id || feature.properties?.id || fallbackId,
		properties: {
			...(feature.properties || {}),
			id: feature.id || feature.properties?.id || fallbackId,
		},
		geometry: feature.geometry,
	};
}

function createLayerDataSignature(features, overlays = {}) {
	return JSON.stringify({
		features: features.map((feature) => ({
			id: feature.id,
			geometryType: feature.geometry?.type,
			coordinates: feature.geometry?.coordinates,
			properties: feature.properties,
		})),
		featuresVisible: Boolean(overlays.features),
	});
}

function toCenterSignature(viewport = {}) {
	return `${Number(viewport.center?.lng || 0).toFixed(6)}:${Number(
		viewport.center?.lat || 0,
	).toFixed(6)}:${Number(viewport.zoom || 0).toFixed(4)}`;
}

function createSpatialRenderSignature(state = {}) {
	return JSON.stringify({
		requestId: state.spatial?.response?.request?.requestId || "",
		featureCount: Array.isArray(state.spatial?.response?.features)
			? state.spatial.response.features.length
			: 0,
		featuresVisible: Boolean(state.visibleOverlays?.features),
		selectedFeatureId: state.selectedFeatureId || null,
	});
}

function toSelectedFeatureSummary(state = {}) {
	const features = Array.isArray(state.spatial?.response?.features)
		? state.spatial.response.features
		: [];
	const selectedFeatureId = state.selectedFeatureId;
	if (!selectedFeatureId) {
		return null;
	}
	return (
		features.find((feature) => {
			const featureId = feature?.id ?? feature?.properties?.id ?? null;
			return featureId === selectedFeatureId;
		}) || null
	);
}

function renderSelectedFeatureCard(feature) {
	const properties = feature?.properties || {};
	const title =
		properties.title || properties.label || properties.name || "Untitled feature";
	const subtitle = properties.subtitle || properties.dateLabel || "";
	const featureId = feature?.id || properties.id || "n/a";
	const category = properties.category || properties.type || properties.kind || "n/a";
	const description =
		properties.description || properties.statusText || properties.status || "n/a";
	const sourceLabel = properties.sourceLabel || properties.collectionTitle || "n/a";
	const sourceUrl = properties.sourceUrl || "";
	const imageUrl = properties.imageUrl || properties.thumbnailUrl || properties.mediaUrl || "";
	const geometryType = feature?.geometry?.type || "n/a";
	return `
		<div class="detail-card" data-bind="selected-detail-card">
			${imageUrl ? `<img class="detail-card__media" src="${imageUrl}" alt="${title}">` : ""}
			<h3 class="detail-card__title">${title}</h3>
			${subtitle ? `<p class="detail-card__subtitle">${subtitle}</p>` : ""}
			<div class="detail-meta">
				<span class="detail-chip">Category: ${category}</span>
				<span class="detail-chip">Geometry: ${geometryType}</span>
				<span class="detail-chip">Source: ${sourceLabel}</span>
			</div>
			<div class="detail-grid">
				<p class="detail-row"><span class="detail-label">ID:</span> ${featureId}</p>
				<p class="detail-row"><span class="detail-label">Description:</span> ${description}</p>
				${sourceUrl ? `<p class="detail-row"><span class="detail-label">Source URL:</span> <a href="${sourceUrl}" target="_blank" rel="noreferrer">${sourceUrl}</a></p>` : ""}
			</div>
			<div class="detail-actions">
				<button type="button" class="action-button action-button--primary" data-action="feature-action-save">Save</button>
				<button type="button" class="action-button" data-action="clear-selection">Clear selection</button>
			</div>
		</div>
	`;
}

function parseBooleanAttribute(value, fallbackValue) {
	if (value == null) {
		return fallbackValue;
	}
	if (value === "" || value === "true") {
		return true;
	}
	if (value === "false") {
		return false;
	}
	return fallbackValue;
}

class TimemapBrowserShellElement extends HTMLElement {
	static get observedAttributes() {
		return [
			"show-top-chrome",
			"show-timeline",
			"show-detail-overlay",
			"show-filter-entry",
			"map-edge-to-edge",
			"embed-density",
			"map-clear-selection-on-background",
		];
	}

	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this._state = null;
		this._presentation = {};
		this._mapReady = false;
		this._hasRendered = false;
		this._lastLayerDataSignature = null;
		this._lastAppliedCenterSignature = null;
		this._lastMapViewportSignature = null;
		this._lastSpatialRenderSignature = null;
		this._lastFeatureClickTimestamp = 0;
		this._hasAutoFitInitialCollectionPoints = false;
		this._suppressTimelineChangeEvent = false;
		this._handleMapReady = this._onMapReady.bind(this);
		this._handleViewportChange = this._onMapViewportChange.bind(this);
		this._handleMapFeatureClick = this._onMapFeatureClick.bind(this);
		this._handleTimelineRangeChange = this._onTimelineRangeChange.bind(this);
		this._handleClick = this._onClick.bind(this);
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (oldValue === newValue) {
			return;
		}
		if (name === "embed-density") {
			this.dataset.embedDensity = newValue === "compact" ? "compact" : "comfortable";
		}
		if (this._hasRendered) {
			this.updateViewFromState();
		}
	}

	set state(nextState) {
		const previousState = this._state;
		this._state = nextState;
		if (!this._hasRendered) {
			this.render();
			return;
		}
		this.updateViewFromState();
		if (this.shouldRenderSpatialLayers(previousState, nextState)) {
			this.renderSpatialLayers();
		}
	}

	get state() {
		return this._state;
	}

	set presentation(nextPresentation) {
		this._presentation = { ...(nextPresentation || {}) };
		if (this._hasRendered) {
			this.updateViewFromState();
		}
	}

	get presentation() {
		return this._presentation;
	}

	connectedCallback() {
		this.render();
	}

	getConfig() {
		const embeddedByState = Boolean(this._presentation?.embedded);
		const showTopChromeDefault = !embeddedByState;
		const mapClearFallback = this.isMobileViewport();
		const embedDensityDefault = embeddedByState ? "compact" : "comfortable";
		const embedDensityAttr = this.getAttribute("embed-density");
		const embedDensity =
			embedDensityAttr === "compact" || embedDensityAttr === "comfortable"
				? embedDensityAttr
				: embedDensityDefault;

		return {
			showTopChrome: parseBooleanAttribute(
				this.getAttribute("show-top-chrome"),
				showTopChromeDefault,
			),
			showTimeline: parseBooleanAttribute(this.getAttribute("show-timeline"), true),
			showDetailOverlay: parseBooleanAttribute(
				this.getAttribute("show-detail-overlay"),
				true,
			),
			showFilterEntry: parseBooleanAttribute(
				this.getAttribute("show-filter-entry"),
				true,
			),
			mapEdgeToEdge: parseBooleanAttribute(
				this.getAttribute("map-edge-to-edge"),
				true,
			),
			embedDensity,
			mapClearSelectionOnBackground: parseBooleanAttribute(
				this.getAttribute("map-clear-selection-on-background"),
				mapClearFallback,
			),
		};
	}

	isMobileViewport() {
		return typeof window !== "undefined"
			? window.matchMedia("(max-width: 767px)").matches
			: false;
	}

	render() {
		if (!this._hasRendered) {
			this.shadowRoot.innerHTML = `
				<style>${timemapBrowserShellStyles}</style>
				<main class="shell" aria-label="Timemap browser map-first shell">
					<section class="map-stage" aria-label="Map stage">
						<div class="map-wrap">
							<oc-map
								style-url="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
							></oc-map>
						</div>
					</section>

					<section class="overlay-region top-overlay" data-region="top-overlay">
						<div class="top-chrome" data-bind="top-chrome">
							<div class="top-primary">
								<h1 class="top-title">Timemap browser</h1>
								<p class="chrome-note" data-bind="top-summary"></p>
							</div>
							<div class="top-actions">
								<button type="button" class="action-button action-button--primary" data-action="filter-entry">Filters</button>
							</div>
							<div class="top-actions">
								<button type="button" class="action-button" data-action="shell-menu">Menu</button>
							</div>
						</div>
					</section>

					<section class="overlay-region detail-overlay" data-region="detail-overlay">
						<div class="detail-shell" data-bind="detail-shell" hidden>
							<div class="detail-header">
								<h2 class="detail-heading">Selected feature</h2>
								<button type="button" class="action-button" data-action="clear-selection">Close</button>
							</div>
							<div data-bind="selected-feature-detail"></div>
						</div>
					</section>

					<section class="overlay-region bottom-overlay" data-region="bottom-overlay">
						<div class="timeline-shell" data-bind="timeline-shell">
							<div class="timeline-pill" aria-hidden="true"></div>
							<timemap-browser-time-range-control class="timeline-slider" data-bind="timeline-slider"></timemap-browser-time-range-control>
							<p class="timeline-note" data-bind="time-range-note"></p>
							<p class="sr-only" data-bind="status"></p>
						</div>
					</section>
				</main>
			`;

			const mapElement = this.shadowRoot.querySelector("oc-map");
			if (mapElement) {
				mapElement.addEventListener("oc-map-ready", this._handleMapReady, {
					once: true,
				});
				mapElement.addEventListener(
					"oc-map-viewport-change",
					this._handleViewportChange,
				);
				mapElement.addEventListener(
					"oc-map-feature-click",
					this._handleMapFeatureClick,
				);
			}
			const timelineSliderElement = this.shadowRoot.querySelector(
				'[data-bind="timeline-slider"]',
			);
			if (timelineSliderElement) {
				timelineSliderElement.addEventListener(
					"timemap-browser-time-range-change",
					this._handleTimelineRangeChange,
				);
			}
			this.shadowRoot.addEventListener("click", this._handleClick);
			this._hasRendered = true;
		}

		this.updateViewFromState();
		this.renderSpatialLayers();
	}

	updateViewFromState() {
		const state = this._state || {
			filters: {},
			timeRange: {},
			selectedFeatureId: null,
			visibleOverlays: {},
			viewport: { center: { lng: 5.1769, lat: 52.225 }, zoom: 13.6 },
			spatial: {
				request: { strategy: { mode: "explore", density: "auto" } },
				response: { features: [] },
				status: "idle",
			},
			status: { text: "Timemap map-first shell ready." },
		};

		const config = this.getConfig();
		this.dataset.embedDensity = config.embedDensity;
		this.toggleAttribute("data-embedded", Boolean(this._presentation?.embedded));
		const selectedFeature = toSelectedFeatureSummary(state);
		const activeFilterCount =
			(state.filters.text ? 1 : 0) +
			(state.filters.keywords?.length || 0) +
			(state.filters.tags?.length || 0) +
			(state.filters.types?.length || 0);
		const spatialFeatures = Array.isArray(state.spatial?.response?.features)
			? state.spatial.response.features
			: [];
		const spatialFeatureCount = spatialFeatures.length;
		const visibleOverlayCount = getVisibleOverlayCount(state.visibleOverlays);
		const pointVisibilityDiagnostics = getPointFeatureVisibilityDiagnostics(spatialFeatures);

		this.updateText(
			"top-summary",
			`${spatialFeatureCount} mapped features (${pointVisibilityDiagnostics.uniqueCoordinateCount} visible positions; ${pointVisibilityDiagnostics.overlapGroupCount} overlap groups) • ${activeFilterCount} active filters • ${visibleOverlayCount} visible overlays`,
		);
		this.syncTimelineControl(state);
		this.updateText("status", `Status: ${state.status.text}`);
		this.renderSelectedFeatureDetail(selectedFeature);
		this.syncOverlayVisibility(config, Boolean(selectedFeature));
		this.syncMapViewport(state.viewport);
	}

	syncTimelineControl(state = {}) {
		const timelineSliderElement = this.shadowRoot.querySelector(
			'[data-bind="timeline-slider"]',
		);
		if (!timelineSliderElement) {
			return;
		}
		const timelineFeatures = Array.isArray(state.timelineSourceFeatures)
			? state.timelineSourceFeatures
			: Array.isArray(state.spatial?.response?.features)
				? state.spatial.response.features
				: [];
		const temporalDomain = deriveTemporalFeatureYearDomain(timelineFeatures);
		if (!temporalDomain) {
			this._suppressTimelineChangeEvent = true;
			timelineSliderElement.setAttribute("disabled", "");
			timelineSliderElement.setAttribute("domain-min", "0");
			timelineSliderElement.setAttribute("domain-max", "1");
			timelineSliderElement.setAttribute("range-start", "0");
			timelineSliderElement.setAttribute("range-end", "1");
			this._suppressTimelineChangeEvent = false;
			this.updateText("time-range-note", "No known temporal range in loaded features.");
			return;
		}

		const activeRange = resolveActiveTimeRangeYears(state, temporalDomain);
		this._suppressTimelineChangeEvent = true;
		timelineSliderElement.removeAttribute("disabled");
		timelineSliderElement.setAttribute("domain-min", String(temporalDomain.min));
		timelineSliderElement.setAttribute("domain-max", String(temporalDomain.max));
		timelineSliderElement.setAttribute("range-start", String(activeRange.start));
		timelineSliderElement.setAttribute("range-end", String(activeRange.end));
		this._suppressTimelineChangeEvent = false;
		this.updateText(
			"time-range-note",
			`Active time range: ${formatTimeRange(state.timeRange)}.`,
		);
	}

	_onTimelineRangeChange(event) {
		if (this._suppressTimelineChangeEvent) {
			return;
		}
		const detail = event?.detail || {};
		const startYear = Number(detail.start);
		const endYear = Number(detail.end);
		if (!Number.isFinite(startYear) || !Number.isFinite(endYear)) {
			return;
		}
		const nextStart = String(Math.min(startYear, endYear));
		const nextEnd = String(Math.max(startYear, endYear));
		const currentQueryTimeRange =
			this._state?.query?.timeRange && typeof this._state.query.timeRange === "object"
				? this._state.query.timeRange
				: {};
		const currentStateTimeRange =
			this._state?.timeRange && typeof this._state.timeRange === "object"
				? this._state.timeRange
				: {};
		const currentStart =
			currentQueryTimeRange.start ??
			currentStateTimeRange.start ??
			null;
		const currentEnd = currentQueryTimeRange.end ?? currentStateTimeRange.end ?? null;
		if (String(currentStart ?? "") === nextStart && String(currentEnd ?? "") === nextEnd) {
			return;
		}
		this.dispatchEvent(
			new CustomEvent("timemap-browser-time-range-patch", {
				bubbles: true,
				composed: true,
				detail: {
					start: nextStart,
					end: nextEnd,
				},
			}),
		);
	}

	syncOverlayVisibility(config, hasSelectedFeature) {
		const topOverlay = this.shadowRoot.querySelector('[data-region="top-overlay"]');
		const topChrome = this.shadowRoot.querySelector('[data-bind="top-chrome"]');
		const timelineOverlay = this.shadowRoot.querySelector('[data-region="bottom-overlay"]');
		const timelineShell = this.shadowRoot.querySelector('[data-bind="timeline-shell"]');
		const detailOverlay = this.shadowRoot.querySelector('[data-region="detail-overlay"]');
		const detailShell = this.shadowRoot.querySelector('[data-bind="detail-shell"]');
		const filterButton = this.shadowRoot.querySelector('[data-action="filter-entry"]');
		if (!topOverlay || !topChrome || !timelineOverlay || !timelineShell || !detailOverlay || !detailShell) {
			return;
		}

		topOverlay.hidden = !config.showTopChrome;
		topChrome.hidden = !config.showTopChrome;
		timelineOverlay.hidden = !config.showTimeline;
		timelineShell.hidden = !config.showTimeline;
		detailOverlay.hidden = !(config.showDetailOverlay && hasSelectedFeature);
		detailShell.hidden = !(config.showDetailOverlay && hasSelectedFeature);
		if (filterButton) {
			filterButton.hidden = !config.showFilterEntry;
		}

		if (!config.mapEdgeToEdge) {
			this.style.setProperty("--timeline-reserved-space", "6rem");
		} else {
			this.style.removeProperty("--timeline-reserved-space");
		}
	}

	updateText(bindKey, value) {
		const element = this.shadowRoot.querySelector(`[data-bind="${bindKey}"]`);
		if (element && element.textContent !== value) {
			element.textContent = value;
		}
	}

	renderSelectedFeatureDetail(selectedFeature) {
		const detailElement = this.shadowRoot.querySelector(
			'[data-bind="selected-feature-detail"]',
		);
		if (!detailElement) {
			return;
		}

		if (!selectedFeature) {
			detailElement.innerHTML = `<p class="detail-empty">Select a map feature to open detail.</p>`;
			return;
		}
		detailElement.innerHTML = renderSelectedFeatureCard(selectedFeature);
	}

	syncMapViewport(viewport = {}) {
		const mapElement = this.shadowRoot.querySelector("oc-map");
		if (!mapElement) {
			return;
		}
		const centerSignature = toCenterSignature(viewport);
		if (this._lastAppliedCenterSignature === centerSignature) {
			return;
		}
		if (this._lastMapViewportSignature === centerSignature) {
			this._lastAppliedCenterSignature = centerSignature;
			return;
		}
		const centerLngValue = String(viewport.center?.lng ?? 0);
		const centerLatValue = String(viewport.center?.lat ?? 0);
		const zoomValue = String(viewport.zoom ?? 0);
		if (mapElement.getAttribute("center-lng") !== centerLngValue) {
			mapElement.setAttribute("center-lng", centerLngValue);
		}
		if (mapElement.getAttribute("center-lat") !== centerLatValue) {
			mapElement.setAttribute("center-lat", centerLatValue);
		}
		if (mapElement.getAttribute("zoom") !== zoomValue) {
			mapElement.setAttribute("zoom", zoomValue);
		}
		this._lastAppliedCenterSignature = centerSignature;
	}

	_onMapReady() {
		this._mapReady = true;
		this.renderSpatialLayers();
	}

	_onMapViewportChange(event) {
		const detail = event?.detail || {};
		const center = detail.center
			? {
					lng: Number(detail.center.lng),
					lat: Number(detail.center.lat),
				}
			: null;
		if (!center) {
			return;
		}
		const viewportSignature = toCenterSignature({
			center,
			zoom: Number(detail.zoom),
		});
		this._lastMapViewportSignature = viewportSignature;

		const mapElement = this.shadowRoot.querySelector("oc-map");
		this.dispatchEvent(
			new CustomEvent("timemap-browser-map-viewport-change", {
				bubbles: true,
				composed: true,
				detail: {
					center,
					zoom: Number(detail.zoom),
					bearing: Number(detail.bearing),
					pitch: Number(detail.pitch),
					bbox: toBboxFromBounds(detail.bounds),
					pixelSize: mapElement
						? {
								width: Math.round(mapElement.clientWidth || 0),
								height: Math.round(mapElement.clientHeight || 0),
							}
						: {
								width: null,
								height: null,
							},
				},
			}),
		);
	}

	_onMapFeatureClick(event) {
		this._lastFeatureClickTimestamp = Date.now();
		const detail = event?.detail || {};
		this.dispatchEvent(
			new CustomEvent("timemap-browser-map-feature-click", {
				bubbles: true,
				composed: true,
				detail: {
					featureId: detail.featureId || detail.featureProperties?.id || null,
					layerId: detail.layerId || null,
					sourceId: detail.sourceId || null,
				},
			}),
		);
	}

	_onClick(event) {
		const target = event?.target;
		if (!(target instanceof HTMLElement)) {
			return;
		}

		if (target.closest('[data-action="clear-selection"]')) {
			this.dispatchEvent(
				new CustomEvent("timemap-browser-clear-selection", {
					bubbles: true,
					composed: true,
				}),
			);
			return;
		}

		const mapContainerClicked = Boolean(target.closest("oc-map"));
		const state = this._state || {};
		if (!state.selectedFeatureId || !mapContainerClicked) {
			return;
		}
		const config = this.getConfig();
		if (!config.mapClearSelectionOnBackground) {
			return;
		}
		if (Date.now() - this._lastFeatureClickTimestamp < 240) {
			return;
		}
		this.dispatchEvent(
			new CustomEvent("timemap-browser-clear-selection", {
				bubbles: true,
				composed: true,
			}),
		);
	}

	shouldRenderSpatialLayers(previousState, nextState) {
		if (!nextState) {
			return false;
		}
		const nextSignature = createSpatialRenderSignature(nextState);
		if (this._lastSpatialRenderSignature === nextSignature) {
			return false;
		}
		this._lastSpatialRenderSignature = nextSignature;
		return previousState !== nextState;
	}

	renderSpatialLayers() {
		const mapElement = this.shadowRoot.querySelector("oc-map");
		const state = this._state;
		if (!mapElement || !this._mapReady || !state) {
			return;
		}

		const features = Array.isArray(state.spatial?.response?.features)
			? state.spatial.response.features
			: [];
		const normalizedFeatures = features
			.map((feature, index) => toMapFeature(feature, `stub-feature-${index}`))
			.filter(Boolean);
		const nextLayerDataSignature = createLayerDataSignature(
			normalizedFeatures,
			state.visibleOverlays,
		);
		if (nextLayerDataSignature === this._lastLayerDataSignature) {
			return;
		}
		this._lastLayerDataSignature = nextLayerDataSignature;

		const pointFeatures = normalizedFeatures.filter(
			(feature) => feature.geometry?.type === "Point",
		);
		const adjustedPointFeatures = applyPointOverlapOffsets(pointFeatures);
		const lineFeatures = normalizedFeatures.filter(
			(feature) => feature.geometry?.type === "LineString",
		);
		const polygonFeatures = normalizedFeatures.filter(
			(feature) => feature.geometry?.type === "Polygon",
		);

		mapElement.setGeoJsonData("timemap-polygon-fill", toFeatureCollection(polygonFeatures), {
			type: "fill",
			paint: {
				"fill-color": "#60a5fa",
				"fill-opacity": 0.2,
			},
			selectionProperty: "id",
			visible: Boolean(state.visibleOverlays?.features),
		});
		mapElement.setGeoJsonData("timemap-line", toFeatureCollection(lineFeatures), {
			type: "line",
			paint: {
				"line-color": "#0369a1",
				"line-width": 3,
			},
			selectionProperty: "id",
			visible: Boolean(state.visibleOverlays?.features),
		});
		mapElement.setGeoJsonData(
			"timemap-points",
			toFeatureCollection(adjustedPointFeatures),
			{
				type: "circle",
				paint: {
					"circle-radius": [
						"case",
						[">", ["coalesce", ["get", "overlapCount"], 1], 1],
						8.5,
						7,
					],
					"circle-color": [
						"case",
						[">", ["coalesce", ["get", "overlapCount"], 1], 1],
						"#0f766e",
						"#1d4ed8",
					],
					"circle-stroke-width": 1.5,
					"circle-stroke-color": "#e2e8f0",
				},
				selectionProperty: "id",
				visible: Boolean(state.visibleOverlays?.features),
			},
		);

		if (!this._hasAutoFitInitialCollectionPoints && adjustedPointFeatures.length > 0) {
			const mobileViewport = this.isMobileViewport();
			const didAutoFit = mapElement.fitToData("timemap-points", {
				padding: mobileViewport ? 54 : 78,
				maxZoom: mobileViewport ? 14.25 : 14.8,
				duration: 0,
			});
			if (didAutoFit) {
				this._hasAutoFitInitialCollectionPoints = true;
			}
		}

		const selectedFeature = toSelectedFeatureSummary(state);
		if (!selectedFeature) {
			mapElement.clearSelection();
			return;
		}
		const geometryType = selectedFeature.geometry?.type;
		const sourceId =
			geometryType === "Point"
				? "timemap-points"
				: geometryType === "LineString"
					? "timemap-line"
					: "timemap-polygon-fill";
		mapElement.selectFeature(sourceId, selectedFeature.id, { property: "id" });
	}
}

if (!customElements.get("open-collections-timemap-browser-shell")) {
	customElements.define("open-collections-timemap-browser-shell", TimemapBrowserShellElement);
}

export { TimemapBrowserShellElement };
