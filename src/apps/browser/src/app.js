import { ComponentBase, normalizeCollection } from '../../../library/core/src/index.js';
import { BROWSER_CONFIG } from './config.js';
import { bindDomEvents, cacheDomElements } from './controllers/dom-bindings.js';
import {
  announceManifestUrl,
  clearRecentManifestUrls,
  readRecentManifestUrls,
  rememberRecentManifestUrl,
  resolveStartupManifestUrl,
} from './controllers/manifest-controller.js';
import {
  closeViewer,
  findSelectedItem,
  findViewerItem,
  isMobileViewport,
  openViewer,
  selectItem,
} from './controllers/selection-controller.js';
import './components/browser-collection-browser.js';
import './components/browser-manifest-controls.js';
import './components/browser-metadata-panel.js';
import './components/browser-viewer-dialog.js';

class TimemapBrowserElement extends ComponentBase {
  constructor() {
    super();
    this.state = {
      collection: null,
      manifestUrlInput: '',
      currentManifestUrl: '',
      recentManifestUrls: readRecentManifestUrls(),
      selectedItemId: null,
      viewerItemId: null,
      mobileMetadataOpen: false,
      statusText: 'Load a collection manifest to browse.',
      statusTone: 'neutral',
    };
    this.shadow = this.attachShadow({ mode: 'open' });
    this.renderShell();
    this.cacheDom();
  }

  connectedCallback() {
    this.bindEvents();
    this.setStatus(this.state.statusText, this.state.statusTone);
    this.renderManifestControls();
    this.renderViewport();
    this.renderMetadata();
    this.initializeStartupManifest();
    this.syncMetadataPanelVisibility();
  }

  disconnectedCallback() {
    if (this._handleWindowResize) {
      window.removeEventListener('resize', this._handleWindowResize);
      this._handleWindowResize = null;
    }
  }

  bindEvents() {
    bindDomEvents(this);
  }

  cacheDom() {
    this.dom = cacheDomElements(this.shadow);
  }

  renderShell() {
    this.shadow.innerHTML = `
      <style>
        :host {
          display: block;
          height: 100%;
          min-height: 0;
          overflow: hidden;
          font-family: "Segoe UI", Tahoma, sans-serif;
          color: #111827;
          background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
        }

        * {
          box-sizing: border-box;
        }

        .shell {
          min-height: min(100dvh, 100vh);
          height: 100%;
          padding: 0.95rem;
          display: grid;
          grid-template-rows: minmax(0, 1fr);
        }

        :host([data-workbench-embed]) .shell {
          min-height: 0;
        }

        @media (max-width: 760px) {
          .shell {
            padding: 0.75rem;
          }
        }
      </style>
      <div class="shell">
        <open-browser-collection-browser id="browserViewport">
          <open-browser-manifest-controls id="manifestControls" slot="toolbar"></open-browser-manifest-controls>
          <open-browser-metadata-panel id="metadataPanel" slot="inspector"></open-browser-metadata-panel>
        </open-browser-collection-browser>
        <open-browser-viewer-dialog id="viewerDialog"></open-browser-viewer-dialog>
      </div>
    `;
  }

  initializeStartupManifest() {
    const startupManifestUrl = resolveStartupManifestUrl(this, BROWSER_CONFIG.defaultManifestUrl);
    if (!startupManifestUrl) {
      return;
    }
    this.setManifestInput(startupManifestUrl);
    this.loadCollection({ manifestUrl: startupManifestUrl, announceInput: false });
  }

  setManifestInput(manifestUrl) {
    this.state.manifestUrlInput = String(manifestUrl || '').trim();
    this.renderManifestControls();
  }

  setStatus(text, tone = 'neutral') {
    this.state.statusText = text;
    this.state.statusTone = tone;
    this.renderManifestControls();
  }

  isMobileViewport() {
    return isMobileViewport();
  }

  openMobileMetadataPanel() {
    this.state.mobileMetadataOpen = true;
    this.syncMetadataPanelVisibility();
  }

  closeMobileMetadataPanel() {
    this.state.mobileMetadataOpen = false;
    this.syncMetadataPanelVisibility();
  }

  syncMetadataPanelVisibility() {
    this.dom.metadataPanel?.setMobileOpen(this.isMobileViewport() && this.state.mobileMetadataOpen);
  }

  syncShellFrame() {
    const collectionTitle = this.state.collection?.title?.trim();
    const itemCount = this.state.collection?.items?.length || 0;
    return {
      shellTitle: collectionTitle || 'Collection browser',
      shellSubtitle: collectionTitle
        ? `${itemCount} item${itemCount === 1 ? '' : 's'} · Read-only browser`
        : 'Load a manifest to browse a single collection.',
    };
  }

