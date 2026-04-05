function createInitialFilters() {
	return {
		keywords: [],
		tags: [],
		types: [],
	};
}

function createInitialTimeRange() {
	return {
		start: null,
		end: null,
	};
}

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
	return {
		filters: createInitialFilters(),
		timeRange: createInitialTimeRange(),
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
