import {
  createManifest,
  validateCollectionShape,
} from '../../../packages/collector-schema/src/schema.js';
import { createLocalProvider } from '../../../packages/provider-local/src/index.js';
import { createPublicUrlProvider } from '../../../packages/provider-public-url/src/index.js';
import { createGithubProvider } from '../../../packages/provider-github/src/index.js';
import { COLLECTOR_CONFIG } from './config.js';

class TimemapCollectorElement extends HTMLElement {
  constructor() {
    super();

    this.state = {
      provider: null,
      connected: false,
      assets: [],
      selectedItemId: null,
      manifest: null,
    };

    this.providers = {
      local: createLocalProvider(),
      'public-url': createPublicUrlProvider(),
      github: createGithubProvider(),
    };

    this.providerCatalog = [
      this.providers.github.getDescriptor(),
      this.providers['public-url'].getDescriptor(),
      {
        id: 'gdrive',
        label: 'Google Drive',
        category: 'external',
        enabled: false,
        statusLabel: 'Coming soon',
        description: 'OAuth-based access to Drive folders and media.',
      },
      {
        id: 's3',
        label: 'S3-compatible storage',
        category: 'external',
        enabled: false,
        statusLabel: 'Coming soon',
        description: 'Use S3 buckets and prefixes as collection sources.',
      },
      {
        id: 'wikimedia',
        label: 'Wikimedia Commons',
        category: 'external',
        enabled: false,
        statusLabel: 'Planned',
        description: 'Import media and metadata from Wikimedia Commons.',
      },
      {
        id: 'internet-archive',
        label: 'Internet Archive',
        category: 'external',
        enabled: false,
        statusLabel: 'Planned',
        description: 'Browse and load assets from Archive.org items.',
      },
      this.providers.local.getDescriptor(),
    ];

    this.shadow = this.attachShadow({ mode: 'open' });
    this.renderShell();
    this.cacheDom();
  }

  connectedCallback() {
    this.bindEvents();
    this.setStatus('Not connected.', 'neutral');
    this.renderCapabilities(this.providers.local);
    this.renderProviderCatalog();
    this.setSelectedProvider('github');
    this.renderAssets();
    this.renderEditor();
  }

