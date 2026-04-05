const BROWSE_MODES = Object.freeze({
	LIST: "collection",
	MAP: "map",
});

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
			const button =
				event.target instanceof Element
					? event.target.closest("button[data-browse-mode]")
					: null;
			const nextMode = normalizeBrowseMode(
				button?.dataset?.browseMode,
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
			return `<timemap-browser${embeddedAttrs}${shellEmbedAttrs}${appMode}></timemap-browser>`;
		}
		return `<collection-browser${embeddedAttrs}${shellEmbedAttrs}${appMode}></collection-browser>`;
	}

	render() {
		const browseMode = this.currentBrowseMode();
		const isCollectionMode = browseMode === BROWSE_MODES.LIST;
		const isMapMode = browseMode === BROWSE_MODES.MAP;

		this.shadowRoot.innerHTML = `
			<style>
				:host {
					display: block;
					height: 100%;
					min-height: 0;
					background: #e7e7e3;
				}
				.browse-shell {
					display: grid;
					grid-template-rows: auto minmax(0, 1fr);
					height: 100%;
					min-height: 0;
				}
				.mode-switch-wrap {
					display: flex;
					justify-content: center;
					padding: 0.75rem 0.75rem 0.5rem;
				}
				.mode-switch {
					display: inline-grid;
					grid-template-columns: repeat(2, minmax(0, 1fr));
					width: min(100%, 340px);
					border: 1px solid #d4d4cf;
					border-radius: 999px;
					background: #ffffff;
					overflow: hidden;
				}
				.mode-button {
					border: 0;
					padding: 0.5rem 0.75rem;
					background: transparent;
					font: inherit;
					font-size: 0.92rem;
					font-weight: 600;
					color: #4c4c46;
				}
				.mode-button[data-active="true"] {
					background: #2f2f2a;
					color: #ffffff;
				}
				.mode-button:focus-visible {
					outline: 2px solid #6b7280;
					outline-offset: -2px;
				}
				.app-viewport {
					min-height: 0;
				}
				.app-viewport > collection-browser,
				.app-viewport > timemap-browser {
					display: block;
					height: 100%;
					min-height: 0;
				}
				@media (max-width: 640px) {
					.mode-switch-wrap {
						padding: 0.5rem;
					}
					.mode-switch {
						width: 100%;
					}
				}
			</style>
			<section class="browse-shell" aria-label="Browse mode shell">
				<div class="mode-switch-wrap">
					<div class="mode-switch" role="tablist" aria-label="Browse mode">
						<button
							class="mode-button"
							type="button"
							role="tab"
							aria-selected="${isCollectionMode ? "true" : "false"}"
							data-active="${isCollectionMode ? "true" : "false"}"
							data-browse-mode="collection"
						>
							List
						</button>
						<button
							class="mode-button"
							type="button"
							role="tab"
							aria-selected="${isMapMode ? "true" : "false"}"
							data-active="${isMapMode ? "true" : "false"}"
							data-browse-mode="map"
						>
							Map
						</button>
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
