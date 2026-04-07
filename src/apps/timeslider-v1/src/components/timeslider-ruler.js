const DEFAULT_DOMAIN_MIN = 1800;
const DEFAULT_DOMAIN_MAX = 2025;
const INERTIA_RELEASE_BOOST = 1.18;
const INERTIA_MAX_VELOCITY = 0.045;
const INERTIA_START_THRESHOLD = 0.0009;
const INERTIA_STOP_THRESHOLD = 0.00015;
const INERTIA_DECAY_TIME_MS = 220;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function formatYear(year) {
	return Math.round(year).toString();
}

const MONTH_LABELS = [
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"May",
	"Jun",
	"Jul",
	"Aug",
	"Sep",
	"Oct",
	"Nov",
	"Dec",
];

function normalizeYearStep(value, step) {
	const rounded = Math.round(value / step) * step;
	return Number(rounded.toFixed(6));
}

function computeRulerScale(windowSizeYears) {
	if (windowSizeYears === "all") {
		return { minorStep: 10, majorStep: 20, labelStep: 20, minLabelSpacingPx: 62 };
	}
	if (windowSizeYears <= 1) {
		return {
			minorStep: 1 / 12,
			majorStep: 0.25,
			labelStep: 0.25,
			minLabelSpacingPx: 44,
		};
	}
	if (windowSizeYears <= 10) {
		return { minorStep: 1, majorStep: 2, labelStep: 2, minLabelSpacingPx: 58 };
	}
	if (windowSizeYears <= 20) {
		return { minorStep: 1, majorStep: 5, labelStep: 5, minLabelSpacingPx: 56 };
	}
	if (windowSizeYears <= 50) {
		return { minorStep: 5, majorStep: 10, labelStep: 10, minLabelSpacingPx: 60 };
	}
	return { minorStep: 10, majorStep: 20, labelStep: 20, minLabelSpacingPx: 62 };
}

function formatTickLabel(year, windowSizeYears) {
	if (windowSizeYears > 1 || windowSizeYears === "all") {
		return formatYear(year);
	}
	const fractionalYear = year - Math.floor(year);
	const monthIndex = Math.max(
		0,
		Math.min(11, Math.round((fractionalYear + 1e-6) * 12)),
	);
	if (monthIndex === 0) {
		return `${MONTH_LABELS[monthIndex]} ${formatYear(year)}`;
	}
	return MONTH_LABELS[monthIndex];
}

