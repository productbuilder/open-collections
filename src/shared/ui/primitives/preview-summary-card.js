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
	}

	update(data = {}) {
		this.model = { ...this.model, ...data };
		this.render();
		this.bindEvents();
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
						(imageUrl, index) => `
            <span class="preview-slot">
              <img class="preview-image" src="${escapeHtml(imageUrl)}" alt="${escapeHtml(this.model.title || `Preview ${index + 1}`)}" loading="lazy" />
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
          pointer-events: none;
        }

        * {
          box-sizing: border-box;
        }

        .card {
          width: 100%;
          pointer-events: auto;
          appearance: none;
          -webkit-appearance: none;
          border: 1px solid #dbe3ec;
          border-radius: 11px;
          background: #ffffff;
          padding: 0.62rem;
          display: grid;
          align-content: start;
          gap: 0.55rem;
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
          height: 90px;
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
        }

        .preview-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .preview-placeholder {
          width: 100%;
          height: 90px;
          display: grid;
          place-items: center;
          border: 1px solid #dbe3ec;
          border-radius: 8px;
          background: #f8fafc;
          color: #64748b;
          font-size: 0.8rem;
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
          margin: 0;
          font-size: 0.81rem;
          line-height: 1.38;
          color: #475569;
          min-height: 1.1rem;
          overflow-wrap: anywhere;
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
        ${this.renderPreviewStrip()}
        <span class="title">${title}</span>
        <span class="subtitle">${subtitle || "&nbsp;"}</span>
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
