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
          border:1px solid #d7dde5;
          border-radius:12px;
          background:#ffffff;
          display:grid;
          grid-template-rows:auto 1fr auto;
          gap:8px;
          cursor:pointer;
          overflow:hidden;
        }
        .card__header {
          padding: 10px 12px;
          background: transparent;
          border-bottom: none;
        }
        .header-title {
          margin:0;
          font-size:0.79rem;
          font-weight:600;
          color:#2d3748;
          display:flex;
          align-items:center;
          gap:7px;
          line-height:1.25;
        }
        .title-text {
          display:-webkit-box;
          -webkit-line-clamp:1;
          -webkit-box-orient:vertical;
          overflow:hidden;
        }
        .type-icon {
          width:16px;
          height:16px;
          opacity:0.58;
          color:#738195;
          flex:none;
        }
        .card__body {
          padding: 0 12px;
          min-height: 0;
        }
        .image { height:76px; border-radius:9px; border:1px solid #d3dae2; overflow:hidden; background:#ecf1f6; }
        .image img { width:100%; height:100%; object-fit:contain; display:block; background:#f7fafc; }
        .meta { margin:6px 0 0; font-size:0.68rem; color:#7a8493; }
        .card__footer {
          padding:6px 12px 10px;
          min-height:20px;
          display:flex;
          justify-content:flex-end;
          align-items:center;
          font-size:0.66rem;
          color:#637083;
          border-top:1px solid #edf1f5;
        }
        :host(.tile-1x1) .card {
          border-radius: 10px;
          gap: 6px;
        }
        :host(.tile-1x1) .card__header {
          padding: 8px 9px;
        }
        :host(.tile-1x1) .card__body {
          padding: 0 9px;
        }
        :host(.tile-1x1) .image {
          height:68px;
        }
        :host(.tile-1x1) .header-title {
          font-size:0.73rem;
        }
        :host(.tile-1x1) .meta {
          font-size:0.64rem;
        }
        :host(.tile-1x1) .card__footer {
          padding:5px 9px 8px;
          font-size:0.62rem;
        }
      </style>
      <article class="card card--item" tabindex="0" role="button" aria-label="${title}">
        <div class="card__header">
          <h4 class="header-title">
            <svg class="type-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="3.75" y="5.75" width="16.5" height="12.5" rx="1.5" stroke="currentColor" stroke-width="1.5"/>
              <path d="m7.5 14 3-3 2.25 2.25L15.75 10l2.5 4" stroke="currentColor" stroke-width="1.5"/>
            </svg>
            <span class="title-text">${title}</span>
          </h4>
        </div>
        <div class="card__body">
          <div class="image">${previewUrl ? `<img src="${previewUrl}" alt="" loading="lazy" decoding="async"/>` : ""}</div>
          <p class="meta">${subtitle || "&nbsp;"}</p>
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
