import { browserStyles } from '../css/browser.css.js';
import '../../../collection-manager/src/components/panel-shell.js';
import '../../../collection-manager/src/components/pane-layout.js';
import './browser-item-card-grid.js';

class OpenBrowserCollectionBrowserElement extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.model = {
      viewportTitle: 'Collection items',
      viewportSubtitle: 'Load a collection to browse its items.',
      shellTitle: 'Collection browser',
      shellSubtitle: 'Load a manifest to browse a single collection.',
      items: [],
      selectedItemId: null,
    };
  }

  connectedCallback() {
    this.render();
    this.renderFrame();
    this.renderBody();
  }

  update(data = {}) {
    this.model = { ...this.model, ...data };
    if (!this.shadowRoot?.getElementById('panelShell')) {
      return;
    }
    this.renderFrame();
    this.renderBody();
  }

  renderFrame() {
    const panelShell = this.shadowRoot.getElementById('panelShell');
    const title = this.shadowRoot.getElementById('viewportTitle');
    const subtitle = this.shadowRoot.getElementById('viewportSubtitle');
    if (!panelShell || !title || !subtitle) {
      return;
    }

    panelShell.setAttribute('title', this.model.shellTitle || 'Collection browser');
    panelShell.setAttribute('subtitle', this.model.shellSubtitle || 'Load a manifest to browse a single collection.');
    title.textContent = this.model.viewportTitle || 'Collection items';
    subtitle.textContent = this.model.viewportSubtitle || '';
  }

  renderBody() {
    const host = this.shadowRoot.getElementById('browserHost');
    if (!host) {
      return;
    }
    host.innerHTML = '';
    const renderer = document.createElement('open-browser-item-card-grid');
    renderer.update({
      items: this.model.items,
      selectedItemId: this.model.selectedItemId,
    });
    host.appendChild(renderer);
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>${browserStyles}</style>
      <section class="viewport-panel" aria-label="Collection browser">
        <open-panel-shell id="panelShell" title="Collection browser" subtitle="Load a manifest to browse a single collection." show-back="false">
          <slot name="toolbar" slot="toolbar"></slot>
          <open-pane-layout id="paneLayout" inspector-placement="right">
            <section class="viewport-region" slot="main">
              <div class="viewport-summary">
                <h2 id="viewportTitle" class="viewport-title">Collection items</h2>
                <p id="viewportSubtitle" class="viewport-subtitle">Load a collection to browse its items.</p>
              </div>
              <div id="browserHost" class="browser-host"></div>
            </section>
            <slot name="inspector" slot="inspector"></slot>
          </open-pane-layout>
        </open-panel-shell>
      </section>
    `;
  }
}

if (!customElements.get('open-browser-collection-browser')) {
  customElements.define('open-browser-collection-browser', OpenBrowserCollectionBrowserElement);
}

export { OpenBrowserCollectionBrowserElement };