class TimeSliderV1RulerElement extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.model = {
			domainMinYear: DEFAULT_DOMAIN_MIN,
			domainMaxYear: DEFAULT_DOMAIN_MAX,
			centerYear: 1950,
			windowSizeYears: 20,
		};
		this.drag = {
			active: false,
			startX: 0,
			startYear: 1950,
			lastX: 0,
			lastTime: 0,
		};
		this.motion = {
			displayYear: 1950,
			velocityYearsPerMs: 0,
			inertiaActive: false,
			rafId: 0,
			lastFrameTime: 0,
		};
		this.onPointerMove = this.onPointerMove.bind(this);
		this.onPointerUp = this.onPointerUp.bind(this);
		this.onFrame = this.onFrame.bind(this);
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

	set centerYear(value) {
		const next = Number(value);
		if (!Number.isFinite(next)) {
			return;
		}
		this.model.centerYear = clamp(next, this.model.domainMinYear, this.model.domainMaxYear);
		this.motion.displayYear = this.model.centerYear;
		this.motion.velocityYearsPerMs = 0;
		this.motion.inertiaActive = false;
		this.applyView();
	}

	set windowSizeYears(value) {
		if (value === "all") {
			this.model.windowSizeYears = "all";
			this.applyView();
			return;
		}
		const next = Number(value);
		if (!Number.isFinite(next) || next <= 0) {
			return;
		}
		this.model.windowSizeYears = next;
		this.applyView();
	}

	getPixelsPerYear() {
		const track = this.shadowRoot?.getElementById("track");
		if (!track) {
			return 4;
		}
		const width = track.getBoundingClientRect().width || track.clientWidth || 320;
		if (this.model.windowSizeYears === "all") {
			return width / (this.model.domainMaxYear - this.model.domainMinYear);
		}
		return width / this.model.windowSizeYears;
	}

	bindEvents() {
		const track = this.shadowRoot?.getElementById("track");
		if (!track) {
			return;
		}
		track.addEventListener("pointerdown", (event) => {
			event.preventDefault();
			track.setPointerCapture(event.pointerId);
			this.drag.active = true;
			this.drag.startX = event.clientX;
			this.drag.startYear = this.model.centerYear;
			this.drag.lastX = event.clientX;
			this.drag.lastTime = event.timeStamp || performance.now();
			this.motion.velocityYearsPerMs = 0;
			this.motion.inertiaActive = false;
			window.addEventListener("pointermove", this.onPointerMove);
			window.addEventListener("pointerup", this.onPointerUp);
			window.addEventListener("pointercancel", this.onPointerUp);
		});
	}

	onPointerMove(event) {
		if (!this.drag.active) {
			return;
		}
		const deltaX = event.clientX - this.drag.startX;
		const pixelsPerYear = this.getPixelsPerYear();
		if (!pixelsPerYear) {
			return;
		}
		const deltaYears = deltaX / pixelsPerYear;
		const nextYear = clamp(
			this.drag.startYear - deltaYears,
			this.model.domainMinYear,
			this.model.domainMaxYear,
		);
		const time = event.timeStamp || performance.now();
		const dt = Math.max(1, time - this.drag.lastTime);
		const incrementalDeltaX = event.clientX - this.drag.lastX;
		const instantVelocity = -(incrementalDeltaX / pixelsPerYear) / dt;
		this.motion.velocityYearsPerMs =
			this.motion.velocityYearsPerMs * 0.7 + instantVelocity * 0.3;
		this.drag.lastX = event.clientX;
		this.drag.lastTime = time;
		this.updateCenterYear(nextYear);
		this.ensureAnimationLoop();
	}

	onPointerUp() {
		this.drag.active = false;
		this.motion.velocityYearsPerMs = clamp(
			this.motion.velocityYearsPerMs * INERTIA_RELEASE_BOOST,
			-INERTIA_MAX_VELOCITY,
			INERTIA_MAX_VELOCITY,
		);
		if (Math.abs(this.motion.velocityYearsPerMs) > INERTIA_START_THRESHOLD) {
			this.motion.inertiaActive = true;
			this.ensureAnimationLoop();
		}
		window.removeEventListener("pointermove", this.onPointerMove);
		window.removeEventListener("pointerup", this.onPointerUp);
		window.removeEventListener("pointercancel", this.onPointerUp);
	}

	updateCenterYear(nextYear) {
		const boundedYear = clamp(
			nextYear,
			this.model.domainMinYear,
			this.model.domainMaxYear,
		);
		if (this.model.centerYear === boundedYear) {
			return;
		}
		this.model.centerYear = boundedYear;
		this.dispatchEvent(
			new CustomEvent("center-year-change", {
				detail: { centerYear: boundedYear },
				bubbles: true,
				composed: true,
			}),
		);
	}

	ensureAnimationLoop() {
		if (this.motion.rafId) {
			return;
		}
		this.motion.lastFrameTime = performance.now();
		this.motion.rafId = requestAnimationFrame(this.onFrame);
	}

	onFrame(now) {
		const dt = Math.min(32, Math.max(1, now - this.motion.lastFrameTime));
		this.motion.lastFrameTime = now;

		if (!this.drag.active && this.motion.inertiaActive) {
			const nextYear = this.model.centerYear + this.motion.velocityYearsPerMs * dt;
			this.updateCenterYear(nextYear);
			this.motion.velocityYearsPerMs *= Math.exp(-dt / INERTIA_DECAY_TIME_MS);
			if (
				this.model.centerYear <= this.model.domainMinYear ||
				this.model.centerYear >= this.model.domainMaxYear
			) {
				this.motion.velocityYearsPerMs = 0;
			}
			if (Math.abs(this.motion.velocityYearsPerMs) < INERTIA_STOP_THRESHOLD) {
				this.motion.inertiaActive = false;
				this.motion.velocityYearsPerMs = 0;
			}
		}

		const blend = 1 - Math.exp(-dt / 70);
		this.motion.displayYear += (this.model.centerYear - this.motion.displayYear) * blend;
		this.applyView();

		const keepRunning =
			this.drag.active ||
			this.motion.inertiaActive ||
			Math.abs(this.model.centerYear - this.motion.displayYear) > 0.01;

		if (keepRunning) {
			this.motion.rafId = requestAnimationFrame(this.onFrame);
			return;
		}
		this.motion.displayYear = this.model.centerYear;
		this.motion.rafId = 0;
	}

	getWindowWidthPx(trackWidth, pixelsPerYear) {
		if (this.model.windowSizeYears === "all") {
			return trackWidth;
		}
		return Math.max(10, Math.min(trackWidth, this.model.windowSizeYears * pixelsPerYear));
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
		const renderCenterYear = this.motion.displayYear;
		const minYear = Math.max(
			this.model.domainMinYear,
			Math.floor(renderCenterYear - visibleHalfYears - bufferYears),
		);
		const maxYear = Math.min(
			this.model.domainMaxYear,
			Math.ceil(renderCenterYear + visibleHalfYears + bufferYears),
		);
		const firstTick = normalizeYearStep(Math.floor(minYear / baseStep) * baseStep, baseStep);
		let lastLabelX = -Infinity;
		const appendTick = (year) => {
			const x = centerX + (year - renderCenterYear) * pixelsPerYear;
			if (x < -36 || x > trackWidth + 36) {
				return;
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
				label.textContent = formatTickLabel(year, this.model.windowSizeYears);
				tick.append(label);
				lastLabelX = x;
			}
			ticksContainer.append(tick);
		};
		for (
			let year = firstTick;
			year <= maxYear + baseStep * 0.5;
			year = normalizeYearStep(year + baseStep, baseStep)
		) {
			if (year < this.model.domainMinYear) {
				continue;
			}
			appendTick(year);
		}
		appendTick(this.model.domainMinYear);
		appendTick(this.model.domainMaxYear);
	}

	applyView() {
		if (!this.shadowRoot) {
			return;
		}
		const track = this.shadowRoot.getElementById("track");
		const activeWindow = this.shadowRoot.getElementById("activeWindow");
		const centerYear = this.shadowRoot.getElementById("centerYear");
		if (!track || !activeWindow) {
			return;
		}
		const trackWidth = track.getBoundingClientRect().width || track.clientWidth || 320;
		const pixelsPerYear = this.getPixelsPerYear();
		const windowWidth = this.getWindowWidthPx(trackWidth, pixelsPerYear);
		activeWindow.style.width = `${windowWidth}px`;
		if (centerYear) {
			centerYear.textContent = formatYear(this.model.centerYear);
		}
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
					--band-top: 28px;
					--triangle-width: 15px;
					--triangle-height: 10px;
					--band-height: 54px;
					height: 96px;
					border-radius: 12px;
					overflow: hidden;
					background: linear-gradient(180deg, #0f273a 0%, #0b1f30 100%);
					border: 1px solid rgba(255, 255, 255, 0.14);
					touch-action: none;
					user-select: none;
				}
				.base-line {
					position: absolute;
					left: -8px;
					right: -8px;
					top: 57px;
					height: 2px;
					background: rgba(255, 255, 255, 0.25);
				}
				.active-window {
					position: absolute;
					left: 50%;
					top: var(--band-top);
					height: var(--band-height);
					transform: translateX(-50%);
					background: rgba(74, 134, 173, 0.72);
					border: none;
					border-radius: 8px;
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
					top: 54px;
					width: 1px;
					height: 6px;
					background: rgba(255, 255, 255, 0.26);
				}
				.tick[data-tier="major"] {
					height: 11px;
					top: 51px;
					width: 2px;
					background: rgba(255, 255, 255, 0.72);
				}
				.label {
					position: absolute;
					top: -17px;
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
					top: var(--band-top);
					height: var(--band-height);
					transform: translateX(-50%);
					width: 3px;
					background: #ffd85e;
					box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.35), 0 0 12px rgba(255, 216, 94, 0.5);
					z-index: 1;
				}
				.center-marker::before,
				.center-marker::after {
					content: "";
					position: absolute;
					left: 50%;
					width: var(--triangle-width);
					height: var(--triangle-height);
					background: rgba(255, 255, 255, 0.98);
					filter: drop-shadow(0 1px 0 rgba(0, 0, 0, 0.45));
				}
				.center-marker::before {
					top: 0;
					transform: translateX(-50%);
					clip-path: polygon(50% 100%, 0 0, 100% 0);
				}
				.center-marker::after {
					bottom: 0;
					transform: translateX(-50%);
					clip-path: polygon(50% 0, 0 100%, 100% 100%);
				}
				.center-year {
					position: absolute;
					left: 50%;
					top: -4px;
					transform: translateX(-50%);
					padding: 0.18rem 0.56rem;
					font-size: 0.84rem;
					font-weight: 700;
					border-radius: 999px;
					background: rgba(8, 19, 29, 0.95);
					border: 1px solid rgba(255, 216, 94, 0.85);
					color: #fff2bf;
					line-height: 1.1;
					letter-spacing: 0.01em;
					pointer-events: none;
					z-index: 2;
				}
			</style>
			<div id="track" class="track" aria-label="Timeline ruler" role="slider">
				<div class="base-line"></div>
				<div id="activeWindow" class="active-window"></div>
				<div id="ticks" class="ticks"></div>
				<div id="centerYear" class="center-year">1950</div>
				<div class="center-marker" aria-hidden="true"></div>
			</div>
		`;
	}
}

if (!customElements.get("oc-timeslider-v1-ruler")) {
	customElements.define("oc-timeslider-v1-ruler", TimeSliderV1RulerElement);
}

export { TimeSliderV1RulerElement };
