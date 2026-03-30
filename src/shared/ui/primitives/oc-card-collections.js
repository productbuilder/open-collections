import { renderArrowIcon } from "../../components/back-button.js";

function escapeHtml(value) {
	return String(value ?? "")
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");
}

function normalizeRows(previewRows = []) {
	const rows = Array.isArray(previewRows)
		? previewRows
				.map((row) => ({
					title: row?.title || "",
					images: Array.isArray(row?.images)
						? row.images.filter(Boolean).slice(0, 5)
						: [],
				}))
				.filter((row) => row.images.length > 0)
		: [];
	return rows.slice(0, 3);
}

function buildFallbackRows(previewImages = []) {
	const list = Array.isArray(previewImages)
		? previewImages.filter(Boolean).slice(0, 15)
		: [];
	if (list.length === 0) {
		return [];
	}
	const perRow = Math.max(1, Math.ceil(list.length / 3));
	const rows = [];
	for (let index = 0; index < 3; index += 1) {
		const start = index * perRow;
		const slice = list.slice(start, start + perRow);
		if (slice.length === 0) {
			continue;
		}
		rows.push({
			title: "",
			images: slice,
		});
	}
	return rows;
}

class OcCardCollectionsElement extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.model = {
			title: "",
			subtitle: "",
			countLabel: "",
			previewRows: [],
			previewImages: [],
			actionLabel: "Browse",
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
			new CustomEvent("oc-card-activate", {
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
		card.addEventListener("keydown", (event) => {
			if (event.key !== "Enter" && event.key !== " ") {
				return;
			}
			event.preventDefault();
			this.dispatchActivate();
		});
		this._boundCard = card;
	}

	renderRows() {
		const preferredRows = normalizeRows(this.model.previewRows);
		const rows = preferredRows.length
			? preferredRows
			: buildFallbackRows(this.model.previewImages);
		if (rows.length === 0) {
			return '<div class="row-placeholder">No collection previews yet</div>';
		}

		const normalizedRows = rows.slice(0, 3);
		while (normalizedRows.length < 3) {
			normalizedRows.push({ title: "", images: [] });
		}

		return `
      <div class="rows" aria-hidden="true">
        ${normalizedRows
					.map((row, rowIndex) => {
						if (!row.images.length) {
							return '<div class="preview-row is-empty"><span class="preview-row-empty">No collection preview</span></div>';
						}
						const rowLabel = row.title || `Collection ${rowIndex + 1}`;
						return `
            <div class="preview-row">
              <p class="row-label">${escapeHtml(rowLabel)}</p>
              <div class="row-track">
                ${row.images
								.map(
									(imageUrl, imageIndex) => `
                    <span class="row-slot">
                      <img
                        class="row-image"
                        src="${escapeHtml(imageUrl)}"
                        alt="${escapeHtml(this.model.title || "Source")} ${escapeHtml(rowLabel)} preview ${imageIndex + 1}"
                        loading="lazy"
                      />
                    </span>
                  `,
								)
								.join("")}
              </div>
            </div>
          `;
					})
					.join("")}
      </div>
    `;
	}

	render() {
		const title = escapeHtml(this.model.title || "Source");
		const subtitle = escapeHtml(this.model.subtitle || "");
		const countLabel = escapeHtml(this.model.countLabel || "");
		const actionLabel = escapeHtml(this.model.actionLabel || "Browse");
		const disabledAttr = this.model.disabled ? "true" : "false";
		const activeClass = this.model.active ? "is-active" : "";

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
          width: 100%;
          pointer-events: auto;
          touch-action: pan-y;
          border: 1px solid #dbe3ec;
          border-radius: 16px;
          background: linear-gradient(180deg, #f7fbff 0%, #ffffff 100%);
          padding: 0.9rem;
          display: grid;
          gap: 0.72rem;
          align-content: start;
          text-align: left;
          font: inherit;
          color: inherit;
          cursor: pointer;
          transition: border-color 120ms ease, box-shadow 120ms ease, background-color 120ms ease;
        }

        .card:hover {
          border-color: #93c5fd;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.08);
          background: linear-gradient(180deg, #f2f8ff 0%, #ffffff 100%);
        }

        .card:focus-visible {
          outline: 2px solid #60a5fa;
          outline-offset: 2px;
        }

        .card.is-active {
          border-color: #0f6cc6;
          box-shadow: 0 0 0 1px #66a6e8 inset, 0 4px 14px rgba(15, 108, 198, 0.16);
          background: linear-gradient(180deg, #edf5ff 0%, #ffffff 100%);
        }

        .card[aria-disabled="true"] {
          opacity: 0.7;
          cursor: default;
        }

        .header {
          display: flex;
          justify-content: space-between;
          gap: 0.7rem;
          align-items: start;
        }

        .title-group {
          min-width: 0;
        }

        .title {
          margin: 0;
          font-size: 0.98rem;
          font-weight: 700;
          line-height: 1.2;
          color: #0f172a;
          overflow-wrap: anywhere;
        }

        .subtitle {
          margin: 0.18rem 0 0;
          font-size: 0.8rem;
          line-height: 1.34;
          color: #475569;
          overflow-wrap: anywhere;
          min-height: 1.05rem;
        }

        .arrow {
          width: 1.9rem;
          height: 1.9rem;
          border-radius: 999px;
          border: 1px solid #cbd5e1;
          background: #ffffff;
          color: #0f6cc6;
          display: grid;
          place-items: center;
          font-size: 1rem;
          font-weight: 700;
          flex: 0 0 auto;
        }

        .arrow .icon {
          width: 1rem;
          height: 1rem;
          fill: currentColor;
        }

        .rows {
          display: grid;
          gap: 0.46rem;
        }

        .preview-row {
          border: 1px solid #dbe3ec;
          border-radius: 10px;
          padding: 0.36rem;
          background: #ffffff;
          display: grid;
          gap: 0.34rem;
        }

        .row-label {
          margin: 0;
          font-size: 0.7rem;
          font-weight: 600;
          color: #64748b;
          line-height: 1.2;
        }

        .row-track {
          display: grid;
          grid-auto-flow: column;
          grid-auto-columns: minmax(44px, 1fr);
          gap: 0.3rem;
          min-height: 46px;
        }

        .row-slot {
          border-radius: 7px;
          overflow: hidden;
          border: 1px solid #dbe3ec;
          background: #eef2f7;
        }

        .row-image {
          width: 100%;
          height: 100%;
          min-height: 44px;
          object-fit: cover;
          display: block;
        }

        .preview-row.is-empty {
          min-height: 64px;
          display: grid;
          place-items: center;
          border-style: dashed;
          background: #f8fafc;
        }

        .preview-row-empty,
        .row-placeholder {
          font-size: 0.76rem;
          color: #64748b;
          text-align: center;
        }

        .footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.5rem;
          min-height: 1.2rem;
        }

        .meta {
          margin: 0;
          font-size: 0.76rem;
          color: #334155;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
        }

        .meta-icon {
          font-size: 0.82rem;
          color: #64748b;
        }

        .action {
          margin: 0;
          font-size: 0.74rem;
          color: #64748b;
          font-weight: 600;
          white-space: nowrap;
        }
      </style>
      <article class="card ${activeClass}" id="card" role="button" tabindex="0" aria-label="${actionLabel} ${title}" aria-disabled="${disabledAttr}">
        <div class="header">
          <div class="title-group">
            <p class="title">${title}</p>
            <p class="subtitle">${subtitle || "&nbsp;"}</p>
          </div>
          <span class="arrow" aria-hidden="true">${renderArrowIcon({ className: "icon icon-forward", direction: "right" })}</span>
        </div>
        ${this.renderRows()}
        <div class="footer">
          <p class="meta">${countLabel ? '<span class="meta-icon" aria-hidden="true">&#9679;</span>' : ""}${countLabel || "&nbsp;"}</p>
          <p class="action">${actionLabel}</p>
        </div>
      </article>
    `;
	}
}

if (!customElements.get("oc-card-collections")) {
	customElements.define("oc-card-collections", OcCardCollectionsElement);
}

export { OcCardCollectionsElement };
