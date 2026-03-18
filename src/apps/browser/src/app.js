import { ComponentBase, normalizeCollection } from '../../../library/core/src/index.js';
import '../../../apps/manager/src/components/panel-shell.js';
import '../../../apps/manager/src/components/pane-layout.js';
import { BROWSER_CONFIG } from './config.js';

const RECENT_MANIFEST_STORAGE_KEY = 'open-collections-browser:recent-manifest-urls:v1';
const MAX_RECENT_MANIFEST_URLS = 8;

class TimemapBrowserElement extends ComponentBase {
  constructor() {
    super();
    this.state = {
      collection: null,
      currentManifestUrl: '',
      recentManifestUrls: this.readRecentManifestUrls(),
      selectedId: null,
      viewerId: null,
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
    this.syncShellFrame();
    this.renderRecentManifestUrls();
    this.initializeStartupManifest();
    this.renderGrid();
    this.renderMetadata();
    this.syncMetadataPanelVisibility();
  }

  disconnectedCallback() {
    if (this._handleWindowResize) {
      window.removeEventListener('resize', this._handleWindowResize);
      this._handleWindowResize = null;
    }
  }

  initializeStartupManifest() {
    const startupManifestUrl = this.resolveStartupManifestUrl();
    if (!startupManifestUrl) {
      return;
    }
    this.dom.manifestUrlInput.value = startupManifestUrl;
    this.syncRecentSelection(startupManifestUrl);
    this.loadCollection({ manifestUrl: startupManifestUrl, announceInput: false });
  }

  resolveStartupManifestUrl() {
    const attrStartupUrl = this.getAttribute('startup-manifest-url') || this.dataset.startupManifestUrl || '';
    const queryStartupUrl = new URLSearchParams(window.location.search).get('manifest') || '';
    const rememberedRecentUrl = this.state.recentManifestUrls[0] || '';
    return attrStartupUrl.trim() || queryStartupUrl.trim() || rememberedRecentUrl || BROWSER_CONFIG.defaultManifestUrl;
  }

  readRecentManifestUrls() {
    try {
      const raw = window.localStorage.getItem(RECENT_MANIFEST_STORAGE_KEY) || '[]';
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed
        .map((value) => this.normalizePersistedManifestUrl(value))
        .filter(Boolean)
        .slice(0, MAX_RECENT_MANIFEST_URLS);
    } catch {
      return [];
    }
  }

  writeRecentManifestUrls(urls) {
    this.state.recentManifestUrls = urls;
    try {
      window.localStorage.setItem(RECENT_MANIFEST_STORAGE_KEY, JSON.stringify(urls));
    } catch {
      // Ignore storage failures and keep the in-memory list available for this session.
    }
    this.renderRecentManifestUrls();
  }

  normalizePersistedManifestUrl(manifestUrl) {
    const trimmed = String(manifestUrl || '').trim();
    if (!trimmed) {
      return '';
    }

    try {
      const resolvedUrl = new URL(trimmed, window.location.href);
      const protocol = resolvedUrl.protocol.toLowerCase();
      if (!['http:', 'https:'].includes(protocol)) {
        return '';
      }
      if (resolvedUrl.username || resolvedUrl.password) {
        return '';
      }
      const sensitiveParamNames = new Set(['access_token', 'auth', 'key', 'secret', 'sig', 'signature', 'token', 'x-amz-signature']);
      const hasSensitiveParams = Array.from(resolvedUrl.searchParams.keys())
        .some((name) => sensitiveParamNames.has(String(name || '').toLowerCase()));
      if (hasSensitiveParams) {
        return '';
      }
      return resolvedUrl.href;
    } catch {
      return '';
    }
  }

  rememberRecentManifestUrl(manifestUrl) {
    const normalizedUrl = this.normalizePersistedManifestUrl(manifestUrl);
    if (!normalizedUrl) {
      return;
    }
    const nextUrls = [normalizedUrl, ...this.state.recentManifestUrls.filter((url) => url !== normalizedUrl)]
      .slice(0, MAX_RECENT_MANIFEST_URLS);
    this.writeRecentManifestUrls(nextUrls);
    this.syncRecentSelection(normalizedUrl);
  }

  clearRecentManifestUrls() {
    this.writeRecentManifestUrls([]);
    this.dom.recentManifestSelect.value = '';
  }

  syncRecentSelection(manifestUrl = this.dom.manifestUrlInput?.value || '') {
    if (!this.dom?.recentManifestSelect) {
      return;
    }
    const normalizedUrl = this.normalizePersistedManifestUrl(manifestUrl);
    this.dom.recentManifestSelect.value = normalizedUrl || '';
  }

  isMobileViewport() {
    return typeof window !== 'undefined' && window.matchMedia('(max-width: 760px)').matches;
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
    const metadataPanel = this.dom?.metadataPanel;
    if (!metadataPanel) {
      return;
    }

    const shouldShowOverlay = this.isMobileViewport() && this.state.mobileMetadataOpen;
    metadataPanel.classList.toggle('is-mobile-open', shouldShowOverlay);
    metadataPanel.classList.toggle('is-mobile-hidden', this.isMobileViewport() && !this.state.mobileMetadataOpen);
    this.dom.metadataCloseBtn.hidden = !this.isMobileViewport();
  }

  syncShellFrame() {
    if (!this.dom?.browserShell) {
      return;
    }

    const collectionTitle = this.state.collection?.title?.trim();
    const itemCount = this.state.collection?.items?.length || 0;
    const subtitle = collectionTitle
      ? `${itemCount} item${itemCount === 1 ? '' : 's'} · Read-only browser`
      : 'Load a manifest to browse a single collection.';

    this.dom.browserShell.setAttribute('title', collectionTitle || 'Collection browser');
    this.dom.browserShell.setAttribute('subtitle', subtitle);
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

        .viewport-panel {
          display: grid;
          grid-template-rows: minmax(0, 1fr);
          min-height: 0;
        }

        .toolbar-stack {
          display: grid;
          gap: 0.7rem;
          width: 100%;
        }

        .manifest-control {
          display: grid;
          gap: 0.45rem;
          width: 100%;
        }

        .field-label {
          font-size: 0.76rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: #475569;
        }

        .manifest-entry-row,
        .manifest-secondary-row {
          display: flex;
          align-items: center;
          gap: 0.55rem;
          flex-wrap: wrap;
        }

        .manifest-input-wrap {
          flex: 1 1 24rem;
          min-width: min(100%, 18rem);
        }

        .recent-input-wrap {
          flex: 1 1 20rem;
          min-width: min(100%, 16rem);
        }

        .text-input,
        .select-input,
        .dialog-btn,
        .btn {
          width: 100%;
          font: inherit;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 0.5rem 0.65rem;
          background: #fff;
          color: #111827;
        }

        .text-input:focus,
        .select-input:focus,
        .btn:focus,
        .dialog-btn:focus {
          outline: 2px solid rgba(15, 108, 198, 0.18);
          outline-offset: 2px;
          border-color: #0f6cc6;
        }

        .btn,
        .dialog-btn {
          width: auto;
          padding: 0.48rem 0.75rem;
          cursor: pointer;
          font-size: 0.88rem;
          font-weight: 600;
        }

        .btn:hover,
        .dialog-btn:hover {
          background: #f8fafc;
        }

        .btn:disabled,
        .dialog-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-primary {
          border-color: #0f6cc6;
          background: #0f6cc6;
          color: #ffffff;
        }

        .btn-primary:hover {
          background: #0b5aa6;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          min-height: 2.35rem;
          padding: 0.2rem 0.7rem;
          border-radius: 999px;
          border: 1px solid #cbd5e1;
          background: #f8fafc;
          font-size: 0.82rem;
          font-weight: 600;
          color: #475569;
        }

        .status-badge[data-tone="ok"] {
          background: #ecfdf3;
          border-color: #86efac;
          color: #166534;
        }

        .status-badge[data-tone="warn"] {
          background: #fff7ed;
          border-color: #fdba74;
          color: #9a3412;
        }

        open-pane-layout {
          display: block;
          min-height: 0;
          height: 100%;
        }

        .viewport-region {
          min-height: 0;
          height: 100%;
          display: grid;
          grid-template-rows: auto minmax(0, 1fr);
          gap: 0.85rem;
          padding: 0.95rem;
          overflow: hidden;
        }

        .viewport-summary {
          display: grid;
          gap: 0.2rem;
          padding: 0 0.1rem;
        }

        .viewport-title {
          margin: 0;
          font-size: 0.94rem;
          color: #111827;
        }

        .viewport-subtitle {
          margin: 0;
          font-size: 0.83rem;
          color: #64748b;
        }

        .grid-scroll {
          min-height: 0;
          overflow: auto;
          overscroll-behavior: contain;
          padding-right: 0.1rem;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 0.75rem;
          align-content: start;
        }

        .card {
          border: 1px solid #dbe3ec;
          border-radius: 12px;
          padding: 0.6rem;
          display: grid;
          grid-template-rows: auto minmax(2.5rem, auto) auto auto;
          gap: 0.55rem;
          cursor: pointer;
          background: rgba(255, 255, 255, 0.88);
          backdrop-filter: blur(4px);
          transition: border-color 120ms ease, box-shadow 120ms ease, background-color 120ms ease, transform 120ms ease;
        }

        .card:hover {
          border-color: #93c5fd;
          box-shadow: 0 6px 24px rgba(15, 23, 42, 0.08);
          background: rgba(255, 255, 255, 0.96);
          transform: translateY(-1px);
        }

        .card.is-selected {
          border-color: #0f6cc6;
          box-shadow: 0 0 0 1px #66a6e8 inset, 0 10px 30px rgba(15, 108, 198, 0.16);
          background: #f5faff;
        }

        .thumb-frame {
          width: 100%;
          height: 140px;
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid #dbe3ec;
          background: #eef2f7;
        }

        .thumb,
        .thumb-placeholder {
          width: 100%;
          height: 100%;
          display: block;
        }

        .thumb {
          object-fit: cover;
          background: transparent;
        }

        .thumb-placeholder {
          display: grid;
          place-items: center;
          color: #64748b;
          font-size: 0.82rem;
          background: #f8fafc;
        }

        .card-title {
          margin: 0;
          font-size: 0.9rem;
          font-weight: 700;
          line-height: 1.25;
          color: #111827;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .meta {
          margin: 0;
          font-size: 0.82rem;
          color: #475569;
          line-height: 1.45;
        }

        .card-actions {
          display: flex;
          justify-content: flex-end;
        }

        .card-actions .btn {
          min-width: 6rem;
        }

        .metadata-panel {
          height: 100%;
          min-height: 0;
          display: grid;
          grid-template-rows: auto minmax(0, 1fr);
          background: rgba(255, 255, 255, 0.94);
          border-left: 1px solid #dbe3ec;
          overflow: hidden;
        }

        .metadata-panel-header {
          padding: 1rem 1rem 0.9rem;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 0.75rem;
        }

        .metadata-header-meta {
          display: grid;
          gap: 0.24rem;
          min-width: 0;
        }

        .metadata-title {
          margin: 0;
          font-size: 0.95rem;
          color: #111827;
        }

        .metadata-context {
          margin: 0;
          font-size: 0.82rem;
          color: #64748b;
          word-break: break-word;
        }

        .metadata-panel-body {
          min-height: 0;
          overflow: auto;
          padding: 1rem;
          display: grid;
          gap: 1rem;
          align-content: start;
        }

        .metadata-list {
          display: grid;
          gap: 0.75rem;
          margin: 0;
        }

        .metadata-row {
          display: grid;
          gap: 0.22rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid #edf2f7;
        }

        .metadata-row:last-child {
          padding-bottom: 0;
          border-bottom: none;
        }

        .metadata-row dt,
        .metadata-row dd {
          margin: 0;
        }

        .metadata-row dt {
          font-size: 0.74rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: #64748b;
        }

        .metadata-row dd {
          font-size: 0.84rem;
          color: #334155;
          line-height: 1.45;
          word-break: break-word;
        }

        .empty {
          border: 1px dashed #cbd5e1;
          border-radius: 10px;
          padding: 1rem;
          text-align: center;
          color: #64748b;
          background: #f8fafc;
        }

        dialog {
          width: min(980px, 96vw);
          border: 1px solid #dbe3ec;
          border-radius: 12px;
          padding: 0;
        }

        dialog::backdrop {
          background: rgba(15, 23, 42, 0.45);
        }

        .dialog-shell {
          display: grid;
          grid-template-rows: auto 1fr;
          max-height: min(85vh, 760px);
        }

        .dialog-header {
          padding: 0.75rem 0.9rem;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.65rem;
        }

        .dialog-body {
          padding: 0.85rem;
          overflow: auto;
        }

        .viewer-media {
          width: 100%;
          max-height: 64vh;
          border-radius: 8px;
          border: 1px solid #dbe3ec;
          background: #f8fafc;
        }

        @media (max-width: 1080px) {
          .metadata-panel {
            border-left: none;
            border-top: 1px solid #dbe3ec;
          }
        }

        @media (max-width: 760px) {
          .shell {
            padding: 0.75rem;
          }

          .viewport-region {
            padding: 0.8rem;
            gap: 0.7rem;
          }

          .manifest-entry-row,
          .manifest-secondary-row,
          .dialog-header {
            align-items: stretch;
          }

          .manifest-entry-row .btn,
          .manifest-secondary-row .btn {
            width: 100%;
          }

          .status-badge {
            white-space: normal;
            border-radius: 16px;
          }

          .grid {
            grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
            gap: 0.6rem;
          }

          .thumb-frame {
            height: 112px;
          }

          .metadata-panel {
            display: none;
            position: fixed;
            inset: 0;
            z-index: 20;
            border: none;
            background: rgba(255, 255, 255, 0.98);
          }

          .metadata-panel.is-mobile-hidden {
            display: none;
          }

          .metadata-panel.is-mobile-open {
            display: grid;
          }
        }
      </style>
      <div class="shell">
        <section class="viewport-panel" aria-label="Collection browser workspace">
          <open-panel-shell id="browserShell" title="Collection browser" subtitle="Load a manifest to browse a single collection." show-back="false">
            <div class="toolbar-stack" slot="toolbar">
              <div class="manifest-control">
                <span class="field-label">Manifest URL</span>
                <div class="manifest-entry-row">
                  <div class="manifest-input-wrap">
                    <input id="manifestUrlInput" class="text-input" type="text" placeholder="https://example.org/collection.json" />
                  </div>
                  <button id="loadBtn" class="btn btn-primary" type="button">Load</button>
                </div>
                <div class="manifest-secondary-row">
                  <div class="recent-input-wrap">
                    <select id="recentManifestSelect" class="select-input" aria-label="Recent manifest URLs">
                      <option value="">No recent manifests</option>
                    </select>
                  </div>
                  <button id="useRecentBtn" class="btn" type="button">Use recent</button>
                  <button id="clearRecentBtn" class="btn" type="button">Clear recent</button>
                  <span id="statusText" class="status-badge" data-tone="neutral">Load a collection manifest to browse.</span>
                </div>
              </div>
            </div>
            <open-pane-layout id="paneLayout" inspector-placement="right">
              <section class="viewport-region" slot="main">
                <div class="viewport-summary">
                  <h2 class="viewport-title">Collection items</h2>
                  <p id="gridSummary" class="viewport-subtitle">Load a collection to browse its items.</p>
                </div>
                <div class="grid-scroll">
                  <div id="grid" class="grid"></div>
                </div>
              </section>
              <aside id="metadataPanel" class="metadata-panel" slot="inspector" aria-label="Metadata panel">
                <div class="metadata-panel-header">
                  <div class="metadata-header-meta">
                    <h2 class="metadata-title">Metadata</h2>
                    <p id="detailSummary" class="metadata-context">Read-only details for the selected item.</p>
                  </div>
                  <button id="metadataCloseBtn" class="btn" type="button" hidden>Close</button>
                </div>
                <div id="detail" class="metadata-panel-body"></div>
              </aside>
            </open-pane-layout>
          </open-panel-shell>
        </section>
      </div>
      <dialog id="viewerDialog" aria-label="Media viewer">
        <div class="dialog-shell">
          <div class="dialog-header">
            <h2 id="viewerTitle" class="metadata-title">Viewer</h2>
            <button id="closeViewerBtn" class="dialog-btn" type="button">Close</button>
          </div>
          <div id="viewerBody" class="dialog-body"></div>
        </div>
      </dialog>
    `;
  }

  cacheDom() {
    const root = this.shadow;
    this.dom = {
      browserShell: root.getElementById('browserShell'),
      paneLayout: root.getElementById('paneLayout'),
      statusText: root.getElementById('statusText'),
      manifestUrlInput: root.getElementById('manifestUrlInput'),
      loadBtn: root.getElementById('loadBtn'),
      recentManifestSelect: root.getElementById('recentManifestSelect'),
      useRecentBtn: root.getElementById('useRecentBtn'),
      clearRecentBtn: root.getElementById('clearRecentBtn'),
      gridSummary: root.getElementById('gridSummary'),
      detailSummary: root.getElementById('detailSummary'),
      grid: root.getElementById('grid'),
      detail: root.getElementById('detail'),
      metadataPanel: root.getElementById('metadataPanel'),
      metadataCloseBtn: root.getElementById('metadataCloseBtn'),
      viewerDialog: root.getElementById('viewerDialog'),
      viewerTitle: root.getElementById('viewerTitle'),
      viewerBody: root.getElementById('viewerBody'),
      closeViewerBtn: root.getElementById('closeViewerBtn'),
    };
  }

  bindEvents() {
    if (this._eventsBound) {
      return;
    }

    this._eventsBound = true;
    this._handleWindowResize = () => this.syncMetadataPanelVisibility();
    window.addEventListener('resize', this._handleWindowResize);

    this.dom.loadBtn.addEventListener('click', async () => {
      await this.loadCollection();
    });
    this.dom.useRecentBtn.addEventListener('click', async () => {
      await this.loadSelectedRecentManifest();
    });
    this.dom.clearRecentBtn.addEventListener('click', () => {
      this.clearRecentManifestUrls();
      this.setStatus('Cleared recent manifest URLs for this browser.', 'neutral');
    });
    this.dom.metadataCloseBtn.addEventListener('click', () => {
      this.closeMobileMetadataPanel();
    });
    this.dom.manifestUrlInput.addEventListener('keydown', async (event) => {
      if (event.key !== 'Enter') {
        return;
      }
      event.preventDefault();
      await this.loadCollection();
    });
    this.dom.manifestUrlInput.addEventListener('input', () => {
      this.syncRecentSelection(this.dom.manifestUrlInput.value);
    });
    this.dom.recentManifestSelect.addEventListener('change', () => {
      const selectedUrl = this.dom.recentManifestSelect.value;
      if (!selectedUrl) {
        return;
      }
      this.dom.manifestUrlInput.value = selectedUrl;
    });
    this.dom.closeViewerBtn.addEventListener('click', () => {
      this.closeViewer();
    });
    this.dom.viewerDialog.addEventListener('close', () => {
      this.state.viewerId = null;
    });
  }

  async loadSelectedRecentManifest() {
    const manifestUrl = this.dom.recentManifestSelect.value || this.dom.manifestUrlInput.value;
    if (!manifestUrl) {
      this.setStatus('Choose a recent manifest or enter a manifest URL.', 'warn');
      return;
    }
    this.dom.manifestUrlInput.value = manifestUrl;
    await this.loadCollection({ manifestUrl });
  }

  announceManifestUrl(manifestUrl) {
    this.dispatchEvent(new CustomEvent('browser-manifest-url-change', {
      detail: { manifestUrl },
      bubbles: true,
      composed: true,
    }));
  }

  setStatus(text, tone = 'neutral') {
    this.state.statusText = text;
    this.state.statusTone = tone;
    this.dom.statusText.textContent = text;
    this.dom.statusText.dataset.tone = tone;
  }

  getSelectedItem() {
    return (this.state.collection?.items || []).find((item) => item.id === this.state.selectedId) || null;
  }

  getViewerItem() {
    return (this.state.collection?.items || []).find((item) => item.id === this.state.viewerId) || null;
  }

  async loadCollection({ manifestUrl: explicitManifestUrl, announceInput = true } = {}) {
    const manifestUrl = (explicitManifestUrl || this.dom.manifestUrlInput.value).trim();
    if (!manifestUrl) {
      this.setStatus('Enter a manifest URL.', 'warn');
      return;
    }

    this.dom.manifestUrlInput.value = manifestUrl;
    this.syncRecentSelection(manifestUrl);

    if (announceInput) {
      this.announceManifestUrl(manifestUrl);
    }

    this.setStatus('Loading collection...', 'neutral');
    try {
      const response = await fetch(manifestUrl);
      if (!response.ok) {
        this.setStatus(`Could not load manifest (${response.status}).`, 'warn');
        return;
      }
      const json = await response.json();
      this.state.collection = normalizeCollection(json);
      this.state.currentManifestUrl = manifestUrl;
      this.state.selectedId = this.state.collection.items[0]?.id || null;
      this.state.viewerId = null;
      this.state.mobileMetadataOpen = false;
      this.rememberRecentManifestUrl(manifestUrl);
      this.setStatus(`Loaded ${this.state.collection.title} (${this.state.collection.items.length} items).`, 'ok');
      this.announceManifestUrl(manifestUrl);
      this.syncShellFrame();
      this.renderGrid();
      this.renderMetadata();
      this.syncMetadataPanelVisibility();
    } catch (error) {
      this.setStatus(`Load failed: ${error.message}`, 'warn');
    }
  }

  renderRecentManifestUrls() {
    const recentUrls = this.state.recentManifestUrls;
    this.dom.recentManifestSelect.innerHTML = '';

    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = recentUrls.length > 0 ? 'Select a recent manifest URL' : 'No recent manifests';
    this.dom.recentManifestSelect.appendChild(placeholder);

    for (const url of recentUrls) {
      const option = document.createElement('option');
      option.value = url;
      option.textContent = url;
      this.dom.recentManifestSelect.appendChild(option);
    }

    this.dom.useRecentBtn.disabled = recentUrls.length === 0;
    this.dom.clearRecentBtn.disabled = recentUrls.length === 0;
    this.syncRecentSelection();
  }

  createPreviewElement(item) {
    const mediaUrl = item.media?.thumbnailUrl || item.media?.url || '';
    const mediaType = (item.media?.type || '').toLowerCase();

    if (!mediaUrl) {
      const placeholder = document.createElement('div');
      placeholder.className = 'thumb-placeholder';
      placeholder.textContent = 'No preview';
      return placeholder;
    }

    if (mediaType.includes('video')) {
      const video = document.createElement('video');
      video.className = 'thumb';
      video.src = mediaUrl;
      video.muted = true;
      video.playsInline = true;
      video.preload = 'metadata';
      return video;
    }

    const image = document.createElement('img');
    image.className = 'thumb';
    image.src = mediaUrl;
    image.alt = item.title || item.id;
    return image;
  }

  selectItem(itemId) {
    if (!itemId) {
      return;
    }
    this.state.selectedId = itemId;
    this.renderGrid();
    this.renderMetadata();
    if (this.isMobileViewport()) {
      this.openMobileMetadataPanel();
    } else {
      this.syncMetadataPanelVisibility();
    }
  }

  renderGrid() {
    this.dom.grid.innerHTML = '';
    const items = this.state.collection?.items || [];
    this.dom.gridSummary.textContent = items.length > 0
      ? `${items.length} item${items.length === 1 ? '' : 's'} available. Click a card to inspect metadata, or use View to open media.`
      : 'Load a collection to browse its items.';

    if (items.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty';
      empty.textContent = 'No items loaded.';
      this.dom.grid.appendChild(empty);
      this.syncShellFrame();
      return;
    }

    for (const item of items) {
      const card = document.createElement('article');
      card.className = 'card';
      card.tabIndex = 0;
      card.setAttribute('role', 'button');
      card.setAttribute('aria-label', `Select ${item.title || item.id}`);
      if (this.state.selectedId === item.id) {
        card.classList.add('is-selected');
      }

      card.addEventListener('click', () => {
        this.selectItem(item.id);
      });
      card.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') {
          return;
        }
        event.preventDefault();
        this.selectItem(item.id);
      });

      const thumbFrame = document.createElement('div');
      thumbFrame.className = 'thumb-frame';
      thumbFrame.appendChild(this.createPreviewElement(item));

      const title = document.createElement('h3');
      title.className = 'card-title';
      title.textContent = item.title || item.id;

      const meta = document.createElement('p');
      meta.className = 'meta';
      meta.textContent = item.license ? `License: ${item.license}` : 'License not set';

      const actions = document.createElement('div');
      actions.className = 'card-actions';
      const viewButton = document.createElement('button');
      viewButton.type = 'button';
      viewButton.className = 'btn';
      viewButton.textContent = 'View';
      viewButton.addEventListener('click', (event) => {
        event.stopPropagation();
        this.openViewer(item.id);
      });
      actions.appendChild(viewButton);

      card.append(thumbFrame, title, meta, actions);
      this.dom.grid.appendChild(card);
    }

    this.syncShellFrame();
  }

  renderMetadata() {
    this.dom.detail.innerHTML = '';
    const collection = this.state.collection;
    const selected = this.getSelectedItem();

    if (selected) {
      this.dom.detailSummary.textContent = `${selected.title || selected.id} · Read-only metadata`;
      const fields = [
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
      ];

      const list = document.createElement('dl');
      list.className = 'metadata-list';
      for (const [label, value] of fields) {
        const row = document.createElement('div');
        row.className = 'metadata-row';

        const term = document.createElement('dt');
        term.textContent = label;

        const definition = document.createElement('dd');
        definition.textContent = value || '-';

        row.append(term, definition);
        list.appendChild(row);
      }
      this.dom.detail.appendChild(list);
      return;
    }

    if (collection) {
      this.dom.detailSummary.textContent = `${collection.title || 'Collection'} · Collection overview`;
      const fields = [
        ['Title', collection.title || ''],
        ['Description', collection.description || ''],
        ['Publisher', collection.publisher || ''],
        ['License', collection.license || ''],
        ['Items', String(collection.items?.length || 0)],
        ['Manifest URL', this.state.currentManifestUrl || ''],
      ];

      const list = document.createElement('dl');
      list.className = 'metadata-list';
      for (const [label, value] of fields) {
        const row = document.createElement('div');
        row.className = 'metadata-row';

        const term = document.createElement('dt');
        term.textContent = label;

        const definition = document.createElement('dd');
        definition.textContent = value || '-';

        row.append(term, definition);
        list.appendChild(row);
      }
      this.dom.detail.appendChild(list);
      return;
    }

    this.dom.detailSummary.textContent = 'Read-only details for the selected item.';
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.textContent = 'Load a collection, then click a card to inspect metadata.';
    this.dom.detail.appendChild(empty);
  }

  renderViewer() {
    const item = this.getViewerItem();
    if (!item) {
      this.closeViewer();
      return;
    }

    this.dom.viewerTitle.textContent = item.title || item.id;
    this.dom.viewerBody.innerHTML = '';
    const mediaType = (item.media?.type || '').toLowerCase();
    if (mediaType.includes('video')) {
      const video = document.createElement('video');
      video.className = 'viewer-media';
      video.src = item.media?.url || '';
      video.controls = true;
      this.dom.viewerBody.appendChild(video);
    } else {
      const image = document.createElement('img');
      image.className = 'viewer-media';
      image.src = item.media?.url || item.media?.thumbnailUrl || '';
      image.alt = item.title || item.id;
      this.dom.viewerBody.appendChild(image);
    }
  }

  openViewer(itemId) {
    const item = (this.state.collection?.items || []).find((entry) => entry.id === itemId);
    if (!item) {
      return;
    }

    this.state.viewerId = itemId;
    this.renderViewer();
    this.openDialog(this.dom.viewerDialog);
  }

  closeViewer() {
    this.state.viewerId = null;
    this.dom.viewerBody.innerHTML = '';
    this.closeDialog(this.dom.viewerDialog);
  }
}

if (!customElements.get('timemap-browser')) {
  customElements.define('timemap-browser', TimemapBrowserElement);
}
