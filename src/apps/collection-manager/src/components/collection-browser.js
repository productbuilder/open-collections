import { browserStyles } from '../css/browser.css.js?v=20260322-titlebar-center';
import './panel-shell.js?v=20260322-titlebar-center';
import './view-toggle.js';
import './collection-card-grid.js';
import './collection-row-list.js';
import './item-card-grid.js';
import './item-row-list.js';
import { getPlatformType, PLATFORM_TYPES } from '../../../../shared/platform/index.js';

class OpenCollectionsBrowserElement extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.model = {
      currentLevel: 'collections',
      viewportTitle: 'Collections',
      workingStatus: {
        label: 'Draft',
        tone: 'neutral',
      },
      assetCountText: 'No assets loaded.',
      collections: [],
      items: [],
      selectedCollectionId: null,
      selectedCollectionIds: [],
      deletableSelectedCollectionCount: 0,
      focusedItemId: null,
      selectedItemIds: [],
      dropTargetActive: false,
      desktopFileDropEnabled: true,
      publishAction: {
        label: 'Publish collection',
        visible: false,
        disabled: true,
        reason: 'Select a collection to publish.',
      },
      viewModes: {
        collections: 'cards',
        items: 'cards',
      },
      onboarding: {
        visible: false,
      },
    };
  }

  connectedCallback() {
    this.model.desktopFileDropEnabled = this.detectDesktopFileDropSupport();
    this.mediaQueryList = typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(max-width: 760px)')
      : null;
    this.handleViewportChange = () => this.renderFrame();
    this.render();
    this.bindEvents();
    this.mediaQueryList?.addEventListener?.('change', this.handleViewportChange);
    this.renderFrame();
    this.renderBody();
    this.setDropTargetActive(this.model.dropTargetActive);
  }

  detectDesktopFileDropSupport() {
    return getPlatformType() !== PLATFORM_TYPES.CAPACITOR;
  }

  disconnectedCallback() {
    this.mediaQueryList?.removeEventListener?.('change', this.handleViewportChange);
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
    });
    this.shadowRoot.addEventListener('click', (event) => {
      const target = event.target instanceof Element ? event.target.closest('button') : null;
      if (!target) {
        return;
      }
      if (target.id === 'addExampleCollectionBtn') {
        this.dispatch('add-example-collection');
      } else if (target.id === 'addConnectionBtn') {
        this.dispatch('add-connection');
      } else if (target.id === 'createCollectionEmptyBtn') {
        this.dispatch('add-collection');
      }
    });
    this.shadowRoot.getElementById('publishCollectionBtn')?.addEventListener('click', () => {
      this.dispatch('publish-collection');
    });

    this.shadowRoot.getElementById('viewToggle')?.addEventListener('view-mode-change', (event) => {
      this.setCurrentViewMode(event.detail?.mode || 'cards');
    });
    this.shadowRoot.getElementById('deleteSelectedBtn')?.addEventListener('click', () => {
      if (this.model.currentLevel === 'collections') {
        this.dispatch('delete-selected-collections');
        return;
      }
      this.dispatch('delete-selected-items');
    });
    this.shadowRoot.getElementById('clearSelectionBtn')?.addEventListener('click', () => {
      if (this.model.currentLevel === 'collections') {
        this.dispatch('clear-collection-selection');
        return;
      }
      this.dispatch('clear-item-selection');
    });

    this.shadowRoot.getElementById('imageFileInput')?.addEventListener('change', (event) => {
      const files = Array.from(event.target?.files || []);
      if (files.length > 0) {
        this.dispatch('files-selected', { files });
      }
      event.target.value = '';
    });

    const assetWrap = this.shadowRoot.getElementById('assetWrap');
    if (!this.model.desktopFileDropEnabled) {
      return;
    }
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
    this.model.dropTargetActive = this.model.desktopFileDropEnabled && Boolean(active);
    const overlay = this.shadowRoot?.getElementById('assetDropOverlay');
    if (overlay) {
      overlay.classList.toggle('is-active', this.model.dropTargetActive);
    }
  }

  setPublishActionState(action = {}) {
    this.model.publishAction = {
      ...this.model.publishAction,
      ...action,
    };
    this.renderFrame();
  }

  setWorkingStatus(status = {}) {
    this.model.workingStatus = {
      ...this.model.workingStatus,
      ...status,
    };
    this.renderFrame();
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
    const selectionStatus = this.shadowRoot.getElementById('selectionStatus');
    const deleteSelectedBtn = this.shadowRoot.getElementById('deleteSelectedBtn');
    const clearSelectionBtn = this.shadowRoot.getElementById('clearSelectionBtn');
    const publishBtn = this.shadowRoot.getElementById('publishCollectionBtn');
    if (!panelShell || !addBtn || !viewToggle || !selectionStatus || !deleteSelectedBtn || !clearSelectionBtn || !publishBtn) {
      return;
    }

    const isCollectionsView = this.model.currentLevel === 'collections';

    panelShell.setAttribute('title', this.model.viewportTitle || 'Collections');
    if (isCollectionsView) {
      panelShell.removeAttribute('subtitle');
      panelShell.setAttribute('show-back', 'false');
    } else {
      const subtitle = this.model.assetCountText || 'No assets loaded.';
      if (subtitle) {
        panelShell.setAttribute('subtitle', subtitle);
      } else {
        panelShell.removeAttribute('subtitle');
      }
      panelShell.setAttribute('show-back', 'true');
    }
    if (isCollectionsView && this.model.workingStatus?.label) {
      panelShell.setAttribute('status-label', this.model.workingStatus.label);
      panelShell.setAttribute('status-tone', this.model.workingStatus.tone || 'neutral');
    } else {
      panelShell.removeAttribute('status-label');
      panelShell.removeAttribute('status-tone');
    }
    addBtn.textContent = this.model.currentLevel === 'collections' ? 'Add collection' : 'Add item';
    viewToggle.setAttribute('mode', this.getCurrentViewMode());
    const publishAction = this.model.publishAction || {};
    publishBtn.textContent = publishAction.label || 'Publish collection';
    publishBtn.hidden = publishAction.visible === false;
    publishBtn.disabled = publishAction.disabled !== false;
    const publishReason = publishAction.reason || '';
    if (publishReason) {
      publishBtn.title = publishReason;
      publishBtn.setAttribute('aria-label', `${publishBtn.textContent}. ${publishReason}`);
    } else {
      publishBtn.removeAttribute('title');
      publishBtn.setAttribute('aria-label', publishBtn.textContent);
    }
    const overlay = this.shadowRoot.getElementById('assetDropOverlay');
    if (overlay) {
      overlay.hidden = !this.model.desktopFileDropEnabled;
    }

    const isItemsView = this.model.currentLevel === 'items';
    const selectedItemCount = Array.isArray(this.model.selectedItemIds) ? this.model.selectedItemIds.length : 0;
    const selectedCollectionCount = Array.isArray(this.model.selectedCollectionIds) ? this.model.selectedCollectionIds.length : 0;
    const deletableSelectedCollectionCount = Number.isFinite(this.model.deletableSelectedCollectionCount)
      ? this.model.deletableSelectedCollectionCount
      : 0;

    if (isItemsView) {
      const showSelectionToolbar = selectedItemCount > 0;
      selectionStatus.hidden = !showSelectionToolbar;
      deleteSelectedBtn.hidden = !showSelectionToolbar;
      clearSelectionBtn.hidden = !showSelectionToolbar;
      selectionStatus.textContent = `${selectedItemCount} selected`;
      deleteSelectedBtn.textContent = 'Delete selected';
      deleteSelectedBtn.disabled = false;
      return;
    }

    const isMobile = this.mediaQueryList?.matches ?? false;
    selectionStatus.hidden = selectedCollectionCount === 0;
    selectionStatus.textContent = `#${selectedCollectionCount}`;
    deleteSelectedBtn.hidden = false;
    deleteSelectedBtn.innerHTML = isMobile
      ? '<span class="material-icons icon" aria-hidden="true">delete</span>'
      : 'Delete selected';
    deleteSelectedBtn.setAttribute('aria-label', 'Delete selected collections');
    deleteSelectedBtn.disabled = deletableSelectedCollectionCount === 0;
    clearSelectionBtn.hidden = selectedCollectionCount === 0;
  }

  renderBody() {
    const host = this.shadowRoot.getElementById('browserHost');
    if (!host) {
      return;
    }
    host.innerHTML = '';

    if (this.model.onboarding?.visible) {
      host.innerHTML = `
        <section class="onboarding-empty" aria-label="Get started">
          <h3>Start your first collection workspace</h3>
          <p>Choose how you want to begin.</p>
          <div class="onboarding-actions">
            <button class="btn" id="addExampleCollectionBtn" type="button">Add example collection</button>
            <button class="btn" id="addConnectionBtn" type="button">Add connection</button>
            <button class="btn btn-primary" id="createCollectionEmptyBtn" type="button">Create collection</button>
          </div>
        </section>
      `;
      return;
    }

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
        selectedCollectionIds: this.model.selectedCollectionIds,
      });
    } else {
      renderer.update({
        items: this.model.items,
        focusedItemId: this.model.focusedItemId,
        selectedItemIds: this.model.selectedItemIds,
      });
    }
    host.appendChild(renderer);
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>${browserStyles}</style>
      <section class="viewport-panel" aria-label="Collection browser">
        <open-panel-shell id="panelShell" title="Collections" show-back="false">
          <div class="viewport-actions viewport-title-actions" slot="header-actions">
            <button class="btn btn-primary" id="publishCollectionBtn" type="button" hidden disabled>Publish collection</button>
            <input id="imageFileInput" type="file" accept=".jpg,.jpeg,.png,.webp,.gif" multiple hidden />
          </div>
          <div class="viewport-actions viewport-toolbar-main" slot="toolbar">
            <open-view-toggle id="viewToggle" mode="cards"></open-view-toggle>
            <button class="btn btn-danger" id="deleteSelectedBtn" type="button" hidden>Delete selected</button>
            <span id="selectionStatus" class="selection-status" hidden>#0</span>
            <button class="btn" id="clearSelectionBtn" type="button" hidden>Clear selection</button>
          </div>
          <div class="viewport-actions viewport-toolbar-actions" slot="toolbar-actions">
            <button class="btn" id="addImagesBtn" type="button">Add item</button>
          </div>
          <div id="assetWrap" class="asset-wrap">
            <div id="assetDropOverlay" class="drop-overlay">Drop image files to add them to this collection draft</div>
            <div id="browserHost" class="browser-host"></div>
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
