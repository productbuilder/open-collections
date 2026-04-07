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
		this.updateFocusYearFromPointer(event.clientX);
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
		const domainSpan = this.model.domainMaxYear - this.model.domainMinYear;
		if (!Number.isFinite(domainSpan) || domainSpan <= 0) return 0;
		return ((year - this.model.domainMinYear) / domainSpan) * width;
	}

	xToYear(x, width) {
		if (!Number.isFinite(width) || width <= 0) return this.model.focusYear;
		const domainSpan = this.model.domainMaxYear - this.model.domainMinYear;
		if (!Number.isFinite(domainSpan) || domainSpan <= 0) return this.model.focusYear;
		const clampedX = Math.max(0, Math.min(width, x));
		return this.model.domainMinYear + ((clampedX / width) * domainSpan);
	}

	updateFocusYearFromPointer(clientX) {
		const frame = this.shadowRoot?.getElementById("frame");
		if (!frame) return;
		const rect = frame.getBoundingClientRect();
		const width = rect.width || frame.clientWidth || 320;
		const offsetX = clientX - rect.left;
		const nextFocusYear = this.xToYear(offsetX, width);
		this.dispatchEvent(
			new CustomEvent("focus-year-change", {
				detail: { focusYear: nextFocusYear },
				bubbles: true,
				composed: true,
			}),
		);
	}

	onPointerMove(event) {
		if (this.interaction.activeDragType === "focus" && event.pointerId === this.interaction.focusDrag.pointerId) {
			this.updateFocusYearFromPointer(event.clientX);
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
		const minVisualRangeWidth = Math.max(
			this.model.minRangeYears * this.model.pixelsPerYear,
			(HANDLE_WIDTH_PX * 2) + LOWER_LABEL_SAFE_WIDTH_PX + RANGE_INNER_GUTTER_PX,
		);
		const yearMappedStartX = this.yearToX(this.model.activeRangeStartYear, trackWidth);
		const yearMappedEndX = this.yearToX(this.model.activeRangeEndYear, trackWidth);
		const yearMappedWidth = Math.max(0, yearMappedEndX - yearMappedStartX);
		const rangeWidth = Math.max(minVisualRangeWidth, yearMappedWidth);
		const rangeCenterX = this.yearToX(this.model.focusYear, trackWidth);
		const clampedRangeCenterX = Math.max(rangeWidth / 2, Math.min(trackWidth - (rangeWidth / 2), rangeCenterX));
		const leftEdgeX = clampedRangeCenterX - (rangeWidth / 2);
		const rightEdgeX = clampedRangeCenterX + (rangeWidth / 2);

		activeRange.style.left = `${leftEdgeX}px`;
		activeRange.style.width = `${rangeWidth}px`;
		leftHandle.style.left = `${leftEdgeX}px`;
		rightHandle.style.left = `${rightEdgeX}px`;
		leftGuide.style.left = `${leftEdgeX}px`;
		rightGuide.style.left = `${rightEdgeX}px`;
		leftEdgeValue.style.left = `${leftEdgeX}px`;
		rightEdgeValue.style.left = `${rightEdgeX}px`;
		centerMarker.style.left = `${clampedRangeCenterX}px`;
		centerYear.style.left = `${clampedRangeCenterX}px`;
		centerYear.textContent = formatYear(this.model.focusYear);
		leftEdgeValue.textContent = formatYear(this.model.activeRangeStartYear);
		rightEdgeValue.textContent = formatYear(this.model.activeRangeEndYear);
		rangeValues.textContent = `${Math.round(this.model.activeRangeYears)}y`;
		frame.dataset.mode = this.interaction.activeDragType || "idle";
		this.buildTicks(trackWidth);
	}

	render() {
		this.shadowRoot.innerHTML = `
			<style>
				:host { display: block; margin-inline: -0.2rem; }
				.frame {
					position: relative;
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
					padding: 0;
				}
				.upper-track {
					height: 76px;
					background: #6f6f6f;
					pointer-events: auto;
				}
				.lower-track {
					height: 44px;
					background: #626262;
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
				.ruler-zone {
					position: absolute;
					top: 0;
					left: 0;
					width: 100%;
					height: 76px;
					touch-action: none;
					cursor: grab;
					pointer-events: auto;
					z-index: 1;
				}
				.frame[data-mode="focus"] .ruler-zone { cursor: grabbing; }
				.base-line {
					position: absolute;
					left: -6px;
					right: -6px;
					top: 50px;
					height: 1px;
					background: rgba(255, 255, 255, 0.46);
					pointer-events: none;
				}
				.active-range {
					position: absolute;
					top: 14px;
					height: 38px;
					background: rgba(255, 255, 255, 0.09);
					border: 1px solid rgba(255, 255, 255, 0.78);
					border-radius: 4px;
					z-index: 2;
					pointer-events: none;
				}
				.edge-value {
					position: absolute;
					top: -10px;
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
				.ticks {
					position: absolute;
					inset: 0;
					z-index: 2;
					pointer-events: none;
				}
				.tick {
					position: absolute;
					top: 47px;
					width: 1px;
					height: 6px;
					background: rgba(255, 255, 255, 0.46);
				}
				.tick[data-tier="major"] {
					height: 11px;
					top: 42px;
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
					top: 12px;
					height: 52px;
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
					top: -12px;
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
					top: 72px;
					width: 1px;
					height: 14px;
					background: rgba(255, 255, 255, 0.56);
					transform: translateX(-50%);
					pointer-events: none;
				}
				.handle {
					position: absolute;
					top: 86px;
					width: ${HANDLE_WIDTH_PX}px;
					height: 30px;
					transform: translateX(-50%);
					border-radius: 6px;
					border: 1px solid rgba(255, 255, 255, 0.64);
					background: #3f3f3f;
					display: grid;
					place-items: center;
					cursor: ew-resize;
					touch-action: none;
					box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
					pointer-events: auto;
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
					opacity: 0.8;
				}
				.range-values {
					position: absolute;
					left: 50%;
					top: 102px;
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
					<div id="rulerZone" class="ruler-zone" aria-label="Drag ruler to move focused year"></div>
					<div class="base-line"></div>
					<div id="activeRange" class="active-range" aria-hidden="true"></div>
					<div id="leftEdgeValue" class="edge-value left">1938</div>
					<div id="rightEdgeValue" class="edge-value right">1962</div>
					<div id="ticks" class="ticks"></div>
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
			</div>
		`;
	}
}

if (!customElements.get("oc-timeslider-v5-ruler")) {
	customElements.define("oc-timeslider-v5-ruler", TimeSliderV5RulerElement);
}

export { TimeSliderV5RulerElement };
