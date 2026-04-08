import {
	createCollectionQueryState,
	normalizeCollectionQueryFilterPatch,
	normalizeCollectionQueryState,
} from "../../../../shared/data/query/collection-query-contract.js";
import {
	createSpatialQueryInput,
	normalizeSpatialViewportInput,
	normalizeSpatialQueryInput,
} from "../../../../shared/data/spatial/spatial-query-contract.js";
import { createTimemapBrowserInitialState } from "../state/initial-state.js";
import { loadCollectionSpatialResponse } from "../services/collection-spatial-loader.js";

function buildSpatialRequest(state) {
	return normalizeSpatialQueryInput(
		{
			query: state.query,
			viewport: state.viewport,
		},
		createSpatialQueryInput(),
	);
}

function cloneState(state) {
	return {
		...state,
		query: normalizeCollectionQueryState(state.query),
		filters: {
			...state.filters,
			text: state.filters.text || "",
			keywords: [...state.filters.keywords],
			tags: [...state.filters.tags],
			types: [...state.filters.types],
			categories: [...(state.filters.categories || [])],
		},
		timeRange: { ...state.timeRange },
		visibleOverlays: { ...state.visibleOverlays },
		viewport: {
			...state.viewport,
			center: { ...state.viewport.center },
			bbox: state.viewport.bbox ? { ...state.viewport.bbox } : null,
			pixelSize: state.viewport.pixelSize
				? { ...state.viewport.pixelSize }
				: { width: null, height: null },
		},
		spatial: {
			...state.spatial,
			request: normalizeSpatialQueryInput(state.spatial?.request),
			response: {
				...(state.spatial?.response || {}),
				features: [...(state.spatial?.response?.features || [])],
				clusters: [...(state.spatial?.response?.clusters || [])],
				aggregates: {
					...(state.spatial?.response?.aggregates || {}),
					byType: [...(state.spatial?.response?.aggregates?.byType || [])],
					byTimeBucket: [...(state.spatial?.response?.aggregates?.byTimeBucket || [])],
				},
				pageInfo: { ...(state.spatial?.response?.pageInfo || {}) },
				meta: { ...(state.spatial?.response?.meta || {}) },
				request: { ...(state.spatial?.response?.request || {}) },
			},
		},
		status: { ...state.status },
	};
}

function areViewportsEqual(left, right) {
	if (!left || !right) {
		return false;
	}
	return (
		left.center?.lng === right.center?.lng &&
		left.center?.lat === right.center?.lat &&
		left.zoom === right.zoom &&
		left.bearing === right.bearing &&
		left.pitch === right.pitch &&
		left.bbox?.west === right.bbox?.west &&
		left.bbox?.south === right.bbox?.south &&
		left.bbox?.east === right.bbox?.east &&
		left.bbox?.north === right.bbox?.north &&
		left.pixelSize?.width === right.pixelSize?.width &&
		left.pixelSize?.height === right.pixelSize?.height
	);
}

function hasFeatureWithId(features, featureId) {
	if (!featureId || !Array.isArray(features)) {
		return false;
	}
	return features.some((feature) => {
		const candidateId = feature?.id ?? feature?.properties?.id ?? null;
		return candidateId === featureId;
	});
}