  viewportModel() {
    const items = this.state.collection?.items || [];
    return {
      ...this.syncShellFrame(),
      viewportTitle: 'Collection items',
      viewportSubtitle: items.length > 0
        ? `${items.length} item${items.length === 1 ? '' : 's'} available. Click a card to inspect metadata, or use View to open media.`
        : 'Load a collection to browse its items.',
      items,
      selectedItemId: this.state.selectedItemId,
    };
  }

  metadataModel() {
    const selected = findSelectedItem(this);
    if (selected) {
      return {
        title: 'Metadata',
        contextText: `${selected.title || selected.id} · Read-only metadata`,
        fields: [
          ['Title', selected.title || ''],
          ['Identifier', selected.id || ''],
          ['Description', selected.description || ''],
          ['Creator', selected.creator || ''],
          ['Date', selected.date || ''],
          ['Location', selected.location || ''],
          ['License', selected.license || ''],
          ['Attribution', selected.attribution || ''],
          ['Source', selected.source || ''],
          ['Media URL', selected.media?.url || ''],
        ].map(([label, value]) => ({ label, value: value || '-' })),
        mobileOpen: this.isMobileViewport() && this.state.mobileMetadataOpen,
      };
    }

    const collection = this.state.collection;
    if (collection) {
      return {
        title: 'Metadata',
        contextText: `${collection.title || 'Collection'} · Collection overview`,
        fields: [
          ['Title', collection.title || ''],
          ['Description', collection.description || ''],
          ['Publisher', collection.publisher || ''],
          ['License', collection.license || ''],
          ['Items', String(collection.items?.length || 0)],
          ['Manifest URL', this.state.currentManifestUrl || ''],
        ].map(([label, value]) => ({ label, value: value || '-' })),
        mobileOpen: this.isMobileViewport() && this.state.mobileMetadataOpen,
      };
    }

    return {
      title: 'Metadata',
      contextText: 'Read-only details for the selected item.',
      fields: [],
      emptyText: 'Load a collection, then click a card to inspect metadata.',
      mobileOpen: this.isMobileViewport() && this.state.mobileMetadataOpen,
    };
  }

  renderManifestControls() {
    this.dom?.manifestControls?.update({
      currentManifestUrl: this.state.manifestUrlInput,
      recentManifestUrls: this.state.recentManifestUrls,
      statusText: this.state.statusText,
      statusTone: this.state.statusTone,
    });
  }

  renderViewport() {
    this.dom?.browserViewport?.update(this.viewportModel());
  }

  renderMetadata() {
    this.dom?.metadataPanel?.setView(this.metadataModel());
  }

  renderViewer() {
    const item = findViewerItem(this);
    if (!item) {
      this.closeViewer();
      return;
    }
    this.dom.viewerDialog?.setItem(item);
  }

  selectItem(itemId) {
    selectItem(this, itemId);
  }

  openViewer(itemId) {
    openViewer(this, itemId);
  }

  closeViewer() {
    closeViewer(this);
  }

  clearRecentManifestUrls() {
    clearRecentManifestUrls(this);
  }

  async loadCollection({ manifestUrl: explicitManifestUrl, announceInput = true } = {}) {
    const manifestUrl = String(explicitManifestUrl || this.state.manifestUrlInput || '').trim();
    if (!manifestUrl) {
      this.setStatus('Enter a manifest URL.', 'warn');
      return;
    }

    this.state.manifestUrlInput = manifestUrl;
    if (announceInput) {
      announceManifestUrl(this, manifestUrl);
    }

    this.setStatus('Loading collection...', 'neutral');
    try {
      const response = await fetch(manifestUrl);
      if (!response.ok) {
        this.setStatus(`Could not load manifest (${response.status}).`, 'warn');
        return;
      }

      const json = await response.json();
      const collection = normalizeCollection(json);
      this.state.collection = collection;
      this.state.currentManifestUrl = manifestUrl;
      this.state.selectedItemId = collection.items[0]?.id || null;
      this.state.viewerItemId = null;
      this.state.mobileMetadataOpen = false;
      rememberRecentManifestUrl(this, manifestUrl);
      this.setStatus(`Loaded ${collection.title} (${collection.items.length} items).`, 'ok');
      announceManifestUrl(this, manifestUrl);
      this.renderManifestControls();
      this.renderViewport();
      this.renderMetadata();
      this.renderViewer();
      this.syncMetadataPanelVisibility();
    } catch (error) {
      this.setStatus(`Load failed: ${error.message}`, 'warn');
    }
  }
}

if (!customElements.get('timemap-browser')) {
  customElements.define('timemap-browser', TimemapBrowserElement);
}
