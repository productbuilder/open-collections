const DEFAULT_DOMAIN_MIN = 1800;
const DEFAULT_DOMAIN_MAX = 2025;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function formatYear(year) {
	return Math.round(year).toString();
}

function computeTickStep(windowSizeYears) {
	if (windowSizeYears === "all") {
		return 20;
	}
	if (windowSizeYears <= 1) {
		return 1;
	}
	if (windowSizeYears <= 10) {
		return 2;
	}
	if (windowSizeYears <= 20) {
		return 5;
	}
	if (windowSizeYears <= 50) {
		return 10;
	}
	return 20;
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

	set centerYear(value) {
		const next = Number(value);
		if (!Number.isFinite(next)) {
			return;
		}
		this.model.centerYear = clamp(next, this.model.domainMinYear, this.model.domainMaxYear);
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
			window.addEventListener("pointermove", this.onPointerMove);
			window.addEventListener("pointerup", this.onPointerUp);
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
		this.model.centerYear = nextYear;
		this.applyView();
		this.dispatchEvent(
			new CustomEvent("center-year-change", {
				detail: { centerYear: nextYear },
				bubbles: true,
				composed: true,
			}),
		);
	}

	onPointerUp() {
		this.drag.active = false;
		window.removeEventListener("pointermove", this.onPointerMove);
		window.removeEventListener("pointerup", this.onPointerUp);
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
		const step = computeTickStep(this.model.windowSizeYears);
		const visibleHalfYears = trackWidth / (2 * pixelsPerYear);
		const bufferYears = visibleHalfYears * 0.5;
		const minYear = Math.max(
			this.model.domainMinYear,
			Math.floor(this.model.centerYear - visibleHalfYears - bufferYears),
		);
		const maxYear = Math.min(
			this.model.domainMaxYear,
			Math.ceil(this.model.centerYear + visibleHalfYears + bufferYears),
		);
		const firstTick = Math.floor(minYear / step) * step;

		for (let year = firstTick; year <= maxYear; year += step) {
			if (year < this.model.domainMinYear) {
				continue;
			}
			const x = centerX + (year - this.model.centerYear) * pixelsPerYear;
			if (x < -20 || x > trackWidth + 20) {
				continue;
			}
			const tick = document.createElement("div");
			tick.className = "tick";
			tick.style.left = `${x}px`;
			const majorEvery = step >= 10 ? step : step * 5;
			const major = year % majorEvery === 0;
			if (major) {
				tick.dataset.major = "true";
				const label = document.createElement("div");
				label.className = "label";
				label.textContent = formatYear(year);
				tick.append(label);
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
		if (!track || !activeWindow) {
			return;
		}
		const trackWidth = track.getBoundingClientRect().width || track.clientWidth || 320;
		const pixelsPerYear = this.getPixelsPerYear();
		const windowWidth = this.getWindowWidthPx(trackWidth, pixelsPerYear);
		activeWindow.style.width = `${windowWidth}px`;
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
					height: 84px;
					border-radius: 12px;
					overflow: hidden;
					background: linear-gradient(180deg, #112739 0%, #0b1a29 100%);
					border: 1px solid rgba(255, 255, 255, 0.16);
					touch-action: none;
					user-select: none;
				}
				.base-line {
					position: absolute;
					left: 0;
					right: 0;
					top: 39px;
					height: 2px;
					background: rgba(255, 255, 255, 0.25);
				}
				.active-window {
					position: absolute;
					left: 50%;
					top: 8px;
					height: 50px;
					transform: translateX(-50%);
					background: rgba(82, 199, 255, 0.2);
					border: 1px solid rgba(82, 199, 255, 0.7);
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
					top: 30px;
					width: 1px;
					height: 18px;
					background: rgba(255, 255, 255, 0.4);
				}
				.tick[data-major="true"] {
					height: 28px;
					top: 24px;
					width: 2px;
					background: rgba(255, 255, 255, 0.76);
				}
				.label {
					position: absolute;
					top: -20px;
					left: 50%;
					transform: translateX(-50%);
					font-size: 0.65rem;
					font-weight: 600;
					color: rgba(255, 255, 255, 0.9);
					white-space: nowrap;
				}
				.center-marker {
					position: absolute;
					left: 50%;
					top: 0;
					bottom: 0;
					transform: translateX(-50%);
					width: 3px;
					background: #ffd85e;
					box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.35), 0 0 12px rgba(255, 216, 94, 0.5);
				}
			</style>
			<div id="track" class="track" aria-label="Timeline ruler" role="slider">
				<div class="base-line"></div>
				<div id="activeWindow" class="active-window"></div>
				<div id="ticks" class="ticks"></div>
				<div class="center-marker" aria-hidden="true"></div>
			</div>
		`;
	}
}

if (!customElements.get("oc-timeslider-v1-ruler")) {
	customElements.define("oc-timeslider-v1-ruler", TimeSliderV1RulerElement);
}

export { TimeSliderV1RulerElement };
