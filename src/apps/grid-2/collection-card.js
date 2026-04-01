function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

class Grid2CollectionCardElement extends HTMLElement {
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

  renderGrid() {
    const images = Array.isArray(this.model.previewImages) ? this.model.previewImages.slice(0, 4) : [];
    return Array.from({ length: 4 }).map((_, i) => {
      const url = images[i];
      return url
        ? `<span class="preview"><img src="${escapeHtml(url)}" alt="" loading="lazy" decoding="async"/></span>`
        : `<span class="preview placeholder" aria-hidden="true"></span>`;
    }).join('');
  }

  render() {
    const title = escapeHtml(this.model.title || 'Collection');
    const subtitle = escapeHtml(this.model.subtitle || 'Curated set of items');
    const countLabel = escapeHtml(this.model.countLabel || '');
    const actionLabel = escapeHtml(this.model.actionLabel || 'Open');

    this.shadowRoot.innerHTML = `
      <style>
        :host { display:block; min-height:0; }
        * { box-sizing:border-box; }
        .card {
          height:100%; border:1px solid #d8d2eb; border-radius:14px;
          background:linear-gradient(180deg, #f7f5ff, #fff); padding:12px;
          display:grid; grid-template-rows:auto auto 1fr auto; gap:8px; cursor:pointer;
        }
        h3 { margin:0; font-size:0.95rem; color:#1f2937; }
        .subtitle { margin:0; color:#6b7280; font-size:0.75rem; }
        .preview-grid { display:grid; grid-template-columns:1fr 1fr; gap:6px; }
        .preview { border:1px solid #d8d0f0; border-radius:8px; height:48px; overflow:hidden; background:#f1ecff; }
        .preview img { width:100%; height:100%; object-fit:cover; display:block; }
        .placeholder { background:linear-gradient(120deg, #ece7ff, #f7f3ff); }
        .foot { font-size:0.72rem; color:#5f4d90; display:flex; justify-content:space-between; }
      </style>
      <article class="card" tabindex="0" role="button" aria-label="${actionLabel} ${title}">
        <h3>${title}</h3>
        <p class="subtitle">${subtitle}</p>
        <div class="preview-grid">${this.renderGrid()}</div>
        <div class="foot"><span>${countLabel}</span><span>${actionLabel}</span></div>
      </article>
    `;
  }
}

if (!customElements.get('grid2-card-collection')) {
  customElements.define('grid2-card-collection', Grid2CollectionCardElement);
}

export { Grid2CollectionCardElement };
