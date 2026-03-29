import { renderArrowIcon } from "../../components/back-button.js";

function escapeHtml(value) {
	return String(value ?? "")
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");
}

class OpenCollectionsActionRowElement extends HTMLElement {
	static get observedAttributes() {
		return ["title", "subtitle", "arrow", "disabled", "type"];
	}

	constructor() {
		super();
		this.attachShadow({ mode: "open" });
	}

	connectedCallback() {
		this.render();
		this.attachSlotListeners();
		this.syncSecondaryVisibility();
	}

	attributeChangedCallback() {
		if (!this.isConnected) {
			return;
		}
		this.render();
		this.attachSlotListeners();
		this.syncSecondaryVisibility();
	}

	attachSlotListeners() {
		const secondarySlot = this.shadowRoot?.querySelector("slot[name='secondary']");
		if (!secondarySlot || this._secondarySlot === secondarySlot) {
			return;
		}
		secondarySlot.addEventListener("slotchange", () => this.syncSecondaryVisibility());
		this._secondarySlot = secondarySlot;
	}

	syncSecondaryVisibility() {
		const secondarySlot = this.shadowRoot?.querySelector(
			"slot[name='secondary']",
		);
		const secondaryWrap = this.shadowRoot?.getElementById("secondarySlot");
		if (!secondarySlot || !secondaryWrap) {
			return;
		}
		const hasSecondary = secondarySlot
			.assignedNodes({ flatten: true })
			.some((node) => {
				if (node.nodeType === Node.TEXT_NODE) {
					return node.textContent?.trim();
				}
				return node.nodeType === Node.ELEMENT_NODE;
			});
		secondaryWrap.hidden = !hasSecondary;
	}

	get disabled() {
		return this.hasAttribute("disabled");
	}

	get showArrow() {
		return this.getAttribute("arrow") !== "off";
	}

	render() {
		const title = escapeHtml(this.getAttribute("title") || "");
		const subtitle = escapeHtml(this.getAttribute("subtitle") || "");
		const buttonType = this.getAttribute("type") || "button";
		const disabledAttr = this.disabled ? " disabled" : "";
		const arrowMarkup = this.showArrow
			? `<span class="row-trailing" aria-hidden="true">${renderArrowIcon({ className: "icon icon-forward", direction: "right" })}</span>`
			: "";
		const subtitleMarkup = subtitle
			? `<span class="row-subtitle">${subtitle}</span>`
			: "";

		this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
        }

        .row-shell {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: var(--oc-space-2);
          align-items: center;
          width: 100%;
        }

        .row-button {
          width: 100%;
          min-height: 4.1rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--oc-space-3);
          border: 1px solid var(--oc-border-subtle);
          background: var(--oc-bg-surface);
          color: var(--oc-text-primary);
          border-radius: var(--oc-radius-md);
          padding: 0.9rem var(--oc-space-4);
          text-align: left;
          font: inherit;
          cursor: pointer;
          transition: border-color 120ms ease, background-color 120ms ease;
        }

        .row-button:hover {
          border-color: var(--oc-border-strong);
          background: var(--oc-bg-surface);
        }

        .row-button:focus-visible {
          outline: 2px solid var(--oc-focus-ring, #2563eb);
          outline-offset: 2px;
        }

        .row-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .row-leading {
          width: 2.35rem;
          height: 2.35rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 auto;
          color: var(--oc-text-muted);
        }

        .row-leading ::slotted(.icon),
        .row-leading .icon {
          width: 2.1rem;
          height: 2.1rem;
          fill: none;
          stroke: currentColor;
          stroke-width: 1.8;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .row-content {
          min-width: 0;
          display: grid;
          gap: 0.2rem;
          flex: 1;
        }

        .row-title {
          text-align: left;
          font-weight: 600;
          line-height: 1.2;
        }

        .row-subtitle {
          color: var(--oc-text-muted);
          font-size: 0.82rem;
          line-height: 1.3;
          font-weight: 500;
        }

        .row-trailing {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: var(--oc-text-muted);
        }

        .row-trailing .icon {
          width: 1.1rem;
          height: 1.1rem;
          fill: currentColor;
        }

        .secondary-slot {
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
      </style>
      <div class="row-shell">
        <button class="row-button" id="rowButton" type="${escapeHtml(buttonType)}"${disabledAttr}>
          <span class="row-leading" aria-hidden="true"><slot name="leading"></slot></span>
          <span class="row-content">
            <span class="row-title">${title}</span>
            ${subtitleMarkup}
          </span>
          ${arrowMarkup}
        </button>
        <span class="secondary-slot" id="secondarySlot" hidden><slot name="secondary"></slot></span>
      </div>
    `;
	}
}

if (!customElements.get("open-collections-action-row")) {
	customElements.define(
		"open-collections-action-row",
		OpenCollectionsActionRowElement,
	);
}

export { OpenCollectionsActionRowElement };
