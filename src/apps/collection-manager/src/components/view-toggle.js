import { viewToggleStyles } from "../css/view-toggle.css.js";
import {
	renderGridViewIcon,
	renderViewListIcon,
} from "../../../../shared/components/icons.js";

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

	renderButton({
		iconMarkup,
		label,
		mode,
		active = false,
		mobileOnly = false,
	}) {
		return `
      <button
        type="button"
        class="option ${active ? "is-active" : ""} ${mobileOnly ? "is-mobile-toggle" : ""}"
        data-mode="${mode}"
        aria-label="${label}"
        title="${label}"
        ${active ? 'aria-pressed="true"' : 'aria-pressed="false"'}
      >
        ${iconMarkup}
      </button>
    `;
	}

	render() {
		const mode = this.getAttribute("mode") === "rows" ? "rows" : "cards";
		const isMobile = this.mediaQueryList?.matches ?? false;

		const desktopButtons = [
			this.renderButton({
				iconMarkup: renderViewListIcon(),
				label: "Switch to rows view",
				mode: "rows",
				active: mode === "rows",
			}),
			this.renderButton({
				iconMarkup: renderGridViewIcon(),
				label: "Switch to cards view",
				mode: "cards",
				active: mode === "cards",
			}),
		].join("");

		const mobileButton =
			mode === "cards"
				? this.renderButton({
						iconMarkup: renderViewListIcon(),
						label: "Switch to rows view",
						mode: "rows",
						mobileOnly: true,
					})
				: this.renderButton({
						iconMarkup: renderGridViewIcon(),
						label: "Switch to cards view",
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