  renderShell() {
    this.shadow.innerHTML = `
      <style>
        :host {
          display: block;
          color: #111827;
          font-family: "Segoe UI", Tahoma, sans-serif;
        }

        * {
          box-sizing: border-box;
        }

        .app-shell {
          min-height: 84vh;
          background: #f3f5f8;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          overflow: hidden;
          display: grid;
          grid-template-rows: auto 1fr;
        }

        .topbar {
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
          gap: 0.15rem;
        }

        .title {
          margin: 0;
          font-size: 1rem;
          font-weight: 700;
        }

        .status {
          margin: 0;
          font-size: 0.85rem;
          color: #64748b;
        }

        .top-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .btn {
          border: 1px solid #cbd5e1;
          background: #ffffff;
          color: #0f172a;
          border-radius: 8px;
          padding: 0.42rem 0.7rem;
          cursor: pointer;
          font: inherit;
          font-size: 0.88rem;
          font-weight: 600;
        }

        .btn:hover {
          background: #f8fafc;
        }

        .btn-primary {
          background: #0f6cc6;
          color: #ffffff;
          border-color: #0f6cc6;
        }

        .btn-primary:hover {
          background: #0d5eae;
        }

        .content-grid {
          padding: 0.95rem;
          display: grid;
          gap: 0.95rem;
          grid-template-columns: minmax(0, 1fr) 350px;
          align-items: stretch;
        }

        .panel {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
        }

        .viewport-panel {
          display: grid;
          grid-template-rows: auto 1fr;
          min-height: 600px;
        }

        .panel-header {
          padding: 0.8rem 0.95rem;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.7rem;
        }

        .panel-title {
          margin: 0;
          font-size: 0.95rem;
        }

        .panel-subtext {
          margin: 0;
          font-size: 0.83rem;
          color: #64748b;
        }

        .asset-wrap {
          padding: 0.9rem;
          overflow: auto;
        }

        .asset-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 0.7rem;
        }

        .asset-card {
          border: 1px solid #dbe3ec;
          border-radius: 9px;
          padding: 0.55rem;
          background: #ffffff;
          display: grid;
          gap: 0.5rem;
          cursor: pointer;
          transition: border-color 120ms ease, box-shadow 120ms ease, background-color 120ms ease;
        }

        .asset-card:hover {
          border-color: #93c5fd;
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
          background: #f8fbff;
        }

        .asset-card:focus-visible {
          outline: 2px solid #2563eb;
          outline-offset: 2px;
        }

        .asset-card.is-selected {
          border-color: #0f6cc6;
          box-shadow: 0 0 0 1px #66a6e8 inset, 0 3px 10px rgba(15, 108, 198, 0.16);
          background: #f5faff;
        }

        .thumb {
          width: 100%;
          height: 125px;
          object-fit: cover;
          border-radius: 7px;
          border: 1px solid #dbe3ec;
          background: #eef2f7;
        }

        .thumb-placeholder {
          width: 100%;
          height: 125px;
          border-radius: 7px;
          border: 1px dashed #cbd5e1;
          display: grid;
          place-items: center;
          color: #64748b;
          background: #f8fafc;
          font-size: 0.82rem;
        }

        .card-title {
          margin: 0;
          font-size: 0.88rem;
          font-weight: 700;
        }

        .badge-row {
          display: flex;
          flex-wrap: wrap;
          gap: 0.35rem;
        }

        .badge {
          font-size: 0.75rem;
          padding: 0.15rem 0.4rem;
          border-radius: 999px;
          border: 1px solid #cbd5e1;
          color: #475569;
          background: #f8fafc;
        }

        .badge.ok {
          border-color: #86efac;
          background: #f0fdf4;
          color: #166534;
        }

        .badge.warn {
          border-color: #fed7aa;
          background: #fff7ed;
          color: #9a3412;
        }

        .card-actions {
          display: flex;
          gap: 0.45rem;
        }

        .card-actions .btn {
          flex: 1;
        }

        .empty {
          border: 1px dashed #cbd5e1;
          border-radius: 8px;
          padding: 1rem;
          text-align: center;
          color: #64748b;
          background: #f8fafc;
          font-size: 0.9rem;
        }

        .editor-panel {
          display: grid;
          grid-template-rows: auto auto 1fr;
          min-height: 600px;
        }

        .editor-wrap {
          padding: 0.95rem;
          display: grid;
          gap: 0.6rem;
          align-content: start;
        }

        .field-row {
          display: grid;
          gap: 0.25rem;
        }

        .field-row > label {
          font-size: 0.8rem;
          color: #475569;
          font-weight: 600;
        }

        input,
        textarea,
        select {
          width: 100%;
          font: inherit;
          font-size: 0.9rem;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 0.45rem 0.55rem;
          background: #ffffff;
          color: #0f172a;
        }

        textarea {
          resize: vertical;
          min-height: 78px;
        }

        .checkbox-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.84rem;
          color: #334155;
          padding-top: 0.2rem;
        }

        .checkbox-row input {
          width: auto;
        }

        dialog {
          width: min(780px, 94vw);
          border: 1px solid #dbe3ec;
          border-radius: 12px;
          padding: 0;
          box-shadow: 0 14px 36px rgba(15, 23, 42, 0.2);
          background: #ffffff;
        }

        dialog::backdrop {
          background: rgba(15, 23, 42, 0.45);
        }

        .dialog-shell {
          display: grid;
          grid-template-rows: auto 1fr;
          max-height: min(82vh, 760px);
        }

        .dialog-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.75rem;
          padding: 0.8rem 0.95rem;
          border-bottom: 1px solid #e2e8f0;
        }

        .dialog-title {
          margin: 0;
          font-size: 0.95rem;
        }

        .dialog-body {
          padding: 0.95rem;
          overflow: auto;
          display: grid;
          gap: 0.7rem;
          align-content: start;
        }

        .dialog-actions {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .provider-layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: 0.7rem;
        }

        .provider-list {
          display: grid;
          gap: 0.5rem;
          align-content: start;
        }

        .provider-card {
          border: 1px solid #dbe3ec;
          border-radius: 8px;
          background: #ffffff;
          padding: 0.6rem;
          text-align: left;
          display: grid;
          gap: 0.2rem;
          cursor: pointer;
        }

        .provider-card.is-selected {
          border-color: #0f6cc6;
          box-shadow: 0 0 0 1px #66a6e8 inset;
          background: #f5faff;
        }

        .provider-card.is-disabled {
          cursor: not-allowed;
          background: #f8fafc;
          color: #64748b;
          border-color: #e2e8f0;
        }

        .provider-card-label-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
        }

        .pill {
          border-radius: 999px;
          border: 1px solid #cbd5e1;
          padding: 0.1rem 0.4rem;
          font-size: 0.72rem;
          color: #475569;
          background: #f8fafc;
        }

        .pill.is-muted {
          color: #64748b;
          border-color: #e2e8f0;
          background: #f8fafc;
        }

        .provider-config {
          display: grid;
          gap: 0.6rem;
          align-content: start;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: #f8fafc;
          padding: 0.7rem;
        }

        .config-section-title {
          margin: 0;
          font-size: 0.83rem;
          color: #334155;
        }

        .is-hidden {
          display: none;
        }

        pre {
          margin: 0;
          padding: 0.75rem;
          border-radius: 8px;
          background: #0f172a;
          color: #dbeafe;
          font-size: 0.8rem;
          max-height: 280px;
          overflow: auto;
          white-space: pre-wrap;
          word-break: break-word;
        }

        @media (max-width: 1080px) {
          .content-grid {
            grid-template-columns: minmax(0, 1fr);
          }

          .editor-panel {
            min-height: 0;
          }
        }
      </style>

      <div class="app-shell">
        <header class="topbar">
          <div class="brand">
            <h1 class="title">TimeMap Collector</h1>
            <p id="statusText" class="status">Not connected.</p>
          </div>
          <div class="top-actions">
            <button class="btn" id="openProviderBtn" type="button">Sources</button>
            <button class="btn" id="openManifestBtn" type="button">Manifest</button>
          </div>
        </header>

        <div class="content-grid">
          <section class="panel viewport-panel" aria-label="Collection browser">
            <div class="panel-header">
              <h2 class="panel-title">Collection viewport</h2>
              <p id="assetCount" class="panel-subtext">No assets loaded.</p>
            </div>
            <div class="asset-wrap">
              <div id="assetGrid" class="asset-grid"></div>
            </div>
          </section>

          <aside class="panel editor-panel" aria-label="Metadata editor">
            <div class="panel-header">
              <h2 class="panel-title">Metadata editor</h2>
              <p id="editorStatus" class="panel-subtext">Select an asset card.</p>
            </div>
            <div id="editorEmpty" class="editor-wrap">
              <div class="empty">Select an item from the grid to edit metadata.</div>
            </div>
            <form id="editorForm" class="editor-wrap" hidden>
              <div class="field-row"><label for="itemTitle">Title</label><input id="itemTitle" type="text" /></div>
              <div class="field-row"><label for="itemDescription">Description</label><textarea id="itemDescription"></textarea></div>
              <div class="field-row"><label for="itemType">Type / Format</label><input id="itemType" type="text" /></div>
              <div class="field-row"><label for="itemCreator">Creator</label><input id="itemCreator" type="text" /></div>
              <div class="field-row"><label for="itemDate">Date / Period</label><input id="itemDate" type="text" /></div>
              <div class="field-row"><label for="itemLocation">Location</label><input id="itemLocation" type="text" /></div>
              <div class="field-row"><label for="itemLicense">License</label><input id="itemLicense" type="text" /></div>
              <div class="field-row"><label for="itemAttribution">Attribution</label><input id="itemAttribution" type="text" /></div>
              <div class="field-row"><label for="itemSource">Source</label><input id="itemSource" type="text" /></div>
              <div class="field-row"><label for="itemTags">Tags / Keywords (comma separated)</label><input id="itemTags" type="text" /></div>
              <label class="checkbox-row" for="itemInclude"><span>Include in manifest</span><input id="itemInclude" type="checkbox" /></label>
              <button class="btn btn-primary" id="saveItemBtn" type="button">Save metadata</button>
            </form>
          </aside>
        </div>
      </div>

      <dialog id="providerDialog" aria-label="Source and provider settings">
        <div class="dialog-shell">
          <div class="dialog-header">
            <h2 class="dialog-title">Storage providers and sources</h2>
            <button class="btn" data-close="providerDialog" type="button">Close</button>
          </div>
          <div class="dialog-body">
            <p class="panel-subtext">Collector supports multiple source providers. GitHub is the first authenticated provider in this MVP.</p>
            <div class="provider-layout">
              <div>
                <p class="config-section-title">Providers</p>
                <div id="providerCatalog" class="provider-list"></div>
              </div>
              <div id="providerConfig" class="provider-config">
                <p id="providerConfigTitle" class="config-section-title">Provider configuration</p>

                <div id="githubConfig" class="is-hidden">
                  <div class="field-row"><label for="githubToken">GitHub token (PAT)</label><input id="githubToken" type="password" /></div>
                  <div class="field-row"><label for="githubOwner">Repository owner</label><input id="githubOwner" type="text" /></div>
                  <div class="field-row"><label for="githubRepo">Repository name</label><input id="githubRepo" type="text" /></div>
                  <div class="field-row"><label for="githubBranch">Branch</label><input id="githubBranch" type="text" value="main" /></div>
                  <div class="field-row"><label for="githubPath">Folder path (optional)</label><input id="githubPath" type="text" placeholder="media/" /></div>
                </div>

                <div id="publicUrlConfig" class="is-hidden">
                  <div class="field-row"><label for="publicUrlInput">Manifest URL</label><input id="publicUrlInput" type="text" placeholder="https://example.org/collection.json" /></div>
                </div>

                <div id="localConfig" class="is-hidden">
                  <div class="field-row"><label for="localPathInput">Collection path</label><input id="localPathInput" type="text" /></div>
                </div>

                <div id="placeholderConfig" class="is-hidden">
                  <div class="empty">This provider is planned and not yet available in this MVP.</div>
                </div>

                <div class="dialog-actions">
                  <button class="btn btn-primary" id="connectBtn" type="button">Connect provider</button>
                </div>
              </div>
            </div>
            <p id="connectionStatus" class="panel-subtext">Not connected.</p>
            <pre id="capabilities">{}</pre>
          </div>
        </div>
      </dialog>

      <dialog id="manifestDialog" aria-label="Manifest export">
        <div class="dialog-shell">
          <div class="dialog-header">
            <h2 class="dialog-title">Manifest export</h2>
            <button class="btn" data-close="manifestDialog" type="button">Close</button>
          </div>
          <div class="dialog-body">
            <div class="field-row"><label for="collectionId">Collection ID</label><input id="collectionId" type="text" /></div>
            <div class="field-row"><label for="collectionTitle">Collection title</label><input id="collectionTitle" type="text" /></div>
            <div class="field-row"><label for="collectionDescription">Collection description</label><textarea id="collectionDescription"></textarea></div>
            <div class="dialog-actions">
              <button class="btn btn-primary" id="generateManifestBtn" type="button">Generate collection.json</button>
              <button class="btn" id="copyManifestBtn" type="button">Copy</button>
              <button class="btn" id="downloadManifestBtn" type="button">Download</button>
            </div>
            <pre id="manifestPreview"></pre>
          </div>
        </div>
      </dialog>
    `;
  }

