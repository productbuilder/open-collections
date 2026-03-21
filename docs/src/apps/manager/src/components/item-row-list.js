import { browserRendererStyles } from '../css/browser-renderers.css.js';
import { resolveItemPreviewUrl } from '../utils/preview-utils.js';

class OpenItemRowListElement extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.model = { items: [], focusedItemId: null, selectedItemIds: [] };
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

  requiredFieldScore(item) {
    const checks = [Boolean(item.id), Boolean(item.title), Boolean(item.media && item.media.url), Boolean(item.license)];
    return `${checks.filter(Boolean).length}/${checks.length}`;
  }

  previewMarkup(item) {
    const url = resolveItemPreviewUrl(item);
    if (!url) {
      return '<span class="row-thumb-placeholder">No</span>';
    }
    return `<img class="row-thumb" src="${url}" alt="${item.title || item.id}" />`;
  }

  render() {
    const items = Array.isArray(this.model.items) ? this.model.items : [];
    const selectedIds = new Set(Array.isArray(this.model.selectedItemIds) ? this.model.selectedItemIds : []);
    if (items.length === 0) {
      this.shadowRoot.innerHTML = `<style>${browserRendererStyles}</style><div class="empty">This collection has no items yet. Add item to begin.</div>`;
      return;
    }

    const rows = items.map((item) => `
      <tr
        class="${this.model.focusedItemId === item.workspaceId ? 'is-focused' : ''} ${selectedIds.has(item.workspaceId) ? 'is-selected' : ''}"
        data-id="${item.workspaceId}"
      >
        <td>
          <input
            type="checkbox"
            aria-label="Select ${item.title || item.id}"
            data-select-id="${item.workspaceId}"
            ${selectedIds.has(item.workspaceId) ? 'checked' : ''}
          />
        </td>
        <td>${this.previewMarkup(item)}</td>
        <td>${item.title || '(Untitled)'}</td>
        <td>${item.id || ''}</td>
        <td>${item.media?.type || ''}</td>
        <td>${this.requiredFieldScore(item)}</td>
        <td><button type="button" class="btn" data-open-id="${item.workspaceId}">View</button></td>
      </tr>
    `).join('');

    this.shadowRoot.innerHTML = `
      <style>${browserRendererStyles}</style>
      <div class="row-table-wrap">
        <table class="row-table" aria-label="Collection items list">
          <thead>
            <tr>
              <th>Select</th><th>Media</th><th>Title</th><th>ID</th><th>Type</th><th>Completeness</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;

    this.shadowRoot.querySelectorAll('tbody tr[data-id]').forEach((row) => {
      row.addEventListener('click', () => {
        this.dispatch('item-select', { workspaceId: row.getAttribute('data-id') });
      });
    });
    this.shadowRoot.querySelectorAll('input[data-select-id]').forEach((input) => {
      input.addEventListener('click', (event) => {
        event.stopPropagation();
      });
      input.addEventListener('change', (event) => {
        event.stopPropagation();
        this.dispatch('item-toggle-selected', {
          workspaceId: input.getAttribute('data-select-id'),
          selected: event.target?.checked === true,
        });
      });
    });
    this.shadowRoot.querySelectorAll('button[data-open-id]').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        this.dispatch('item-view', { workspaceId: button.getAttribute('data-open-id') });
      });
    });
  }
}

if (!customElements.get('open-item-row-list')) {
  customElements.define('open-item-row-list', OpenItemRowListElement);
}

export { OpenItemRowListElement };
