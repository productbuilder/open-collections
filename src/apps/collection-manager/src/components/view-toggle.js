import { viewToggleStyles } from "../css/view-toggle.css.js";

const MOBILE_BREAKPOINT = "(max-width: 760px)";

class OpenViewToggleElement extends HTMLElement {
	static get observedAttributes() {
		return ["mode"];
	}

	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.handleClick = this.handleClick.bind(this);
		this.handleViewportChange = this.handleViewportChange.bind(this);
		this.mediaQueryList =
			typeof window !== "undefined" &&
			typeof window.matchMedia === "function"
				? window.matchMedia(MOBILE_BREAKPOINT)
				: null;
	}

	connectedCallback() {
		this.render();
		this.shadowRoot.addEventListener("click", this.handleClick);
		this.mediaQueryList?.addEventListener?.(
			"change",
			this.handleViewportChange,
		);
	}

	disconnectedCallback() {
		this.shadowRoot.removeEventListener("click", this.handleClick);
		this.mediaQueryList?.removeEventListener?.(
			"change",
			this.handleViewportChange,
		);
	}

	attributeChangedCallback() {
		this.render();
	}

	handleViewportChange() {
		this.render();
	}

	handleClick(event) {
		const button =
			event.target instanceof Element
				? event.target.closest("[data-mode]")
				: null;
		if (!button) {
			return;
		}

		const mode = button.getAttribute("data-mode") || "cards";
		this.dispatchEvent(
			new CustomEvent("view-mode-change", {
				detail: { mode },
				bubbles: true,
				composed: true,
			}),
		);
	}

	renderButton({ icon, label, mode, active = false, mobileOnly = false }) {
		return `
      <button
        type="button"
        class="option ${active ? "is-active" : ""} ${mobileOnly ? "is-mobile-toggle" : ""}"
        data-mode="${mode}"
        aria-label="${label}"
        title="${label}"
        ${active ? 'aria-pressed="true"' : 'aria-pressed="false"'}
      >
        <span class="material-icons icon" aria-hidden="true">${icon}</span>
      </button>
    `;
	}

	render() {
		const mode = this.getAttribute("mode") === "rows" ? "rows" : "cards";
		const isMobile = this.mediaQueryList?.matches ?? false;

		const desktopButtons = [
			this.renderButton({
				icon: "grid_view",
				label: "Switch to rows view",
				mode: "rows",
				active: mode === "cards",
			}),
			this.renderButton({
				icon: "view_list",
				label: "Switch to cards view",
				mode: "cards",
				active: mode === "rows",
			}),
		].join("");

		const mobileButton =
			mode === "cards"
				? this.renderButton({
						icon: "view_list",
						label: "Switch to cards view",
						mode: "rows",
						mobileOnly: true,
					})
				: this.renderButton({
						icon: "grid_view",
						label: "Switch to rows view",
						mode: "cards",
						mobileOnly: true,
					});

		this.shadowRoot.innerHTML = `
      <style>${viewToggleStyles}</style>
      <div class="toggle-shell ${isMobile ? "is-mobile" : "is-desktop"}">
        <div class="toggle" role="group" aria-label="View mode">
          ${isMobile ? mobileButton : desktopButtons}
        </div>
      </div>
    `;
	}
}

if (!customElements.get("open-view-toggle")) {
	customElements.define("open-view-toggle", OpenViewToggleElement);
}

export { OpenViewToggleElement };
