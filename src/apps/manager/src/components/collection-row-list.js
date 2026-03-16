import { browserRendererStyles } from '../css/browser-renderers.css.js';

class OpenCollectionRowListElement extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.model = { collections: [], selectedCollectionId: null };
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
    if (collections.length === 0) {
      this.shadowRoot.innerHTML = `<style>${browserRendererStyles}</style><div class="empty">No collections yet. Add a collection to begin.</div>`;
      return;
    }

    const rows = collections.map((collection) => `
      <tr class="${this.model.selectedCollectionId === collection.id ? 'is-selected' : ''}" data-id="${collection.id}">
        <td>${collection.title || collection.id}</td>
        <td>${collection.id}</td>
        <td><button type="button" class="btn" data-open-id="${collection.id}">Open</button></td>
      </tr>
    `).join('');

    this.shadowRoot.innerHTML = `
      <style>${browserRendererStyles}</style>
      <div class="row-table-wrap">
        <table class="row-table" aria-label="Collections list">
          <thead><tr><th>Title</th><th>ID</th><th>Actions</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;

    this.shadowRoot.querySelectorAll('tbody tr[data-id]').forEach((row) => {
      row.addEventListener('click', () => {
        this.dispatch('collection-select', { collectionId: row.getAttribute('data-id') });
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

if (!customElements.get('open-collection-row-list')) {
  customElements.define('open-collection-row-list', OpenCollectionRowListElement);
}

export { OpenCollectionRowListElement };
