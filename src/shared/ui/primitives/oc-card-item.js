// Deprecated: superseded by grid5-card-* components in shared/ui/primitives.
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
			actionLabel: "",
			actionValue: "",
			active: false,
			disabled: false,
		};
		this._lastPreviewErrorKey = "";
	}

	connectedCallback() {
		this.render();
		this.bindEvents();
		this.applyModel();
	}

	bindEvents() {
		const image = this.shadowRoot?.getElementById("previewImage");
		const preview = this.shadowRoot?.querySelector(".preview");
		if (!image || this._boundPreviewImage === image) {
			return;
		}
		image.addEventListener("load", async () => {
			const placeholder = this.shadowRoot?.getElementById("previewPlaceholder");
			const currentSrc = String(image.currentSrc || image.src || "").trim();
			if (!currentSrc || currentSrc !== this._activePreviewUrl) {
				return;
			}
			try {
				if (typeof image.decode === "function") {
					await image.decode();
				}
			} catch {
				// decode() can reject after successful load in some browsers; keep reveal behavior.
			}
			image.hidden = false;
			if (placeholder) {
				placeholder.hidden = true;
			}
			preview?.setAttribute("data-state", "loaded");
		});
		image.addEventListener("error", () => {
			const placeholder = this.shadowRoot?.getElementById("previewPlaceholder");
			const actionValue = String(this.model.actionValue || "").trim();
			const previewUrl = String(image.currentSrc || image.src || "").trim();
			const errorKey = `${actionValue}|${previewUrl}`;
			if (!previewUrl || this._lastPreviewErrorKey === errorKey) {
				return;
			}
			image.hidden = true;
			if (placeholder) {
				placeholder.hidden = false;
			}
			preview?.setAttribute("data-state", "error");
			this._lastPreviewErrorKey = errorKey;
			this.dispatchEvent(
				new CustomEvent("oc-card-preview-error", {
					detail: {
						browseKind: "item",
						actionValue,
						previewUrl,
						title: this.model.title || "",
					},
					bubbles: true,
					composed: true,
				}),
			);
		});
		this._boundPreviewImage = image;
	}

	update(data = {}) {
		this.model = { ...this.model, ...data };
		this.applyModel();
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
		const preview = this.shadowRoot?.querySelector(".preview");
		if (!card || !title || !subtitle || !count || !image || !placeholder) {
			return;
		}

		const previews = this.resolvePreviewImages();
		const previewUrl = previews[0] || "";
		const subtitleText = String(this.model.subtitle || "").trim();
		const actionText = String(this.model.actionLabel || "").trim();
		this._lastPreviewErrorKey = "";

		title.textContent = this.model.title || "Item";
		subtitle.textContent = subtitleText || "\u00A0";
		subtitle.hidden = false;
		count.textContent = this.model.countLabel || "";
		card.classList.toggle("is-active", this.model.active === true);
		card.toggleAttribute("disabled", this.model.disabled === true);
		card.setAttribute(
			"aria-label",
			actionText
				? `${actionText} ${this.model.title || "Item"}`
				: `${this.model.title || "Item"}`,
		);

		if (previewUrl) {
			image.loading = "lazy";
			image.decoding = "async";
			image.fetchPriority = "low";
			const isSamePreviewUrl = this._activePreviewUrl === previewUrl;
			this._activePreviewUrl = previewUrl;
			image.alt = "";
			if (
				isSamePreviewUrl &&
				image.complete &&
				Number(image.naturalWidth) > 0
			) {
				image.hidden = false;
				placeholder.hidden = true;
				preview.setAttribute("data-state", "loaded");
			} else {
				preview.setAttribute("data-state", "loading");
				image.hidden = true;
				placeholder.hidden = false;
				if (image.getAttribute("src") !== previewUrl) {
					image.src = previewUrl;
				}
			}
		} else {
			this._activePreviewUrl = "";
			image.removeAttribute("src");
			image.alt = "";
			image.hidden = true;
			placeholder.hidden = false;
			preview.setAttribute("data-state", "empty");
		}
	}

	render() {
		this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          min-height: 0;
        }

        * {
          box-sizing: border-box;
        }

        .card {
          display: block;
          pointer-events: auto;
          touch-action: pan-y;
          width: 100%;
          border: 1px solid var(--oc-browser-border, #d9d5d0);
          border-radius: 11px;
          background: var(--oc-browser-bg-card, #fffdfa);
          padding: 0.55rem;
          text-align: left;
          font: inherit;
          color: inherit;
          cursor: pointer;
          transition: border-color 120ms ease, box-shadow 120ms ease, background-color 120ms ease;
        }

        .card:hover {
          border-color: var(--oc-browser-border-strong, #c8c1b8);
          box-shadow: 0 1px 3px rgba(46, 41, 36, 0.08);
          background: var(--oc-browser-bg-card-soft, #f7f4f1);
        }

        .card:focus-visible {
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

        .content {
          display: grid;
          grid-template-rows: auto auto auto;
          gap: 0.42rem;
          align-content: start;
          min-height: 100%;
        }

        .preview {
          width: 100%;
          aspect-ratio: var(--oc-item-preview-ratio, 1 / 1);
          border-radius: 9px;
          overflow: hidden;
          border: 1px solid var(--oc-browser-border, #d9d5d0);
          background: var(--oc-browser-bg-card-soft, #f7f4f1);
          display: grid;
          place-items: center;
          position: relative;
        }

        .preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          opacity: 0;
          transition: opacity 180ms ease;
        }

        .preview[data-state="loaded"] img {
          opacity: 1;
        }

        .preview-placeholder {
          width: 100%;
          height: 100%;
          display: block;
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

        .preview[data-state="loaded"] .preview-placeholder {
          display: none;
        }

        .preview[data-state="error"] .preview-placeholder,
        .preview[data-state="empty"] .preview-placeholder {
          animation: none;
          background: var(--oc-browser-surface-muted, #eeebe7);
        }

        @keyframes preview-shimmer {
          to {
            background-position-x: -220%;
          }
        }

        .body {
          min-width: 0;
          display: grid;
          gap: 0.24rem;
          align-content: start;
        }

        .title {
          margin: 0;
          font-size: 0.86rem;
          font-weight: 700;
          line-height: 1.3;
          min-height: var(--oc-item-title-min-height, 2.24rem);
          color: var(--oc-browser-text, #2e2924);
          overflow-wrap: anywhere;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .subtitle {
          margin: 0;
          font-size: 0.76rem;
          color: var(--oc-browser-text-muted, #6c6258);
          line-height: 1.32;
          min-height: var(--oc-item-subtitle-min-height, 2.01rem);
          overflow-wrap: anywhere;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .footer {
          margin-top: auto;
          display: flex;
          justify-content: flex-start;
          gap: 0.4rem;
          align-items: center;
          min-height: 1rem;
          padding-top: 0.08rem;
        }

        .count {
          font-size: 0.74rem;
          color: var(--oc-browser-text, #2e2924);
          font-weight: 600;
        }

      </style>
      <button id="card" class="card" type="button">
        <span class="content">
          <span class="preview">
            <img id="previewImage" alt="" hidden />
            <span id="previewPlaceholder" class="preview-placeholder" aria-hidden="true"></span>
          </span>
          <span class="body">
            <span id="title" class="title">${escapeHtml(this.model.title || "Item")}</span>
            <span id="subtitle" class="subtitle">${escapeHtml(this.model.subtitle || "License not set")}</span>
          </span>
          <span class="footer">
            <span id="count" class="count"></span>
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