  cacheDom() {
    const root = this.shadow;
    this.dom = {
      statusText: root.getElementById('statusText'),
      openProviderBtn: root.getElementById('openProviderBtn'),
      openManifestBtn: root.getElementById('openManifestBtn'),
      providerDialog: root.getElementById('providerDialog'),
      manifestDialog: root.getElementById('manifestDialog'),
      providerCatalog: root.getElementById('providerCatalog'),
      providerConfigTitle: root.getElementById('providerConfigTitle'),
      githubConfig: root.getElementById('githubConfig'),
      githubToken: root.getElementById('githubToken'),
      githubOwner: root.getElementById('githubOwner'),
      githubRepo: root.getElementById('githubRepo'),
      githubBranch: root.getElementById('githubBranch'),
      githubPath: root.getElementById('githubPath'),
      publicUrlConfig: root.getElementById('publicUrlConfig'),
      publicUrlInput: root.getElementById('publicUrlInput'),
      localConfig: root.getElementById('localConfig'),
      localPathInput: root.getElementById('localPathInput'),
      placeholderConfig: root.getElementById('placeholderConfig'),
      connectBtn: root.getElementById('connectBtn'),
      connectionStatus: root.getElementById('connectionStatus'),
      capabilities: root.getElementById('capabilities'),
      assetCount: root.getElementById('assetCount'),
      assetGrid: root.getElementById('assetGrid'),
      editorStatus: root.getElementById('editorStatus'),
      editorEmpty: root.getElementById('editorEmpty'),
      editorForm: root.getElementById('editorForm'),
      itemTitle: root.getElementById('itemTitle'),
      itemDescription: root.getElementById('itemDescription'),
      itemType: root.getElementById('itemType'),
      itemCreator: root.getElementById('itemCreator'),
      itemDate: root.getElementById('itemDate'),
      itemLocation: root.getElementById('itemLocation'),
      itemLicense: root.getElementById('itemLicense'),
      itemAttribution: root.getElementById('itemAttribution'),
      itemSource: root.getElementById('itemSource'),
      itemTags: root.getElementById('itemTags'),
      itemInclude: root.getElementById('itemInclude'),
      saveItemBtn: root.getElementById('saveItemBtn'),
      collectionId: root.getElementById('collectionId'),
      collectionTitle: root.getElementById('collectionTitle'),
      collectionDescription: root.getElementById('collectionDescription'),
      generateManifestBtn: root.getElementById('generateManifestBtn'),
      copyManifestBtn: root.getElementById('copyManifestBtn'),
      downloadManifestBtn: root.getElementById('downloadManifestBtn'),
      manifestPreview: root.getElementById('manifestPreview'),
    };

    this.dom.localPathInput.value = COLLECTOR_CONFIG.defaultLocalManifestPath;
    this.dom.collectionId.value = COLLECTOR_CONFIG.defaultCollectionMeta.id;
    this.dom.collectionTitle.value = COLLECTOR_CONFIG.defaultCollectionMeta.title;
    this.dom.collectionDescription.value = COLLECTOR_CONFIG.defaultCollectionMeta.description;
    this.dom.manifestPreview.textContent = '{}';
  }

