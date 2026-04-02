function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

class Grid5ItemCardElement extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.model = {
      title: "",
      subtitle: "",
      previewUrl: "",
      actionLabel: "View item",
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
    const actionLabel = escapeHtml(this.model.actionLabel || "View item");

    this.shadowRoot.innerHTML = `
      <style>
        :host { display:block; min-height:0; }
        * { box-sizing:border-box; }
        .card {
          height:100%;
          border:1px solid #cfd7e0;
          border-radius:13px;
          background:linear-gradient(180deg, #f8fafc, #ffffff);
          cursor:pointer;
          overflow:hidden;
          padding:9px;
          display:grid;
          grid-template-rows: 1fr;
        }
        .card__body {
          min-height:0;
          display:grid;
          grid-template-columns:minmax(88px, 44%) 1fr;
          gap:10px;
          align-items:stretch;
        }
        .image {
          width:100%;
          aspect-ratio:1 / 1;
          border-radius:10px;
          border:1px solid #ccd3dc;
          overflow:hidden;
          background:#e8edf2;
        }
        .image img { width:100%; height:100%; object-fit:cover; display:block; }
        .content {
          min-width: 0;
          display:grid;
          align-content:center;
          gap:4px;
          padding:2px 0;
        }
        .textSection {
          min-width:0;
          display:grid;
          grid-template-rows:1fr auto;
          min-height:0;
          gap:7px;
        }
        .card__titleRow {
          display:flex;
          align-items:flex-start;
          min-width:0;
        }
        .card__title {
          margin:0;
          font-size:0.83rem;
          font-weight:600;
          color:#1f2937;
          line-height:1.3;
          display:-webkit-box;
          -webkit-line-clamp:2;
          -webkit-box-orient:vertical;
          overflow:hidden;
        }
        .meta { margin:0; font-size:0.7rem; color:#6b7280; }
        .card__footer {
          display:flex;
          justify-content:flex-end;
          align-items:center;
          min-height:20px;
          padding-top:2px;
        }
        .actionWrap {
          display:inline-flex;
          align-items:center;
          gap:4px;
        }
        .actionIcon {
          width:13px;
          height:13px;
          color:#5e6f84;
          opacity:0.78;
          flex:none;
        }
        .action {
          font-size:0.7rem;
          color:#52647b;
          font-weight:500;
        }

        :host(.tile-1x1) .card {
          border-radius: 10px;
          padding: 8px;
        }
        :host(.tile-1x1) .card__body {
          grid-template-columns:1fr;
          grid-template-rows:auto 1fr;
          gap:7px;
          align-items:stretch;
        }
        :host(.tile-1x1) .image {
          aspect-ratio:auto;
          height:68px;
        }
        :host(.tile-1x1) .content {
          align-content:start;
          gap:2px;
          padding:0;
        }
        :host(.tile-1x1) .textSection {
          grid-template-rows:1fr auto;
          gap:6px;
        }
        :host(.tile-1x1) .card__title { font-size:0.76rem; -webkit-line-clamp:1; }
        :host(.tile-1x1) .meta { font-size:0.66rem; }

        :host(.tile-1x2) .card {
          padding:8px;
        }
        :host(.tile-1x2) .card__body {
          grid-template-columns:1fr;
          grid-template-rows:auto 1fr;
          gap:8px;
          align-items:stretch;
        }
        :host(.tile-1x2) .image {
          aspect-ratio:auto;
          height:132px;
          min-height:0;
        }
        :host(.tile-1x2) .content {
          align-content:start;
          gap:3px;
          padding:0;
        }
        :host(.tile-1x2) .textSection {
          min-height:100%;
          grid-template-rows:1fr auto;
          gap:6px;
        }
        :host(.tile-1x2) .card__title {
          -webkit-line-clamp:2;
          font-size:0.8rem;
        }

        @media (max-width: 760px) {
          :host(.tile-2x1) .card {
            border-radius: 10px;
            padding: 8px;
          }
          :host(.tile-2x1) .card__body {
            grid-template-columns: minmax(72px, 46%) 1fr;
            gap: 8px;
            align-items: stretch;
          }
          :host(.tile-2x1) .image {
            aspect-ratio: 1 / 1;
            height: auto;
          }
          :host(.tile-2x1) .content {
            align-content: center;
            gap: 3px;
            padding: 1px 0;
          }
          :host(.tile-2x1) .textSection {
            grid-template-rows: 1fr auto;
            gap: 6px;
          }
          :host(.tile-2x1) .card__title { font-size: 0.78rem; -webkit-line-clamp: 2; }
          :host(.tile-2x1) .meta { font-size: 0.66rem; }
        }
      </style>
      <article class="card card--item" tabindex="0" role="button" aria-label="${actionLabel} ${title}">
        <div class="card__body">
          <div class="image">${previewUrl ? `<img src="${previewUrl}" alt="" loading="lazy" decoding="async"/>` : ""}</div>
          <div class="textSection">
            <div class="content">
              <div class="card__titleRow">
                <h4 class="card__title">${title}</h4>
              </div>
              <p class="meta">${subtitle || "&nbsp;"}</p>
            </div>
            <div class="card__footer">
              <span class="actionWrap">
                <svg class="actionIcon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M6.5 5.75h11a1.5 1.5 0 0 1 1.5 1.5v9.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 16.75v-9.5a1.5 1.5 0 0 1 1.5-1.5Z" stroke="currentColor" stroke-width="1.5"/>
                  <path d="M8 14.25 10.75 11.5l2.25 2.25 1.75-1.75L16 13.25" stroke="currentColor" stroke-width="1.5"/>
                </svg>
                <span class="action">${actionLabel}</span>
              </span>
            </div>
          </div>
        </div>
      </article>
    `;
  }
}

if (!customElements.get("grid5-card-item")) {
  customElements.define("grid5-card-item", Grid5ItemCardElement);
}

export { Grid5ItemCardElement };
