function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

class Grid3CollectionsCardElement extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.model = {
      title: "",
      subtitle: "",
      country: "",
      descriptor: "Multi-collection source",
      countLabel: "",
      actionLabel: "Open source",
      actionValue: "",
      logoLabel: "",
      previewRows: [],
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

  bindEvents() {
    const card = this.shadowRoot?.querySelector(".card");
    if (!card || this._boundCard === card) return;
    card.addEventListener("click", () => this.dispatchActivate());
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        this.dispatchActivate();
      }
    });
    this._boundCard = card;
  }

  dispatchActivate() {
    if (this.model.disabled) return;
    this.dispatchEvent(
      new CustomEvent("oc-card-activate", {
        detail: { value: this.model.actionValue || "" },
        bubbles: true,
        composed: true,
      }),
    );
  }

  renderRows() {
    const rows = Array.isArray(this.model.previewRows) ? this.model.previewRows.slice(0, 2) : [];
    const filledRows = rows.length ? rows : [[], []];
    while (filledRows.length < 2) filledRows.push([]);

    return filledRows
      .map((row) => {
        const images = Array.isArray(row) ? row.slice(0, 3) : [];
        return `<div class="image-grid-row">
          ${Array.from({ length: 3 })
            .map((_, index) => {
              const url = images[index];
              return url
                ? `<span class="thumb"><img src="${escapeHtml(url)}" alt="" loading="lazy" decoding="async"/></span>`
                : `<span class="thumb placeholder" aria-hidden="true"></span>`;
            })
            .join("")}
        </div>`;
      })
      .join("");
  }

  render() {
    const title = escapeHtml(this.model.title || "Source");
    const subtitle = escapeHtml(this.model.subtitle || "Organization");
    const country = escapeHtml(this.model.country || "");
    const descriptor = escapeHtml(this.model.descriptor || "Multi-collection source");
    const countLabel = escapeHtml(this.model.countLabel || "");
    const actionLabel = escapeHtml(this.model.actionLabel || "Open source");
    const logoLabel = escapeHtml((this.model.logoLabel || title).slice(0, 2).toUpperCase());

    this.shadowRoot.innerHTML = `
      <style>
        :host { display:block; min-height:0; }
        * { box-sizing:border-box; }
        .card {
          height: 100%;
          border: 1px solid #c8d5e5;
          border-radius: 14px;
          background: linear-gradient(180deg, #f2f7ff, #ffffff);
          display: grid;
          grid-template-rows: auto 1fr auto;
          gap: 10px;
          cursor: pointer;
          box-shadow: 0 1px 1px rgba(55, 75, 99, 0.06);
          overflow: hidden;
        }
        .card__header {
          padding: 12px 14px;
          border-bottom: 1px solid rgba(40, 60, 90, 0.11);
          background: #e6edf6;
        }
        .head {
          display:grid;
          grid-template-columns:56px 1fr;
          gap:10px;
        }
        .card__titleRow {
          margin: 0 0 8px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .card__title {
          margin: 0;
          font-size: 0.91rem;
          color: #1f2937;
          line-height: 1.3;
          font-weight: 600;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .card__icon {
          width: 16px;
          height: 16px;
          color: #5f6d80;
          opacity: 0.62;
          flex: none;
        }
        .logo {
          width:56px; height:56px; border-radius:10px; display:grid; place-items:center;
          border:1px solid #8fb0d9; color:#2f4f78; background:linear-gradient(180deg, #dbeaff, #ebf3ff);
          box-shadow: inset 0 1px 0 #f4f9ff;
          font-size:0.8rem; font-weight:700;
        }
        .meta { font-size:0.72rem; color:#5f6b7e; margin-top:2px; }
        .meta.org { color:#445569; font-weight:600; }
        .meta.country { color:#607187; }
        .meta.descriptor { color:#4b6483; }
        .card__body {
          padding: 0 14px;
          min-height: 0;
        }
        .image-grid { display:grid; gap:6px; }
        .image-grid-row { display:grid; grid-template-columns:repeat(3, 1fr); gap:6px; }
        .thumb { border:1px solid #cfdae8; border-radius:7px; overflow:hidden; height:36px; background:#eaf2ff; }
        .thumb img { width:100%; height:100%; object-fit:cover; display:block; }
        .placeholder { background:linear-gradient(120deg, #dbe7f9, #edf4ff); }
        .card__footer {
          display:flex;
          justify-content:space-between;
          align-items:center;
          gap: 8px;
          padding: 8px 14px 12px;
          border-top: 1px solid #dde7f4;
          min-height: 28px;
        }
        .pill { font-size:0.68rem; border:1px solid #bad0ea; background:#eaf4ff; color:#35577f; border-radius:999px; padding:3px 8px; }
        .action { font-size:0.71rem; color:#44556a; font-weight:500; }
      </style>
      <article class="card card--source" tabindex="0" role="button" aria-label="${actionLabel} ${title}">
        <div class="card__header">
          <div class="card__titleRow">
            <svg class="card__icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M3.75 20.25h16.5v-9.5L12 4.25l-8.25 6.5v9.5Z" stroke="currentColor" stroke-width="1.5"/>
              <path d="M8 20.25v-6h8v6" stroke="currentColor" stroke-width="1.5"/>
            </svg>
            <h3 class="card__title">${title}</h3>
          </div>
          <div class="head">
            <div class="logo">${logoLabel}</div>
            <div>
              <div class="meta org">${subtitle}</div>
              <div class="meta country">${country}</div>
              <div class="meta descriptor">${descriptor}</div>
            </div>
          </div>
        </div>
        <div class="card__body">
          <div class="image-grid">${this.renderRows()}</div>
        </div>
        <div class="card__footer">
          <span class="pill">${countLabel}</span>
          <span class="action">${actionLabel}</span>
        </div>
      </article>
    `;
  }
}

if (!customElements.get("grid3-card-collections")) {
  customElements.define("grid3-card-collections", Grid3CollectionsCardElement);
}

export { Grid3CollectionsCardElement };
