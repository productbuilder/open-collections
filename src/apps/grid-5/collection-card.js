function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

class Grid5CollectionCardElement extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.model = {
      title: "",
      subtitle: "",
      countLabel: "",
      previewImages: [],
      actionLabel: "Open collection",
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
    const images = Array.isArray(this.model.previewImages) ? this.model.previewImages.slice(0, 4) : [];
    return Array.from({ length: 4 })
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
    const actionLabel = escapeHtml(this.model.actionLabel || "Open collection");

    this.shadowRoot.innerHTML = `
      <style>
        :host { display:block; min-height:0; }
        * { box-sizing:border-box; }
        .card {
          height:100%;
           border: 1px solid rgba(70, 90, 120, 0.16);
          border-radius:14px;
          background:linear-gradient(180deg, #f8f6ff, #fff);
          display:grid;
          grid-template-rows:auto 1fr auto;
          cursor:pointer;
          overflow:hidden;
        }
        .card__header {
          padding: 7px 12px;
          border-bottom: 1px solid rgba(40, 40, 60, 0.11);
          background: #e6e2de;
        }
        .card__headerMain {
          display:flex;
          align-items:center;
          gap:9px;
        }
        .card__icon {
          width:32px;
          height:32px;
          opacity:0.74;
          color:#606983;
          flex:none;
        }
        .card__titleBlock { min-width:0; }
        .card__title {
          margin: 0;
          font-size: 0.88rem;
          font-weight: 620;
          line-height: 1.2;
          color:#1f2937;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .subtitle {
          margin:2px 0 0;
          color:#6f7788;
          font-size:0.69rem;
          line-height:1.25;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .card__body {
          margin-top:-1px;
          padding: 10px 12px 0;
          min-height: 0;
          overflow: hidden;
        }
        .preview-viewport {
          overflow:hidden;
          border-radius:10px;
          height:100%;
        }
        .image-grid {
          display:grid;
          grid-template-columns:repeat(2, minmax(0, 1fr));
          gap:7px;
          align-content:start;
        }
        .preview {
          border:1px solid #d3caef;
          border-radius:8px;
          aspect-ratio:3 / 2;
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
          padding:7px 12px 10px;
          min-height:26px;
        }
        .footerAction {
          display:inline-flex;
          align-items:center;
          gap:4px;
        }
        .footerIcon {
          width:14px;
          height:14px;
          color:#606983;
          opacity:0.74;
          flex:none;
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
        <div class="card__footer">
          <span>${countLabel}</span>
          <span class="footerAction">
            <svg class="footerIcon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M3.75 6.75h6l1.5 2h9v8.5a1 1 0 0 1-1 1H4.75a1 1 0 0 1-1-1V6.75Z" stroke="currentColor" stroke-width="1.5"/>
            </svg>
            <span>${actionLabel}</span>
          </span>
        </div>
      </article>
    `;
  }
}

if (!customElements.get("grid5-card-collection")) {
  customElements.define("grid5-card-collection", Grid5CollectionCardElement);
}

export { Grid5CollectionCardElement };
