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

	renderPreviewStrip() {
		const previews = Array.isArray(this.model.previewImages)
			? this.model.previewImages.filter(Boolean).slice(0, 3)
			: [];
		if (previews.length === 0) {
			return `<span class="preview-placeholder">${escapeHtml(this.model.placeholderLabel)}</span>`;
		}

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
          border: 1px solid #dbe3ec;
          border-radius: 11px;
          background: #ffffff;
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
          border-color: #93c5fd;
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
          background: #f8fbff;
        }

        .card:not(:disabled):focus-visible {
          outline: 2px solid #60a5fa;
          outline-offset: 2px;
        }

        .card.is-active {
          border-color: #0f6cc6;
          box-shadow: 0 0 0 1px #66a6e8 inset, 0 3px 10px rgba(15, 108, 198, 0.16);
          background: #f5faff;
        }

        .card:disabled {
          opacity: 0.7;
          cursor: default;
        }

        .preview-strip {
          width: 100%;
          height: 84px;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 0.35rem;
        }

        .preview-slot {
          display: block;
          overflow: hidden;
          border-radius: 7px;
          border: 1px solid #dbe3ec;
          background: #eef2f7;
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
          background: #eef2f7;
        }

        @keyframes preview-shimmer {
          to {
            background-position-x: -220%;
          }
        }

        .preview-placeholder {
          width: 100%;
          height: 84px;
          display: grid;
          place-items: center;
          border: 1px solid #dbe3ec;
          border-radius: 8px;
          background: #f8fafc;
          color: #64748b;
          font-size: 0.8rem;
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
          color: #0f172a;
          overflow-wrap: anywhere;
        }

        .subtitle {
          display: block;
          margin: 0.14rem 0 0;
          font-size: 0.78rem;
          line-height: 1.35;
          color: #475569;
          min-height: 1.05rem;
          overflow-wrap: anywhere;
        }

        .arrow {
          width: 1.75rem;
          height: 1.75rem;
          border-radius: 999px;
          border: 1px solid #cbd5e1;
          background: #ffffff;
          color: #0f6cc6;
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
          color: #334155;
          font-weight: 600;
        }

        .action-hint {
          display: block;
          margin: 0;
          font-size: 0.76rem;
          color: #64748b;
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
