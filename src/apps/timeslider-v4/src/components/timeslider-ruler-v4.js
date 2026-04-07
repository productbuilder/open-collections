const DEFAULT_DOMAIN_MIN = 1800;
const DEFAULT_DOMAIN_MAX = 2025;
const DEFAULT_PIXELS_PER_YEAR = 3.2;
const HANDLE_WIDTH_PX = 20;
const LOWER_LABEL_SAFE_WIDTH_PX = 72;
const RANGE_INNER_GUTTER_PX = 20;

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

class TimeSliderV4RulerElement extends HTMLElement {
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
		if (!Number.isFinite(next)) return;
		this.model.domainMinYear = next;
		this.applyView();
	}

	set domainMaxYear(value) {
		const next = Number(value);
		if (!Number.isFinite(next)) return;
		this.model.domainMaxYear = next;
		this.applyView();
	}

	set focusYear(value) {
		const next = Number(value);
		if (!Number.isFinite(next)) return;
		this.model.focusYear = next;
		this.applyView();
	}

	set activeRangeYears(value) {
		const next = Number(value);
		if (!Number.isFinite(next) || next <= 0) return;
		this.model.activeRangeYears = next;
		this.applyView();
	}

	set minRangeYears(value) {
		const next = Number(value);
		if (!Number.isFinite(next) || next <= 0) return;
		this.model.minRangeYears = next;
		this.applyView();
	}

	set maxRangeYears(value) {
		const next = Number(value);
		if (!Number.isFinite(next) || next <= 0) return;
		this.model.maxRangeYears = next;
		this.applyView();
	}

	set pixelsPerYear(value) {
		const next = Number(value);
		if (!Number.isFinite(next) || next <= 0) return;
		this.model.pixelsPerYear = next;
		this.applyView();
	}

	set activeRangeStartYear(value) {
		const next = Number(value);
		if (!Number.isFinite(next)) return;
		this.model.activeRangeStartYear = next;
		this.applyView();
	}

	set activeRangeEndYear(value) {
		const next = Number(value);
		if (!Number.isFinite(next)) return;
		this.model.activeRangeEndYear = next;
		this.applyView();
	}

	bindEvents() {
		const rulerZone = this.shadowRoot?.getElementById("rulerZone");
		const leftHandle = this.shadowRoot?.getElementById("leftHandle");
		const rightHandle = this.shadowRoot?.getElementById("rightHandle");
		if (!rulerZone || !leftHandle || !rightHandle) return;
		rulerZone.addEventListener("pointerdown", (event) => this.startRulerDrag(event));
		leftHandle.addEventListener("pointerdown", (event) => this.startRangeResize(event, "left"));
		rightHandle.addEventListener("pointerdown", (event) => this.startRangeResize(event, "right"));
	}

	startRulerDrag(event) {
		const rulerZone = this.shadowRoot?.getElementById("rulerZone");
		if (!rulerZone) return;
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
		if (!handlesLayer) return;
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
		if (event.pointerId !== this.interaction.pointerId) return;
		const deltaX = event.clientX - this.interaction.startX;
		const pixelsPerYear = this.model.pixelsPerYear;
		if (!pixelsPerYear) return;

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
		if (event.pointerId !== this.interaction.pointerId) return;
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
		if (!ticksContainer) return;
		ticksContainer.innerHTML = "";
		const centerX = trackWidth / 2;
		const pixelsPerYear = this.model.pixelsPerYear;
		const scale = computeTickScale(pixelsPerYear);
		const baseStep = Math.min(scale.minorStep, scale.majorStep);
		const visibleHalfYears = trackWidth / (2 * pixelsPerYear);
		const minYear = Math.max(this.model.domainMinYear, Math.floor(this.model.focusYear - visibleHalfYears * 1.4));
		const maxYear = Math.min(this.model.domainMaxYear, Math.ceil(this.model.focusYear + visibleHalfYears * 1.4));
		const firstTick = normalizeYearStep(Math.floor(minYear / baseStep) * baseStep, baseStep);
		let lastLabelX = -Infinity;

		for (let year = firstTick; year <= maxYear + baseStep * 0.5; year = normalizeYearStep(year + baseStep, baseStep)) {
			if (year < this.model.domainMinYear) continue;
			const x = centerX + (year - this.model.focusYear) * pixelsPerYear;
			if (x < -36 || x > trackWidth + 36) continue;
			const tick = document.createElement("div");
			tick.className = "tick";
			tick.style.left = `${x}px`;
			const tickOnMajor = Math.abs((year / scale.majorStep) - Math.round(year / scale.majorStep)) < 1e-4;
			tick.dataset.tier = tickOnMajor ? "major" : "minor";
			const tickOnLabel = Math.abs((year / scale.labelStep) - Math.round(year / scale.labelStep)) < 1e-4;
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
		const track = this.shadowRoot?.getElementById("track");
		const activeRange = this.shadowRoot?.getElementById("activeRange");
		const centerYear = this.shadowRoot?.getElementById("centerYear");
		const leftHandle = this.shadowRoot?.getElementById("leftHandle");
		const rightHandle = this.shadowRoot?.getElementById("rightHandle");
		const leftGuide = this.shadowRoot?.getElementById("leftGuide");
		const rightGuide = this.shadowRoot?.getElementById("rightGuide");
		const leftEdgeValue = this.shadowRoot?.getElementById("leftEdgeValue");
		const rightEdgeValue = this.shadowRoot?.getElementById("rightEdgeValue");
		const rangeValues = this.shadowRoot?.getElementById("rangeValues");
		if (!track || !activeRange || !centerYear || !leftHandle || !rightHandle || !leftGuide || !rightGuide || !leftEdgeValue || !rightEdgeValue || !rangeValues) {
			return;
		}

		const trackWidth = track.getBoundingClientRect().width || track.clientWidth || 320;
		const minVisualRangeWidth = Math.max(
			this.model.minRangeYears * this.model.pixelsPerYear,
			(HANDLE_WIDTH_PX * 2) + LOWER_LABEL_SAFE_WIDTH_PX + RANGE_INNER_GUTTER_PX,
		);
		const rangeWidth = Math.max(minVisualRangeWidth, Math.min(trackWidth, this.model.activeRangeYears * this.model.pixelsPerYear));
		const edgeInset = (trackWidth - rangeWidth) / 2;

		activeRange.style.width = `${rangeWidth}px`;
		leftHandle.style.left = `${edgeInset}px`;
		rightHandle.style.right = `${edgeInset}px`;
		leftGuide.style.left = `${edgeInset}px`;
		rightGuide.style.right = `${edgeInset}px`;
		leftEdgeValue.style.left = `${edgeInset}px`;
		rightEdgeValue.style.right = `${edgeInset}px`;
		centerYear.textContent = formatYear(this.model.focusYear);
		leftEdgeValue.textContent = formatYear(this.model.activeRangeStartYear);
		rightEdgeValue.textContent = formatYear(this.model.activeRangeEndYear);
		rangeValues.textContent = `${Math.round(this.model.activeRangeYears)}y`;
		track.dataset.mode = this.interaction.mode || "idle";
		this.buildTicks(trackWidth);
	}

	render() {
		this.shadowRoot.innerHTML = `
			<style>
				:host { display: block; }
				.track-shell { display: grid; gap: 0.42rem; }
				.track {
					position: relative;
					height: 114px;
					border-radius: 12px;
					overflow: hidden;
					background: linear-gradient(180deg, #575757 0%, #474747 100%);
					border: 1px solid #8a8a8a;
					user-select: none;
				}
				.ruler-zone {
					position: absolute;
					inset: 0;
					touch-action: none;
					cursor: grab;
					z-index: 1;
				}
				.track[data-mode="drag-ruler"] .ruler-zone { cursor: grabbing; }
				.base-line {
					position: absolute;
					left: -6px;
					right: -6px;
					top: 76px;
					height: 1px;
					background: rgba(255, 255, 255, 0.46);
				}
				.active-range {
					position: absolute;
					left: 50%;
					top: 42px;
					height: 44px;
					transform: translateX(-50%);
					background: rgba(255, 255, 255, 0.09);
					border: 1px solid rgba(255, 255, 255, 0.78);
					border-radius: 8px;
					z-index: 2;
					pointer-events: none;
				}
				.edge-value {
					position: absolute;
					top: 20px;
					transform: translateX(-50%);
					font-size: 0.67rem;
					font-weight: 600;
					letter-spacing: 0.01em;
					color: #efefef;
					z-index: 4;
					background: rgba(43, 43, 43, 0.85);
					border: 1px solid rgba(255, 255, 255, 0.34);
					border-radius: 6px;
					padding: 0.12rem 0.35rem;
					line-height: 1.1;
					white-space: nowrap;
					pointer-events: none;
				}
				.edge-value.right {
					transform: translateX(50%);
				}
				.ticks {
					position: absolute;
					inset: 0;
					z-index: 2;
					pointer-events: none;
				}
				.tick {
					position: absolute;
					top: 73px;
					width: 1px;
					height: 7px;
					background: rgba(255, 255, 255, 0.46);
				}
				.tick[data-tier="major"] {
					height: 12px;
					top: 68px;
					width: 2px;
					background: rgba(255, 255, 255, 0.82);
				}
				.label {
					position: absolute;
					top: -18px;
					left: 50%;
					transform: translateX(-50%);
					font-size: 0.62rem;
					font-weight: 550;
					color: rgba(255, 255, 255, 0.9);
					white-space: nowrap;
				}
				.center-marker {
					position: absolute;
					left: 50%;
					top: 34px;
					height: 57px;
					width: 2px;
					transform: translateX(-50%);
					background: rgba(255, 255, 255, 0.78);
					pointer-events: none;
					z-index: 3;
				}
				.center-year {
					position: absolute;
					left: 50%;
					top: 9px;
					transform: translateX(-50%);
					padding: 0.2rem 0.6rem;
					font-size: 0.82rem;
					font-weight: 700;
					border-radius: 999px;
					background: #3f3f3f;
					border: 1px solid #9f9f9f;
					color: #f5f5f5;
					line-height: 1.1;
					pointer-events: none;
					z-index: 5;
				}
				.control-lane {
					position: relative;
					height: 50px;
					border-radius: 10px;
					background: linear-gradient(180deg, #565656 0%, #4b4b4b 100%);
					border: 1px solid #838383;
				}
				.handles-layer {
					position: relative;
					height: 100%;
					touch-action: none;
					user-select: none;
				}
				.resize-guide {
					position: absolute;
					top: -10px;
					width: 1px;
					height: 16px;
					background: rgba(255, 255, 255, 0.56);
				}
				.handle {
					position: absolute;
					top: 9px;
					width: ${HANDLE_WIDTH_PX}px;
					height: 30px;
					border-radius: 6px;
					border: 1px solid rgba(255, 255, 255, 0.64);
					background: #3f3f3f;
					display: grid;
					place-items: center;
					cursor: ew-resize;
					touch-action: none;
					box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
				}
				.handle.left { transform: translateX(-50%); }
				.handle.right { transform: translateX(50%); }
				.handle-grip {
					display: block;
					width: 10px;
					height: 14px;
					background: repeating-linear-gradient(
						90deg,
						rgba(255, 255, 255, 0.7) 0,
						rgba(255, 255, 255, 0.7) 1px,
						transparent 1px,
						transparent 3px
					);
					opacity: 0.8;
				}
				.range-values {
					position: absolute;
					left: 50%;
					top: 50%;
					transform: translate(-50%, -50%);
					font-size: 0.8rem;
					font-weight: 700;
					color: #f1f1f1;
					pointer-events: none;
					z-index: 3;
					white-space: nowrap;
				}
			</style>
			<div class="track-shell">
				<div id="track" class="track" data-mode="idle" aria-label="Timeline ruler" role="application">
					<div id="rulerZone" class="ruler-zone" aria-label="Drag ruler to move focused year"></div>
					<div class="base-line"></div>
					<div id="activeRange" class="active-range" aria-hidden="true"></div>
					<div id="leftEdgeValue" class="edge-value left">1938</div>
					<div id="rightEdgeValue" class="edge-value right">1962</div>
					<div id="ticks" class="ticks"></div>
					<div id="centerYear" class="center-year">1950</div>
					<div class="center-marker" aria-hidden="true"></div>
				</div>
				<div class="control-lane" aria-label="Range controls">
					<div id="handlesLayer" class="handles-layer" aria-label="Range resize handles">
						<div id="leftGuide" class="resize-guide"></div>
						<div id="rightGuide" class="resize-guide"></div>
						<button id="leftHandle" class="handle left" type="button" aria-label="Resize active range left edge">
							<span class="handle-grip" aria-hidden="true"></span>
						</button>
						<button id="rightHandle" class="handle right" type="button" aria-label="Resize active range right edge">
							<span class="handle-grip" aria-hidden="true"></span>
						</button>
						<div class="range-values" id="rangeValues">24y</div>
					</div>
				</div>
			</div>
		`;
	}
}

if (!customElements.get("oc-timeslider-v4-ruler")) {
	customElements.define("oc-timeslider-v4-ruler", TimeSliderV4RulerElement);
}

export { TimeSliderV4RulerElement };
