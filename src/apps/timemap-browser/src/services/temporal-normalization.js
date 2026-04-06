function toTrimmedText(value) {
	return String(value ?? "").trim();
}

function toFiniteYear(value) {
	const text = toTrimmedText(value);
	if (!/^[-+]?\d{1,6}$/.test(text)) {
		return null;
	}
	const year = Number(text);
	if (!Number.isInteger(year)) {
		return null;
	}
	return year;
}

function toUtcTimestamp(year, month = 1, day = 1, endOfDay = false) {
	const monthIndex = month - 1;
	if (
		!Number.isInteger(year) ||
		!Number.isInteger(month) ||
		!Number.isInteger(day) ||
		month < 1 ||
		month > 12
	) {
		return null;
	}
	const maxDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
	if (day < 1 || day > maxDay) {
		return null;
	}
	return endOfDay
		? Date.UTC(year, monthIndex, day, 23, 59, 59, 999)
		: Date.UTC(year, monthIndex, day, 0, 0, 0, 0);
}

function parseIsoLikeDateRange(value) {
	const text = toTrimmedText(value);
	const match = text.match(/^(?<year>[-+]?\d{1,6})(?:-(?<month>\d{2})(?:-(?<day>\d{2}))?)?$/);
	if (!match || !match.groups) {
		return null;
	}

	const year = Number(match.groups.year);
	if (!Number.isInteger(year)) {
		return null;
	}

	if (!match.groups.month) {
		const start = toUtcTimestamp(year, 1, 1, false);
		const end = toUtcTimestamp(year, 12, 31, true);
		if (start === null || end === null) {
			return null;
		}
		return { timeStart: start, timeEnd: end };
	}

	const month = Number(match.groups.month);
	if (!Number.isInteger(month) || month < 1 || month > 12) {
		return null;
	}

	if (!match.groups.day) {
		const endDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
		const start = toUtcTimestamp(year, month, 1, false);
		const end = toUtcTimestamp(year, month, endDay, true);
		if (start === null || end === null) {
			return null;
		}
		return { timeStart: start, timeEnd: end };
	}

	const day = Number(match.groups.day);
	if (!Number.isInteger(day)) {
		return null;
	}
	const start = toUtcTimestamp(year, month, day, false);
	const end = toUtcTimestamp(year, month, day, true);
	if (start === null || end === null) {
		return null;
	}
	return { timeStart: start, timeEnd: end };
}

function parseSimpleYearRange(value) {
	const text = toTrimmedText(value);
	const match = text.match(
		/^(?<start>[-+]?\d{1,6})\s*(?:to|\/|–|—|\s-\s)\s*(?<end>[-+]?\d{1,6})$/i,
	);
	if (!match || !match.groups) {
		return null;
	}
	const startYear = toFiniteYear(match.groups.start);
	const endYear = toFiniteYear(match.groups.end);
	if (startYear === null || endYear === null) {
		return null;
	}
	const normalizedStartYear = Math.min(startYear, endYear);
	const normalizedEndYear = Math.max(startYear, endYear);
	const timeStart = toUtcTimestamp(normalizedStartYear, 1, 1, false);
	const timeEnd = toUtcTimestamp(normalizedEndYear, 12, 31, true);
	if (timeStart === null || timeEnd === null) {
		return null;
	}
	return { timeStart, timeEnd };
}

function parseSimpleDateRange(value) {
	const text = toTrimmedText(value);
	const match = text.match(
		/^(?<start>[-+]?\d{1,6}(?:-\d{2}(?:-\d{2})?)?)\s*(?:to|\/|–|—|\s-\s)\s*(?<end>[-+]?\d{1,6}(?:-\d{2}(?:-\d{2})?)?)$/i,
	);
	if (!match || !match.groups) {
		return null;
	}

	const parsedStart = parseIsoLikeDateRange(match.groups.start);
	const parsedEnd = parseIsoLikeDateRange(match.groups.end);
	if (!parsedStart || !parsedEnd) {
		return null;
	}

	const timeStart = Math.min(parsedStart.timeStart, parsedEnd.timeStart);
	const timeEnd = Math.max(parsedStart.timeEnd, parsedEnd.timeEnd);
	return { timeStart, timeEnd };
}

export function normalizeTemporalDisplayValue(value) {
	const temporalDisplayValue = toTrimmedText(value);
	if (!temporalDisplayValue) {
		return {
			temporalDisplayValue,
			timeStart: null,
			timeEnd: null,
			timeKnown: false,
		};
	}

	const parsedRange =
		parseSimpleYearRange(temporalDisplayValue) ||
		parseSimpleDateRange(temporalDisplayValue) ||
		parseIsoLikeDateRange(temporalDisplayValue);
	if (!parsedRange) {
		return {
			temporalDisplayValue,
			timeStart: null,
			timeEnd: null,
			timeKnown: false,
		};
	}

	return {
		temporalDisplayValue,
		timeStart: parsedRange.timeStart,
		timeEnd: parsedRange.timeEnd,
		timeKnown: true,
	};
}
