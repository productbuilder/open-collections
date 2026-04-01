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
          display:grid; grid-template-columns:90px 1fr; gap:10px; align-items:center; cursor:pointer;
        }
        .image { height:74px; border-radius:10px; border:1px solid #ccd3dc; overflow:hidden; background:#e8edf2; }
        .image img { width:100%; height:100%; object-fit:cover; display:block; }
        h4 { margin:0 0 4px; font-size:0.86rem; color:#1f2937; }
        .meta { margin:0; font-size:0.72rem; color:#6b7280; }
      </style>
      <article class="card" tabindex="0" role="button" aria-label="${title}">
        <div class="image">${previewUrl ? `<img src="${previewUrl}" alt="" loading="lazy" decoding="async"/>` : ''}</div>
        <div>
          <h4>${title}</h4>
          <p class="meta">${subtitle || '&nbsp;'}</p>
        </div>
      </article>
    `;
  }
}

if (!customElements.get('grid2-card-item')) {
  customElements.define('grid2-card-item', Grid2ItemCardElement);
}

export { Grid2ItemCardElement };