  bindEvents() {
    if (this._eventsBound) {
      return;
    }

    this._eventsBound = true;

    this.dom.openProviderBtn.addEventListener('click', () => this.openDialog(this.dom.providerDialog));
    this.dom.openManifestBtn.addEventListener('click', () => this.openDialog(this.dom.manifestDialog));

    this.shadow.querySelectorAll('[data-close]').forEach((button) => {
      button.addEventListener('click', () => {
        const dialogId = button.getAttribute('data-close');
        this.closeDialog(this.shadow.getElementById(dialogId));
      });
    });

    this.dom.connectBtn.addEventListener('click', async () => {
      await this.connectCurrentProvider();
    });

    this.dom.saveItemBtn.addEventListener('click', async () => {
      const selected = this.findSelectedItem();
      if (!selected) {
        return;
      }
      await this.updateItem(selected.id, this.collectEditorPatch());
      this.setStatus(`Saved metadata for ${selected.id}`, 'ok');
    });

    this.dom.generateManifestBtn.addEventListener('click', async () => {
      await this.generateManifest();
    });

    this.dom.copyManifestBtn.addEventListener('click', async () => {
      await this.copyManifestToClipboard();
    });

    this.dom.downloadManifestBtn.addEventListener('click', () => {
      this.downloadManifest();
    });
  }

