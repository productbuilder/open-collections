function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

class Grid2ItemCardElement extends HTMLElement {
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

  connectedCallback() { this.render(); this.bindEvents(); }
  update(data = {}) { this.model = { ...this.model, ...data }; this.render(); this.bindEvents(); }

  bindEvents() {
    const card = this.shadowRoot?.querySelector('.card');
    if (!card || this._boundCard === card) return;
    card.addEventListener('click', () => this.dispatchActivate());
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); this.dispatchActivate(); }
    });
    this._boundCard = card;
  }

  dispatchActivate() {
    if (this.model.disabled) return;
    this.dispatchEvent(new CustomEvent('oc-card-activate', { detail: { value: this.model.actionValue || '' }, bubbles: true, composed: true }));
  }

  render() {
    const title = escapeHtml(this.model.title || 'Item');
    const subtitle = escapeHtml(this.model.subtitle || '');
    const previewUrl = escapeHtml(this.model.previewUrl || '');

    this.shadowRoot.innerHTML = `
      <style>
        :host { display:block; min-height:0; }
        * { box-sizing:border-box; }
        .card {
          height:100%; border:1px solid #cfd7e0; border-radius:14px;
          background:linear-gradient(180deg, #f8fafc, #ffffff); padding:10px;
          display:grid; grid-template-columns:96px 1fr; gap:10px; align-items:center; cursor:pointer;
        }
        .image { height:76px; border-radius:10px; border:1px solid #ccd3dc; overflow:hidden; background:#e8edf2; }
        .image img { width:100%; height:100%; object-fit:cover; display:block; }
        h4 { margin:0 0 4px; font-size:0.84rem; color:#1f2937; }
        .meta { margin:0; font-size:0.72rem; color:#6b7280; }
        .foot {
          margin-top:7px;
          padding-top:6px;
          border-top:1px solid #e4e9ef;
          min-height:20px;
          display:flex;
          justify-content:flex-end;
          align-items:center;
          font-size:0.68rem;
          color:#556171;
        }
        :host(.tile-1x1) .card {
          grid-template-columns:1fr;
          grid-template-rows:1fr auto;
          padding:8px;
          gap:7px;
          align-items:stretch;
        }
        :host(.tile-1x1) .image {
          height:68px;
        }
        :host(.tile-1x1) h4 {
          font-size:0.76rem;
          margin-bottom:2px;
        }
        :host(.tile-1x1) .meta {
          font-size:0.67rem;
        }
        :host(.tile-1x1) .foot {
          margin-top:5px;
          padding-top:5px;
          min-height:18px;
        }
      </style>
      <article class="card" tabindex="0" role="button" aria-label="${title}">
        <div class="image">${previewUrl ? `<img src="${previewUrl}" alt="" loading="lazy" decoding="async"/>` : ''}</div>
        <div>
          <h4>${title}</h4>
          <p class="meta">${subtitle || '&nbsp;'}</p>
          <div class="foot"><span>${escapeHtml(this.model.actionLabel || 'View')}</span></div>
        </div>
      </article>
    `;
  }
}

if (!customElements.get('grid2-card-item')) {
  customElements.define('grid2-card-item', Grid2ItemCardElement);
}

export { Grid2ItemCardElement };
