function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

class Grid3CollectionCardElement extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.model = {
      title: "",
      subtitle: "",
      countLabel: "",
      previewImages: [],
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
      new CustomEvent("oc-card-activate", { detail: { value: this.model.actionValue || "" }, bubbles: true, composed: true }),
    );
  }

  renderGrid() {
    const images = Array.isArray(this.model.previewImages) ? this.model.previewImages.slice(0, 6) : [];
    return Array.from({ length: 6 })
      .map((_, i) => {
        const url = images[i];
        return url
          ? `<span class="preview"><img src="${escapeHtml(url)}" alt="" loading="lazy" decoding="async"/></span>`
          : `<span class="preview placeholder" aria-hidden="true"></span>`;
      })
      .join("");
  }

  render() {
    const title = escapeHtml(this.model.title || "Collection");
    const subtitle = escapeHtml(this.model.subtitle || "Curated set of items");
    const countLabel = escapeHtml(this.model.countLabel || "");
    const actionLabel = escapeHtml(this.model.actionLabel || "Open");

    this.shadowRoot.innerHTML = `
      <style>
        :host { display:block; min-height:0; }
        * { box-sizing:border-box; }
        .card {
          height:100%;
          border:1px solid #d6d1e8;
          border-radius:14px;
          background:linear-gradient(180deg, #f8f6ff, #fff);
          display:grid;
          grid-template-rows:auto 1fr auto;
          cursor:pointer;
          overflow:hidden;
        }
        .card__header {
          padding: 12px 14px;
          border-bottom: 1px solid rgba(40, 40, 60, 0.11);
          background: #eceaf7;
        }
        .card__headerMain {
          display:flex;
          align-items:flex-start;
          gap:10px;
        }
        .card__icon {
          width:22px;
          height:22px;
          opacity:0.72;
          color:#606983;
          flex:none;
          margin-top:1px;
        }
        .card__titleBlock {
          min-width:0;
        }
        .card__title {
          margin: 0;
          font-size: 0.92rem;
          font-weight: 620;
          line-height: 1.25;
          color:#1f2937;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .subtitle {
          margin:4px 0 0;
          color:#6f7788;
          font-size:0.72rem;
          line-height:1.3;
        }
        .card__body {
          margin-top:-1px;
          padding: 10px 14px 0;
          min-height: 0;
          overflow: hidden;
        }
        .preview-viewport {
          overflow:hidden;
          border-radius:10px;
          height:84px;
        }
        .image-grid {
          display:grid;
          grid-template-columns:1fr 1fr;
          row-gap:6px;
          column-gap:6px;
        }
        .preview {
          border:1px solid #d3caef;
          border-radius:8px;
          height:36px;
          overflow:hidden;
          background:#f1ecff;
        }
        .preview img { width:100%; height:100%; object-fit:cover; display:block; }
        .placeholder { background:linear-gradient(120deg, #ece7ff, #f7f3ff); }
        .card__footer {
          font-size:0.7rem;
          color:#665b8a;
          display:flex;
          justify-content:space-between;
          align-items:center;
          gap:8px;
          border-top:1px solid #e2dcf3;
          padding:8px 14px 12px;
          min-height:28px;
        }
      </style>
      <article class="card card--collection" tabindex="0" role="button" aria-label="${actionLabel} ${title}">
        <div class="card__header">
          <div class="card__headerMain">
            <svg class="card__icon card__icon--collection" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M3.75 6.75h6l1.5 2h9v8.5a1 1 0 0 1-1 1H4.75a1 1 0 0 1-1-1V6.75Z" stroke="currentColor" stroke-width="1.5"/>
            </svg>
            <div class="card__titleBlock">
              <h3 class="card__title">${title}</h3>
              <p class="subtitle">${subtitle}</p>
            </div>
          </div>
        </div>
        <div class="card__body">
          <div class="preview-viewport">
            <div class="image-grid">${this.renderGrid()}</div>
          </div>
        </div>
        <div class="card__footer"><span>${countLabel}</span><span>${actionLabel}</span></div>
      </article>
    `;
  }
}

if (!customElements.get("grid3-card-collection")) {
  customElements.define("grid3-card-collection", Grid3CollectionCardElement);
}

export { Grid3CollectionCardElement };
