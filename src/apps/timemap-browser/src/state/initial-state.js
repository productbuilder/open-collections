import { createCollectionQueryState } from "../../../../shared/data/query/collection-query-contract.js";

function createInitialViewport() {
	return {
		center: {
			lng: 5.1769,
			lat: 52.225,
		},
		zoom: 13.6,
		bearing: 0,
		pitch: 0,
	};
}

function createInitialVisibleOverlays() {
	return {
		baseMap: true,
		features: true,
		timeline: true,
		heatmap: false,
	};
}

export function createTimemapBrowserInitialState() {
	const query = createCollectionQueryState();
	return {
		query,
		filters: {
			keywords: [...query.keywords],
			tags: [...query.tags],
			types: [...query.types],
		},
		timeRange: { ...query.timeRange },
		selectedFeatureId: null,
		hoveredFeatureId: null,
		visibleOverlays: createInitialVisibleOverlays(),
		viewport: createInitialViewport(),
		status: {
			tone: "neutral",
			text: "Timemap scaffold ready for interaction wiring.",
		},
	};
}
