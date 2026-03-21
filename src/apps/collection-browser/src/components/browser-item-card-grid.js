import { browserRendererStyles } from '../css/browser-renderers.css.js';

class OpenBrowserItemCardGridElement extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.model = { items: [], selectedItemId: null };
  }

  connectedCallback() {
    this.render();
  }

  update(data = {}) {
    this.model = { ...this.model, ...data };
    this.render();
  }

  dispatch(name, detail = {}) {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }

  previewMarkup(item) {
    const mediaUrl = item.media?.thumbnailUrl || item.media?.url || '';
    const mediaType = (item.media?.type || '').toLowerCase();

    if (!mediaUrl) {
      return '<div class="thumb-placeholder">No preview</div>';
    }

    if (mediaType.includes('video')) {
      return `<video class="thumb" src="${mediaUrl}" muted playsinline preload="metadata"></video>`;
    }

    return `<img class="thumb" src="${mediaUrl}" alt="${item.title || item.id}" />`;
  }

  render() {
    const items = Array.isArray(this.model.items) ? this.model.items : [];
    if (items.length === 0) {
      this.shadowRoot.innerHTML = `<style>${browserRendererStyles}</style><div class="empty">No items loaded.</div>`;
      return;
    }

    const cards = items.map((item) => `
      <article
        class="asset-card ${this.model.selectedItemId === item.id ? 'is-focused' : ''}"
        role="button"
        tabindex="0"
        data-item-id="${item.id}"
        aria-label="Select ${item.title || item.id}"
      >
        <div class="thumb-frame">${this.previewMarkup(item)}</div>
        <h3 class="card-title">${item.title || item.id}</h3>
        <p class="meta">${item.license ? `License: ${item.license}` : 'License not set'}</p>
        <div class="card-actions">
          <button type="button" class="btn" data-view-id="${item.id}">View</button>
        </div>
      </article>
    `).join('');

    this.shadowRoot.innerHTML = `<style>${browserRendererStyles}</style><div class="asset-grid">${cards}</div>`;

    this.shadowRoot.querySelectorAll('[data-item-id]').forEach((card) => {
      card.addEventListener('click', () => {
        this.dispatch('item-select', { itemId: card.getAttribute('data-item-id') || '' });
      });
      card.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') {
          return;
        }
        event.preventDefault();
        this.dispatch('item-select', { itemId: card.getAttribute('data-item-id') || '' });
      });
    });

    this.shadowRoot.querySelectorAll('[data-view-id]').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        this.dispatch('item-view', { itemId: button.getAttribute('data-view-id') || '' });
      });
    });
  }
}

if (!customElements.get('open-browser-item-card-grid')) {
  customElements.define('open-browser-item-card-grid', OpenBrowserItemCardGridElement);
}

export { OpenBrowserItemCardGridElement };
