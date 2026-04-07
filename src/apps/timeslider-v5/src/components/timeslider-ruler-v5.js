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

class TimeSliderV5RulerElement extends HTMLElement {
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
			activeDragType: null,
			focusDrag: {
				pointerId: null,
				startX: 0,
				startFocusYear: 1950,
			},
			rangeResizeDrag: {
				pointerId: null,
				startX: 0,
				startRangeYears: 24,
				edge: null,
			},
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
		const frame = this.shadowRoot?.getElementById("frame");
		const upperTrack = this.shadowRoot?.querySelector(".upper-track");
		const leftHandle = this.shadowRoot?.getElementById("leftHandle");
		const rightHandle = this.shadowRoot?.getElementById("rightHandle");
		if (!frame || !upperTrack || !leftHandle || !rightHandle) return;
		frame.addEventListener("pointerdown", (event) => {
			const target = event.target instanceof Element ? event.target : null;
			const targetHandle = target?.closest(".handle");
			if (targetHandle === leftHandle) {
				this.startRangeResize(event, "left");
				return;
			}
			if (targetHandle === rightHandle) {
				this.startRangeResize(event, "right");
				return;
			}
			const upperTrackBounds = upperTrack.getBoundingClientRect();
			const pointerInUpperTrack =
				event.clientY >= upperTrackBounds.top && event.clientY <= upperTrackBounds.bottom;
			if (!pointerInUpperTrack) return;
			this.startFocusDrag(event);
		});
	}

	startFocusDrag(event) {
		const upperTrack = this.shadowRoot?.querySelector(".upper-track");
		if (!upperTrack) return;
		event.preventDefault();
		upperTrack.setPointerCapture(event.pointerId);
		this.interaction.activeDragType = "focus";
		this.interaction.focusDrag.pointerId = event.pointerId;
		this.interaction.focusDrag.startX = event.clientX;
		this.interaction.focusDrag.startFocusYear = this.model.focusYear;
		window.addEventListener("pointermove", this.onPointerMove);
		window.addEventListener("pointerup", this.onPointerUp);
		window.addEventListener("pointercancel", this.onPointerUp);
		this.applyView();
	}

	startRangeResize(event, edge) {
		const target = event.target instanceof Element ? event.target : null;
		const handle = target?.closest(".handle");
		if (!(handle instanceof HTMLElement)) return;
		event.preventDefault();
		handle.setPointerCapture(event.pointerId);
		this.interaction.activeDragType = "resize-range";
		this.interaction.rangeResizeDrag.pointerId = event.pointerId;
		this.interaction.rangeResizeDrag.edge = edge;
		this.interaction.rangeResizeDrag.startX = event.clientX;
		this.interaction.rangeResizeDrag.startRangeYears = this.model.activeRangeYears;
		window.addEventListener("pointermove", this.onPointerMove);
		window.addEventListener("pointerup", this.onPointerUp);
		window.addEventListener("pointercancel", this.onPointerUp);
		this.applyView();
	}

	yearToX(year, width) {
		if (!Number.isFinite(width) || width <= 0) return 0;
		const centerX = width / 2;
		const deltaYears = year - this.model.focusYear;
		return centerX + (deltaYears * this.model.pixelsPerYear);
	}

	computeFixedRangeLayout(trackWidth) {
		const minVisualRangeWidth = Math.max(
			this.model.minRangeYears * this.model.pixelsPerYear,
			(HANDLE_WIDTH_PX * 2) + LOWER_LABEL_SAFE_WIDTH_PX + RANGE_INNER_GUTTER_PX,
		);
		const modelWidth = Math.max(0, (this.model.activeRangeEndYear - this.model.activeRangeStartYear) * this.model.pixelsPerYear);
		const visualWidth = Math.max(minVisualRangeWidth, modelWidth);
		const centerX = trackWidth / 2;
		return {
			visualWidth,
			centerX,
			leftEdgeX: centerX - (visualWidth / 2),
			rightEdgeX: centerX + (visualWidth / 2),
		};
	}

	updateFocusYear(nextFocusYear) {
		const clampedFocusYear = Math.min(this.model.domainMaxYear, Math.max(this.model.domainMinYear, nextFocusYear));
		this.dispatchEvent(
			new CustomEvent("focus-year-change", {
				detail: { focusYear: clampedFocusYear },
				bubbles: true,
				composed: true,
			}),
		);
	}

	onPointerMove(event) {
		if (this.interaction.activeDragType === "focus" && event.pointerId === this.interaction.focusDrag.pointerId) {
			const deltaX = event.clientX - this.interaction.focusDrag.startX;
			const deltaYears = deltaX / this.model.pixelsPerYear;
			this.updateFocusYear(this.interaction.focusDrag.startFocusYear - deltaYears);
			return;
		}

		if (this.interaction.activeDragType === "resize-range" && event.pointerId === this.interaction.rangeResizeDrag.pointerId) {
			const pixelsPerYear = this.model.pixelsPerYear;
			if (!pixelsPerYear) return;
			const deltaX = event.clientX - this.interaction.rangeResizeDrag.startX;
			const signedDeltaYears = deltaX / pixelsPerYear;
			const edgeFactor = this.interaction.rangeResizeDrag.edge === "left" ? -1 : 1;
			const deltaHalfWidthYears = signedDeltaYears * edgeFactor;
			const nextRangeYears = this.interaction.rangeResizeDrag.startRangeYears + (deltaHalfWidthYears * 2);
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
		const isFocusPointer = event.pointerId === this.interaction.focusDrag.pointerId;
		const isResizePointer = event.pointerId === this.interaction.rangeResizeDrag.pointerId;
		if (!isFocusPointer && !isResizePointer) return;
		this.interaction.activeDragType = null;
		this.interaction.focusDrag.pointerId = null;
		this.interaction.focusDrag.startX = 0;
		this.interaction.focusDrag.startFocusYear = this.model.focusYear;
		this.interaction.rangeResizeDrag.pointerId = null;
		this.interaction.rangeResizeDrag.edge = null;
		window.removeEventListener("pointermove", this.onPointerMove);
		window.removeEventListener("pointerup", this.onPointerUp);
		window.removeEventListener("pointercancel", this.onPointerUp);
		this.applyView();
	}

	buildTicks(trackWidth) {
		const ticksContainer = this.shadowRoot?.getElementById("ticks");
		if (!ticksContainer) return;
		ticksContainer.innerHTML = "";
		const scale = computeTickScale(this.model.pixelsPerYear);
		const baseStep = Math.min(scale.minorStep, scale.majorStep);
		const firstTick = normalizeYearStep(Math.ceil(this.model.domainMinYear / baseStep) * baseStep, baseStep);
		let lastLabelX = -Infinity;

		for (let year = firstTick; year <= this.model.domainMaxYear + baseStep * 0.5; year = normalizeYearStep(year + baseStep, baseStep)) {
			const x = this.yearToX(year, trackWidth);
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
		const frame = this.shadowRoot?.getElementById("frame");
		const activeRange = this.shadowRoot?.getElementById("activeRange");
		const centerYear = this.shadowRoot?.getElementById("centerYear");
		const centerMarker = this.shadowRoot?.getElementById("centerMarker");
		const leftHandle = this.shadowRoot?.getElementById("leftHandle");
		const rightHandle = this.shadowRoot?.getElementById("rightHandle");
		const leftGuide = this.shadowRoot?.getElementById("leftGuide");
		const rightGuide = this.shadowRoot?.getElementById("rightGuide");
		const leftEdgeValue = this.shadowRoot?.getElementById("leftEdgeValue");
		const rightEdgeValue = this.shadowRoot?.getElementById("rightEdgeValue");
		const rangeValues = this.shadowRoot?.getElementById("rangeValues");
		if (!frame || !activeRange || !centerYear || !centerMarker || !leftHandle || !rightHandle || !leftGuide || !rightGuide || !leftEdgeValue || !rightEdgeValue || !rangeValues) {
			return;
		}

		const trackWidth = frame.getBoundingClientRect().width || frame.clientWidth || 320;
		const { visualWidth, centerX: focusX, leftEdgeX, rightEdgeX } = this.computeFixedRangeLayout(trackWidth);

		activeRange.style.left = `${leftEdgeX}px`;
		activeRange.style.width = `${visualWidth}px`;
		leftHandle.style.left = `${leftEdgeX}px`;
		rightHandle.style.left = `${rightEdgeX}px`;
		leftGuide.style.left = `${leftEdgeX}px`;
		rightGuide.style.left = `${rightEdgeX}px`;
		leftEdgeValue.style.left = `${leftEdgeX + 8}px`;
		rightEdgeValue.style.left = `${rightEdgeX - 8}px`;
		centerMarker.style.left = `${focusX}px`;
		centerYear.style.left = `${focusX}px`;
		centerYear.textContent = formatYear(this.model.focusYear);
		leftEdgeValue.textContent = formatYear(this.model.activeRangeStartYear);
		rightEdgeValue.textContent = formatYear(this.model.activeRangeEndYear);
		rangeValues.textContent = `${Math.round(this.model.activeRangeEndYear - this.model.activeRangeStartYear)}y`;
		frame.dataset.mode = this.interaction.activeDragType || "idle";
		this.buildTicks(trackWidth);
	}

	render() {
		this.shadowRoot.innerHTML = `
			<style>
				:host { display: block; margin-inline: -0.2rem; }
				.frame {
					position: relative;
					--ruler-baseline-y: 69px;
					--edge-value-bottom-inset: 6px;
					--active-range-top: 41px;
					--active-range-bottom: 97px;
					--handle-top: 108px;
					--handle-height: 30px;
					--center-marker-top: 28px;
					--tick-minor-height: 6px;
					--tick-major-height: 11px;
					--active-range-height: calc(var(--active-range-bottom) - var(--active-range-top));
					--timeline-lane-height: var(--active-range-height);
					--timeline-lane-top: calc(var(--ruler-baseline-y) - (var(--timeline-lane-height) / 2));
					--handle-center-y: calc(var(--handle-top) + (var(--handle-height) / 2));
					--handles-lane-height: var(--handle-height);
					--handles-lane-top: calc(var(--handle-center-y) - (var(--handles-lane-height) / 2));
					border-radius: 0;
					overflow: hidden;
					border: none;
					background: #686868;
					user-select: none;
				}
				.stage {
					position: relative;
					display: grid;
					gap: 4px;
					padding: 14px 0 6px;
				}
				.upper-track {
					height: 80px;
					background: transparent;
					pointer-events: auto;
				}
				.lower-track {
					height: 48px;
					background: transparent;
					pointer-events: none;
				}
				.overlay {
					position: absolute;
					top: 0;
					left: 0;
					width: 100%;
					height: 100%;
					pointer-events: none;
				}
				.moving-timeline {
					position: absolute;
					inset: 0;
					z-index: 1;
					pointer-events: none;
				}
				.fixed-overlay {
					position: absolute;
					inset: 0;
					z-index: 2;
					pointer-events: none;
				}
				.timeline-lane,
				.handles-lane {
					position: absolute;
					left: 0;
					width: 100%;
					background: rgba(255, 255, 255, 0.05);
					pointer-events: none;
					z-index: 0;
				}
				.timeline-lane {
					top: var(--timeline-lane-top);
					height: var(--timeline-lane-height);
				}
				.handles-lane {
					top: var(--handles-lane-top);
					height: var(--handles-lane-height);
				}
				.ruler-zone {
					position: absolute;
					top: 14px;
					left: 0;
					width: 100%;
					height: 80px;
					touch-action: none;
					cursor: grab;
					pointer-events: auto;
					z-index: 4;
				}
				.frame[data-mode="focus"] .ruler-zone { cursor: grabbing; }
				.base-line {
					position: absolute;
					left: -6px;
					right: -6px;
					top: var(--ruler-baseline-y);
					height: 1px;
					background: rgba(255, 255, 255, 0.46);
					pointer-events: none;
				}
				.active-range {
					position: absolute;
					top: var(--active-range-top);
					height: var(--active-range-height);
					background: rgba(255, 255, 255, 0.09);
					border: 1px solid rgba(255, 255, 255, 0.78);
					border-radius: 4px;
					z-index: 2;
					pointer-events: none;
				}
				.edge-value {
					position: absolute;
					top: calc(var(--active-range-bottom) - var(--edge-value-bottom-inset) - (0.62rem * 1.1));
					font-size: 0.62rem;
					font-weight: 550;
					letter-spacing: 0.01em;
					color: rgba(255, 255, 255, 0.82);
					z-index: 2;
					line-height: 1.1;
					white-space: nowrap;
					pointer-events: none;
				}
				.edge-value.left {
					transform: none;
					text-align: left;
				}
				.edge-value.right {
					transform: translateX(-100%);
					text-align: right;
				}
				.ticks {
					position: absolute;
					inset: 0;
					z-index: 1;
					pointer-events: none;
				}
				.tick {
					position: absolute;
					top: calc(var(--ruler-baseline-y) - (var(--tick-minor-height) / 2));
					width: 1px;
					height: var(--tick-minor-height);
					background: rgba(255, 255, 255, 0.46);
				}
				.tick[data-tier="major"] {
					height: var(--tick-major-height);
					top: calc(var(--ruler-baseline-y) - (var(--tick-major-height) / 2));
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
					pointer-events: none;
				}
				.center-marker {
					position: absolute;
					top: var(--center-marker-top);
					height: calc(var(--ruler-baseline-y) - var(--center-marker-top));
					width: 2px;
					transform: translateX(-50%);
					background: rgba(255, 255, 255, 0.78);
					pointer-events: none;
					z-index: 3;
				}
				.center-marker::after {
					content: "";
					position: absolute;
					left: 50%;
					bottom: -4px;
					width: 8px;
					height: 8px;
					transform: translateX(-50%);
					border-radius: 50%;
					background: rgba(255, 255, 255, 0.88);
				}
				.center-year {
					position: absolute;
					top: 4px;
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
				.resize-guide {
					position: absolute;
					top: var(--active-range-bottom);
					width: 1px;
					height: calc(var(--handle-top) - var(--active-range-bottom) + 6px);
					background: rgba(255, 255, 255, 0.56);
					transform: translateX(-50%);
					pointer-events: none;
				}
				.handle {
					position: absolute;
					top: var(--handle-top);
					width: ${HANDLE_WIDTH_PX}px;
					height: var(--handle-height);
					transform: translateX(-50%);
					border-radius: 4px;
					border: 1px solid rgba(255, 255, 255, 0.64);
					background: #3f3f3f;
					display: grid;
					place-items: center;
					cursor: ew-resize;
					touch-action: none;
					box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
					pointer-events: auto;
					z-index: 3;
				}
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
					background-position: center;
					margin: 0;
					opacity: 0.8;
				}
				.range-values {
					position: absolute;
					left: 50%;
					top: 126px;
					transform: translate(-50%, -50%);
					font-size: 0.8rem;
					font-weight: 700;
					color: #f1f1f1;
					pointer-events: none;
					z-index: 3;
					white-space: nowrap;
				}
			</style>
			<div id="frame" class="frame" data-mode="idle" aria-label="Timeline ruler" role="application">
				<div class="stage">
					<div class="upper-track"></div>
					<div class="lower-track"></div>
				</div>
				<div id="overlay" class="overlay">
					<div id="movingTimeline" class="moving-timeline" aria-hidden="true">
						<div id="ticks" class="ticks"></div>
					</div>
					<div id="fixedOverlay" class="fixed-overlay">
						<div class="timeline-lane" aria-hidden="true"></div>
						<div class="handles-lane" aria-hidden="true"></div>
						<div class="base-line"></div>
						<div id="activeRange" class="active-range" aria-hidden="true"></div>
						<div id="leftEdgeValue" class="edge-value left">1938</div>
						<div id="rightEdgeValue" class="edge-value right">1962</div>
						<div id="centerYear" class="center-year">1950</div>
						<div id="centerMarker" class="center-marker" aria-hidden="true"></div>
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
					<div id="rulerZone" class="ruler-zone" aria-label="Drag ruler to move focused year"></div>
				</div>
			</div>
		`;
	}
}

if (!customElements.get("oc-timeslider-v5-ruler")) {
	customElements.define("oc-timeslider-v5-ruler", TimeSliderV5RulerElement);
}

export { TimeSliderV5RulerElement };
