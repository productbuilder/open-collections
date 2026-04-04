const timemapBrowserShellStyles = `
	:host {
		display: block;
		color: #0f172a;
		font-family: Inter, "Segoe UI", Roboto, Arial, sans-serif;
	}

	.shell {
		display: grid;
		gap: 0.75rem;
		padding: 0.75rem;
		box-sizing: border-box;
		min-height: 100%;
		background: #f8fafc;
	}

	.layout {
		display: grid;
		gap: 0.75rem;
		grid-template-columns: minmax(0, 1fr);
	}

	.panel-content {
		display: grid;
		gap: 0.5rem;
	}

	.panel-note {
		margin: 0;
		font-size: 0.9rem;
		line-height: 1.4;
		color: #334155;
	}

	.map-panel {
		padding: 0;
		overflow: hidden;
	}

	.map-wrap {
		min-height: 300px;
		block-size: clamp(300px, 45vh, 560px);
	}

	.map-wrap oc-map {
		--oc-map-height: 100%;
		inline-size: 100%;
		block-size: 100%;
	}

	@media (min-width: 960px) {
		.layout {
			grid-template-columns: minmax(0, 2.2fr) minmax(280px, 1fr);
			align-items: start;
		}

		.main-column,
		.side-column {
			display: grid;
			gap: 0.75rem;
		}
	}
`;

class TimemapBrowserShellElement extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: "open" });
	}

	connectedCallback() {
		this.render();
	}

	render() {
		this.shadowRoot.innerHTML = `
			<style>${timemapBrowserShellStyles}</style>
			<main class="shell" aria-label="Timemap browser scaffold">
				<open-collections-section-header
					heading-level="1"
					title="Timemap browser"
					description="Scaffold layout with map, filters, timeline, and detail placeholders."
				></open-collections-section-header>

				<div class="layout">
					<section class="main-column" aria-label="Timemap main workspace">
						<open-collections-section-panel
							title="Filters"
							description="Reserved area for future timemap filters."
							heading-level="2"
							surface
						>
							<div class="panel-content">
								<p class="panel-note">Filter controls will be introduced in a later iteration.</p>
							</div>
						</open-collections-section-panel>

						<open-collections-section-panel
							title="Map"
							description="Shared oc-map primitive scaffolded for timemap integration."
							heading-level="2"
							surface
							class="map-panel"
						>
							<div class="map-wrap">
								<oc-map
									center-lng="5.1769"
									center-lat="52.225"
									zoom="13.6"
									style-url="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
								></oc-map>
							</div>
						</open-collections-section-panel>

						<open-collections-section-panel
							title="Timeline"
							description="Reserved area for future timeline controls and tracks."
							heading-level="2"
							surface
						>
							<div class="panel-content">
								<p class="panel-note">Timeline UI scaffold placeholder.</p>
							</div>
						</open-collections-section-panel>
					</section>

					<aside class="side-column" aria-label="Timemap details workspace">
						<open-collections-section-panel
							title="Cards & detail"
							description="Reserved area for card list, drawer, and item details."
							heading-level="2"
							surface
						>
							<div class="panel-content">
								<p class="panel-note">Detail drawer/card composition will be implemented in a future step.</p>
							</div>
						</open-collections-section-panel>
					</aside>
				</div>
			</main>
		`;
	}
}

if (!customElements.get("open-collections-timemap-browser-shell")) {
	customElements.define("open-collections-timemap-browser-shell", TimemapBrowserShellElement);
}

export { TimemapBrowserShellElement };
