const BROWSE_MODES = Object.freeze({
	LIST: "collection",
	MAP: "map",
});

const BROWSE_MODE_OPTIONS = Object.freeze([
	{
		key: BROWSE_MODES.LIST,
		label: "List",
		icon: '<path d="M6 7h12M6 12h12M6 17h12"></path>',
	},
	{
		key: BROWSE_MODES.MAP,
		label: "Map",
		icon: '<path d="M3.75 6.25 9 4.25l6 2 5.25-2v13.5L15 19.75l-6-2-5.25 2V6.25Z"></path><path d="M9 4.25v13.5M15 6.25v13.5"></path>',
	},
]);

function normalizeBrowseMode(value, fallback = BROWSE_MODES.LIST) {
	const normalized = String(value || "")
		.trim()
		.toLowerCase();
	if (normalized === BROWSE_MODES.MAP) {
		return BROWSE_MODES.MAP;
	}
	if (normalized === BROWSE_MODES.LIST || normalized === "list") {
		return BROWSE_MODES.LIST;
	}
	return fallback;
}

class OpenCollectionsBrowseShellElement extends HTMLElement {
	static get observedAttributes() {
		return [
			"browse-mode",
			"default-browse-mode",
			"data-workbench-embed",
			"data-shell-embed",
			"data-oc-app-mode",
		];
	}

	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.state = {
			browseMode: normalizeBrowseMode(
				this.getAttribute("default-browse-mode"),
				BROWSE_MODES.LIST,
			),
		};
	}

	connectedCallback() {
		this.render();
		this.bindEvents();
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (oldValue === newValue) {
			return;
		}
		if (name === "browse-mode" || name === "default-browse-mode") {
			if (!this.hasAttribute("browse-mode") && name === "default-browse-mode") {
				this.state.browseMode = normalizeBrowseMode(
					newValue,
					this.state.browseMode || BROWSE_MODES.LIST,
				);
			}
		}
		this.render();
	}

	bindEvents() {
		if (this._isBound) {
			return;
		}
		this._isBound = true;
		this.shadowRoot.addEventListener("click", (event) => {
			const element = event.target instanceof Element ? event.target : null;
			if (!element) {
				return;
			}

			const modeButton = element.closest("button[data-browse-mode]");
			if (modeButton) {
				const nextMode = normalizeBrowseMode(
					modeButton?.dataset?.browseMode,
					this.currentBrowseMode(),
				);
				if (nextMode === this.currentBrowseMode()) {
					return;
				}
				this.setAttribute("browse-mode", nextMode);
				this.dispatchEvent(
					new CustomEvent("browse-shell-mode-change", {
						detail: { mode: nextMode },
						bubbles: true,
						composed: true,
					}),
				);
				return;
			}

			if (element.closest('[data-action="search-entry"]')) {
				this.dispatchEvent(
					new CustomEvent("browse-shell-search-entry", {
						bubbles: true,
						composed: true,
					}),
				);
				return;
			}

			if (element.closest('[data-action="filter-entry"]')) {
				this.dispatchEvent(
					new CustomEvent("browse-shell-filter-entry", {
						bubbles: true,
						composed: true,
					}),
				);
			}
		});
	}

	currentBrowseMode() {
		if (this.hasAttribute("browse-mode")) {
			return normalizeBrowseMode(
				this.getAttribute("browse-mode"),
				this.state.browseMode || BROWSE_MODES.LIST,
			);
		}
		return normalizeBrowseMode(this.state.browseMode, BROWSE_MODES.LIST);
	}

	renderChildApp(mode) {
		const embeddedAttrs = this.hasAttribute("data-workbench-embed")
			? ' data-workbench-embed="true"'
			: "";
		const shellEmbedAttrs = this.hasAttribute("data-shell-embed")
			? ' data-shell-embed="true"'
			: "";
		const appModeAttr = this.getAttribute("data-oc-app-mode");
		const appMode = appModeAttr
			? ` data-oc-app-mode="${appModeAttr.replaceAll('"', "&quot;")}"`
			: "";
		if (mode === BROWSE_MODES.MAP) {
			return `<timemap-browser${embeddedAttrs}${shellEmbedAttrs}${appMode} show-top-chrome="false" show-filter-entry="false" map-edge-to-edge="true"></timemap-browser>`;
		}
		return `<collection-browser${embeddedAttrs}${shellEmbedAttrs}${appMode}></collection-browser>`;
	}

	renderModeButton(option, currentMode) {
		const isActive = option.key === currentMode;
		return `
			<button
				class="mode-button"
				type="button"
				role="tab"
				aria-selected="${isActive ? "true" : "false"}"
				data-active="${isActive ? "true" : "false"}"
				data-browse-mode="${option.key}"
			>
				<svg class="mode-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${option.icon}</svg>
				<span class="mode-label">${option.label}</span>
			</button>
		`;
	}

	render() {
		const browseMode = this.currentBrowseMode();

		this.shadowRoot.innerHTML = `
			<style>
				:host {
					display: block;
					height: 100%;
					min-height: 0;
					background: #e7e7e3;
					color: #2e2924;
				}
				.browse-shell {
					display: grid;
					grid-template-rows: auto minmax(0, 1fr);
					height: 100%;
					min-height: 0;
				}
				.control-strip {
					display: grid;
					grid-template-columns: minmax(0, 1fr) auto;
					align-items: center;
					gap: 0.45rem;
					padding: 0.45rem 0.5rem;
					background: #ecebe7;
					border-bottom: 1px solid #d8d5cf;
				}
				.entry-actions {
					display: flex;
					align-items: center;
					gap: 0.45rem;
					min-width: 0;
				}
				.search-entry,
				.filter-entry,
				.mode-button {
					border: 1px solid #cbc6be;
					background: #fffcf8;
					color: inherit;
					font: inherit;
					line-height: 1;
				}
				.search-entry,
				.filter-entry {
					display: inline-flex;
					align-items: center;
					gap: 0.42rem;
					block-size: 2rem;
					padding: 0 0.65rem;
					border-radius: 0.65rem;
					font-size: 0.82rem;
					font-weight: 540;
				}
				.search-entry {
					flex: 1 1 auto;
					justify-content: flex-start;
					min-inline-size: 0;
				}
				.search-entry-label {
					color: #6b6258;
					white-space: nowrap;
					overflow: hidden;
					text-overflow: ellipsis;
				}
				.filter-entry {
					flex: 0 0 auto;
				}
				.mode-switch {
					display: inline-flex;
					align-items: center;
					padding: 0.12rem;
					border-radius: 999px;
					background: #ffffff;
					border: 1px solid #d4d4cf;
					gap: 0.15rem;
				}
				.mode-button {
					display: inline-flex;
					align-items: center;
					gap: 0.3rem;
					block-size: 1.8rem;
					padding: 0 0.55rem;
					border-radius: 999px;
					border-color: transparent;
					background: transparent;
					font-size: 0.78rem;
					font-weight: 620;
					color: #514a43;
				}
				.mode-button[data-active="true"] {
					background: #2f2f2a;
					color: #ffffff;
				}
				.mode-icon,
				.entry-icon {
					inline-size: 0.9rem;
					block-size: 0.9rem;
					stroke: currentColor;
					stroke-width: 1.8;
					fill: none;
					stroke-linecap: round;
					stroke-linejoin: round;
					flex-shrink: 0;
				}
				.app-viewport {
					min-height: 0;
					overflow: hidden;
				}
				.app-viewport > collection-browser,
				.app-viewport > timemap-browser {
					display: block;
					height: 100%;
					min-height: 0;
				}
				button:focus-visible {
					outline: 2px solid #6b7280;
					outline-offset: 1px;
				}
				@media (max-width: 760px) {
					.control-strip {
						grid-template-columns: 1fr;
						gap: 0.38rem;
						padding: 0.42rem;
					}
					.entry-actions {
						gap: 0.35rem;
					}
					.search-entry,
					.filter-entry {
						block-size: 1.9rem;
						font-size: 0.78rem;
					}
					.mode-switch {
						justify-self: end;
					}
					.mode-button {
						block-size: 1.7rem;
						font-size: 0.75rem;
						padding: 0 0.46rem;
					}
				}
			</style>
			<section class="browse-shell" aria-label="Browse mode shell">
				<div class="control-strip" aria-label="Browse controls">
					<div class="entry-actions">
						<button class="search-entry" type="button" data-action="search-entry" aria-label="Search browse results">
							<svg class="entry-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="11" cy="11" r="6"></circle><path d="m16 16 5 5"></path></svg>
							<span class="search-entry-label">Search titles, places, and sources</span>
						</button>
						<button class="filter-entry" type="button" data-action="filter-entry" aria-label="Open browse filters">
							<svg class="entry-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 5h18M7 12h10M10 19h4"></path></svg>
							<span>Filters</span>
						</button>
					</div>
					<div class="mode-switch" role="tablist" aria-label="Browse mode">
						${BROWSE_MODE_OPTIONS.map((option) => this.renderModeButton(option, browseMode)).join("")}
					</div>
				</div>
				<div class="app-viewport">${this.renderChildApp(browseMode)}</div>
			</section>
		`;
	}
}

if (!customElements.get("open-collections-browse-shell")) {
	customElements.define(
		"open-collections-browse-shell",
		OpenCollectionsBrowseShellElement,
	);
}

export { OpenCollectionsBrowseShellElement };
