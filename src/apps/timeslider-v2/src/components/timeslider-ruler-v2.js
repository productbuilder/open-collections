const DEFAULT_DOMAIN_MIN = 1800;
const DEFAULT_DOMAIN_MAX = 2025;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function formatYear(year) {
	return Math.round(year).toString();
}

function normalizeYearStep(value, step) {
	const rounded = Math.round(value / step) * step;
	return Number(rounded.toFixed(6));
}

function computeRulerScale(windowSizeYears) {
	if (windowSizeYears <= 10) {
		return { minorStep: 1, majorStep: 5, labelStep: 5, minLabelSpacingPx: 54 };
	}
	if (windowSizeYears <= 30) {
		return { minorStep: 2, majorStep: 10, labelStep: 10, minLabelSpacingPx: 58 };
	}
	if (windowSizeYears <= 100) {
		return { minorStep: 5, majorStep: 20, labelStep: 20, minLabelSpacingPx: 62 };
	}
	return { minorStep: 10, majorStep: 50, labelStep: 50, minLabelSpacingPx: 66 };
}

class TimeSliderV2RulerElement extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.model = {
			domainMinYear: DEFAULT_DOMAIN_MIN,
			domainMaxYear: DEFAULT_DOMAIN_MAX,
			focusYear: 1950,
			windowSizeYears: 24,
			minWindowYears: 4,
			maxWindowYears: 225,
		};
		this.interaction = {
			mode: null,
			pointerId: null,
			edge: null,
			startX: 0,
			startFocusYear: 1950,
			startWindowSizeYears: 24,
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
		this.model.focusYear = clamp(next, this.model.domainMinYear, this.model.domainMaxYear);
		this.applyView();
	}

	set windowSizeYears(value) {
		const next = Number(value);
		if (!Number.isFinite(next) || next <= 0) {
			return;
		}
		this.model.windowSizeYears = clamp(
			next,
			this.model.minWindowYears,
			this.model.maxWindowYears,
		);
		this.applyView();
	}

	set minWindowYears(value) {
		const next = Number(value);
		if (!Number.isFinite(next) || next <= 0) {
			return;
		}
		this.model.minWindowYears = next;
		this.applyView();
	}

	set maxWindowYears(value) {
		const next = Number(value);
		if (!Number.isFinite(next) || next <= 0) {
			return;
		}
		this.model.maxWindowYears = next;
		this.applyView();
	}

	getPixelsPerYear() {
		const track = this.shadowRoot?.getElementById("track");
		if (!track) {
			return 3;
		}
		const width = track.getBoundingClientRect().width || track.clientWidth || 320;
		const visibleSpanYears = Math.max(this.model.windowSizeYears * 2, 16);
		return width / visibleSpanYears;
	}

	bindEvents() {
		if (!this.shadowRoot) {
			return;
		}
		const track = this.shadowRoot.getElementById("track");
		const windowEdgeLeft = this.shadowRoot.getElementById("leftHandle");
		const windowEdgeRight = this.shadowRoot.getElementById("rightHandle");
		if (!track || !windowEdgeLeft || !windowEdgeRight) {
			return;
		}

		track.addEventListener("pointerdown", (event) => {
			const target = event.target;
			const handle = target instanceof HTMLElement ? target.closest("[data-edge]") : null;
			if (handle) {
				this.startResize(event);
				return;
			}
			this.startFocusDrag(event);
		});
	}

	startFocusDrag(event) {
		const track = this.shadowRoot?.getElementById("track");
		if (!track) {
			return;
		}
		event.preventDefault();
		track.setPointerCapture(event.pointerId);
		this.interaction.mode = "drag-ruler";
		this.interaction.pointerId = event.pointerId;
		this.interaction.startX = event.clientX;
		this.interaction.startFocusYear = this.model.focusYear;
		window.addEventListener("pointermove", this.onPointerMove);
		window.addEventListener("pointerup", this.onPointerUp);
		window.addEventListener("pointercancel", this.onPointerUp);
		this.applyView();
	}

	startResize(event) {
		const track = this.shadowRoot?.getElementById("track");
		const target = event.target;
		const handle = target instanceof HTMLElement ? target.closest("[data-edge]") : null;
		if (!track) {
			return;
		}
		event.preventDefault();
		track.setPointerCapture(event.pointerId);
		this.interaction.mode = "resize-window";
		this.interaction.pointerId = event.pointerId;
		this.interaction.edge = handle?.dataset.edge === "left" ? "left" : "right";
		this.interaction.startX = event.clientX;
		this.interaction.startWindowSizeYears = this.model.windowSizeYears;
		window.addEventListener("pointermove", this.onPointerMove);
		window.addEventListener("pointerup", this.onPointerUp);
		window.addEventListener("pointercancel", this.onPointerUp);
		this.applyView();
	}

	onPointerMove(event) {
		if (event.pointerId !== this.interaction.pointerId) {
			return;
		}
		const pixelsPerYear = this.getPixelsPerYear();
		if (!pixelsPerYear) {
			return;
		}
		const deltaX = event.clientX - this.interaction.startX;
		if (this.interaction.mode === "drag-ruler") {
			const deltaYears = deltaX / pixelsPerYear;
			const nextYear = clamp(
				this.interaction.startFocusYear - deltaYears,
				this.model.domainMinYear,
				this.model.domainMaxYear,
			);
			this.dispatchEvent(
				new CustomEvent("focus-year-change", {
					detail: { focusYear: nextYear },
					bubbles: true,
					composed: true,
				}),
			);
			return;
		}
		if (this.interaction.mode === "resize-window") {
			const deltaYears = deltaX / pixelsPerYear;
			const halfDeltaYears =
				this.interaction.edge === "left" ? -deltaYears : deltaYears;
			const nextSize = clamp(
				this.interaction.startWindowSizeYears + (halfDeltaYears * 2),
				this.model.minWindowYears,
				this.model.maxWindowYears,
			);
			this.dispatchEvent(
				new CustomEvent("window-size-change", {
					detail: { windowSizeYears: nextSize },
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

	buildTicks(trackWidth, pixelsPerYear) {
		const ticksContainer = this.shadowRoot?.getElementById("ticks");
		if (!ticksContainer) {
			return;
		}
		ticksContainer.innerHTML = "";
		const centerX = trackWidth / 2;
		const scale = computeRulerScale(this.model.windowSizeYears);
		const baseStep = Math.min(scale.minorStep, scale.majorStep);
		const visibleHalfYears = trackWidth / (2 * pixelsPerYear);
		const bufferYears = visibleHalfYears * 0.5;
		const minYear = Math.max(
			this.model.domainMinYear,
			Math.floor(this.model.focusYear - visibleHalfYears - bufferYears),
		);
		const maxYear = Math.min(
			this.model.domainMaxYear,
			Math.ceil(this.model.focusYear + visibleHalfYears + bufferYears),
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
			if (x < -32 || x > trackWidth + 32) {
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
		const activeWindow = this.shadowRoot.getElementById("activeWindow");
		const centerYear = this.shadowRoot.getElementById("centerYear");
		if (!track || !activeWindow || !centerYear) {
			return;
		}
		const trackWidth = track.getBoundingClientRect().width || track.clientWidth || 320;
		const pixelsPerYear = this.getPixelsPerYear();
		const windowWidth = Math.max(
			16,
			Math.min(trackWidth, this.model.windowSizeYears * pixelsPerYear),
		);
		activeWindow.style.width = `${windowWidth}px`;
		centerYear.textContent = formatYear(this.model.focusYear);
		track.dataset.mode = this.interaction.mode || "idle";
		this.buildTicks(trackWidth, pixelsPerYear);
	}

	render() {
		this.shadowRoot.innerHTML = `
			<style>
				:host {
					display: block;
				}
				.track {
					position: relative;
					height: 104px;
					border-radius: 12px;
					overflow: hidden;
					background: linear-gradient(180deg, #0f273a 0%, #0b1f30 100%);
					border: 1px solid rgba(255, 255, 255, 0.14);
					touch-action: none;
					user-select: none;
					cursor: grab;
				}
				.track[data-mode="drag-ruler"] {
					cursor: grabbing;
				}
				.base-line {
					position: absolute;
					left: -8px;
					right: -8px;
					top: 64px;
					height: 2px;
					background: rgba(255, 255, 255, 0.25);
				}
				.active-window {
					position: absolute;
					left: 50%;
					top: 34px;
					height: 58px;
					transform: translateX(-50%);
					background: rgba(82, 199, 255, 0.23);
					border: 1px solid rgba(82, 199, 255, 0.72);
					border-radius: 9px;
					box-shadow:
						inset 0 0 0 1px rgba(255, 255, 255, 0.11),
						0 0 0 1px rgba(82, 199, 255, 0.28),
						0 0 16px rgba(34, 137, 185, 0.36);
					z-index: 2;
				}
				.window-handle {
					position: absolute;
					top: 0;
					bottom: 0;
					width: 20px;
					display: grid;
					place-items: center;
					cursor: ew-resize;
					touch-action: none;
				}
				.window-handle::before {
					content: "";
					height: 28px;
					width: 3px;
					border-radius: 2px;
					background: rgba(177, 231, 255, 0.95);
					box-shadow: 0 0 0 1px rgba(7, 25, 41, 0.55);
				}
				.window-handle::after {
					content: "";
					position: absolute;
					width: 12px;
					height: 38px;
					border-radius: 8px;
					border: 1px solid rgba(177, 231, 255, 0.35);
					background: rgba(8, 19, 29, 0.3);
				}
				.window-handle.left {
					left: -10px;
				}
				.window-handle.right {
					right: -10px;
				}
				.ticks {
					position: absolute;
					left: 0;
					right: 0;
					top: 0;
					bottom: 0;
				}
				.tick {
					position: absolute;
					top: 61px;
					width: 1px;
					height: 7px;
					background: rgba(255, 255, 255, 0.3);
				}
				.tick[data-tier="major"] {
					height: 13px;
					top: 57px;
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
					top: 32px;
					height: 60px;
					transform: translateX(-50%);
					width: 3px;
					background: #ffd85e;
					box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.35), 0 0 12px rgba(255, 216, 94, 0.5);
					z-index: 3;
				}
				.center-year {
					position: absolute;
					left: 50%;
					top: 4px;
					transform: translateX(-50%);
					padding: 0.18rem 0.56rem;
					font-size: 0.84rem;
					font-weight: 700;
					border-radius: 999px;
					background: rgba(8, 19, 29, 0.95);
					border: 1px solid rgba(255, 216, 94, 0.85);
					color: #fff2bf;
					line-height: 1.1;
					pointer-events: none;
					z-index: 4;
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
				}
				.track[data-mode="drag-ruler"] .mode-pill::after {
					content: "Ruler drag";
				}
				.track[data-mode="resize-window"] .mode-pill::after {
					content: "Resize window";
				}
				.track[data-mode="idle"] .mode-pill::after {
					content: "Ready";
				}
			</style>
			<div id="track" class="track" data-mode="idle" aria-label="Timeline ruler" role="application">
				<div class="base-line"></div>
				<div id="activeWindow" class="active-window" aria-label="Active filter range">
					<div id="leftHandle" class="window-handle left" data-edge="left" aria-hidden="true"></div>
					<div id="rightHandle" class="window-handle right" data-edge="right" aria-hidden="true"></div>
				</div>
				<div id="ticks" class="ticks"></div>
				<div id="centerYear" class="center-year">1950</div>
				<div class="center-marker" aria-hidden="true"></div>
				<div class="mode-pill" aria-hidden="true"></div>
			</div>
		`;
	}
}

if (!customElements.get("oc-timeslider-v2-ruler")) {
	customElements.define("oc-timeslider-v2-ruler", TimeSliderV2RulerElement);
}

export { TimeSliderV2RulerElement };
