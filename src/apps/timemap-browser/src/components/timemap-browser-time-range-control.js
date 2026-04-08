import "../../../timeslider-v5/src/components/timeslider-ruler-v5.js";

const DEFAULT_DOMAIN_MIN = 1800;
const DEFAULT_DOMAIN_MAX = 2050;
const DEFAULT_MIN_RANGE_YEARS = 1;
const EMBEDDED_STARTUP_CENTER_YEAR = 1950;
const EMBEDDED_STARTUP_RANGE_YEARS = 50;
const EMBEDDED_MIN_PIXELS_PER_YEAR = 2.4;
const EMBEDDED_MAX_PIXELS_PER_YEAR = 12;
const EMBEDDED_MIN_MEASURABLE_WIDTH = 180;
const EMBEDDED_DOMAIN_FIT_FACTOR = 0.9;

function toFiniteNumber(value) {
	const next = Number(value);
	return Number.isFinite(next) ? next : null;
}

function clamp(value, min, max) {
	return Math.min(max, Math.max(min, value));
}

function resolveDomain(domainMin, domainMax) {
	const hasMin = Number.isFinite(domainMin);
	const hasMax = Number.isFinite(domainMax);
	if (hasMin && hasMax) {
		return domainMin <= domainMax
			? { min: domainMin, max: domainMax }
			: { min: domainMax, max: domainMin };
	}
	if (hasMin) {
		return { min: domainMin, max: Math.max(domainMin, DEFAULT_DOMAIN_MAX) };
	}
	if (hasMax) {
		return { min: Math.min(DEFAULT_DOMAIN_MIN, domainMax), max: domainMax };
	}
	return { min: DEFAULT_DOMAIN_MIN, max: DEFAULT_DOMAIN_MAX };
}

function resolveEmbeddedStartupRange(domain) {
	const domainMin = domain.min;
	const domainMax = domain.max;
	const domainSpan = Math.max(0, domainMax - domainMin);
	const width = Math.min(EMBEDDED_STARTUP_RANGE_YEARS, domainSpan);
	if (width <= 0) {
		return {
			start: domainMin,
			end: domainMin,
		};
	}
	const halfWidth = width / 2;
	const minCenter = domainMin + halfWidth;
	const maxCenter = domainMax - halfWidth;
	const center = clamp(EMBEDDED_STARTUP_CENTER_YEAR, minCenter, maxCenter);
	return {
		start: center - halfWidth,
		end: center + halfWidth,
	};
}

function normalizeCanonicalRange({ start, end, domainMin, domainMax }) {
	const domain = resolveDomain(domainMin, domainMax);
	const startYear = toFiniteNumber(start);
	const endYear = toFiniteNumber(end);
	const hasStart = Number.isFinite(startYear);
	const hasEnd = Number.isFinite(endYear);
	if (!hasStart && !hasEnd) {
		const { start: embeddedStart, end: embeddedEnd } = resolveEmbeddedStartupRange(domain);
		return {
			domain,
			start: embeddedStart,
			end: embeddedEnd,
		};
	}
	if (!hasStart || !hasEnd) {
		const singleBound = hasStart ? startYear : endYear;
		const clampedBound = clamp(singleBound, domain.min, domain.max);
		return {
			domain,
			start: clampedBound,
			end: clampedBound,
		};
	}
	const orderedStart = Math.min(startYear, endYear);
	const orderedEnd = Math.max(startYear, endYear);
	return {
		domain,
		start: clamp(orderedStart, domain.min, domain.max),
		end: clamp(orderedEnd, domain.min, domain.max),
	};
}

function toV5Model(range) {
	const width = Math.max(DEFAULT_MIN_RANGE_YEARS, range.end - range.start);
	return {
		domainMinYear: range.domain.min,
		domainMaxYear: range.domain.max,
		activeRangeStartYear: range.start,
		activeRangeEndYear: range.end,
		activeRangeYears: width,
		focusYear: range.start + (width / 2),
	};
}

function clampRangeWithinDomain({ center, width, domain }) {
	const domainMin = domain.min;
	const domainMax = domain.max;
	const domainSpan = Math.max(0, domainMax - domainMin);
	const clampedWidth = Math.min(Math.max(DEFAULT_MIN_RANGE_YEARS, width), domainSpan);
	if (clampedWidth <= 0) {
		return {
			start: domainMin,
			end: domainMin,
		};
	}
	const halfWidth = clampedWidth / 2;
	const minCenter = domainMin + halfWidth;
	const maxCenter = domainMax - halfWidth;
	const clampedCenter = clamp(center, minCenter, maxCenter);
	return {
		start: clampedCenter - halfWidth,
		end: clampedCenter + halfWidth,
	};
}

