function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

class Grid2CollectionsCardElement extends HTMLElement {
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
        return `<div class="preview-row">
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
          border: 1px solid #cad6e8;
          border-radius: 14px;
          background: linear-gradient(180deg, #f0f6ff, #ffffff);
          padding: 12px;
          display: grid;
          grid-template-rows: auto 1fr auto;
          gap: 10px;
          cursor: pointer;
        }
        .head { display:grid; grid-template-columns:56px 1fr; gap:10px; }
        .logo {
          width:56px; height:56px; border-radius:10px; display:grid; place-items:center;
          border:1px dashed #98b4da; color:#38577d; background:#e3efff; font-size:0.8rem; font-weight:700;
        }
        .title { margin:0; font-size:0.95rem; color:#1f2937; }
        .meta { font-size:0.73rem; color:#5f6b7e; margin-top:2px; }
        .rows { display:grid; gap:6px; }
        .preview-row { display:grid; grid-template-columns:repeat(3, 1fr); gap:6px; }
        .thumb { border:1px solid #cfdae8; border-radius:7px; overflow:hidden; height:34px; background:#eaf2ff; }
        .thumb img { width:100%; height:100%; object-fit:cover; display:block; }
        .placeholder { background:linear-gradient(120deg, #dbe7f9, #edf4ff); }
        .foot { display:flex; justify-content:space-between; align-items:center; }
        .pill { font-size:0.68rem; border:1px solid #bad0ea; background:#eaf4ff; color:#35577f; border-radius:999px; padding:3px 8px; }
        .action { font-size:0.7rem; color:#4b5563; }
      </style>
      <article class="card" tabindex="0" role="button" aria-label="${actionLabel} ${title}">
        <div class="head">
          <div class="logo">${logoLabel}</div>
          <div>
            <h3 class="title">${title}</h3>
            <div class="meta">${subtitle}</div>
            <div class="meta">${country}</div>
            <div class="meta">${descriptor}</div>
          </div>
        </div>
        <div class="rows">${this.renderRows()}</div>
        <div class="foot">
          <span class="pill">${countLabel}</span>
          <span class="action">${actionLabel}</span>
        </div>
      </article>
    `;
  }
}

if (!customElements.get("grid2-card-collections")) {
  customElements.define("grid2-card-collections", Grid2CollectionsCardElement);
}

export { Grid2CollectionsCardElement };
