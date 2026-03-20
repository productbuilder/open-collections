import { cardGridStyles } from '../css/card-grid.css.js';

class PbBucketCardGridElement extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.model = { assets: [], focusedAssetId: null, selectedAssetIds: [] };
  }

  connectedCallback() {
    this.render();
    this.bindEvents();
  }

  update(model = {}) {
    this.model = { ...this.model, ...model };
    if (this.isConnected) {
      this.render();
      this.bindEvents();
    }
  }

  bindEvents() {
    this.shadowRoot.querySelectorAll('[data-focus-id]').forEach((card) => {
      card.addEventListener('click', (event) => {
        if (event.target.closest('input[type="checkbox"]')) {
          return;
        }
        this.dispatch('asset-focus', { assetId: card.dataset.focusId });
      });
    });
    this.shadowRoot.querySelectorAll('[data-select-id]').forEach((checkbox) => {
      checkbox.addEventListener('change', () => {
        this.dispatch('asset-selection-toggle', { assetId: checkbox.dataset.selectId });
      });
    });
    this.shadowRoot.querySelectorAll('[data-preview-id]').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        this.dispatch('asset-preview', { assetId: button.dataset.previewId });
      });
    });
  }

  dispatch(name, detail = {}) {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }

  render() {
    const cards = this.model.assets.map((asset) => {
      const isFocused = asset.id === this.model.focusedAssetId;
      const isSelected = this.model.selectedAssetIds.includes(asset.id);
      return `
        <article class="asset-card ${isFocused ? 'is-focused' : ''}" data-focus-id="${asset.id}">
          <div class="asset-thumb">${asset.thumbnailLabel}</div>
          <div class="asset-content">
            <div class="asset-title-row">
              <h3>${asset.name}</h3>
              <input type="checkbox" data-select-id="${asset.id}" ${isSelected ? 'checked' : ''} aria-label="Select ${asset.name}" />
            </div>
            <p>${asset.summary}</p>
            <dl>
              <div><dt>Type</dt><dd>${asset.kind}</dd></div>
              <div><dt>State</dt><dd>${asset.syncState}</dd></div>
              <div><dt>Size</dt><dd>${asset.sizeLabel}</dd></div>
            </dl>
            <button class="btn" type="button" data-preview-id="${asset.id}">Preview</button>
          </div>
        </article>
      `;
    }).join('');

    this.shadowRoot.innerHTML = `
      <style>${cardGridStyles}</style>
      <section class="card-grid">${cards || '<div class="empty">No assets match this path and filter set.</div>'}</section>
    `;
  }
}

if (!customElements.get('pb-bucket-card-grid')) {
  customElements.define('pb-bucket-card-grid', PbBucketCardGridElement);
}
