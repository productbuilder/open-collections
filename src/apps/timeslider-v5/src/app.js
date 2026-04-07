import "./components/timeslider-ruler-v5.js";

function clamp(value, min, max) {
	return Math.min(max, Math.max(min, value));
}

function formatYear(value) {
	return Math.round(value).toString();
}

class OpenCollectionsTimeSliderV5AppElement extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.state = {
			domain: {
				minYear: 1800,
				maxYear: 2025,
			},
			focusYear: 1950,
			rangeMinYear: 1938,
			rangeMaxYear: 1962,
			minRangeYears: 6,
			maxRangeYears: 260,
			pixelsPerYear: 3.2,
		};
	}

	connectedCallback() {
		this.render();
		this.bindEvents();
		this.applyView();
	}

	bindEvents() {
		const ruler = this.shadowRoot?.querySelector("oc-timeslider-v5-ruler");
		if (!ruler) return;
		ruler.addEventListener("focus-year-change", (event) => {
			const nextFocus = Number(event.detail?.focusYear);
			if (!Number.isFinite(nextFocus)) return;
			this.state.focusYear = clamp(nextFocus, this.state.domain.minYear, this.state.domain.maxYear);
			this.applyView();
		});
		ruler.addEventListener("active-range-change", (event) => {
			const nextRange = Number(event.detail?.activeRangeYears);
			if (!Number.isFinite(nextRange)) return;
			const domainSpan = this.state.domain.maxYear - this.state.domain.minYear;
			const clampedRangeYears = clamp(
				nextRange,
				this.state.minRangeYears,
				Math.min(this.state.maxRangeYears, domainSpan),
			);
			const half = clampedRangeYears / 2;
			const rangeCenter = (this.state.rangeMinYear + this.state.rangeMaxYear) / 2;
			const centeredMin = rangeCenter - half;
			const centeredMax = rangeCenter + half;
			const overflowLeft = this.state.domain.minYear - centeredMin;
			const overflowRight = centeredMax - this.state.domain.maxYear;
			if (overflowLeft > 0) {
				this.state.rangeMinYear = centeredMin + overflowLeft;
				this.state.rangeMaxYear = centeredMax + overflowLeft;
			} else if (overflowRight > 0) {
				this.state.rangeMinYear = centeredMin - overflowRight;
				this.state.rangeMaxYear = centeredMax - overflowRight;
			} else {
				this.state.rangeMinYear = centeredMin;
				this.state.rangeMaxYear = centeredMax;
			}
			this.applyView();
		});
	}

	applyView() {
		if (!this.shadowRoot) return;
		const ruler = this.shadowRoot.querySelector("oc-timeslider-v5-ruler");
		const activeRangeYears = this.state.rangeMaxYear - this.state.rangeMinYear;
		if (ruler) {
			ruler.domainMinYear = this.state.domain.minYear;
			ruler.domainMaxYear = this.state.domain.maxYear;
			ruler.focusYear = this.state.focusYear;
			ruler.activeRangeYears = activeRangeYears;
			ruler.minRangeYears = this.state.minRangeYears;
			ruler.maxRangeYears = this.state.maxRangeYears;
			ruler.pixelsPerYear = this.state.pixelsPerYear;
			ruler.activeRangeStartYear = this.state.rangeMinYear;
			ruler.activeRangeEndYear = this.state.rangeMaxYear;
		}
		const focusValue = this.shadowRoot.getElementById("focusValue");
		const rangeValue = this.shadowRoot.getElementById("rangeValue");
		const widthValue = this.shadowRoot.getElementById("widthValue");
		const domainValue = this.shadowRoot.getElementById("domainValue");
		if (!focusValue || !rangeValue || !widthValue || !domainValue) return;
		focusValue.textContent = formatYear(this.state.focusYear);
		rangeValue.textContent = `${formatYear(this.state.rangeMinYear)} to ${formatYear(this.state.rangeMaxYear)}`;
		widthValue.textContent = `${Math.round(activeRangeYears)} years`;
		domainValue.textContent = `${formatYear(this.state.domain.minYear)} to ${formatYear(this.state.domain.maxYear)}`;
	}

	render() {
		this.shadowRoot.innerHTML = `
			<style>
				:host {
					display: block;
					min-height: 100dvh;
					font-family: Inter, "Segoe UI", Roboto, sans-serif;
					background: linear-gradient(180deg, #3a3a3a 0%, #2f2f2f 100%);
					color: #f2f2f2;
				}
				.app { display: grid; grid-template-rows: 1fr auto; min-height: 100dvh; }
				.page { padding: 1rem 1rem 9rem; }
				.header { display: grid; gap: 0.75rem; padding: 0.5rem 0; }
				h1 { font-size: 1.1rem; line-height: 1.2; margin: 0; }
				.helper { margin: 0; opacity: 0.9; font-size: 0.84rem; color: #e4e4e4; }
				.readouts { display: grid; grid-template-columns: minmax(0, 1fr); gap: 0.65rem; }
				.readout {
					background: rgba(255, 255, 255, 0.08);
					border: 1px solid rgba(255, 255, 255, 0.24);
					border-radius: 0.75rem;
					padding: 0.6rem 0.75rem;
				}
				.readout strong {
					display: block;
					font-size: 0.72rem;
					letter-spacing: 0.04em;
					text-transform: uppercase;
					opacity: 0.84;
				}
				.readout span { display: block; font-size: 1.1rem; margin-top: 0.24rem; font-weight: 700; }
				.footer-rail {
					position: fixed;
					left: 0;
					right: 0;
					bottom: 0;
					padding: 0.85rem 0.75rem calc(1rem + env(safe-area-inset-bottom));
					background: rgba(36, 36, 36, 0.95);
					border-top: 1px solid rgba(255, 255, 255, 0.2);
				}
				.ruler-stage {
					background: linear-gradient(180deg, rgba(70, 70, 70, 0.96) 0%, rgba(60, 60, 60, 0.95) 100%);
					border-radius: 0.85rem;
					padding: 0.5rem;
					border: 1px solid rgba(255, 255, 255, 0.34);
					box-shadow: 0 5px 14px rgba(0, 0, 0, 0.24);
				}
			</style>
			<div class="app">
				<div class="page">
					<header class="header">
						<h1>Timeline focus prototype (v5)</h1>
						<p class="helper">Layered structure pass: static track stage + dynamic overlay while preserving v4 interactions.</p>
						<div class="readouts">
							<div class="readout"><strong>Focused year</strong><span id="focusValue">1950</span></div>
							<div class="readout"><strong>Active range</strong><span id="rangeValue">1938 to 1962</span></div>
							<div class="readout"><strong>Range width</strong><span id="widthValue">24 years</span></div>
							<div class="readout"><strong>Domain model</strong><span id="domainValue">1800 to 2025</span></div>
						</div>
					</header>
				</div>
				<div class="footer-rail">
					<div class="ruler-stage">
						<oc-timeslider-v5-ruler></oc-timeslider-v5-ruler>
					</div>
				</div>
			</div>
		`;
	}
}

if (!customElements.get("open-collections-timeslider-v5")) {
	customElements.define("open-collections-timeslider-v5", OpenCollectionsTimeSliderV5AppElement);
}

export { OpenCollectionsTimeSliderV5AppElement };