export function createTimemapBrowserController(
	initialState = createTimemapBrowserInitialState(),
) {
	let state = cloneState(initialState);
	const listeners = new Set();
	let latestSpatialLoadToken = 0;

	function emit() {
		const snapshot = cloneState(state);
		listeners.forEach((listener) => listener(snapshot));
	}

	function patchState(partialState) {
		state = {
			...state,
			...partialState,
		};
		emit();
	}

	return {
		getState() {
			return cloneState(state);
		},
		subscribe(listener) {
			listeners.add(listener);
			listener(cloneState(state));
			return () => listeners.delete(listener);
		},
		async initializeSpatialData() {
			const loadToken = latestSpatialLoadToken + 1;
			latestSpatialLoadToken = loadToken;
			const requestAtStart = normalizeSpatialQueryInput(state.spatial.request);

			patchState({
				spatial: {
					...state.spatial,
					status: "loading",
				},
				status: {
					...state.status,
					tone: "neutral",
					text: "Loading collection spatial data...",
				},
			});

			try {
				const spatialResponse = await loadCollectionSpatialResponse(requestAtStart);
				if (loadToken !== latestSpatialLoadToken) {
					return;
				}
				patchState({
					spatial: {
						...state.spatial,
						response: spatialResponse,
						status: "ready",
					},
					selectedFeatureId: hasFeatureWithId(
						spatialResponse.features,
						state.selectedFeatureId,
					)
						? state.selectedFeatureId
						: null,
					status: {
						...state.status,
						tone: "positive",
						text: `Collection spatial payload ready (${spatialResponse.features.length} mapped points from ${spatialResponse.meta?.georeferencedItems || spatialResponse.features.length} georeferenced items).`,
					},
				});
			} catch (error) {
				if (loadToken !== latestSpatialLoadToken) {
					return;
				}
				patchState({
					spatial: {
						...state.spatial,
						status: "error",
					},
					status: {
						...state.status,
						tone: "critical",
						text: error?.message || "Failed to load collection spatial payload.",
					},
				});
			}
		},
		setFilters(partialFilters) {
			const nextQuery = normalizeCollectionQueryFilterPatch(
				partialFilters,
				state.query || createCollectionQueryState(),
			);
			patchState({
				query: nextQuery,
				filters: {
					...state.filters,
					text: nextQuery.text,
					keywords: [...nextQuery.keywords],
					tags: [...nextQuery.tags],
					types: [...nextQuery.types],
					categories: [...nextQuery.categories],
				},
				spatial: {
					...state.spatial,
					request: buildSpatialRequest({
						...state,
						query: nextQuery,
					}),
				},
			});
		},
		setTimeRange(timeRange = {}) {
			const currentQueryTimeRange =
				state.query?.timeRange && typeof state.query.timeRange === "object"
					? state.query.timeRange
					: createCollectionQueryState().timeRange;
			const hasStartPatch = Object.prototype.hasOwnProperty.call(timeRange, "start");
			const hasEndPatch = Object.prototype.hasOwnProperty.call(timeRange, "end");
			const nextQuery = normalizeCollectionQueryState(
				{
					timeRange: {
						start: hasStartPatch ? timeRange.start : currentQueryTimeRange.start,
						end: hasEndPatch ? timeRange.end : currentQueryTimeRange.end,
					},
				},
				state.query || createCollectionQueryState(),
			);
			patchState({
				query: nextQuery,
				timeRange: {
					...nextQuery.timeRange,
				},
				spatial: {
					...state.spatial,
					request: buildSpatialRequest({
						...state,
						query: nextQuery,
					}),
				},
			});
		},
		setSelectedFeature(featureId) {
			patchState({ selectedFeatureId: featureId || null });
		},
		setHoveredFeature(featureId) {
			patchState({ hoveredFeatureId: featureId || null });
		},
		toggleOverlay(overlayKey, isVisible) {
			if (!Object.prototype.hasOwnProperty.call(state.visibleOverlays, overlayKey)) {
				return;
			}
			patchState({
				visibleOverlays: {
					...state.visibleOverlays,
					[overlayKey]: Boolean(isVisible),
				},
			});
		},
		setViewport(viewport = {}) {
			const nextViewport = normalizeSpatialViewportInput(viewport, state.viewport);
			if (areViewportsEqual(nextViewport, state.viewport)) {
				return;
			}
			patchState({
				viewport: nextViewport,
				spatial: {
					...state.spatial,
					request: buildSpatialRequest({
						...state,
						viewport: nextViewport,
					}),
				},
			});
		},
		setStatus(status = {}) {
			patchState({
				status: {
					...state.status,
					...status,
				},
			});
		},
		reset() {
			state = cloneState(createTimemapBrowserInitialState());
			emit();
		},
	};
}
