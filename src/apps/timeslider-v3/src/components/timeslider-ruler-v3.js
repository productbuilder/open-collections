const DEFAULT_DOMAIN_MIN = 1800;
const DEFAULT_DOMAIN_MAX = 2025;
const DEFAULT_PIXELS_PER_YEAR = 3.2;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function formatYear(value) {
	return Math.round(value).toString();
}

function normalizeYearStep(value, step) {
	const rounded = Math.round(value / step) * step;
	return Number(rounded.toFixed(6));
}

function computeTickScale(pixelsPerYear) {
	if (pixelsPerYear >= 14) {
		return { minorStep: 1, majorStep: 5, labelStep: 5, minLabelSpacingPx: 56 };
	}
	if (pixelsPerYear >= 8) {
		return { minorStep: 2, majorStep: 10, labelStep: 10, minLabelSpacingPx: 58 };
	}
	if (pixelsPerYear >= 4) {
		return { minorStep: 5, majorStep: 20, labelStep: 20, minLabelSpacingPx: 62 };
	}
	return { minorStep: 10, majorStep: 50, labelStep: 50, minLabelSpacingPx: 66 };
}

class TimeSliderV3RulerElement extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.model = {
			domainMinYear: DEFAULT_DOMAIN_MIN,
			domainMaxYear: DEFAULT_DOMAIN_MAX,
			focusYear: 1950,
			activeRangeYears: 24,
			minRangeYears: 6,
			maxRangeYears: 260,
			pixelsPerYear: DEFAULT_PIXELS_PER_YEAR,
			activeRangeStartYear: 1938,
			activeRangeEndYear: 1962,
		};
		this.interaction = {
			mode: null,
			pointerId: null,
			startX: 0,
			startFocusYear: 1950,
			startRangeYears: 24,
			edge: null,
		};
		this.onPointerMove = this.onPointerMove.bind(this);
		this.onPointerUp = this.onPointerUp.bind(this);
	}

	connectedCallback() {
		this.render();
		this.bindEvents();
		this.applyView();
	}

	set domainMinYear(value) {
		const next = Number(value);
		if (!Number.isFinite(next)) {
			return;
		}
		this.model.domainMinYear = next;
		this.applyView();
	}

	set domainMaxYear(value) {
		const next = Number(value);
		if (!Number.isFinite(next)) {
			return;
		}
		this.model.domainMaxYear = next;
		this.applyView();
	}

	set focusYear(value) {
		const next = Number(value);
		if (!Number.isFinite(next)) {
			return;
		}
		this.model.focusYear = next;
		this.applyView();
	}

	set activeRangeYears(value) {
		const next = Number(value);
		if (!Number.isFinite(next) || next <= 0) {
			return;
		}
		this.model.activeRangeYears = next;
		this.applyView();
	}

	set minRangeYears(value) {
		const next = Number(value);
		if (!Number.isFinite(next) || next <= 0) {
			return;
		}
		this.model.minRangeYears = next;
		this.applyView();
	}

	set maxRangeYears(value) {
		const next = Number(value);
		if (!Number.isFinite(next) || next <= 0) {
			return;
		}
		this.model.maxRangeYears = next;
		this.applyView();
	}

	set pixelsPerYear(value) {
		const next = Number(value);
		if (!Number.isFinite(next) || next <= 0) {
			return;
		}
		this.model.pixelsPerYear = next;
		this.applyView();
	}

	set activeRangeStartYear(value) {
		const next = Number(value);
		if (!Number.isFinite(next)) {
			return;
		}
		this.model.activeRangeStartYear = next;
		this.applyView();
	}

	set activeRangeEndYear(value) {
		const next = Number(value);
		if (!Number.isFinite(next)) {
			return;
		}
		this.model.activeRangeEndYear = next;
		this.applyView();
	}

	bindEvents() {
		if (!this.shadowRoot) {
			return;
		}
		const rulerZone = this.shadowRoot.getElementById("rulerZone");
		const leftHandle = this.shadowRoot.getElementById("leftHandle");
		const rightHandle = this.shadowRoot.getElementById("rightHandle");
		if (!rulerZone || !leftHandle || !rightHandle) {
			return;
		}
		rulerZone.addEventListener("pointerdown", (event) => {
			this.startRulerDrag(event);
		});
		leftHandle.addEventListener("pointerdown", (event) => {
			this.startRangeResize(event, "left");
		});
		rightHandle.addEventListener("pointerdown", (event) => {
			this.startRangeResize(event, "right");
		});
	}

	startRulerDrag(event) {
		const rulerZone = this.shadowRoot?.getElementById("rulerZone");
		if (!rulerZone) {
			return;
		}
		event.preventDefault();
		rulerZone.setPointerCapture(event.pointerId);
		this.interaction.mode = "drag-ruler";
		this.interaction.pointerId = event.pointerId;
		this.interaction.startX = event.clientX;
		this.interaction.startFocusYear = this.model.focusYear;
		window.addEventListener("pointermove", this.onPointerMove);
		window.addEventListener("pointerup", this.onPointerUp);
		window.addEventListener("pointercancel", this.onPointerUp);
		this.applyView();
	}

	startRangeResize(event, edge) {
		const handlesLayer = this.shadowRoot?.getElementById("handlesLayer");
		if (!handlesLayer) {
			return;
		}
		event.preventDefault();
		handlesLayer.setPointerCapture(event.pointerId);
		this.interaction.mode = "resize-range";
		this.interaction.pointerId = event.pointerId;
		this.interaction.edge = edge;
		this.interaction.startX = event.clientX;
		this.interaction.startRangeYears = this.model.activeRangeYears;
		window.addEventListener("pointermove", this.onPointerMove);
		window.addEventListener("pointerup", this.onPointerUp);
		window.addEventListener("pointercancel", this.onPointerUp);
		this.applyView();
	}

	onPointerMove(event) {
		if (event.pointerId !== this.interaction.pointerId) {
			return;
		}
		const deltaX = event.clientX - this.interaction.startX;
		const pixelsPerYear = this.model.pixelsPerYear;
		if (!pixelsPerYear) {
			return;
		}
		if (this.interaction.mode === "drag-ruler") {
			const deltaYears = deltaX / pixelsPerYear;
			const nextFocusYear = this.interaction.startFocusYear - deltaYears;
			this.dispatchEvent(
				new CustomEvent("focus-year-change", {
					detail: { focusYear: nextFocusYear },
					bubbles: true,
					composed: true,
				}),
			);
			return;
		}
		if (this.interaction.mode === "resize-range") {
			const signedDeltaYears = deltaX / pixelsPerYear;
			const edgeFactor = this.interaction.edge === "left" ? -1 : 1;
			const deltaHalfWidthYears = signedDeltaYears * edgeFactor;
			const nextRangeYears = this.interaction.startRangeYears + (deltaHalfWidthYears * 2);
			this.dispatchEvent(
				new CustomEvent("active-range-change", {
					detail: { activeRangeYears: nextRangeYears },
					bubbles: true,
					composed: true,
				}),
			);
		}
	}

	onPointerUp(event) {
		if (event.pointerId !== this.interaction.pointerId) {
			return;
		}
		this.interaction.mode = null;
		this.interaction.pointerId = null;
		this.interaction.edge = null;
		window.removeEventListener("pointermove", this.onPointerMove);
		window.removeEventListener("pointerup", this.onPointerUp);
		window.removeEventListener("pointercancel", this.onPointerUp);
		this.applyView();
	}

	buildTicks(trackWidth) {
		const ticksContainer = this.shadowRoot?.getElementById("ticks");
		if (!ticksContainer) {
			return;
		}
		ticksContainer.innerHTML = "";
		const centerX = trackWidth / 2;
		const pixelsPerYear = this.model.pixelsPerYear;
		const scale = computeTickScale(pixelsPerYear);
		const baseStep = Math.min(scale.minorStep, scale.majorStep);
		const visibleHalfYears = trackWidth / (2 * pixelsPerYear);
		const minYear = Math.max(
			this.model.domainMinYear,
			Math.floor(this.model.focusYear - visibleHalfYears * 1.4),
		);
		const maxYear = Math.min(
			this.model.domainMaxYear,
			Math.ceil(this.model.focusYear + visibleHalfYears * 1.4),
		);
		const firstTick = normalizeYearStep(Math.floor(minYear / baseStep) * baseStep, baseStep);
		let lastLabelX = -Infinity;
		for (
			let year = firstTick;
			year <= maxYear + baseStep * 0.5;
			year = normalizeYearStep(year + baseStep, baseStep)
		) {
			if (year < this.model.domainMinYear) {
				continue;
			}
			const x = centerX + (year - this.model.focusYear) * pixelsPerYear;
			if (x < -36 || x > trackWidth + 36) {
				continue;
			}
			const tick = document.createElement("div");
			tick.className = "tick";
			tick.style.left = `${x}px`;
			const tickOnMajor =
				Math.abs((year / scale.majorStep) - Math.round(year / scale.majorStep)) < 1e-4;
			tick.dataset.tier = tickOnMajor ? "major" : "minor";
			const tickOnLabel =
				Math.abs((year / scale.labelStep) - Math.round(year / scale.labelStep)) < 1e-4;
			if (tickOnLabel && x - lastLabelX >= scale.minLabelSpacingPx) {
				const label = document.createElement("div");
				label.className = "label";
				label.textContent = formatYear(year);
				tick.append(label);
				lastLabelX = x;
			}
			ticksContainer.append(tick);
		}
	}

	applyView() {
		if (!this.shadowRoot) {
			return;
		}
		const track = this.shadowRoot.getElementById("track");
		const activeRange = this.shadowRoot.getElementById("activeRange");
		const centerYear = this.shadowRoot.getElementById("centerYear");
		const leftHandle = this.shadowRoot.getElementById("leftHandle");
		const rightHandle = this.shadowRoot.getElementById("rightHandle");
		const leftGuide = this.shadowRoot.getElementById("leftGuide");
		const rightGuide = this.shadowRoot.getElementById("rightGuide");
		const rangeValues = this.shadowRoot.getElementById("rangeValues");
		if (
			!track ||
			!activeRange ||
			!centerYear ||
			!leftHandle ||
			!rightHandle ||
			!leftGuide ||
			!rightGuide ||
			!rangeValues
		) {
			return;
		}
		const trackWidth = track.getBoundingClientRect().width || track.clientWidth || 320;
		const rangeWidth = Math.max(
			22,
			Math.min(trackWidth, this.model.activeRangeYears * this.model.pixelsPerYear),
		);
		const handleInset = (trackWidth - rangeWidth) / 2;
		activeRange.style.width = `${rangeWidth}px`;
		leftHandle.style.left = `${handleInset}px`;
		rightHandle.style.right = `${handleInset}px`;
		leftGuide.style.left = `${handleInset + 20}px`;
		rightGuide.style.right = `${handleInset + 20}px`;
		centerYear.textContent = formatYear(this.model.focusYear);
		rangeValues.textContent = `${formatYear(this.model.activeRangeStartYear)} to ${formatYear(this.model.activeRangeEndYear)}`;
		track.dataset.mode = this.interaction.mode || "idle";
		this.buildTicks(trackWidth);
	}

	render() {
		this.shadowRoot.innerHTML = `
			<style>
				:host {
					display: block;
				}
				.track-shell {
					position: relative;
					display: grid;
					gap: 0.35rem;
				}
				.handles-layer {
					position: relative;
					height: 34px;
					touch-action: none;
					user-select: none;
				}
				.resize-guide {
					position: absolute;
					top: 20px;
					width: 1px;
					height: 12px;
					background: rgba(96, 219, 255, 0.55);
				}
				.handle {
					position: absolute;
					top: 0;
					width: 40px;
					height: 28px;
					border-radius: 999px;
					border: 1px solid rgba(96, 219, 255, 0.72);
					background: rgba(5, 22, 33, 0.95);
					color: #c9f5ff;
					font-size: 0.68rem;
					font-weight: 700;
					display: grid;
					place-items: center;
					cursor: ew-resize;
					touch-action: none;
					box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.08);
				}
				.handle.left {
					transform: translateX(-50%);
				}
				.handle.right {
					transform: translateX(50%);
				}
				.track {
					position: relative;
					height: 110px;
					border-radius: 12px;
					overflow: hidden;
					background: linear-gradient(180deg, #0f273a 0%, #0b1f30 100%);
					border: 1px solid rgba(255, 255, 255, 0.14);
					user-select: none;
				}
				.ruler-zone {
					position: absolute;
					left: 0;
					right: 0;
					top: 0;
					bottom: 0;
					touch-action: none;
					cursor: grab;
					z-index: 1;
				}
				.track[data-mode="drag-ruler"] .ruler-zone {
					cursor: grabbing;
				}
				.base-line {
					position: absolute;
					left: -8px;
					right: -8px;
					top: 72px;
					height: 2px;
					background: rgba(255, 255, 255, 0.24);
				}
				.active-range {
					position: absolute;
					left: 50%;
					top: 40px;
					height: 64px;
					transform: translateX(-50%);
					background: rgba(82, 199, 255, 0.23);
					border: 1px solid rgba(82, 199, 255, 0.72);
					border-radius: 9px;
					box-shadow:
						inset 0 0 0 1px rgba(255, 255, 255, 0.1),
						0 0 14px rgba(34, 137, 185, 0.3);
					z-index: 2;
					pointer-events: none;
				}
				.range-values {
					position: absolute;
					left: 50%;
					top: 46px;
					transform: translateX(-50%);
					padding: 0.18rem 0.52rem;
					font-size: 0.74rem;
					font-weight: 700;
					border-radius: 999px;
					background: rgba(7, 25, 40, 0.92);
					border: 1px solid rgba(82, 199, 255, 0.65);
					color: #c7f0ff;
					pointer-events: none;
					z-index: 3;
				}
				.ticks {
					position: absolute;
					left: 0;
					right: 0;
					top: 0;
					bottom: 0;
					z-index: 2;
					pointer-events: none;
				}
				.tick {
					position: absolute;
					top: 69px;
					width: 1px;
					height: 7px;
					background: rgba(255, 255, 255, 0.3);
				}
				.tick[data-tier="major"] {
					height: 13px;
					top: 65px;
					width: 2px;
					background: rgba(255, 255, 255, 0.7);
				}
				.label {
					position: absolute;
					top: -18px;
					left: 50%;
					transform: translateX(-50%);
					font-size: 0.64rem;
					font-weight: 600;
					color: rgba(255, 255, 255, 0.88);
					white-space: nowrap;
				}
				.center-marker {
					position: absolute;
					left: 50%;
					top: 38px;
					height: 66px;
					width: 3px;
					transform: translateX(-50%);
					background: #ffd85e;
					box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.35), 0 0 12px rgba(255, 216, 94, 0.5);
					pointer-events: none;
					z-index: 4;
				}
				.center-year {
					position: absolute;
					left: 50%;
					top: 8px;
					transform: translateX(-50%);
					padding: 0.18rem 0.56rem;
					font-size: 0.84rem;
					font-weight: 700;
					border-radius: 999px;
					background: rgba(8, 19, 29, 0.96);
					border: 1px solid rgba(255, 216, 94, 0.85);
					color: #fff2bf;
					line-height: 1.1;
					pointer-events: none;
					z-index: 5;
				}
				.mode-pill {
					position: absolute;
					right: 8px;
					top: 8px;
					font-size: 0.65rem;
					font-weight: 700;
					padding: 0.12rem 0.4rem;
					border-radius: 999px;
					text-transform: uppercase;
					letter-spacing: 0.04em;
					background: rgba(255, 255, 255, 0.08);
					border: 1px solid rgba(255, 255, 255, 0.22);
					color: rgba(255, 255, 255, 0.9);
					z-index: 5;
					pointer-events: none;
				}
				.track[data-mode="drag-ruler"] .mode-pill::after {
					content: "Ruler drag";
				}
				.track[data-mode="resize-range"] .mode-pill::after {
					content: "Range resize";
				}
				.track[data-mode="idle"] .mode-pill::after {
					content: "Ready";
				}
			</style>
			<div class="track-shell">
				<div id="handlesLayer" class="handles-layer" aria-label="Range resize handles">
					<div id="leftGuide" class="resize-guide"></div>
					<div id="rightGuide" class="resize-guide"></div>
					<button id="leftHandle" class="handle left" type="button" aria-label="Resize active range left edge">⇤</button>
					<button id="rightHandle" class="handle right" type="button" aria-label="Resize active range right edge">⇥</button>
				</div>
				<div id="track" class="track" data-mode="idle" aria-label="Timeline ruler" role="application">
					<div id="rulerZone" class="ruler-zone" aria-label="Drag ruler to move focused year"></div>
					<div class="base-line"></div>
					<div id="activeRange" class="active-range" aria-hidden="true"></div>
					<div id="ticks" class="ticks"></div>
					<div id="centerYear" class="center-year">1950</div>
					<div class="range-values" id="rangeValues">1938 to 1962</div>
					<div class="center-marker" aria-hidden="true"></div>
					<div class="mode-pill" aria-hidden="true"></div>
				</div>
			</div>
		`;
	}
}

if (!customElements.get("oc-timeslider-v3-ruler")) {
	customElements.define("oc-timeslider-v3-ruler", TimeSliderV3RulerElement);
}

export { TimeSliderV3RulerElement };
