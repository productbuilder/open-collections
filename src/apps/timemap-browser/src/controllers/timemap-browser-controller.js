import {
	createCollectionQueryState,
	normalizeCollectionQueryFilterPatch,
	normalizeCollectionQueryState,
} from "../../../../shared/data/query/collection-query-contract.js";
import { createTimemapBrowserInitialState } from "../state/initial-state.js";

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
		},
		status: { ...state.status },
	};
}

export function createTimemapBrowserController(
	initialState = createTimemapBrowserInitialState(),
) {
	let state = cloneState(initialState);
	const listeners = new Set();

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
			patchState({
				viewport: {
					...state.viewport,
					...viewport,
					center: {
						...state.viewport.center,
						...(viewport.center || {}),
					},
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
