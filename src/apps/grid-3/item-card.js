function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

class Grid3ItemCardElement extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.model = {
      title: "",
      subtitle: "",
      previewUrl: "",
      actionLabel: "View",
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

  render() {
    const title = escapeHtml(this.model.title || "Item");
    const subtitle = escapeHtml(this.model.subtitle || "");
    const previewUrl = escapeHtml(this.model.previewUrl || "");

    this.shadowRoot.innerHTML = `
      <style>
        :host { display:block; min-height:0; }
        * { box-sizing:border-box; }
        .card {
          height:100%;
          border:1px solid #cfd7e0;
          border-radius:13px;
          background:linear-gradient(180deg, #f8fafc, #ffffff);
          display:grid;
          grid-template-rows:1fr auto;
          gap:8px;
          cursor:pointer;
          overflow:hidden;
          padding:10px;
        }
        .card__body {
          min-height:0;
          display:grid;
          grid-template-columns:96px 1fr;
          gap:10px;
          align-items:center;
        }
        .image {
          height:76px;
          border-radius:10px;
          border:1px solid #ccd3dc;
          overflow:hidden;
          background:#e8edf2;
        }
        .image img { width:100%; height:100%; object-fit:cover; display:block; }
        .content { min-width: 0; }
        .card__titleRow {
          margin:0 0 4px;
          display:flex;
          align-items:center;
          gap:7px;
        }
        .card__icon {
          width:15px;
          height:15px;
          opacity:0.58;
          color:#738195;
          flex:none;
        }
        .card__title {
          margin:0;
          font-size:0.83rem;
          font-weight:600;
          color:#1f2937;
          line-height:1.3;
          display:-webkit-box;
          -webkit-line-clamp:1;
          -webkit-box-orient:vertical;
          overflow:hidden;
        }
        .meta { margin:0; font-size:0.7rem; color:#6b7280; }
        .card__footer {
          min-height:20px;
          display:flex;
          justify-content:flex-end;
          align-items:center;
          font-size:0.68rem;
          color:#556171;
          border-top:1px solid #e4e9ef;
          padding-top:6px;
        }
        :host(.tile-1x1) .card {
          border-radius: 10px;
          gap: 7px;
          padding: 8px;
        }
        :host(.tile-1x1) .card__body {
          grid-template-columns:1fr;
          grid-template-rows:1fr auto;
          gap:7px;
          align-items:stretch;
        }
        :host(.tile-1x1) .image { height:68px; }
        :host(.tile-1x1) .card__title { font-size:0.76rem; }
        :host(.tile-1x1) .meta { font-size:0.66rem; }
        :host(.tile-1x1) .card__footer {
          min-height:18px;
          padding-top:5px;
          font-size:0.63rem;
        }
      </style>
      <article class="card card--item" tabindex="0" role="button" aria-label="${title}">
        <div class="card__body">
          <div class="image">${previewUrl ? `<img src="${previewUrl}" alt="" loading="lazy" decoding="async"/>` : ""}</div>
          <div class="content">
            <div class="card__titleRow">
              <svg class="card__icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="3.75" y="5.75" width="16.5" height="12.5" rx="1.5" stroke="currentColor" stroke-width="1.5"/>
                <path d="m7.5 14 3-3 2.25 2.25L15.75 10l2.5 4" stroke="currentColor" stroke-width="1.5"/>
              </svg>
              <h4 class="card__title">${title}</h4>
            </div>
            <p class="meta">${subtitle || "&nbsp;"}</p>
          </div>
        </div>
        <div class="card__footer"><span>${escapeHtml(this.model.actionLabel || "View")}</span></div>
      </article>
    `;
  }
}

if (!customElements.get("grid3-card-item")) {
  customElements.define("grid3-card-item", Grid3ItemCardElement);
}

export { Grid3ItemCardElement };
