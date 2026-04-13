function normalizeMode(value, fallback = "list") {
	const normalized = String(value || "")
		.trim()
		.toLowerCase();
	if (normalized === "map") {
		return "map";
	}
	if (normalized === "list" || normalized === "collection") {
		return "list";
	}
	return fallback;
}

function toNumber(value, fallback = 0) {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : fallback;
}

function toText(value) {
	return String(value ?? "");
}

class OpenCollectionsBrowseHeaderElement extends HTMLElement {
	/**
	 * Public API
	 * - Attributes/properties: search-value, search-placeholder, filter-count, view-mode,
	 *   optional search-expanded and disabled.
	 * - Events:
	 *   - search-change { value }
	 *   - search-focus
	 *   - search-clear
	 *   - filters-click
	 *   - view-mode-change { mode: "list" | "map" }
	 */
	static get observedAttributes() {
		return [
			"search-value",
			"search-placeholder",
			"filter-count",
			"view-mode",
			"search-expanded",
			"disabled",
		];
	}

	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this._searchValue = "";
		this._searchPlaceholder = "Search";
		this._filterCount = 0;
		this._viewMode = "list";
		this._searchExpanded = false;
	}

	connectedCallback() {
		this.render();
		this.syncState();
		this.bindEvents();
	}

	attributeChangedCallback(name, _oldValue, newValue) {
		switch (name) {
			case "search-value":
				this._searchValue = toText(newValue);
				break;
			case "search-placeholder":
				this._searchPlaceholder = toText(newValue || "Search") || "Search";
				break;
			case "filter-count":
				this._filterCount = Math.max(0, toNumber(newValue, 0));
				break;
			case "view-mode":
				this._viewMode = normalizeMode(newValue, this._viewMode);
				break;
			case "search-expanded":
				this._searchExpanded = this.hasAttribute("search-expanded");
				break;
			default:
				break;
		}
		if (this.isConnected) {
			this.syncState();
		}
	}

	get searchValue() {
		return this._searchValue;
	}

	set searchValue(value) {
		this.setAttribute("search-value", toText(value));
	}

	get searchPlaceholder() {
		return this._searchPlaceholder;
	}

	set searchPlaceholder(value) {
		const next = toText(value).trim() || "Search";
		this.setAttribute("search-placeholder", next);
	}

	get filterCount() {
		return this._filterCount;
	}

	set filterCount(value) {
		this.setAttribute("filter-count", String(Math.max(0, toNumber(value, 0))));
	}

	get viewMode() {
		return this._viewMode;
	}

	set viewMode(value) {
		this.setAttribute("view-mode", normalizeMode(value, this._viewMode));
	}

	get searchExpanded() {
		return this._searchExpanded;
	}

	set searchExpanded(value) {
		if (value) {
			this.setAttribute("search-expanded", "");
			return;
		}
		this.removeAttribute("search-expanded");
	}

	get disabled() {
		return this.hasAttribute("disabled");
	}

	set disabled(value) {
		if (value) {
			this.setAttribute("disabled", "");
			return;
		}
		this.removeAttribute("disabled");
	}

	bindEvents() {
		if (this._isBound) {
			return;
		}
		this._isBound = true;
		this.shadowRoot.addEventListener("click", (event) => {
			const target = event.target instanceof Element ? event.target : null;
			if (!target || this.disabled) {
				return;
			}
			if (target.closest('[data-action="search-clear"]')) {
				event.preventDefault();
				this.searchValue = "";
				this.dispatch("search-clear", { value: "" });
				this.dispatch("search-change", { value: "" });
				this.focusInput();
				return;
			}
			if (target.closest('[data-action="filters"]')) {
				this.dispatch("filters-click");
				return;
			}
			const modeButton = target.closest("button[data-mode]");
			if (modeButton) {
				const nextMode = normalizeMode(modeButton.getAttribute("data-mode"), this._viewMode);
				if (nextMode === this._viewMode) {
					return;
				}
				this.viewMode = nextMode;
				this.dispatch("view-mode-change", { mode: nextMode });
			}
		});
		this.shadowRoot.addEventListener("input", (event) => {
			const target = event.target;
			if (!(target instanceof HTMLInputElement) || this.disabled) {
				return;
			}
			this.searchValue = target.value;
			this.dispatch("search-change", { value: target.value });
		});
		this.shadowRoot.addEventListener("focusin", (event) => {
			const target = event.target;
			if (!(target instanceof HTMLInputElement) || this.disabled) {
				return;
			}
			this.searchExpanded = true;
			this.dispatch("search-focus");
		});
		this.shadowRoot.addEventListener("focusout", (event) => {
			const target = event.target;
			if (!(target instanceof HTMLInputElement)) {
				return;
			}
			const relatedTarget = event.relatedTarget;
			if (relatedTarget instanceof Node && this.shadowRoot.contains(relatedTarget)) {
				return;
			}
			if (!this._searchValue.trim()) {
				this.searchExpanded = false;
			}
		});
		this.shadowRoot.addEventListener("keydown", (event) => {
			const target = event.target;
			if (!(target instanceof HTMLInputElement)) {
				return;
			}
			if (event.key === "Escape") {
				if (this._searchValue.trim()) {
					this.searchValue = "";
					this.dispatch("search-clear", { value: "" });
					this.dispatch("search-change", { value: "" });
					return;
				}
				this.searchExpanded = false;
				target.blur();
			}
		});
	}

	focusInput() {
		const input = this.shadowRoot.querySelector("input");
		if (input instanceof HTMLInputElement) {
			input.focus({ preventScroll: true });
		}
	}

	dispatch(type, detail = {}) {
		this.dispatchEvent(
			new CustomEvent(type, {
				detail,
				bubbles: true,
				composed: true,
			}),
		);
	}

	syncState() {
		const root = this.shadowRoot.querySelector(".header-row");
		const input = this.shadowRoot.querySelector(".search-input");
		const clearButton = this.shadowRoot.querySelector('[data-action="search-clear"]');
		const filtersBadge = this.shadowRoot.querySelector(".filters-badge");
		const modeButtons = this.shadowRoot.querySelectorAll(".mode-button");
		if (!root || !input || !clearButton || !filtersBadge) {
			return;
		}
		const hasQuery = Boolean(this._searchValue.trim());
		root.toggleAttribute("data-expanded", this._searchExpanded);
		root.toggleAttribute("data-has-query", hasQuery);
		root.toggleAttribute("data-disabled", this.disabled);
		if (input.value !== this._searchValue) {
			input.value = this._searchValue;
		}
		input.placeholder = this._searchPlaceholder;
		input.disabled = this.disabled;
		clearButton.hidden = !hasQuery;
		filtersBadge.hidden = this._filterCount < 1;
		filtersBadge.textContent = this._filterCount > 0 ? String(this._filterCount) : "";
		for (const button of modeButtons) {
			const mode = normalizeMode(button.getAttribute("data-mode"), "list");
			const active = mode === this._viewMode;
			button.setAttribute("aria-pressed", String(active));
			button.toggleAttribute("data-active", active);
			button.disabled = this.disabled;
		}
	}

	render() {
		this.shadowRoot.innerHTML = `
			<style>
				:host {
					display: block;
				}
				.header-row {
					display: grid;
					grid-template-columns: minmax(0, 1fr) auto;
					align-items: center;
					gap: 0.45rem;
					min-width: 0;
				}
				.search-wrap {
					display: flex;
					align-items: center;
					gap: 0.42rem;
					min-width: 0;
					block-size: 2rem;
					padding: 0 0.65rem;
					border-radius: 999px;
					border: 1px solid #cbc6be;
					background: #fff;
					transition: box-shadow 140ms ease, border-color 140ms ease;
				}
				.search-wrap:focus-within {
					border-color: #8d857b;
					box-shadow: 0 0 0 2px rgba(141, 133, 123, 0.18);
				}
				.search-icon,
				.icon {
					inline-size: 0.9rem;
					block-size: 0.9rem;
					stroke: currentColor;
					stroke-width: 1.8;
					fill: none;
					stroke-linecap: round;
					stroke-linejoin: round;
					flex-shrink: 0;
				}
				.search-input {
					border: 0;
					background: transparent;
					outline: none;
					font: inherit;
					font-size: 0.83rem;
					font-weight: 540;
					color: #2e2924;
					min-width: 0;
					width: 100%;
				}
				.search-input::placeholder {
					color: #6b6258;
				}
				.pill-btn,
				.mode-switch {
					border: 1px solid #cbc6be;
					background: #fff;
					color: #2e2924;
					font: inherit;
				}
				.pill-btn {
					display: inline-flex;
					align-items: center;
					gap: 0.42rem;
					block-size: 2rem;
					padding: 0 0.7rem;
					border-radius: 999px;
					font-size: 0.81rem;
					font-weight: 600;
				}
				.pill-btn:active,
				.mode-button:active {
					transform: translateY(0.5px) scale(0.99);
					filter: saturate(0.95);
				}
				.filters-badge {
					display: inline-flex;
					align-items: center;
					justify-content: center;
					min-width: 1rem;
					height: 1rem;
					padding: 0 0.24rem;
					border-radius: 999px;
					font-size: 0.67rem;
					font-weight: 700;
					background: #2e2924;
					color: #fff;
				}
				.row-actions {
					display: inline-flex;
					align-items: center;
					justify-self: end;
					gap: 0.4rem;
				}
				.mode-switch {
					display: inline-flex;
					align-items: center;
					padding: 0.12rem;
					border-radius: 999px;
					gap: 0.12rem;
				}
				.mode-button {
					display: inline-flex;
					align-items: center;
					gap: 0.3rem;
					border: 0;
					background: transparent;
					border-radius: 999px;
					padding: 0 0.55rem;
					block-size: 1.75rem;
					font: inherit;
					font-size: 0.78rem;
					font-weight: 620;
					color: #514a43;
				}
				.mode-button[data-active] {
					background: #2f2f2a;
					color: #fff;
				}
				.clear-btn {
					display: inline-grid;
					place-items: center;
					inline-size: 1.4rem;
					block-size: 1.4rem;
					border-radius: 999px;
					border: 0;
					background: #e5e2dc;
					padding: 0;
				}
				.clear-btn .icon {
					inline-size: 0.78rem;
					block-size: 0.78rem;
				}
				.header-row[data-disabled] {
					opacity: 0.62;
					pointer-events: none;
				}
				@media (max-width: 760px) {
					.header-row {
						grid-template-columns: minmax(0, 1fr);
					}
					.row-actions {
						overflow: hidden;
						transition: max-height 180ms ease, opacity 160ms ease;
						max-height: 2.2rem;
						opacity: 1;
					}
					.header-row[data-expanded] .row-actions {
						max-height: 0;
						opacity: 0;
						pointer-events: none;
					}
					.search-wrap,
					.pill-btn {
						block-size: 2.05rem;
					}
				}
			</style>
			<div class="header-row" part="container">
				<label class="search-wrap" aria-label="Search">
					<svg class="search-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6"></circle><path d="m16 16 5 5"></path></svg>
					<input class="search-input" type="search" part="search-input" />
					<button type="button" class="clear-btn" data-action="search-clear" aria-label="Clear search">
						<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"></path></svg>
					</button>
				</label>
				<div class="row-actions">
					<button type="button" class="pill-btn" data-action="filters" aria-label="Open filters">
						<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5h18M7 12h10M10 19h4"></path></svg>
						<span>Filters</span>
						<span class="filters-badge" hidden></span>
					</button>
					<div class="mode-switch" role="group" aria-label="Browse view mode">
						<button type="button" class="mode-button" data-mode="list">List</button>
						<button type="button" class="mode-button" data-mode="map">Map</button>
					</div>
				</div>
			</div>
		`;
	}
}

if (!customElements.get("open-collections-browse-header")) {
	customElements.define(
		"open-collections-browse-header",
		OpenCollectionsBrowseHeaderElement,
	);
}

export { OpenCollectionsBrowseHeaderElement };