  openDialog(dialog) {
    if (!dialog) {
      return;
    }

    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
      return;
    }

    dialog.setAttribute('open', 'open');
  }

  closeDialog(dialog) {
    if (!dialog) {
      return;
    }

    if (typeof dialog.close === 'function') {
      dialog.close();
      return;
    }

    dialog.removeAttribute('open');
  }

  renderProviderCatalog() {
    this.dom.providerCatalog.innerHTML = '';

    for (const entry of this.providerCatalog) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'provider-card';
      button.dataset.providerId = entry.id;
      button.disabled = entry.enabled === false;

      if (entry.enabled === false) {
        button.classList.add('is-disabled');
      }

      if (this.state.selectedProviderId === entry.id) {
        button.classList.add('is-selected');
      }

      button.innerHTML = `
        <div class="provider-card-label-row">
          <strong>${entry.label}</strong>
          <span class="pill ${entry.enabled === false ? 'is-muted' : ''}">${entry.statusLabel || 'Available'}</span>
        </div>
        <span class="panel-subtext">${entry.description || ''}</span>
      `;

      button.addEventListener('click', () => {
        if (entry.enabled === false) {
          return;
        }
        this.setSelectedProvider(entry.id);
      });

      this.dom.providerCatalog.appendChild(button);
    }
  }

  setSelectedProvider(providerId) {
    const selected = this.providerCatalog.find((entry) => entry.id === providerId);
    if (!selected) {
      return;
    }

    this.state.selectedProviderId = providerId;

    this.shadow.querySelectorAll('.provider-card').forEach((card) => {
      card.classList.toggle('is-selected', card.dataset.providerId === providerId);
    });

    this.dom.providerConfigTitle.textContent = `${selected.label} configuration`;
    this.dom.githubConfig.classList.add('is-hidden');
    this.dom.publicUrlConfig.classList.add('is-hidden');
    this.dom.localConfig.classList.add('is-hidden');
    this.dom.placeholderConfig.classList.add('is-hidden');

    if (providerId === 'github') {
      this.dom.githubConfig.classList.remove('is-hidden');
    } else if (providerId === 'public-url') {
      this.dom.publicUrlConfig.classList.remove('is-hidden');
    } else if (providerId === 'local') {
      this.dom.localConfig.classList.remove('is-hidden');
    } else {
      this.dom.placeholderConfig.classList.remove('is-hidden');
    }

    this.dom.connectBtn.disabled = selected.enabled === false;
    this.renderCapabilities(this.providers[providerId] || { getCapabilities: () => selected.capabilities || {} });
  }

  setStatus(text, tone = 'neutral') {
    const colors = {
      neutral: '#64748b',
      ok: '#166534',
      warn: '#9a3412',
    };

    this.dom.statusText.textContent = text;
    this.dom.statusText.style.color = colors[tone] || colors.neutral;
  }

  setConnectionStatus(text, isOk = false) {
    this.dom.connectionStatus.textContent = text;
    this.dom.connectionStatus.style.color = isOk ? '#166534' : '#9a3412';
  }

  renderCapabilities(provider) {
    this.dom.capabilities.textContent = JSON.stringify(provider.getCapabilities(), null, 2);
  }

  requiredFieldScore(item) {
    const checks = [
      Boolean(item.id),
      Boolean(item.title),
      Boolean(item.media && item.media.url),
      Boolean(item.license),
    ];

    return `${checks.filter(Boolean).length}/${checks.length}`;
  }

  createPreviewNode(item) {
    const mediaType = (item.media?.type || '').toLowerCase();
    const url = item.media?.thumbnailUrl || item.media?.url;

    if (!url) {
      const placeholder = document.createElement('div');
      placeholder.className = 'thumb-placeholder';
      placeholder.textContent = 'No preview';
      return placeholder;
    }

    if (mediaType.includes('video')) {
      const video = document.createElement('video');
      video.className = 'thumb';
      video.src = url;
      video.muted = true;
      video.playsInline = true;
      video.preload = 'metadata';
      return video;
    }

    const image = document.createElement('img');
    image.className = 'thumb';
    image.src = url;
    image.alt = item.title || item.id;
    return image;
  }

  renderAssets() {
    const grid = this.dom.assetGrid;
    grid.innerHTML = '';

    if (!this.state.connected) {
      this.dom.assetCount.textContent = 'No assets loaded.';
      const empty = document.createElement('div');
      empty.className = 'empty';
      empty.textContent = 'Open Sources to connect a dataset or manifest.';
      grid.appendChild(empty);
      return;
    }

    this.dom.assetCount.textContent = `${this.state.assets.length} assets`;

    if (this.state.assets.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty';
      empty.textContent = 'Connected source has no assets.';
      grid.appendChild(empty);
      return;
    }

    for (const item of this.state.assets) {
      const card = document.createElement('article');
      card.className = 'asset-card';
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', `Select asset ${item.title || item.id}`);
      card.setAttribute('aria-selected', this.state.selectedItemId === item.id ? 'true' : 'false');
      if (this.state.selectedItemId === item.id) {
        card.classList.add('is-selected');
      }

      card.addEventListener('click', () => {
        this.selectItem(item.id);
      });
      card.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          this.selectItem(item.id);
        }
      });

      const preview = this.createPreviewNode(item);

      const title = document.createElement('p');
      title.className = 'card-title';
      title.textContent = item.title || '(Untitled)';

      const badges = document.createElement('div');
      badges.className = 'badge-row';

      const completeness = document.createElement('span');
      completeness.className = 'badge';
      completeness.textContent = `Completeness ${this.requiredFieldScore(item)}`;

      const license = document.createElement('span');
      const hasLicense = Boolean(item.license);
      license.className = `badge ${hasLicense ? 'ok' : 'warn'}`;
      license.textContent = hasLicense ? `License: ${item.license}` : 'License missing';

      const include = document.createElement('span');
      const included = item.include !== false;
      include.className = `badge ${included ? 'ok' : 'warn'}`;
      include.textContent = included ? 'Included' : 'Excluded';

      badges.append(completeness, license, include);

      const actions = document.createElement('div');
      actions.className = 'card-actions';

      const openBtn = document.createElement('button');
      openBtn.type = 'button';
      openBtn.className = 'btn';
      openBtn.textContent = 'Open';
      openBtn.addEventListener('click', (event) => {
        event.stopPropagation();
      });
      openBtn.addEventListener('click', () => {
        this.selectItem(item.id);
      });

      const toggleBtn = document.createElement('button');
      toggleBtn.type = 'button';
      toggleBtn.className = 'btn';
      toggleBtn.textContent = included ? 'Exclude' : 'Include';
      toggleBtn.addEventListener('click', (event) => {
        event.stopPropagation();
      });
      toggleBtn.addEventListener('click', async () => {
        await this.updateItem(item.id, { include: !included });
      });

      actions.append(openBtn, toggleBtn);
      card.append(preview, title, badges, actions);
      grid.appendChild(card);
    }
  }

  selectItem(itemId) {
    if (this.state.selectedItemId === itemId) {
      return;
    }

    this.state.selectedItemId = itemId;
    this.renderAssets();
    this.renderEditor();
  }

  findSelectedItem() {
    return this.state.assets.find((item) => item.id === this.state.selectedItemId) || null;
  }

  renderEditor() {
    const selected = this.findSelectedItem();
    const canSave = this.state.provider?.getCapabilities?.().canSaveMetadata;

    if (!selected) {
      this.dom.editorStatus.textContent = 'Select an asset card.';
      this.dom.editorForm.hidden = true;
      this.dom.editorEmpty.hidden = false;
      return;
    }

    this.dom.editorEmpty.hidden = true;
    this.dom.editorForm.hidden = false;

    this.dom.editorStatus.textContent = canSave
      ? `Editing ${selected.id}`
      : `Editing ${selected.id} (read-only provider)`;

    this.dom.itemTitle.value = selected.title || '';
    this.dom.itemDescription.value = selected.description || '';
    this.dom.itemType.value = selected.media?.type || '';
    this.dom.itemCreator.value = selected.creator || '';
    this.dom.itemDate.value = selected.date || '';
    this.dom.itemLocation.value = selected.location || '';
    this.dom.itemLicense.value = selected.license || '';
    this.dom.itemAttribution.value = selected.attribution || '';
    this.dom.itemSource.value = selected.source || '';
    this.dom.itemTags.value = Array.isArray(selected.tags) ? selected.tags.join(', ') : '';
    this.dom.itemInclude.checked = selected.include !== false;
    this.dom.saveItemBtn.disabled = !canSave;
  }

  tagsToArray(rawValue) {
    return rawValue
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  collectEditorPatch() {
    return {
      title: this.dom.itemTitle.value.trim(),
      description: this.dom.itemDescription.value.trim(),
      creator: this.dom.itemCreator.value.trim(),
      date: this.dom.itemDate.value.trim(),
      location: this.dom.itemLocation.value.trim(),
      license: this.dom.itemLicense.value.trim(),
      attribution: this.dom.itemAttribution.value.trim(),
      source: this.dom.itemSource.value.trim(),
      tags: this.tagsToArray(this.dom.itemTags.value),
      include: this.dom.itemInclude.checked,
      media: {
        type: this.dom.itemType.value.trim(),
      },
    };
  }

  async updateItem(id, patch) {
    const canSave = this.state.provider.getCapabilities().canSaveMetadata;

    if (canSave) {
      const updated = await this.state.provider.saveMetadata(id, patch);
      if (!updated) {
        this.setStatus(`Could not update item ${id}`, 'warn');
        return;
      }

      this.state.assets = this.state.assets.map((item) => (item.id === id ? updated : item));
    } else {
      this.state.assets = this.state.assets.map((item) => (item.id === id ? { ...item, ...patch } : item));
      this.setStatus('Provider is read-only. Changes are local to this session.', 'warn');
    }

    this.renderAssets();
    this.renderEditor();
  }

  async connectCurrentProvider() {
    const providerId = this.state.selectedProviderId;
    const provider = this.providers[providerId];

    if (!provider) {
      this.setConnectionStatus('Selected provider is not yet available.', false);
      this.setStatus('Selected provider is not yet available.', 'warn');
      return;
    }

    this.state.provider = provider;
    this.state.connected = false;
    this.state.assets = [];
    this.state.selectedItemId = null;
    this.state.manifest = null;
    this.dom.manifestPreview.textContent = '{}';

    const config = {};
    if (providerId === 'local') {
      config.path = this.dom.localPathInput.value.trim() || COLLECTOR_CONFIG.defaultLocalManifestPath;
    }

    if (providerId === 'public-url') {
      config.manifestUrl = this.dom.publicUrlInput.value.trim();
    }

    if (providerId === 'github') {
      config.token = this.dom.githubToken.value;
      config.owner = this.dom.githubOwner.value;
      config.repo = this.dom.githubRepo.value;
      config.branch = this.dom.githubBranch.value;
      config.path = this.dom.githubPath.value;
    }

    try {
      const result = await provider.connect(config);
      this.renderCapabilities(provider);

      if (!result.ok) {
        this.setConnectionStatus(result.message, false);
        this.setStatus(result.message, 'warn');
        this.renderAssets();
        this.renderEditor();
        return;
      }

      this.state.connected = true;
      this.setConnectionStatus(result.message, true);
      this.setStatus(result.message, 'ok');

      this.state.assets = await provider.listAssets();
      this.state.selectedItemId = this.state.assets[0]?.id || null;

      if (providerId === 'local') {
        this.dom.collectionTitle.value = 'TimeMap Collector MVP Test Collection';
        this.dom.collectionDescription.value = 'Exported from local example dataset through TimeMap Collector.';
      }

      if (providerId === 'github') {
        this.dom.collectionTitle.value = `GitHub Collection: ${this.dom.githubOwner.value}/${this.dom.githubRepo.value}`;
        this.dom.collectionDescription.value = 'Exported from GitHub provider using token-based repository access.';
      }

      this.renderAssets();
      this.renderEditor();
      this.closeDialog(this.dom.providerDialog);
    } catch (error) {
      this.setConnectionStatus(`Connection error: ${error.message}`, false);
      this.setStatus(`Connection error: ${error.message}`, 'warn');
    }
  }

  currentCollectionMeta() {
    return {
      id: this.dom.collectionId.value.trim() || COLLECTOR_CONFIG.defaultCollectionMeta.id,
      title: this.dom.collectionTitle.value.trim() || COLLECTOR_CONFIG.defaultCollectionMeta.title,
      description:
        this.dom.collectionDescription.value.trim() || COLLECTOR_CONFIG.defaultCollectionMeta.description,
    };
  }

  async generateManifest() {
    if (!this.state.provider || !this.state.connected) {
      this.setStatus('Connect a provider before generating a manifest.', 'warn');
      return;
    }

    try {
      const baseManifest = await this.state.provider.exportCollection(this.currentCollectionMeta());
      const includedItems = this.state.assets.filter((item) => item.include !== false);

      const manifest = createManifest(baseManifest, includedItems);
      const errors = validateCollectionShape(manifest);
      if (errors.length > 0) {
        this.setStatus(`Manifest validation failed: ${errors.join(' ')}`, 'warn');
        return;
      }

      this.state.manifest = manifest;
      this.dom.manifestPreview.textContent = JSON.stringify(manifest, null, 2);
      this.setStatus('Manifest generated and validated.', 'ok');
    } catch (error) {
      this.setStatus(`Manifest generation failed: ${error.message}`, 'warn');
    }
  }

  async copyManifestToClipboard() {
    if (!this.state.manifest) {
      this.setStatus('Generate manifest before copying.', 'warn');
      return;
    }

    try {
      await navigator.clipboard.writeText(JSON.stringify(this.state.manifest, null, 2));
      this.setStatus('Manifest copied to clipboard.', 'ok');
    } catch (error) {
      this.setStatus(`Clipboard copy failed: ${error.message}`, 'warn');
    }
  }

  downloadManifest() {
    if (!this.state.manifest) {
      this.setStatus('Generate manifest before download.', 'warn');
      return;
    }

    const blob = new Blob([JSON.stringify(this.state.manifest, null, 2)], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'collection.json';
    anchor.click();
    URL.revokeObjectURL(url);

    this.setStatus('Downloaded collection.json.', 'ok');
  }
}

if (!customElements.get('timemap-collector')) {
  customElements.define('timemap-collector', TimemapCollectorElement);
}
