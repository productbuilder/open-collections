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
import { loadStubSpatialResponse } from "../services/stub-spatial-loader.js";

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
			keywords: [...state.filters.keywords],
			tags: [...state.filters.tags],
			types: [...state.filters.types],
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
					text: "Loading stub spatial payload...",
				},
			});

			try {
				const spatialResponse = await loadStubSpatialResponse(requestAtStart);
				if (loadToken !== latestSpatialLoadToken) {
					return;
				}
				patchState({
					spatial: {
						...state.spatial,
						response: spatialResponse,
						status: "ready",
					},
					status: {
						...state.status,
						tone: "positive",
						text: `Stub spatial payload ready (${spatialResponse.features.length} features).`,
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
						text: error?.message || "Failed to load stub spatial payload.",
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
					keywords: [...nextQuery.keywords],
					tags: [...nextQuery.tags],
					types: [...nextQuery.types],
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
			const nextQuery = normalizeCollectionQueryState(
				{
					timeRange: {
						start: timeRange.start ?? state.timeRange.start,
						end: timeRange.end ?? state.timeRange.end,
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
