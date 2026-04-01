import { renderArrowIcon } from "../../components/back-button.js";

function escapeHtml(value) {
	return String(value ?? "")
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");
}

class OpenCollectionsPreviewSummaryCardElement extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.model = {
			title: "",
			subtitle: "",
			countLabel: "",
			previewImages: [],
			placeholderLabel: "No preview",
			actionLabel: "Open",
			actionValue: "",
			active: false,
			disabled: false,
		};
	}

	connectedCallback() {
		this.render();
		this.bindEvents();
		this.bindPreviewLoadStates();
	}

	update(data = {}) {
		this.model = { ...this.model, ...data };
		this.render();
		this.bindEvents();
		this.bindPreviewLoadStates();
	}

	dispatchActivate() {
		if (this.model.disabled) {
			return;
		}
		this.dispatchEvent(
			new CustomEvent("preview-card-activate", {
				detail: { value: this.model.actionValue || "" },
				bubbles: true,
				composed: true,
			}),
		);
	}

	bindEvents() {
		const card = this.shadowRoot?.getElementById("card");
		if (!card || this._boundCard === card) {
			return;
		}
		card.addEventListener("click", () => this.dispatchActivate());
		this._boundCard = card;
	}

	bindPreviewLoadStates() {
		const images = this.shadowRoot?.querySelectorAll(".preview-image");
		if (!images?.length) {
			return;
		}
		for (const image of images) {
			if (!(image instanceof HTMLImageElement)) {
				continue;
			}
			const slot = image.closest(".preview-slot");
			if (!(slot instanceof HTMLElement) || image.dataset.ocBound === "true") {
				continue;
			}
			image.dataset.ocBound = "true";
			slot.dataset.state = "loading";
			image.addEventListener("load", async () => {
				try {
					if (typeof image.decode === "function") {
						await image.decode();
					}
				} catch {
					// decode can reject after successful load in some browsers; keep reveal behavior.
				}
				slot.dataset.state = "loaded";
			});
			image.addEventListener("error", () => {
				slot.dataset.state = "error";
				image.hidden = true;
			});
		}
	}

	renderPlaceholderSlots(count = 20) {
		return Array.from({ length: Math.max(0, count) })
			.map(
				() => `
          <span class="preview-slot preview-slot-placeholder" aria-hidden="true"></span>
        `,
			)
			.join("");
	}

	renderPreviewStrip() {
		const previews = Array.isArray(this.model.previewImages)
			? this.model.previewImages.filter(Boolean)
			: [];

		return `
      <span class="preview-strip">
        ${previews
					.map(
						(imageUrl) => `
            <span class="preview-slot" data-state="loading">
              <img class="preview-image" src="${escapeHtml(imageUrl)}" alt="" loading="lazy" decoding="async" fetchpriority="low" />
            </span>
          `,
					)
					.join("")}
        ${this.renderPlaceholderSlots()}
      </span>
    `;
	}

	render() {
		const title = escapeHtml(this.model.title || "");
		const subtitle = escapeHtml(this.model.subtitle || "");
		const countLabel = escapeHtml(this.model.countLabel || "");
		const actionLabel = escapeHtml(
			this.model.actionLabel || "Open",
		);
		const disabledAttr = this.model.disabled ? " disabled" : "";
		const activeClass = this.model.active ? "is-active" : "";

		this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }

        * {
          box-sizing: border-box;
        }

        .card {
          width: 100%;
          pointer-events: auto;
          touch-action: pan-y;
          appearance: none;
          -webkit-appearance: none;
          border: 1px solid var(--oc-browser-border, #d9d5d0);
          border-radius: 11px;
          background: var(--oc-browser-bg-card, #fffdfa);
          padding: 0.64rem;
          display: grid;
          align-content: start;
          gap: 0.5rem;
          text-align: left;
          font: inherit;
          color: inherit;
          cursor: pointer;
          transition: border-color 120ms ease, box-shadow 120ms ease, background-color 120ms ease;
        }

        .card:not(:disabled):hover {
          border-color: var(--oc-browser-border-strong, #c8c1b8);
          box-shadow: 0 1px 3px rgba(46, 41, 36, 0.08);
          background: var(--oc-browser-bg-card-soft, #f8f3ed);
        }

        .card:not(:disabled):focus-visible {
          outline: 2px solid var(--oc-browser-focus-ring, #91857a);
          outline-offset: 2px;
        }

        .card.is-active {
          border-color: var(--oc-browser-accent, #756c64);
          box-shadow: 0 0 0 1px color-mix(in srgb, var(--oc-browser-accent, #756c64) 44%, #ffffff 56%) inset, 0 3px 10px rgba(77, 64, 50, 0.16);
          background: var(--oc-browser-accent-soft, #ece7e1);
        }

        .card:disabled {
          opacity: 0.7;
          cursor: default;
        }

        .preview-strip {
          width: 100%;
          height: 44px;
          display: flex;
          align-items: stretch;
          gap: 0.35rem;
          overflow: hidden;
          justify-content: flex-start;
        }

        .preview-slot {
          flex: 0 0 auto;
          height: 44px;
          aspect-ratio: 3 / 2;
          display: block;
          overflow: hidden;
          border-radius: 7px;
          border: 1px solid var(--oc-browser-border, #d9d5d0);
          background: var(--oc-browser-surface-muted, #eee5dc);
          position: relative;
        }

        .preview-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          opacity: 0;
          transition: opacity 160ms ease;
        }

        .preview-slot::before {
          content: "";
          position: absolute;
          inset: 0;
          background:
            linear-gradient(
              110deg,
              rgba(226, 232, 240, 0.45) 8%,
              rgba(241, 245, 249, 0.9) 18%,
              rgba(226, 232, 240, 0.45) 33%
            );
          background-size: 220% 100%;
          animation: preview-shimmer 1.15s linear infinite;
        }

        .preview-slot[data-state="loaded"]::before {
          display: none;
        }

        .preview-slot[data-state="loaded"] .preview-image {
          opacity: 1;
        }

        .preview-slot[data-state="error"]::before {
          animation: none;
          background: var(--oc-browser-surface-muted, #eee5dc);
        }

        .preview-slot-placeholder {
          border-color: var(--oc-browser-placeholder-border, #d6d0c7);
          background: var(--oc-browser-placeholder-fill, #e8e4de);
        }

        .preview-slot-placeholder::before {
          animation: none;
          background: transparent;
        }

        @keyframes preview-shimmer {
          to {
            background-position-x: -220%;
          }
        }

        .header {
          display: flex;
          align-items: start;
          justify-content: space-between;
          gap: 0.55rem;
        }

        .title-group {
          min-width: 0;
        }

        .title {
          display: block;
          margin: 0;
          font-size: 0.9rem;
          font-weight: 700;
          line-height: 1.25;
          color: var(--oc-browser-text, #2e2924);
          overflow-wrap: anywhere;
        }

        .subtitle {
          display: block;
          margin: 0.14rem 0 0;
          font-size: 0.78rem;
          line-height: 1.35;
          color: var(--oc-browser-text-muted, #6c6258);
          min-height: 1.05rem;
          overflow-wrap: anywhere;
        }

        .arrow {
          width: 1.75rem;
          height: 1.75rem;
          border-radius: 999px;
          border: 1px solid var(--oc-browser-border, #d9d5d0);
          background: var(--oc-browser-bg-card, #fffdfa);
          color: var(--oc-browser-accent, #756c64);
          display: grid;
          place-items: center;
          font-size: 1rem;
          line-height: 1;
          font-weight: 600;
          flex: 0 0 auto;
        }

        .arrow .icon {
          width: 0.98rem;
          height: 0.98rem;
          fill: currentColor;
        }

        .footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
          min-height: 1.45rem;
        }

        .count {
          display: block;
          margin: 0;
          font-size: 0.78rem;
          color: var(--oc-browser-text, #2e2924);
          font-weight: 600;
        }

        .action-hint {
          display: block;
          margin: 0;
          font-size: 0.76rem;
          color: var(--oc-browser-text-muted, #6c6258);
          font-weight: 600;
          white-space: nowrap;
        }
      </style>
      <button class="card ${activeClass}" id="card" type="button" aria-label="${actionLabel} ${title}"${disabledAttr}>
        <span class="header">
          <span class="title-group">
            <span class="title">${title}</span>
            <span class="subtitle">${subtitle || "&nbsp;"}</span>
          </span>
          <span class="arrow" aria-hidden="true">${renderArrowIcon({ className: "icon icon-forward", direction: "right" })}</span>
        </span>
        ${this.renderPreviewStrip()}
        <span class="footer">
          <span class="count">${countLabel || "&nbsp;"}</span>
          <span class="action-hint">${actionLabel}</span>
        </span>
      </button>
    `;
	}
}

if (!customElements.get("open-collections-preview-summary-card")) {
	customElements.define(
		"open-collections-preview-summary-card",
		OpenCollectionsPreviewSummaryCardElement,
	);
}

export { OpenCollectionsPreviewSummaryCardElement };
