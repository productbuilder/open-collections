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
					images: Array.isArray(row?.images) ? row.images.filter(Boolean) : [],
				}))
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
		this.bindRowPreviewLoadStates();
	}

	update(data = {}) {
		this.model = { ...this.model, ...data };
		this.render();
		this.bindEvents();
		this.bindRowPreviewLoadStates();
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

	bindRowPreviewLoadStates() {
		const images = this.shadowRoot?.querySelectorAll(".row-image");
		if (!images?.length) {
			return;
		}
		for (const image of images) {
			if (!(image instanceof HTMLImageElement)) {
				continue;
			}
			const slot = image.closest(".row-slot");
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

	renderRowPlaceholderSlots(count = 20) {
		return Array.from({ length: Math.max(0, count) })
			.map(
				() => `
          <span class="row-slot row-slot-placeholder" aria-hidden="true"></span>
        `,
			)
			.join("");
	}

	renderRows() {
		const preferredRows = normalizeRows(this.model.previewRows);
		const rows = preferredRows.length
			? preferredRows
			: buildFallbackRows(this.model.previewImages);
		const normalizedRows = rows.slice(0, 3);
		while (normalizedRows.length < 3) {
			normalizedRows.push({ title: "", images: [] });
		}

		return `
      <div class="rows" aria-hidden="true">
        ${normalizedRows
					.map((row, rowIndex) => {
						const rowLabel = row.title || `Collection ${rowIndex + 1}`;
						return `
            <div class="preview-row${row.images.length ? "" : " is-empty"}">
              <p class="row-label${row.title ? "" : " is-placeholder"}">${row.title ? escapeHtml(rowLabel) : ""}</p>
              <div class="row-track">
                ${row.images
								.map(
									(imageUrl) => `
                    <span class="row-slot" data-state="loading">
                      <img
                        class="row-image"
                        src="${escapeHtml(imageUrl)}"
                        alt=""
                        loading="lazy"
                        decoding="async"
                        fetchpriority="low"
                      />
                    </span>
                  `,
								)
								.join("")}
                ${this.renderRowPlaceholderSlots()}
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
          height: 100%;
          pointer-events: auto;
          touch-action: pan-y;
          border: 1px solid var(--oc-browser-border, #d9d5d0);
          border-radius: 16px;
          background: var(--oc-browser-bg-card, #fffdfa);
          padding: 0.9rem;
          display: grid;
          grid-template-rows: auto 1fr auto;
          gap: 0.62rem;
          text-align: left;
          font: inherit;
          color: inherit;
          cursor: pointer;
          transition: border-color 120ms ease, box-shadow 120ms ease, background-color 120ms ease;
        }

        .card:hover {
          border-color: var(--oc-browser-border-strong, #c8c1b8);
          box-shadow: 0 2px 8px rgba(46, 41, 36, 0.08);
          background: var(--oc-browser-bg-card-soft, #f7f4f1);
        }

        .card:focus-visible {
          outline: 2px solid var(--oc-browser-focus-ring, #91857a);
          outline-offset: 2px;
        }

        .card.is-active {
          border-color: var(--oc-browser-accent, #756c64);
          box-shadow: 0 0 0 1px color-mix(in srgb, var(--oc-browser-accent, #756c64) 44%, #ffffff 56%) inset, 0 4px 14px rgba(77, 64, 50, 0.16);
          background: var(--oc-browser-accent-soft, #ece7e1);
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
          color: var(--oc-browser-text, #2e2924);
          overflow-wrap: anywhere;
        }

        .subtitle {
          margin: 0.18rem 0 0;
          font-size: 0.8rem;
          line-height: 1.34;
          color: var(--oc-browser-text-muted, #6c6258);
          overflow-wrap: anywhere;
          min-height: 1.05rem;
        }

        .arrow {
          width: 1.9rem;
          height: 1.9rem;
          border-radius: 999px;
          border: 1px solid var(--oc-browser-border, #d9d5d0);
          background: var(--oc-browser-bg-card, #fffdfa);
          color: var(--oc-browser-accent, #756c64);
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
          grid-template-rows: repeat(3, minmax(0, 1fr));
          gap: 0;
          min-height: 240px;
          border-top: 1px solid var(--oc-browser-divider, #e2d8cd);
        }

        .preview-row {
          padding: 0.4rem 0;
          background: var(--oc-browser-bg-card, #fffdfa);
          display: grid;
          grid-template-rows: 0.75rem minmax(0, 1fr);
          gap: 0.28rem;
        }

        .preview-row + .preview-row {
          border-top: 1px solid var(--oc-browser-divider, #e2d8cd);
        }

        .row-label {
          margin: 0;
          font-size: 0.7rem;
          font-weight: 600;
          color: var(--oc-browser-text-muted, #6c6258);
          line-height: 1.2;
          min-height: 0.75rem;
          align-self: center;
        }

        .row-label.is-placeholder {
          width: 32%;
          border-radius: 999px;
          background: var(--oc-browser-placeholder-fill, #e8e4de);
          color: transparent;
        }

        .row-track {
          display: flex;
          align-items: stretch;
          gap: 0.3rem;
          min-height: 44px;
          height: 44px;
          overflow: hidden;
          justify-content: flex-start;
        }

        .row-slot {
          flex: 0 0 auto;
          height: 44px;
          border-radius: 7px;
          overflow: hidden;
          border: 1px solid var(--oc-browser-border, #d9d5d0);
          background: var(--oc-browser-surface-muted, #eee5dc);
          position: relative;
          aspect-ratio: 2 / 1;
        }

        .row-image {
          width: 100%;
          height: 100%;
          min-height: 44px;
          object-fit: cover;
          display: block;
          opacity: 0;
          transition: opacity 160ms ease;
        }

        .row-slot::before {
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

        .row-slot[data-state="loaded"]::before {
          display: none;
        }

        .row-slot[data-state="loaded"] .row-image {
          opacity: 1;
        }

        .row-slot[data-state="error"]::before {
          animation: none;
          background: var(--oc-browser-surface-muted, #eee5dc);
        }

        .row-slot-placeholder {
          border-color: var(--oc-browser-placeholder-border, #d6d0c7);
          background: var(--oc-browser-placeholder-fill, #e8e4de);
        }

        .row-slot-placeholder::before {
          animation: none;
          background: transparent;
        }

        @keyframes preview-shimmer {
          to {
            background-position-x: -220%;
          }
        }

        .preview-row.is-empty {
          background: var(--oc-browser-bg-card, #fffdfa);
        }

        .footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.5rem;
          min-height: 1.2rem;
          border-top: 1px solid var(--oc-browser-divider, #e2d8cd);
          padding-top: 0.42rem;
        }

        .meta {
          margin: 0;
          font-size: 0.76rem;
          color: var(--oc-browser-text, #2e2924);
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
        }

        .meta-icon {
          font-size: 0.82rem;
          color: var(--oc-browser-text-muted, #6c6258);
        }

        .action {
          margin: 0;
          font-size: 0.74rem;
          color: var(--oc-browser-text-muted, #6c6258);
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
