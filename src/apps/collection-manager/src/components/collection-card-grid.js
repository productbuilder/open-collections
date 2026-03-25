import { browserRendererStyles } from '../css/browser-renderers.css.js';

class OpenCollectionCardGridElement extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.model = { collections: [], selectedCollectionId: null, selectedCollectionIds: [] };
  }

  update(data = {}) {
    this.model = { ...this.model, ...data };
    this.render();
  }

  connectedCallback() {
    this.render();
  }

  dispatch(name, detail = {}) {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }

  render() {
    const collections = Array.isArray(this.model.collections) ? this.model.collections : [];
    const selectedIds = new Set(Array.isArray(this.model.selectedCollectionIds) ? this.model.selectedCollectionIds : []);
    const cards = collections.length === 0
      ? '<div class="empty">No collections yet. Add a collection to begin.</div>'
      : collections.map((collection) => `
        <article class="asset-card ${this.model.selectedCollectionId === collection.id ? 'is-focused' : ''} ${selectedIds.has(collection.id) ? 'is-selected' : ''}" data-id="${collection.id}">
          <label class="selection-toggle" data-select-wrap="true" aria-label="Select ${collection.title || collection.id}">
            <input type="checkbox" data-select-id="${collection.id}" ${selectedIds.has(collection.id) ? 'checked' : ''} />
            <span>Select</span>
          </label>
          <p class="card-title">${collection.title || collection.id}</p>
          <div class="badge-row"><span class="badge">${collection.id}</span></div>
          <div class="card-actions"><button type="button" class="btn" data-open-id="${collection.id}">Open</button></div>
        </article>
      `).join('');

    this.shadowRoot.innerHTML = `<style>${browserRendererStyles}</style><div class="asset-grid">${cards}</div>`;

    this.shadowRoot.querySelectorAll('.asset-card[data-id]').forEach((card) => {
      card.addEventListener('click', () => {
        this.dispatch('collection-select', { collectionId: card.getAttribute('data-id') });
      });
    });
    this.shadowRoot.querySelectorAll('[data-select-wrap]').forEach((label) => {
      label.addEventListener('click', (event) => {
        event.stopPropagation();
      });
    });
    this.shadowRoot.querySelectorAll('input[data-select-id]').forEach((input) => {
      input.addEventListener('click', (event) => {
        event.stopPropagation();
      });
      input.addEventListener('change', (event) => {
        event.stopPropagation();
        this.dispatch('collection-toggle-selected', {
          collectionId: input.getAttribute('data-select-id'),
          selected: event.target?.checked === true,
        });
      });
    });
    this.shadowRoot.querySelectorAll('button[data-open-id]').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        this.dispatch('collection-open', { collectionId: button.getAttribute('data-open-id') });
      });
    });
  }
}

if (!customElements.get('open-collection-card-grid')) {
  customElements.define('open-collection-card-grid', OpenCollectionCardGridElement);
}

export { OpenCollectionCardGridElement };
