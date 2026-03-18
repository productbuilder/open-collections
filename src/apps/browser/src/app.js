import { ComponentBase, normalizeCollection } from '../../../library/core/src/index.js';
import '../../../apps/manager/src/components/panel-shell.js';
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
    this.renderDetail();
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
    this.dom.openSelectedBtn.disabled = !this.getSelectedItem();
    this.dom.openSelectedBtn.title = this.getSelectedItem()
      ? 'Open the selected item in the viewer.'
      : 'Select an item to open it in the viewer.';
  }

  renderShell() {
    this.shadow.innerHTML = `
      <style>
        :host {
          display:block;
          height:100%;
          min-height:0;
          overflow:hidden;
          font-family: "Segoe UI", Tahoma, sans-serif;
          color:#111827;
          background:#f3f5f8;
        }
        * { box-sizing: border-box; }
        .shell {
          min-height:min(100dvh, 100vh);
          height:100%;
          padding:0.95rem;
          display:grid;
          grid-template-rows:minmax(0, 1fr);
        }
        :host([data-workbench-embed]) .shell { min-height:0; }
        .viewport-panel {
          display:grid;
          grid-template-rows:minmax(0, 1fr);
          min-height:0;
        }
        .toolbar-stack {
          display:grid;
          gap:0.65rem;
          width:100%;
        }
        .control-row,
        .recent-row {
          display:flex;
          align-items:center;
          gap:0.55rem;
          flex-wrap:wrap;
        }
        .manifest-field,
        .recent-field {
          display:grid;
          gap:0.3rem;
        }
        .manifest-field {
          flex:1 1 24rem;
          min-width:min(100%, 18rem);
        }
        .recent-field {
          flex:1 1 18rem;
          min-width:min(100%, 14rem);
        }
        .field-label {
          font-size:0.76rem;
          font-weight:700;
          text-transform:uppercase;
          letter-spacing:0.04em;
          color:#475569;
        }
        .text-input,
        .select-input,
        .dialog-btn {
          width:100%;
          font:inherit;
          border:1px solid #cbd5e1;
          border-radius:8px;
          padding:0.5rem 0.65rem;
          background:#fff;
          color:#111827;
        }
        .text-input:focus,
        .select-input:focus,
        .btn:focus,
        .dialog-btn:focus {
          outline:2px solid rgba(15, 108, 198, 0.18);
          outline-offset:2px;
          border-color:#0f6cc6;
        }
        .btn,
        .dialog-btn {
          border:1px solid #cbd5e1;
          background:#ffffff;
          color:#0f172a;
          border-radius:8px;
          padding:0.48rem 0.75rem;
          cursor:pointer;
          font:inherit;
          font-size:0.88rem;
          font-weight:600;
        }
        .btn:hover,
        .dialog-btn:hover { background:#f8fafc; }
        .btn:disabled,
        .dialog-btn:disabled {
          opacity:0.6;
          cursor:not-allowed;
        }
        .btn-primary {
          border-color:#0f6cc6;
          background:#0f6cc6;
          color:#ffffff;
        }
        .btn-primary:hover { background:#0b5aa6; }
        .status-badge {
          display:inline-flex;
          align-items:center;
          min-height:2.35rem;
          padding:0.2rem 0.7rem;
          border-radius:999px;
          border:1px solid #cbd5e1;
          background:#f8fafc;
          font-size:0.82rem;
          font-weight:600;
          color:#475569;
          white-space:nowrap;
        }
        .status-badge[data-tone="ok"] {
          background:#ecfdf3;
          border-color:#86efac;
          color:#166534;
        }
        .status-badge[data-tone="warn"] {
          background:#fff7ed;
          border-color:#fdba74;
          color:#9a3412;
        }
        .workspace {
          display:grid;
          gap:0.95rem;
          grid-template-columns:minmax(0, 1fr) 320px;
          min-height:0;
        }
        .workspace-card {
          background:#ffffff;
          border:1px solid #e2e8f0;
          border-radius:10px;
          min-height:0;
          overflow:hidden;
          display:grid;
          grid-template-rows:auto minmax(0, 1fr);
          box-shadow:0 1px 2px rgba(15, 23, 42, 0.04);
        }
        .workspace-card-header {
          padding:0.85rem 0.95rem;
          border-bottom:1px solid #e2e8f0;
          display:flex;
          align-items:flex-start;
          justify-content:space-between;
          gap:0.75rem;
        }
        .workspace-card-heading {
          display:grid;
          gap:0.2rem;
          min-width:0;
        }
        .workspace-card-title {
          margin:0;
          font-size:0.92rem;
          color:#111827;
        }
        .workspace-card-subtitle {
          margin:0;
          font-size:0.82rem;
          color:#64748b;
        }
        .workspace-card-body {
          padding:0.85rem;
          overflow:auto;
          min-height:0;
        }
        .grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:0.7rem; }
        .card {
          border:1px solid #dbe3ec;
          border-radius:9px;
          padding:0.55rem;
          display:grid;
          gap:0.5rem;
          cursor:pointer;
          background:#ffffff;
          transition:border-color 120ms ease, box-shadow 120ms ease, background-color 120ms ease;
        }
        .card:hover {
          border-color:#93c5fd;
          box-shadow:0 1px 3px rgba(15, 23, 42, 0.08);
          background:#f8fbff;
        }
        .card.is-selected {
          border-color:#0f6cc6;
          box-shadow:0 0 0 1px #66a6e8 inset, 0 3px 10px rgba(15, 108, 198, 0.16);
          background:#f5faff;
        }
        .thumb {
          width:100%;
          height:125px;
          border-radius:7px;
          object-fit:cover;
          border:1px solid #dbe3ec;
          background:#eef2f7;
        }
        .card-title {
          margin:0;
          font-size:0.88rem;
          font-weight:700;
          color:#111827;
        }
        .meta,
        .metadata-row dd,
        .metadata-row dt {
          margin:0;
          font-size:0.82rem;
          color:#475569;
          line-height:1.45;
        }
        .metadata-list {
          display:grid;
          gap:0.7rem;
          margin:0;
        }
        .metadata-row {
          display:grid;
          gap:0.2rem;
          padding-bottom:0.7rem;
          border-bottom:1px solid #edf2f7;
        }
        .metadata-row:last-child {
          padding-bottom:0;
          border-bottom:none;
        }
        .metadata-row dt {
          font-size:0.75rem;
          font-weight:700;
          letter-spacing:0.04em;
          text-transform:uppercase;
          color:#64748b;
        }
        .recent-list {
          display:flex;
          flex-wrap:wrap;
          gap:0.45rem;
          min-height:2rem;
        }
        .recent-chip {
          max-width:100%;
          border:1px solid #dbe3ec;
          border-radius:999px;
          padding:0.35rem 0.65rem;
          background:#ffffff;
          color:#334155;
          font:inherit;
          font-size:0.8rem;
          cursor:pointer;
          overflow:hidden;
          text-overflow:ellipsis;
          white-space:nowrap;
        }
        .recent-chip:hover {
          border-color:#93c5fd;
          background:#eff6ff;
        }
        .empty {
          border:1px dashed #cbd5e1;
          border-radius:8px;
          padding:1rem;
          text-align:center;
          color:#64748b;
          background:#f8fafc;
        }
        dialog { width:min(980px,96vw); border:1px solid #dbe3ec; border-radius:12px; padding:0; }
        dialog::backdrop { background: rgba(15,23,42,0.45); }
        .dialog-shell { display:grid; grid-template-rows:auto 1fr; max-height:min(85vh,760px); }
        .dialog-header { padding:0.75rem 0.9rem; border-bottom:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center; gap:0.65rem; }
        .dialog-body { padding:0.85rem; overflow:auto; }
        .viewer-media { width:100%; max-height:64vh; border-radius:8px; border:1px solid #dbe3ec; background:#f8fafc; }
        @media (max-width:1080px) {
          .workspace { grid-template-columns:minmax(0,1fr); }
        }
        @media (max-width:760px) {
          .shell { padding:0.75rem; }
          .control-row,
          .recent-row,
          .workspace-card-header,
          .dialog-header {
            align-items:stretch;
          }
          .status-badge {
            white-space:normal;
            border-radius:16px;
          }
        }
      </style>
      <div class="shell">
        <section class="viewport-panel" aria-label="Collection browser workspace">
          <open-panel-shell id="browserShell" title="Collection browser" subtitle="Load a manifest to browse a single collection." show-back="false">
            <div class="toolbar-stack" slot="toolbar">
              <div class="control-row">
                <label class="manifest-field">
                  <span class="field-label">Manifest URL</span>
                  <input id="manifestUrlInput" class="text-input" type="text" placeholder="https://example.org/collection.json" />
                </label>
                <button id="loadBtn" class="btn btn-primary" type="button">Load collection</button>
                <button id="openSelectedBtn" class="btn" type="button" disabled>Open selected</button>
              </div>
              <div class="recent-row">
                <label class="recent-field">
                  <span class="field-label">Recent manifests</span>
                  <select id="recentManifestSelect" class="select-input">
                    <option value="">No recent manifests</option>
                  </select>
                </label>
                <button id="loadRecentBtn" class="btn" type="button">Load recent</button>
                <button id="clearRecentBtn" class="btn" type="button">Clear recent</button>
                <span id="statusText" class="status-badge" data-tone="neutral">Load a collection manifest to browse.</span>
              </div>
            </div>
            <div class="workspace">
              <section class="workspace-card">
                <div class="workspace-card-header">
                  <div class="workspace-card-heading">
                    <h2 class="workspace-card-title">Collection items</h2>
                    <p id="gridSummary" class="workspace-card-subtitle">Load a collection to browse its items.</p>
                  </div>
                </div>
                <div class="workspace-card-body">
                  <div id="grid" class="grid"></div>
                </div>
              </section>
              <aside class="workspace-card">
                <div class="workspace-card-header">
                  <div class="workspace-card-heading">
                    <h2 class="workspace-card-title">Metadata</h2>
                    <p id="detailSummary" class="workspace-card-subtitle">Read-only details for the selected item.</p>
                  </div>
                </div>
                <div class="workspace-card-body">
                  <div id="detail"></div>
                  <div class="workspace-card-heading" style="margin-top:0.85rem;">
                    <span class="field-label">Recent manifests</span>
                    <div id="recentList" class="recent-list"></div>
                  </div>
                </div>
              </aside>
            </div>
          </open-panel-shell>
        </section>
      </div>
      <dialog id="viewerDialog" aria-label="Media viewer">
        <div class="dialog-shell">
          <div class="dialog-header">
            <h2 id="viewerTitle" class="workspace-card-title">Viewer</h2>
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
      statusText: root.getElementById('statusText'),
      manifestUrlInput: root.getElementById('manifestUrlInput'),
      loadBtn: root.getElementById('loadBtn'),
      openSelectedBtn: root.getElementById('openSelectedBtn'),
      recentManifestSelect: root.getElementById('recentManifestSelect'),
      loadRecentBtn: root.getElementById('loadRecentBtn'),
      clearRecentBtn: root.getElementById('clearRecentBtn'),
      recentList: root.getElementById('recentList'),
      gridSummary: root.getElementById('gridSummary'),
      detailSummary: root.getElementById('detailSummary'),
      grid: root.getElementById('grid'),
      detail: root.getElementById('detail'),
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
    this.dom.loadBtn.addEventListener('click', async () => {
      await this.loadCollection();
    });
    this.dom.loadRecentBtn.addEventListener('click', async () => {
      await this.loadSelectedRecentManifest();
    });
    this.dom.clearRecentBtn.addEventListener('click', () => {
      this.clearRecentManifestUrls();
      this.setStatus('Cleared recent manifest URLs for this browser.', 'neutral');
    });
    this.dom.openSelectedBtn.addEventListener('click', () => {
      const selected = this.getSelectedItem();
      if (selected) {
        this.openViewer(selected.id);
      }
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
      this.closeDialog(this.dom.viewerDialog);
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
      this.rememberRecentManifestUrl(manifestUrl);
      this.setStatus(`Loaded ${this.state.collection.title} (${this.state.collection.items.length} items).`, 'ok');
      this.announceManifestUrl(manifestUrl);
      this.syncShellFrame();
      this.renderGrid();
      this.renderDetail();
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

    this.dom.loadRecentBtn.disabled = recentUrls.length === 0;
    this.dom.clearRecentBtn.disabled = recentUrls.length === 0;
    this.dom.recentList.innerHTML = '';

    if (recentUrls.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty';
      empty.textContent = 'Recently loaded manifests will appear here after a successful load.';
      this.dom.recentList.appendChild(empty);
      return;
    }

    for (const url of recentUrls) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'recent-chip';
      button.title = url;
      button.textContent = url;
      button.addEventListener('click', async () => {
        this.dom.manifestUrlInput.value = url;
        this.syncRecentSelection(url);
        await this.loadCollection({ manifestUrl: url });
      });
      this.dom.recentList.appendChild(button);
    }

    this.syncRecentSelection();
  }

  renderGrid() {
    this.dom.grid.innerHTML = '';
    const items = this.state.collection?.items || [];
    this.dom.gridSummary.textContent = items.length > 0
      ? `${items.length} item${items.length === 1 ? '' : 's'} available. Click to inspect, double-click to view.`
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
      if (this.state.selectedId === item.id) {
        card.classList.add('is-selected');
      }
      card.addEventListener('click', () => {
        this.state.selectedId = item.id;
        this.syncShellFrame();
        this.renderGrid();
        this.renderDetail();
      });
      card.addEventListener('dblclick', () => {
        this.openViewer(item.id);
      });

      const thumb = document.createElement('img');
      thumb.className = 'thumb';
      thumb.src = item.media.thumbnailUrl || item.media.url || '';
      thumb.alt = item.title || item.id;

      const title = document.createElement('h3');
      title.className = 'card-title';
      title.textContent = item.title || item.id;

      const meta = document.createElement('p');
      meta.className = 'meta';
      meta.textContent = item.license ? `License: ${item.license}` : 'License not set';

      card.append(thumb, title, meta);
      this.dom.grid.appendChild(card);
    }

    this.syncShellFrame();
  }

  renderDetail() {
    this.dom.detail.innerHTML = '';
    const selected = this.getSelectedItem();
    this.dom.detailSummary.textContent = selected
      ? `${selected.title || selected.id} · Read-only metadata`
      : 'Read-only details for the selected item.';

    if (!selected) {
      const empty = document.createElement('div');
      empty.className = 'empty';
      empty.textContent = 'Select an item to view metadata.';
      this.dom.detail.appendChild(empty);
      this.syncShellFrame();
      return;
    }

    const fields = [
      ['Title', selected.title || ''],
      ['Description', selected.description || ''],
      ['Creator', selected.creator || ''],
      ['Date', selected.date || ''],
      ['Location', selected.location || ''],
      ['License', selected.license || ''],
      ['Source', selected.source || ''],
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
    this.syncShellFrame();
  }

  openViewer(itemId) {
    const item = (this.state.collection?.items || []).find((entry) => entry.id === itemId);
    if (!item) {
      return;
    }

    this.dom.viewerTitle.textContent = item.title || item.id;
    this.dom.viewerBody.innerHTML = '';
    const mediaType = (item.media.type || '').toLowerCase();
    if (mediaType.includes('video')) {
      const video = document.createElement('video');
      video.className = 'viewer-media';
      video.src = item.media.url;
      video.controls = true;
      this.dom.viewerBody.appendChild(video);
    } else {
      const image = document.createElement('img');
      image.className = 'viewer-media';
      image.src = item.media.url || item.media.thumbnailUrl || '';
      image.alt = item.title || item.id;
      this.dom.viewerBody.appendChild(image);
    }
    this.openDialog(this.dom.viewerDialog);
  }
}

if (!customElements.get('timemap-browser')) {
  customElements.define('timemap-browser', TimemapBrowserElement);
}
