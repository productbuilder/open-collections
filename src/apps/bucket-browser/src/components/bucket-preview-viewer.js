import { previewStyles } from '../css/preview.css.js';

class PbBucketPreviewViewerElement extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.model = { asset: null };
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
    this.shadowRoot.getElementById('closePreviewBtn')?.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('preview-close', { bubbles: true, composed: true }));
    });
  }

  render() {
    const asset = this.model.asset;
    const open = Boolean(asset);
    this.shadowRoot.innerHTML = `
      <style>${previewStyles}</style>
      <section class="preview-shell ${open ? 'is-open' : ''}" aria-hidden="${open ? 'false' : 'true'}">
        <div class="preview-card">
          <div class="preview-header">
            <div>
              <h2>Preview viewer</h2>
              <p>${asset ? asset.name : 'Select Preview on an asset to open a richer viewer placeholder.'}</p>
            </div>
            <button id="closePreviewBtn" class="btn" type="button">Close</button>
          </div>
          <div class="preview-body">
            ${asset ? `
              <div class="preview-art">${asset.thumbnailLabel}</div>
              <div class="preview-meta">
                <p>${asset.summary}</p>
                <ul>
                  <li><strong>Kind:</strong> ${asset.kind}</li>
                  <li><strong>Path:</strong> ${asset.path}</li>
                  <li><strong>State:</strong> ${asset.syncState}</li>
                </ul>
                <p class="note">Placeholder viewer only. Future adapters can plug richer media previews in here.</p>
              </div>
            ` : '<div class="empty">No preview open.</div>'}
          </div>
        </div>
      </section>
    `;
  }
}

if (!customElements.get('pb-bucket-preview-viewer')) {
  customElements.define('pb-bucket-preview-viewer', PbBucketPreviewViewerElement);
}
