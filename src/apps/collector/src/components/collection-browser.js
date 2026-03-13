import { browserStyles } from '../css/browser.css.js';
import './panel-shell.js';
import './view-toggle.js';
import './collection-card-grid.js';
import './collection-row-list.js';
import './item-card-grid.js';
import './item-row-list.js';

class OpenCollectionsBrowserElement extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.model = {
      currentLevel: 'collections',
      viewportTitle: 'Collections',
      assetCountText: 'No assets loaded.',
      collections: [],
      items: [],
      selectedCollectionId: null,
      selectedItemId: null,
      dropTargetActive: false,
      viewModes: {
        collections: 'cards',
        items: 'cards',
      },
    };
  }

  connectedCallback() {
    this.render();
    this.bindEvents();
    this.renderFrame();
    this.renderBody();
    this.setDropTargetActive(this.model.dropTargetActive);
  }

  bindEvents() {
    this.shadowRoot.getElementById('panelShell')?.addEventListener('panel-back', () => {
      this.dispatch('back-to-collections');
    });

    this.shadowRoot.getElementById('addImagesBtn')?.addEventListener('click', () => {
      if (this.model.currentLevel === 'collections') {
        this.dispatch('add-collection');
        return;
      }
      this.dispatch('add-item');
      this.shadowRoot.getElementById('imageFileInput')?.click();
    });

    this.shadowRoot.getElementById('viewToggle')?.addEventListener('view-mode-change', (event) => {
      this.setCurrentViewMode(event.detail?.mode || 'cards');
    });

    this.shadowRoot.getElementById('imageFileInput')?.addEventListener('change', (event) => {
      const files = Array.from(event.target?.files || []);
      if (files.length > 0) {
        this.dispatch('files-selected', { files });
      }
      event.target.value = '';
    });

    const assetWrap = this.shadowRoot.getElementById('assetWrap');
    assetWrap?.addEventListener('dragenter', (event) => {
      event.preventDefault();
      this.dispatch('drop-target-change', { active: true });
    });
    assetWrap?.addEventListener('dragover', (event) => {
      event.preventDefault();
      this.dispatch('drop-target-change', { active: true });
    });
    assetWrap?.addEventListener('dragleave', (event) => {
      event.preventDefault();
      if (!event.relatedTarget || !assetWrap.contains(event.relatedTarget)) {
        this.dispatch('drop-target-change', { active: false });
      }
    });
    assetWrap?.addEventListener('drop', (event) => {
      event.preventDefault();
      this.dispatch('drop-target-change', { active: false });
      const files = Array.from(event.dataTransfer?.files || []);
      if (files.length > 0) {
        this.dispatch('files-selected', { files });
      }
    });
  }

  dispatch(name, detail = {}) {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }

  setSourceOptions(options, selectedValue = 'all') {
    void options;
    void selectedValue;
  }

  setCollectionOptions(options, selectedValue = 'all') {
    void options;
    void selectedValue;
  }

  setDropTargetActive(active) {
    this.model.dropTargetActive = Boolean(active);
    const overlay = this.shadowRoot?.getElementById('assetDropOverlay');
    if (overlay) {
      overlay.classList.toggle('is-active', this.model.dropTargetActive);
    }
  }

  getCurrentViewMode() {
    const level = this.model.currentLevel === 'items' ? 'items' : 'collections';
    return this.model.viewModes?.[level] || 'cards';
  }

  setCurrentViewMode(mode) {
    const normalizedMode = mode === 'rows' ? 'rows' : 'cards';
    const level = this.model.currentLevel === 'items' ? 'items' : 'collections';
    this.model.viewModes = {
      ...this.model.viewModes,
      [level]: normalizedMode,
    };
    this.dispatch('view-mode-change', { level, mode: normalizedMode });
    this.renderBody();
    this.renderFrame();
  }

  update(data = {}) {
    const viewModes = data.viewModes ? { ...this.model.viewModes, ...data.viewModes } : this.model.viewModes;
    this.model = {
      ...this.model,
      ...data,
      viewModes,
    };
    if (!this.shadowRoot?.getElementById('panelShell')) {
      return;
    }
    this.renderFrame();
    this.renderBody();
    this.setDropTargetActive(this.model.dropTargetActive);
  }

  renderFrame() {
    const panelShell = this.shadowRoot.getElementById('panelShell');
    const addBtn = this.shadowRoot.getElementById('addImagesBtn');
    const viewToggle = this.shadowRoot.getElementById('viewToggle');
    if (!panelShell || !addBtn || !viewToggle) {
      return;
    }

    panelShell.setAttribute('title', this.model.viewportTitle || 'Collections');
    panelShell.setAttribute('subtitle', this.model.assetCountText || 'No assets loaded.');
    panelShell.setAttribute('show-back', this.model.currentLevel === 'collections' ? 'false' : 'true');
    addBtn.textContent = this.model.currentLevel === 'collections' ? 'Add collection' : 'Add item';
    viewToggle.setAttribute('mode', this.getCurrentViewMode());
  }

  renderBody() {
    const host = this.shadowRoot.getElementById('browserHost');
    if (!host) {
      return;
    }
    host.innerHTML = '';

    const level = this.model.currentLevel === 'items' ? 'items' : 'collections';
    const mode = this.getCurrentViewMode();
    const componentTag = level === 'collections'
      ? mode === 'rows' ? 'open-collection-row-list' : 'open-collection-card-grid'
      : mode === 'rows' ? 'open-item-row-list' : 'open-item-card-grid';

    const renderer = document.createElement(componentTag);
    if (level === 'collections') {
      renderer.update({
        collections: this.model.collections,
        selectedCollectionId: this.model.selectedCollectionId,
      });
    } else {
      renderer.update({
        items: this.model.items,
        selectedItemId: this.model.selectedItemId,
      });
    }
    host.appendChild(renderer);
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>${browserStyles}</style>
      <section class="viewport-panel" aria-label="Collection browser">
        <open-panel-shell id="panelShell" title="Collections" subtitle="No assets loaded." show-back="false">
          <div class="viewport-actions" slot="toolbar">
            <open-view-toggle id="viewToggle" mode="cards"></open-view-toggle>
          </div>
          <div class="viewport-actions" slot="header-actions">
            <button class="btn" id="addImagesBtn" type="button">Add item</button>
            <input id="imageFileInput" type="file" accept=".jpg,.jpeg,.png,.webp,.gif" multiple hidden />
          </div>
          <div id="assetWrap" class="asset-wrap">
            <div id="assetDropOverlay" class="drop-overlay">Drop image files to add them to this collection draft</div>
            <div id="browserHost"></div>
          </div>
        </open-panel-shell>
      </section>
    `;
  }
}

if (!customElements.get('open-collections-browser')) {
  customElements.define('open-collections-browser', OpenCollectionsBrowserElement);
}

export { OpenCollectionsBrowserElement };
