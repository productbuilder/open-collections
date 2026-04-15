import {
	createCollectionQueryState,
	normalizeCollectionQueryFilterPatch,
	normalizeCollectionQueryState,
} from "./collection-query-contract.js";

const FILTER_OPTION_STATUS = Object.freeze({
	LOADING: "loading",
	READY: "ready",
	EMPTY: "empty",
});

function normalizeText(value) {
	return String(value ?? "").trim();
}

function normalizeFilterOptionEntries(entries = []) {
	if (!Array.isArray(entries)) {
		return [];
	}
	const normalized = new Map();
	for (const entry of entries) {
		const value = normalizeText(entry?.value);
		if (!value) {
			continue;
		}
		const count = Number(entry?.count);
		normalized.set(value, {
			value,
			label: normalizeText(entry?.label) || value,
			count: Number.isFinite(count) ? count : null,
		});
	}
	return [...normalized.values()].sort((left, right) =>
		left.value.localeCompare(right.value),
	);
}

function hasAnyFilterOptionEntries(options = {}) {
	const source = options && typeof options === "object" ? options : {};
	return (
		(Array.isArray(source.types) && source.types.length > 0) ||
		(Array.isArray(source.mediaTypes) && source.mediaTypes.length > 0)
	);
}

function normalizeFilterOptionsStatus(status = "", options = {}) {
	const normalized = normalizeText(status).toLowerCase();
	if (normalized === FILTER_OPTION_STATUS.LOADING) {
		return FILTER_OPTION_STATUS.LOADING;
	}
	if (normalized === FILTER_OPTION_STATUS.READY) {
		return FILTER_OPTION_STATUS.READY;
	}
	if (normalized === FILTER_OPTION_STATUS.EMPTY) {
		return FILTER_OPTION_STATUS.EMPTY;
	}
	return hasAnyFilterOptionEntries(options)
		? FILTER_OPTION_STATUS.READY
		: FILTER_OPTION_STATUS.EMPTY;
}

export function createBrowseShellQueryState() {
	return {
		source: {
			app: "",
			mode: "",
		},
		query: createCollectionQueryState(),
		filters: {
			text: "",
			types: [],
			mediaTypes: [],
			categories: [],
		},
		options: {
			types: [],
			mediaTypes: [],
			categories: [],
		},
		status: {
			loading: false,
			filterOptions: FILTER_OPTION_STATUS.LOADING,
		},
	};
}

export function normalizeBrowseShellQueryState(partialState = {}, baseState = null) {
	const base =
		baseState && typeof baseState === "object"
			? baseState
			: createBrowseShellQueryState();
	const partial =
		partialState && typeof partialState === "object" ? partialState : {};
	const optionsSource =
		partial.options && typeof partial.options === "object" ? partial.options : {};
	const nextOptions = {
		types: normalizeFilterOptionEntries(optionsSource.types),
		mediaTypes: normalizeFilterOptionEntries(optionsSource.mediaTypes),
		categories: [],
	};
	const query = normalizeCollectionQueryState(partial.query, base.query);
	const filterSource =
		partial.filters && typeof partial.filters === "object" ? partial.filters : {};
	return {
		source: {
			app: normalizeText(partial.source?.app || base.source?.app),
			mode: normalizeText(partial.source?.mode || base.source?.mode),
		},
		query,
		filters: {
			text:
				filterSource.text === undefined
					? normalizeText(query.text)
					: normalizeText(filterSource.text),
			types:
				filterSource.types === undefined
					? [...query.types]
					: normalizeCollectionQueryState({ types: filterSource.types }, query).types,
			mediaTypes:
				filterSource.mediaTypes === undefined
					? [...query.mediaTypes]
					: normalizeCollectionQueryState(
							{ mediaTypes: filterSource.mediaTypes },
							query,
						).mediaTypes,
			categories:
				filterSource.categories === undefined
					? [...query.categories]
					: normalizeCollectionQueryState(
							{ categories: filterSource.categories },
							query,
						).categories,
		},
		options: nextOptions,
		status: {
			loading: Boolean(partial.status?.loading),
			filterOptions: normalizeFilterOptionsStatus(
				partial.status?.filterOptions,
				nextOptions,
			),
		},
	};
}

export function normalizeBrowseShellQueryPatch(filterPatch = {}, baseQuery = null) {
	const partial = filterPatch && typeof filterPatch === "object" ? filterPatch : {};
	const patchSource =
		partial.filters && typeof partial.filters === "object"
			? partial.filters
			: partial;
	const timeRangeSource =
		partial.timeRange && typeof partial.timeRange === "object"
			? partial.timeRange
			: partial.query?.timeRange && typeof partial.query.timeRange === "object"
				? partial.query.timeRange
				: null;
	const nextQuery = normalizeCollectionQueryFilterPatch(patchSource, baseQuery);
	const mergedQuery = timeRangeSource
		? normalizeCollectionQueryState(
				{
					timeRange: {
						start:
							timeRangeSource.start === undefined
								? nextQuery.timeRange?.start
								: timeRangeSource.start,
						end:
							timeRangeSource.end === undefined
								? nextQuery.timeRange?.end
								: timeRangeSource.end,
					},
				},
				nextQuery,
			)
		: nextQuery;
	return {
		filters: {
			text: mergedQuery.text,
			types: mergedQuery.types,
			mediaTypes: mergedQuery.mediaTypes,
			categories: mergedQuery.categories,
		},
		query: mergedQuery,
	};
}

export { FILTER_OPTION_STATUS };
