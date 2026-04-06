import "./components/timeslider-ruler.js";

const PRESETS = [1, 10, 20, 50, 100, "all"];

function formatYear(value) {
	return Math.round(value).toString();
}

function clamp(value, min, max) {
	return Math.min(max, Math.max(min, value));
}

class OpenCollectionsTimeSliderV1AppElement extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.state = {
			domainMinYear: 1800,
			domainMaxYear: 2025,
			centerYear: 1950,
			windowSizeYears: 20,
		};
	}

	connectedCallback() {
		this.render();
		this.bindEvents();
		this.applyView();
	}

	bindEvents() {
		this.shadowRoot?.addEventListener("click", (event) => {
			const button = event.target.closest("button[data-preset]");
			if (!button) {
				return;
			}
			const preset = button.dataset.preset || "20";
			this.state.windowSizeYears = preset === "all" ? "all" : Number(preset);
			this.applyView();
		});

		this.shadowRoot
			?.querySelector("oc-timeslider-v1-ruler")
			?.addEventListener("center-year-change", (event) => {
				const next = Number(event.detail?.centerYear);
				if (!Number.isFinite(next)) {
					return;
				}
				this.state.centerYear = clamp(
					next,
					this.state.domainMinYear,
					this.state.domainMaxYear,
				);
				this.applyView();
			});
	}

	getDerivedWindow() {
		const { domainMinYear, domainMaxYear, centerYear, windowSizeYears } = this.state;
		if (windowSizeYears === "all") {
			return { startYear: domainMinYear, endYear: domainMaxYear };
		}
		const half = windowSizeYears / 2;
		return {
			startYear: clamp(centerYear - half, domainMinYear, domainMaxYear),
			endYear: clamp(centerYear + half, domainMinYear, domainMaxYear),
		};
	}

	applyView() {
		if (!this.shadowRoot) {
			return;
		}
		const ruler = this.shadowRoot.querySelector("oc-timeslider-v1-ruler");
		if (ruler) {
			ruler.domainMinYear = this.state.domainMinYear;
			ruler.domainMaxYear = this.state.domainMaxYear;
			ruler.centerYear = this.state.centerYear;
			ruler.windowSizeYears = this.state.windowSizeYears;
		}

		const spanValue = this.shadowRoot.getElementById("spanValue");
		const rangeValue = this.shadowRoot.getElementById("rangeValue");
		if (!spanValue || !rangeValue) {
			return;
		}

		const { startYear, endYear } = this.getDerivedWindow();
		spanValue.textContent =
			this.state.windowSizeYears === "all"
				? "All"
				: `${this.state.windowSizeYears} years`;
		rangeValue.textContent = `${formatYear(startYear)} to ${formatYear(endYear)}`;

		for (const button of this.shadowRoot.querySelectorAll("button[data-preset]")) {
			button.dataset.active =
				String(this.state.windowSizeYears) === String(button.dataset.preset)
					? "true"
					: "false";
		}
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
					padding: 1rem 1rem 7.25rem;
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
				.readouts {
					display: grid;
					grid-template-columns: minmax(0, 1fr);
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
				.readout.full {
					grid-column: 1 / -1;
				}
				.footer-rail {
					position: fixed;
					left: 0;
					right: 0;
					bottom: 0;
					padding: 0.9rem 0.75rem calc(0.9rem + env(safe-area-inset-bottom));
					background: rgba(5, 10, 18, 0.9);
					backdrop-filter: blur(8px);
					border-top: 1px solid rgba(255, 255, 255, 0.12);
					display: grid;
					gap: 0.8rem;
				}
				.preset-row {
					display: flex;
					gap: 0.4rem;
					overflow-x: auto;
					padding-bottom: 0.1rem;
				}
				.preset-row button {
					border: 1px solid rgba(255, 255, 255, 0.18);
					background: rgba(255, 255, 255, 0.06);
					color: #f4f7fb;
					padding: 0.4rem 0.65rem;
					border-radius: 999px;
					font-weight: 600;
					font-size: 0.82rem;
					white-space: nowrap;
				}
				.preset-row button[data-active="true"] {
					background: #52c7ff;
					color: #072033;
					border-color: #52c7ff;
				}
			</style>
			<div class="app">
				<div class="page">
					<header class="header">
						<h1>Timeline focus prototype (v1)</h1>
						<div class="readouts">
							<div class="readout">
								<strong>Window size</strong>
								<span id="spanValue">20 years</span>
							</div>
							<div class="readout full">
								<strong>Active range</strong>
								<span id="rangeValue">1940 to 1960</span>
							</div>
						</div>
					</header>
				</div>
				<div class="footer-rail">
					<div class="preset-row" role="group" aria-label="Window size presets">
						<button type="button" data-preset="1">1Y</button>
						<button type="button" data-preset="10">10Y</button>
						<button type="button" data-preset="20">20Y</button>
						<button type="button" data-preset="50">50Y</button>
						<button type="button" data-preset="100">100Y</button>
						<button type="button" data-preset="all">All</button>
					</div>
					<oc-timeslider-v1-ruler></oc-timeslider-v1-ruler>
				</div>
			</div>
		`;
	}
}

if (!customElements.get("open-collections-timeslider-v1")) {
	customElements.define(
		"open-collections-timeslider-v1",
		OpenCollectionsTimeSliderV1AppElement,
	);
}

export { OpenCollectionsTimeSliderV1AppElement, PRESETS };
