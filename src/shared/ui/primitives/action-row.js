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
		this.bindEvents();
	}

	attributeChangedCallback() {
		if (!this.isConnected) {
			return;
		}
		this.render();
		this.attachSlotListeners();
		this.syncSecondaryVisibility();
		this.bindEvents();
	}

	attachSlotListeners() {
		const leadingSlot = this.shadowRoot?.querySelector("slot[name='leading']");
		if (leadingSlot && this._leadingSlot !== leadingSlot) {
			leadingSlot.addEventListener("slotchange", () =>
				this.syncLeadingIconStyling(),
			);
			this._leadingSlot = leadingSlot;
		}

		const secondarySlot = this.shadowRoot?.querySelector("slot[name='secondary']");
		if (secondarySlot && this._secondarySlot !== secondarySlot) {
			secondarySlot.addEventListener("slotchange", () => this.syncSecondaryVisibility());
			this._secondarySlot = secondarySlot;
		}
	}

	bindEvents() {
		const secondarySlot = this.shadowRoot?.querySelector("slot[name='secondary']");
		if (secondarySlot && this._boundSecondarySlot !== secondarySlot) {
			secondarySlot.addEventListener("click", (event) => {
				event.stopPropagation();
			});
			this._boundSecondarySlot = secondarySlot;
		}
	}

	syncLeadingIconStyling() {
		const leadingSlot = this.shadowRoot?.querySelector("slot[name='leading']");
		if (!leadingSlot) {
			return;
		}
		const assigned = leadingSlot.assignedElements({ flatten: true });
		for (const node of assigned) {
			const icon =
				node.matches?.("svg.icon") ? node : node.querySelector?.("svg.icon");
			if (!icon) {
				continue;
			}
			icon.style.width = "2.1rem";
			icon.style.height = "2.1rem";
			icon.style.fill = "none";
			icon.style.stroke = "currentColor";
			icon.style.strokeWidth = "1.8";
			icon.style.strokeLinecap = "round";
			icon.style.strokeLinejoin = "round";
		}
	}

	syncSecondaryVisibility() {
		this.syncLeadingIconStyling();
		const secondarySlot = this.shadowRoot?.querySelector(
			"slot[name='secondary']",
		);
		const subtitleSlot = this.shadowRoot?.getElementById("subtitleSecondarySlot");
		if (!secondarySlot || !subtitleSlot) {
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
		subtitleSlot.hidden = !hasSecondary;
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
          display: flex;
          align-items: stretch;
          width: 100%;
          border: 1px solid var(--oc-border-subtle);
          border-radius: var(--oc-radius-md);
          background: var(--oc-bg-surface);
          transition: border-color 120ms ease, background-color 120ms ease;
        }

        .row-shell:focus-within {
          border-color: var(--oc-border-strong);
        }

        .row-button {
          width: 100%;
          min-height: 4.1rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--oc-space-3);
          border: 0;
          background: transparent;
          color: var(--oc-text-primary);
          border-radius: var(--oc-radius-md);
          padding: 0.9rem var(--oc-space-4);
          text-align: left;
          font: inherit;
          cursor: pointer;
          transition: background-color 120ms ease;
        }

        .row-button:hover {
          background: color-mix(in srgb, var(--oc-bg-surface) 90%, #e2e8f0 10%);
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

        .row-subline {
          min-height: 1rem;
          display: inline-flex;
          align-items: center;
          gap: var(--oc-space-2);
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

        .secondary-slot[hidden] {
          display: none;
        }
      </style>
      <div class="row-shell">
        <button class="row-button" id="rowButton" type="${escapeHtml(buttonType)}"${disabledAttr}>
          <span class="row-leading" aria-hidden="true"><slot name="leading"></slot></span>
          <span class="row-content">
            <span class="row-title">${title}</span>
            <span class="row-subline">
              ${subtitleMarkup}
              <span class="secondary-slot" id="subtitleSecondarySlot" hidden><slot name="secondary"></slot></span>
            </span>
          </span>
          ${arrowMarkup}
        </button>
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
