function formatTimeRange(timeRange = {}) {
	if (!timeRange.start && !timeRange.end) {
		return "Not set";
	}
	if (timeRange.start && timeRange.end) {
		return `${timeRange.start} to ${timeRange.end}`;
	}
	return timeRange.start ? `From ${timeRange.start}` : `Until ${timeRange.end}`;
}

function resolveTimelineQueryTimeRange(state = {}) {
	const queryTimeRange =
		state?.query?.timeRange && typeof state.query.timeRange === "object"
			? state.query.timeRange
			: state?.timeRange && typeof state.timeRange === "object"
				? state.timeRange
				: {};
	return {
		start: queryTimeRange.start ?? null,
		end: queryTimeRange.end ?? null,
	};
}

function buildTimelineRangeNote(state = {}, hasFeatureTemporalDomain = false) {
	if (!hasFeatureTemporalDomain) {
		return "No known temporal range in loaded features.";
	}
	const queryTimeRange = resolveTimelineQueryTimeRange(state);
	return `Active time range: ${formatTimeRange(queryTimeRange)}.`;
}

export { buildTimelineRangeNote, formatTimeRange, resolveTimelineQueryTimeRange };

