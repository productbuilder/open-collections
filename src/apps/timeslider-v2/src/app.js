import "./components/timeslider-ruler-v2.js";

function clamp(value, min, max) {
	return Math.min(max, Math.max(min, value));
}

function formatYear(value) {
	return Math.round(value).toString();
}

class OpenCollectionsTimeSliderV2AppElement extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.state = {
			domainMinYear: 1800,
			domainMaxYear: 2025,
			focusYear: 1950,
			windowSizeYears: 24,
			minWindowYears: 4,
			maxWindowYears: 225,
		};
	}

	connectedCallback() {
		this.render();
		this.bindEvents();
		this.applyView();
	}

	bindEvents() {
		const ruler = this.shadowRoot?.querySelector("oc-timeslider-v2-ruler");
		if (!ruler) {
			return;
		}
		ruler.addEventListener("focus-year-change", (event) => {
			const nextYear = Number(event.detail?.focusYear);
			if (!Number.isFinite(nextYear)) {
				return;
			}
			this.state.focusYear = clamp(
				nextYear,
				this.state.domainMinYear,
				this.state.domainMaxYear,
			);
			this.applyView();
		});
		ruler.addEventListener("window-size-change", (event) => {
			const nextSize = Number(event.detail?.windowSizeYears);
			if (!Number.isFinite(nextSize)) {
				return;
			}
			this.state.windowSizeYears = clamp(
				nextSize,
				this.state.minWindowYears,
				this.state.maxWindowYears,
			);
			this.applyView();
		});
	}

	getActiveRange() {
		const half = this.state.windowSizeYears / 2;
		return {
			startYear: clamp(
				this.state.focusYear - half,
				this.state.domainMinYear,
				this.state.domainMaxYear,
			),
			endYear: clamp(
				this.state.focusYear + half,
				this.state.domainMinYear,
				this.state.domainMaxYear,
			),
		};
	}

	applyView() {
		if (!this.shadowRoot) {
			return;
		}
		const ruler = this.shadowRoot.querySelector("oc-timeslider-v2-ruler");
		if (ruler) {
			ruler.domainMinYear = this.state.domainMinYear;
			ruler.domainMaxYear = this.state.domainMaxYear;
			ruler.focusYear = this.state.focusYear;
			ruler.windowSizeYears = this.state.windowSizeYears;
			ruler.minWindowYears = this.state.minWindowYears;
			ruler.maxWindowYears = this.state.maxWindowYears;
		}
		const focusValue = this.shadowRoot.getElementById("focusValue");
		const rangeValue = this.shadowRoot.getElementById("rangeValue");
		const windowValue = this.shadowRoot.getElementById("windowValue");
		if (!focusValue || !rangeValue || !windowValue) {
			return;
		}
		const { startYear, endYear } = this.getActiveRange();
		focusValue.textContent = formatYear(this.state.focusYear);
		rangeValue.textContent = `${formatYear(startYear)} to ${formatYear(endYear)}`;
		windowValue.textContent = `${Math.round(this.state.windowSizeYears)} years`;
	}

	render() {
		this.shadowRoot.innerHTML = `
			<style>
				:host {
					display: block;
					min-height: 100dvh;
					font-family: Inter, "Segoe UI", Roboto, sans-serif;
					background: linear-gradient(180deg, #0d1f2c 0%, #0b1117 100%);
					color: #f4f7fb;
				}
				.app {
					display: grid;
					grid-template-rows: 1fr auto;
					min-height: 100dvh;
				}
				.page {
					padding: 1rem 1rem 8rem;
				}
				.header {
					display: grid;
					gap: 0.75rem;
					padding: 0.5rem 0;
				}
				h1 {
					font-size: 1.1rem;
					line-height: 1.2;
					margin: 0;
				}
				.helper {
					margin: 0;
					opacity: 0.8;
					font-size: 0.84rem;
				}
				.readouts {
					display: grid;
					grid-template-columns: 1fr;
					gap: 0.65rem;
				}
				.readout {
					background: rgba(255, 255, 255, 0.08);
					border: 1px solid rgba(255, 255, 255, 0.16);
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
				.readout span {
					display: block;
					font-size: 1.1rem;
					margin-top: 0.24rem;
					font-weight: 700;
				}
				.footer-rail {
					position: fixed;
					left: 0;
					right: 0;
					bottom: 0;
					padding: 0.85rem 0.75rem calc(1rem + env(safe-area-inset-bottom));
					background: rgba(5, 10, 18, 0.92);
					backdrop-filter: blur(8px);
					border-top: 1px solid rgba(255, 255, 255, 0.12);
				}
				.ruler-stage {
					background: linear-gradient(
						180deg,
						rgba(9, 19, 30, 0.96) 0%,
						rgba(7, 13, 23, 0.94) 100%
					);
					border-radius: 0.85rem;
					padding: 0.5rem;
					box-shadow: 0 6px 16px rgba(0, 0, 0, 0.28);
				}
			</style>
			<div class="app">
				<div class="page">
					<header class="header">
						<h1>Timeline focus prototype (v2)</h1>
						<p class="helper">Drag ruler to shift focus year. Drag a window edge to resize the active range symmetrically.</p>
						<div class="readouts">
							<div class="readout">
								<strong>Focused year</strong>
								<span id="focusValue">1950</span>
							</div>
							<div class="readout">
								<strong>Active range</strong>
								<span id="rangeValue">1938 to 1962</span>
							</div>
							<div class="readout">
								<strong>Window size</strong>
								<span id="windowValue">24 years</span>
							</div>
						</div>
					</header>
				</div>
				<div class="footer-rail">
					<div class="ruler-stage">
						<oc-timeslider-v2-ruler></oc-timeslider-v2-ruler>
					</div>
				</div>
			</div>
		`;
	}
}

if (!customElements.get("open-collections-timeslider-v2")) {
	customElements.define(
		"open-collections-timeslider-v2",
		OpenCollectionsTimeSliderV2AppElement,
	);
}

export { OpenCollectionsTimeSliderV2AppElement };
