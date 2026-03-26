import { ComponentBase, normalizeCollection } from '../../../shared/library-core/src/index.js';
import { BROWSER_CONFIG } from './config.js';
import { bindDomEvents, cacheDomElements } from './controllers/dom-bindings.js';
import {
  announceManifestUrl,
  clearRecentManifestUrls,
  hydrateRecentManifestUrls,
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
    this.renderHeader();
    this.renderManifestControls();
    this.renderViewport();
    this.renderMetadata();
    this.syncMetadataPanelVisibility();
    void this.hydrateRecentStateAndInitialize();
  }

  async hydrateRecentStateAndInitialize() {
    await hydrateRecentManifestUrls(this);
    this.renderManifestControls();
    this.initializeStartupManifest();
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
          background: #f3f5f8;
        }

        * {
          box-sizing: border-box;
        }

        .app-shell {
          height: min(100dvh, 100vh);
          min-height: 640px;
          background: #f3f5f8;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .browser-header {
          background: #ffffff;
          border-bottom: 1px solid #e5e7eb;
          padding: 0.85rem 1rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }

        .brand {
          display: grid;
          gap: 0.35rem;
          min-width: 0;
        }

        .title {
          margin: 0;
          font-size: 1rem;
          font-weight: 700;
          color: #111827;
        }

        .context {
          margin: 0;
          font-size: 0.83rem;
          color: #64748b;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 100%;
        }

        .manifest {
          margin: 0;
          font-size: 0.8rem;
          color: #94a3b8;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 100%;
        }

        .header-meta {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .mode-chip {
          display: inline-flex;
          align-items: center;
          border-radius: 999px;
          border: 1px solid #cbd5e1;
          padding: 0.1rem 0.5rem;
          font-size: 0.72rem;
          line-height: 1.2;
          font-weight: 700;
          color: #334155;
          background: #f8fafc;
          white-space: nowrap;
        }

        .header-status {
          display: inline-flex;
          align-items: center;
          min-height: 1.9rem;
          padding: 0.2rem 0.65rem;
          border-radius: 999px;
          border: 1px solid #cbd5e1;
          background: #f8fafc;
          color: #475569;
          font-size: 0.8rem;
          font-weight: 600;
          max-width: min(100%, 32rem);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .header-status[data-tone="ok"] {
          background: #ecfdf3;
          border-color: #86efac;
          color: #166534;
        }

        .header-status[data-tone="warn"] {
          background: #fff7ed;
          border-color: #fdba74;
          color: #9a3412;
        }

        .shell {
          flex: 1;
          min-height: 0;
          padding: 0.95rem;
          display: grid;
          grid-template-rows: minmax(0, 1fr);
        }

        :host([data-workbench-embed]) .app-shell {
          height: 100%;
          min-height: 0;
          border: 0;
          border-radius: 0;
        }

        :host([data-workbench-embed]) .shell {
          min-height: 0;
        }

        @media (max-width: 760px) {
          .app-shell {
            border: 0;
            border-radius: 0;
            min-height: 100dvh;
          }

          .browser-header {
            padding: 0.55rem 0.7rem;
            gap: 0.55rem;
            align-items: center;
          }

          .title {
            font-size: 0.9rem;
          }

          .context {
            font-size: 0.78rem;
          }

          .manifest {
            display: none;
          }

          .header-meta {
            row-gap: 0.35rem;
          }

          .mode-chip {
            font-size: 0.68rem;
          }

          .header-status {
            max-width: 100%;
            font-size: 0.75rem;
            min-height: 1.75rem;
          }

          .shell {
            padding: 0.75rem;
          }
        }
      </style>
      <div class="app-shell">
        <header class="browser-header">
          <div class="brand">
            <h1 class="title">Open Collections Browser</h1>
            <p id="browserContext" class="context">Read-only browsing for Open Collections manifests.</p>
            <p id="browserManifest" class="manifest" hidden></p>
          </div>
          <div class="header-meta">
            <span class="mode-chip">Read-only</span>
            <span id="browserHeaderStatus" class="header-status" data-tone="neutral">Load a collection manifest to browse.</span>
          </div>
        </header>
        <div class="shell">
          <open-browser-collection-browser id="browserViewport">
            <open-browser-manifest-controls id="manifestControls" slot="toolbar"></open-browser-manifest-controls>
            <open-browser-metadata-panel id="metadataPanel" slot="inspector"></open-browser-metadata-panel>
          </open-browser-collection-browser>
          <open-browser-viewer-dialog id="viewerDialog"></open-browser-viewer-dialog>
        </div>
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
    this.renderHeader();
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

  headerModel() {
    const collectionTitle = this.state.collection?.title?.trim();
    const itemCount = this.state.collection?.items?.length || 0;
    const contextText = collectionTitle
      ? `${collectionTitle} (${itemCount} item${itemCount === 1 ? '' : 's'})`
      : 'Read-only browsing for Open Collections manifests.';
    const manifestText = this.state.currentManifestUrl || '';
    return { contextText, manifestText };
  }

  syncShellFrame() {
    const collectionTitle = this.state.collection?.title?.trim();
    const itemCount = this.state.collection?.items?.length || 0;
    return {
      shellTitle: collectionTitle || 'Collection browser',
      shellSubtitle: collectionTitle
        ? `${itemCount} item${itemCount === 1 ? '' : 's'} - Read-only browser`
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
        contextText: `${selected.title || selected.id} - Read-only metadata`,
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
        contextText: `${collection.title || 'Collection'} - Collection overview`,
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

  renderHeader() {
    const context = this.dom?.browserContext;
    const manifest = this.dom?.browserManifest;
    const status = this.dom?.browserHeaderStatus;
    const model = this.headerModel();

    if (context) {
      context.textContent = model.contextText;
    }

    if (manifest) {
      const hasManifest = Boolean(model.manifestText);
      manifest.hidden = !hasManifest;
      manifest.textContent = hasManifest ? `Manifest: ${model.manifestText}` : '';
    }

    if (status) {
      status.textContent = this.state.statusText || '';
      status.dataset.tone = this.state.statusTone || 'neutral';
    }
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

