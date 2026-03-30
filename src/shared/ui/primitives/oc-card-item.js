function escapeHtml(value) {
	return String(value ?? "")
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");
}

class OcCardItemElement extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.model = {
			title: "",
			subtitle: "",
			countLabel: "",
			previewImages: [],
			previewUrl: "",
			actionLabel: "Open item",
			actionValue: "",
			active: false,
			disabled: false,
		};
	}

	connectedCallback() {
		this.render();
		this.bindEvents();
		this.applyModel();
	}

	update(data = {}) {
		this.model = { ...this.model, ...data };
		this.applyModel();
	}

	bindEvents() {
		const card = this.shadowRoot?.getElementById("card");
		if (!card || this._boundCard === card) {
			return;
		}
		card.addEventListener("click", () => {
			if (this.model.disabled) {
				return;
			}
			this.dispatchEvent(
				new CustomEvent("oc-card-activate", {
					detail: { value: this.model.actionValue || "" },
					bubbles: true,
					composed: true,
				}),
			);
		});
		this._boundCard = card;
	}

	resolvePreviewImages() {
		const explicit = Array.isArray(this.model.previewImages)
			? this.model.previewImages.filter(Boolean)
			: [];
		if (explicit.length) {
			return explicit.slice(0, 3);
		}
		const previewUrl = String(this.model.previewUrl || "").trim();
		return previewUrl ? [previewUrl] : [];
	}

	applyModel() {
		const card = this.shadowRoot?.getElementById("card");
		const title = this.shadowRoot?.getElementById("title");
		const subtitle = this.shadowRoot?.getElementById("subtitle");
		const count = this.shadowRoot?.getElementById("count");
		const image = this.shadowRoot?.getElementById("previewImage");
		const placeholder = this.shadowRoot?.getElementById("previewPlaceholder");
		const action = this.shadowRoot?.getElementById("actionHint");
		if (!card || !title || !subtitle || !count || !image || !placeholder || !action) {
			return;
		}

		const previews = this.resolvePreviewImages();
		const previewUrl = previews[0] || "";

		title.textContent = this.model.title || "Item";
		subtitle.textContent = this.model.subtitle || "License not set";
		count.textContent = this.model.countLabel || "";
		action.textContent = this.model.actionLabel || "Open item";
		card.classList.toggle("is-active", this.model.active === true);
		card.toggleAttribute("disabled", this.model.disabled === true);
		card.setAttribute(
			"aria-label",
			`${this.model.actionLabel || "Open item"} ${this.model.title || "Item"}`,
		);

		if (previewUrl) {
			image.src = previewUrl;
			image.alt = `${this.model.title || "Item"} preview`;
			image.hidden = false;
			placeholder.hidden = true;
		} else {
			image.removeAttribute("src");
			image.alt = "";
			image.hidden = true;
			placeholder.hidden = false;
			placeholder.textContent = "Item";
		}
	}

	render() {
		this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          min-height: 0;
          pointer-events: none;
        }

        * {
          box-sizing: border-box;
        }

        .card {
          display: block;
          pointer-events: auto;
          width: 100%;
          border: 1px solid #dbe3ec;
          border-radius: 11px;
          background: #ffffff;
          padding: 0.6rem;
          text-align: left;
          font: inherit;
          color: inherit;
          cursor: pointer;
          transition: border-color 120ms ease, box-shadow 120ms ease, background-color 120ms ease;
        }

        .card:hover {
          border-color: #93c5fd;
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
          background: #f8fbff;
        }

        .card:focus-visible {
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

        .content {
          display: grid;
          grid-template-columns: 64px minmax(0, 1fr);
          gap: 0.55rem;
          align-items: start;
        }

        .preview {
          width: 64px;
          height: 64px;
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid #dbe3ec;
          background: #f8fafc;
          display: grid;
          place-items: center;
        }

        .preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .preview-placeholder {
          color: #64748b;
          font-size: 0.72rem;
          font-weight: 600;
        }

        .body {
          min-width: 0;
          display: grid;
          gap: 0.2rem;
        }

        .title {
          margin: 0;
          font-size: 0.88rem;
          font-weight: 700;
          line-height: 1.25;
          color: #0f172a;
          overflow-wrap: anywhere;
        }

        .subtitle {
          margin: 0;
          font-size: 0.78rem;
          color: #475569;
          line-height: 1.35;
          overflow-wrap: anywhere;
        }

        .footer {
          margin-top: 0.15rem;
          display: flex;
          justify-content: space-between;
          gap: 0.4rem;
          align-items: center;
          min-height: 1rem;
        }

        .count {
          font-size: 0.74rem;
          color: #334155;
          font-weight: 600;
        }

        .action-hint {
          font-size: 0.72rem;
          color: #64748b;
          font-weight: 600;
          white-space: nowrap;
        }
      </style>
      <button id="card" class="card" type="button">
        <span class="content">
          <span class="preview">
            <img id="previewImage" alt="" hidden />
            <span id="previewPlaceholder" class="preview-placeholder">Item</span>
          </span>
          <span class="body">
            <span id="title" class="title">${escapeHtml(this.model.title || "Item")}</span>
            <span id="subtitle" class="subtitle">${escapeHtml(this.model.subtitle || "License not set")}</span>
            <span class="footer">
              <span id="count" class="count"></span>
              <span id="actionHint" class="action-hint">Open item</span>
            </span>
          </span>
        </span>
      </button>
    `;
	}
}

if (!customElements.get("oc-card-item")) {
	customElements.define("oc-card-item", OcCardItemElement);
}

export { OcCardItemElement };
