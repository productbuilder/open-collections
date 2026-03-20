import './bucket-card-grid.js';
import './bucket-row-list.js';
import { viewportStyles } from '../css/viewport.css.js';

class PbWorkspaceBrowserViewportElement extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.model = { assets: [], focusedAssetId: null, selectedAssetIds: [], currentViewMode: 'grid', activePath: '/' };
  }

  connectedCallback() {
    this.render();
    this.renderRenderer();
  }

  update(model = {}) {
    this.model = { ...this.model, ...model };
    if (this.isConnected) {
      this.render();
      this.renderRenderer();
    }
  }

  renderRenderer() {
    const host = this.shadowRoot.getElementById('rendererHost');
    if (!host) {
      return;
    }
    host.innerHTML = '';
    const tag = this.model.currentViewMode === 'list' ? 'pb-bucket-row-list' : 'pb-bucket-card-grid';
    const renderer = document.createElement(tag);
    renderer.update({
      assets: this.model.assets,
      focusedAssetId: this.model.focusedAssetId,
      selectedAssetIds: this.model.selectedAssetIds,
    });
    host.appendChild(renderer);
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>${viewportStyles}</style>
      <section class="viewport-panel">
        <div class="viewport-header">
          <div>
            <h2>Browser viewport</h2>
            <p>${this.model.assets.length} asset(s) visible in ${this.model.activePath}</p>
          </div>
          <span class="mode-chip">${this.model.currentViewMode}</span>
        </div>
        <div id="rendererHost" class="renderer-host"></div>
      </section>
    `;
  }
}

if (!customElements.get('pb-workspace-browser-viewport')) {
  customElements.define('pb-workspace-browser-viewport', PbWorkspaceBrowserViewportElement);
}