function resolveEmbeddedPixelsPerYear({ availableWidth, domain }) {
	const width = Number(availableWidth);
	if (!Number.isFinite(width) || width <= 0) {
		return EMBEDDED_MIN_PIXELS_PER_YEAR;
	}
	const measuredWidth = Math.max(EMBEDDED_MIN_MEASURABLE_WIDTH, width);
	const domainSpan = Math.max(DEFAULT_MIN_RANGE_YEARS, domain.max - domain.min);
	const targetByDomain = measuredWidth / (domainSpan * EMBEDDED_DOMAIN_FIT_FACTOR);
	return clamp(targetByDomain, EMBEDDED_MIN_PIXELS_PER_YEAR, EMBEDDED_MAX_PIXELS_PER_YEAR);
}

class TimemapBrowserTimeRangeControlElement extends HTMLElement {
	static get observedAttributes() {
		return ["range-start", "range-end", "domain-min", "domain-max"];
	}

	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this._canonical = {
			start: null,
			end: null,
			domainMin: null,
			domainMax: null,
		};
		this._suppressDispatch = false;
		this._handleFocusYearChange = this._onFocusYearChange.bind(this);
		this._handleActiveRangeChange = this._onActiveRangeChange.bind(this);
		this._availableWidth = 0;
		this._pixelsPerYear = null;
		this._pixelsPerYearContext = {
			availableWidth: null,
			domainMin: null,
			domainMax: null,
		};
		this._resizeObserver = null;
		this._handleResize = this._onResize.bind(this);
		this._lastEffectiveState = null;
	}

	connectedCallback() {
		this.render();
		const ruler = this._getRuler();
		if (ruler) {
			ruler.addEventListener("focus-year-change", this._handleFocusYearChange);
			ruler.addEventListener("active-range-change", this._handleActiveRangeChange);
		}
		this._setupResizeObserver();
		this._syncFromAttributes();
	}

	disconnectedCallback() {
		const ruler = this._getRuler();
		if (ruler) {
			ruler.removeEventListener("focus-year-change", this._handleFocusYearChange);
			ruler.removeEventListener("active-range-change", this._handleActiveRangeChange);
		}
		if (this._resizeObserver) {
			this._resizeObserver.disconnect();
			this._resizeObserver = null;
		}
	}

	attributeChangedCallback(name, _oldValue, newValue) {
		const parsed = toFiniteNumber(newValue);
		switch (name) {
			case "range-start":
				this._canonical.start = parsed;
				break;
			case "range-end":
				this._canonical.end = parsed;
				break;
			case "domain-min":
				this._canonical.domainMin = parsed;
				break;
			case "domain-max":
				this._canonical.domainMax = parsed;
				break;
			default:
				break;
		}
		this._applyCanonicalToRuler();
	}

	set rangeStart(value) {
		this._canonical.start = toFiniteNumber(value);
		this._applyCanonicalToRuler();
	}

	get rangeStart() {
		return this._canonical.start;
	}

	set rangeEnd(value) {
		this._canonical.end = toFiniteNumber(value);
		this._applyCanonicalToRuler();
	}

	get rangeEnd() {
		return this._canonical.end;
	}

	set domainMin(value) {
		this._canonical.domainMin = toFiniteNumber(value);
		this._applyCanonicalToRuler();
	}

	get domainMin() {
		return this._canonical.domainMin;
	}

	set domainMax(value) {
		this._canonical.domainMax = toFiniteNumber(value);
		this._applyCanonicalToRuler();
	}

	get domainMax() {
		return this._canonical.domainMax;
	}

	getDebugSnapshot() {
		return {
			canonicalStart: this._canonical.start,
			canonicalEnd: this._canonical.end,
			computedFocusYear: this._lastEffectiveState?.focusYear ?? null,
			computedActiveRangeYears: this._lastEffectiveState?.activeRangeYears ?? null,
			effectivePixelsPerYear: this._lastEffectiveState?.pixelsPerYear ?? this._pixelsPerYear,
			disabled: this.hasAttribute("disabled"),
		};
	}

	render() {
		if (this.shadowRoot.childElementCount > 0) {
			return;
		}
		this.shadowRoot.innerHTML = `
			<style>
				:host {
					display: block;
					inline-size: 100%;
					min-inline-size: min(100%, 23rem);
				}

				oc-timeslider-v5-ruler {
					display: block;
					inline-size: 100%;
					min-block-size: 9.8rem;
				}
			</style>
			<oc-timeslider-v5-ruler data-bind="timeline-ruler"></oc-timeslider-v5-ruler>
		`;
	}

	_getRuler() {
		return this.shadowRoot?.querySelector('[data-bind="timeline-ruler"]') ?? null;
	}

	_syncFromAttributes() {
		for (const attributeName of TimemapBrowserTimeRangeControlElement.observedAttributes) {
			const value = this.getAttribute(attributeName);
			if (value == null) {
				continue;
			}
			this.attributeChangedCallback(attributeName, null, value);
		}
		this._applyCanonicalToRuler();
	}

	_setupResizeObserver() {
		if (typeof ResizeObserver !== "function" || this._resizeObserver) {
			return;
		}
		this._resizeObserver = new ResizeObserver((entries) => {
			this._handleResize(entries);
		});
		this._resizeObserver.observe(this);
	}

	_onResize(entries) {
		const entry = entries?.[entries.length - 1];
		const nextWidth =
			entry?.contentRect?.width ??
			this.getBoundingClientRect().width ??
			this.clientWidth ??
			0;
		if (!Number.isFinite(nextWidth)) {
			return;
		}
		if (Math.abs(nextWidth - this._availableWidth) < 0.5) {
			return;
		}
		this._availableWidth = nextWidth;
		this._applyCanonicalToRuler();
	}

	_applyCanonicalToRuler() {
		const ruler = this._getRuler();
		if (!ruler) {
			return;
		}
		const normalized = normalizeCanonicalRange(this._canonical);
		const model = toV5Model(normalized);
		const pixelsPerYear = this._resolvePixelsPerYear(normalized);
		this._lastEffectiveState = {
			focusYear: model.focusYear,
			activeRangeYears: model.activeRangeYears,
			pixelsPerYear,
		};
		this._suppressDispatch = true;
		ruler.pixelsPerYear = pixelsPerYear;
		ruler.domainMinYear = model.domainMinYear;
		ruler.domainMaxYear = model.domainMaxYear;
		ruler.activeRangeStartYear = model.activeRangeStartYear;
		ruler.activeRangeEndYear = model.activeRangeEndYear;
		ruler.activeRangeYears = model.activeRangeYears;
		ruler.focusYear = model.focusYear;
		this._suppressDispatch = false;
	}

	_resolvePixelsPerYear(normalizedRange) {
		const availableWidth = this._availableWidth || this.getBoundingClientRect().width;
		const nextContext = {
			availableWidth,
			domainMin: normalizedRange.domain.min,
			domainMax: normalizedRange.domain.max,
		};
		const hasCachedValue = Number.isFinite(this._pixelsPerYear);
		const sameWidth =
			Number.isFinite(this._pixelsPerYearContext.availableWidth) &&
			Math.abs(this._pixelsPerYearContext.availableWidth - nextContext.availableWidth) < 0.5;
		const sameDomain =
			this._pixelsPerYearContext.domainMin === nextContext.domainMin &&
			this._pixelsPerYearContext.domainMax === nextContext.domainMax;
		if (hasCachedValue && sameWidth && sameDomain) {
			return this._pixelsPerYear;
		}
		this._pixelsPerYear = resolveEmbeddedPixelsPerYear({
			availableWidth,
			domain: normalizedRange.domain,
		});
		this._pixelsPerYearContext = nextContext;
		return this._pixelsPerYear;
	}

	_onFocusYearChange(event) {
		if (this._suppressDispatch) {
			return;
		}
		const nextFocusYear = toFiniteNumber(event?.detail?.focusYear);
		if (!Number.isFinite(nextFocusYear)) {
			return;
		}
		const normalized = normalizeCanonicalRange(this._canonical);
		const width = Math.max(DEFAULT_MIN_RANGE_YEARS, normalized.end - normalized.start);
		const { start, end } = clampRangeWithinDomain({
			center: nextFocusYear,
			width,
			domain: normalized.domain,
		});
		this._emitCanonicalRangeChange(start, end);
	}

	_onActiveRangeChange(event) {
		if (this._suppressDispatch) {
			return;
		}
		const nextRangeYears = toFiniteNumber(event?.detail?.activeRangeYears);
		if (!Number.isFinite(nextRangeYears) || nextRangeYears <= 0) {
			return;
		}
		const normalized = normalizeCanonicalRange(this._canonical);
		const focusYear = (normalized.start + normalized.end) / 2;
		const { start, end } = clampRangeWithinDomain({
			center: focusYear,
			width: nextRangeYears,
			domain: normalized.domain,
		});
		this._emitCanonicalRangeChange(start, end);
	}

	_emitCanonicalRangeChange(start, end) {
		const nextStart = Math.min(start, end);
		const nextEnd = Math.max(start, end);
		const optimisticStart = Math.round(nextStart);
		const optimisticEnd = Math.round(nextEnd);
		this._canonical.start = optimisticStart;
		this._canonical.end = optimisticEnd;
		this._applyCanonicalToRuler();
		this.dispatchEvent(
			new CustomEvent("timemap-browser-time-range-change", {
				bubbles: true,
				composed: true,
				detail: {
					start: String(optimisticStart),
					end: String(optimisticEnd),
				},
			}),
		);
	}
}

if (!customElements.get("timemap-browser-time-range-control")) {
	customElements.define(
		"timemap-browser-time-range-control",
		TimemapBrowserTimeRangeControlElement,
	);
}
