import { sourceManagerStyles } from '../css/source-manager.css.js';

class OpenCollectionsSourceManagerElement extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.model = {
      providerCatalog: [],
      sources: [],
      activeSourceId: 'all',
      selectedProviderId: 'example',
      addHostLevel: 'root',
      remoteSubtype: '',
      capabilities: {},
      connectionStatusText: 'Not connected.',
      connectionStatusTone: 'neutral',
      localFolderStatusText: 'No folder selected.',
      localFolderStatusTone: 'neutral',
      configValues: {
        githubToken: '',
        githubOwner: '',
        githubRepo: '',
        githubBranch: 'main',
        githubPath: '',
        localPathInput: '',
        localFolderName: '',
        s3Endpoint: '',
        s3Bucket: '',
        s3Region: '',
        s3BasePath: '',
        s3AccessKey: '',
        s3SecretKey: '',
      },
    };
  }

  connectedCallback() {
    this.render();
    this.bindEvents();
    this.applyState();
  }

  bindEvents() {
    this.shadowRoot.getElementById('addExampleHostBtn')?.addEventListener('click', () => {
      this.dispatch('add-example-host');
    });

    this.shadowRoot.getElementById('addLocalFolderHostBtn')?.addEventListener('click', () => {
      this.dispatch('add-local-folder-host');
    });

    this.shadowRoot.getElementById('remoteSubtypeCatalog')?.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-remote-subtype]');
      const remoteSubtype = button?.dataset.remoteSubtype || '';
      if (!remoteSubtype) {
        return;
      }
      this.openRemoteSubtype(remoteSubtype);
    });

    this.shadowRoot.getElementById('remoteProviderPanel')?.addEventListener('click', (event) => {
      const card = event.target.closest('.provider-card');
      if (!card) {
        return;
      }
      const providerId = card.dataset.providerId || '';
      if (!providerId || card.classList.contains('is-disabled')) {
        return;
      }
      this.openProviderConfig(providerId);
    });

    this.shadowRoot.getElementById('remoteBackBtn')?.addEventListener('click', () => {
      if (this.model.addHostLevel === 'remote-config' && ['git', 's3', 'domain'].includes(this.model.remoteSubtype)) {
        this.model.addHostLevel = 'remote-providers';
      } else {
        this.model.addHostLevel = 'root';
        this.model.remoteSubtype = '';
      }
      this.renderRemoteFlow();
      this.renderProviderVisibility();
    });

    this.shadowRoot.getElementById('openStorageOptionsBtn')?.addEventListener('click', () => {
      this.dispatch('open-storage-options');
    });

    this.shadowRoot.getElementById('connectBtn')?.addEventListener('click', () => {
      this.dispatch('connect-provider');
    });

  }

  dispatch(name, detail = {}) {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }

  isReady() {
    return Boolean(this.shadowRoot?.getElementById('rootActions'));
  }

  applyState() {
    if (!this.isReady()) {
      return;
    }
    this.renderRemoteFlow();
    this.renderSourcesList();
    this.renderProviderVisibility();
    this.applyConfigValues();
    this.setCapabilities(this.model.capabilities);
    this.setConnectionStatus(this.model.connectionStatusText, this.model.connectionStatusTone);
    this.setLocalFolderStatus(this.model.localFolderStatusText, this.model.localFolderStatusTone);
  }

  setProviderCatalog(catalog = []) {
    this.model.providerCatalog = Array.isArray(catalog) ? catalog : [];
    if (this.isReady()) {
      this.renderRemoteFlow();
      this.renderProviderVisibility();
    }
  }

  setSelectedProvider(providerId) {
    this.model.selectedProviderId = providerId || 'example';
    if (!this.isReady()) {
      return;
    }
    this.renderProviderVisibility();
  }

  setSources(sources = []) {
    this.model.sources = Array.isArray(sources) ? sources : [];
    if (this.isReady()) {
      this.renderSourcesList();
    }
  }

  setActiveSourceId(sourceId = 'all') {
    this.model.activeSourceId = sourceId || 'all';
    if (this.isReady()) {
      this.renderSourcesList();
    }
  }

  setConnectionStatus(text, tone = 'neutral') {
    this.model.connectionStatusText = text || 'Not connected.';
    this.model.connectionStatusTone = tone || 'neutral';
    const colors = {
      neutral: '#64748b',
      ok: '#166534',
      warn: '#9a3412',
    };
    const node = this.shadowRoot?.getElementById('connectionStatus');
    if (!node) {
      return;
    }
    node.textContent = this.model.connectionStatusText;
    node.style.color = colors[this.model.connectionStatusTone] || colors.neutral;
  }

  setCapabilities(capabilities) {
    this.model.capabilities = capabilities || {};
  }

  setLocalFolderStatus(text, tone = 'neutral') {
    this.model.localFolderStatusText = text || 'No folder selected.';
    this.model.localFolderStatusTone = tone || 'neutral';
    const colors = {
      neutral: '#64748b',
      ok: '#166534',
      warn: '#9a3412',
    };
    const node = this.shadowRoot?.getElementById('localFolderStatus');
    if (!node) {
      return;
    }
    node.textContent = this.model.localFolderStatusText;
    node.style.color = colors[this.model.localFolderStatusTone] || colors.neutral;
  }

  setConfigValues(nextValues = {}) {
    this.model.configValues = {
      ...this.model.configValues,
      ...(nextValues || {}),
    };
    this.applyConfigValues();
    if (Object.prototype.hasOwnProperty.call(nextValues || {}, 'localFolderName')) {
      const folderName = String(nextValues.localFolderName || '').trim();
      this.setLocalFolderStatus(folderName ? `Selected folder: ${folderName}` : 'No folder selected.', folderName ? 'ok' : 'neutral');
    }
  }

  applyConfigValues() {
    if (!this.isReady()) {
      return;
    }
    const values = this.model.configValues || {};
    const mapping = {
      githubToken: 'githubToken',
      githubOwner: 'githubOwner',
      githubRepo: 'githubRepo',
      githubBranch: 'githubBranch',
      githubPath: 'githubPath',
      localPathInput: 'localPathInput',
      localFolderName: 'localFolderName',
      s3Endpoint: 's3Endpoint',
      s3Bucket: 's3Bucket',
      s3Region: 's3Region',
      s3BasePath: 's3BasePath',
      s3AccessKey: 's3AccessKey',
      s3SecretKey: 's3SecretKey',
    };
    for (const [key, id] of Object.entries(mapping)) {
      const input = this.shadowRoot.getElementById(id);
      if (!input) {
        continue;
      }
      const raw = values[key];
      if (raw === undefined || raw === null) {
        continue;
      }
      input.value = String(raw);
    }
  }

  getProviderConfig(providerId) {
    const root = this.shadowRoot;
    const config = {};
    if (!root) {
      return config;
    }

    if (providerId === 'local') {
      config.path = root.getElementById('localPathInput')?.value.trim() || '';
      config.localDirectoryName = root.getElementById('localFolderName')?.value.trim() || '';
    }

    if (providerId === 'example') {
      config.path = root.getElementById('localPathInput')?.value.trim() || '';
    }

    if (providerId === 'github') {
      config.token = root.getElementById('githubToken')?.value || '';
      config.owner = root.getElementById('githubOwner')?.value || '';
      config.repo = root.getElementById('githubRepo')?.value || '';
      config.branch = root.getElementById('githubBranch')?.value || '';
      config.path = root.getElementById('githubPath')?.value || '';
    }

    if (providerId === 's3') {
      config.endpoint = root.getElementById('s3Endpoint')?.value || '';
      config.bucket = root.getElementById('s3Bucket')?.value || '';
      config.region = root.getElementById('s3Region')?.value || '';
      config.basePath = root.getElementById('s3BasePath')?.value || '';
      config.accessKey = root.getElementById('s3AccessKey')?.value || '';
      config.secretKey = root.getElementById('s3SecretKey')?.value || '';
    }

    return config;
  }

  providerById(providerId) {
    return this.model.providerCatalog.find((entry) => entry.id === providerId) || null;
  }

  providersForCategory(categoryId, predicate = null) {
    return this.model.providerCatalog.filter((entry) => entry.category === categoryId && (!predicate || predicate(entry)));
  }

  openRemoteSubtype(remoteSubtype) {
    this.model.remoteSubtype = remoteSubtype;
    if (remoteSubtype === 'git' || remoteSubtype === 's3') {
      this.model.addHostLevel = 'remote-providers';
    } else {
      this.model.addHostLevel = 'remote-config';
      this.dispatch('select-provider', { providerId: 'custom-domain' });
    }
    this.renderRemoteFlow();
    this.renderProviderVisibility();
  }

  openProviderConfig(providerId) {
    if (!providerId) {
      return;
    }
    this.model.selectedProviderId = providerId;
    this.model.addHostLevel = 'remote-config';
    this.dispatch('select-provider', { providerId });
    this.renderRemoteFlow();
    this.renderProviderVisibility();
  }

  renderProviderVisibility() {
    const selected = this.providerById(this.model.selectedProviderId);
    const providerLabel = selected?.label || this.model.selectedProviderId || 'Remote host';
    const providerConfigTitle = this.shadowRoot?.getElementById('providerConfigTitle');
    if (providerConfigTitle) {
      providerConfigTitle.textContent = `${providerLabel} configuration`;
    }

    const sections = {
      github: this.shadowRoot?.getElementById('githubConfig'),
      s3: this.shadowRoot?.getElementById('s3Config'),
      placeholder: this.shadowRoot?.getElementById('placeholderConfig'),
    };

    Object.values(sections).forEach((node) => {
      if (node) {
        node.classList.add('is-hidden');
      }
    });

    const connectBtn = this.shadowRoot?.getElementById('connectBtn');
    if (this.model.addHostLevel !== 'remote-config') {
      if (connectBtn) {
        connectBtn.disabled = true;
      }
      return;
    }

    if (this.model.selectedProviderId === 'github') {
      sections.github?.classList.remove('is-hidden');
    } else if (this.model.selectedProviderId === 's3') {
      sections.s3?.classList.remove('is-hidden');
    } else {
      sections.placeholder?.classList.remove('is-hidden');
    }

    if (connectBtn) {
      connectBtn.disabled = selected?.enabled === false || !['github', 's3'].includes(this.model.selectedProviderId);
    }
  }

  renderRemoteFlow() {
    const rootActions = this.shadowRoot?.getElementById('rootActions');
    const remoteFlow = this.shadowRoot?.getElementById('remoteFlow');
    const backBtn = this.shadowRoot?.getElementById('remoteBackBtn');
    const breadcrumb = this.shadowRoot?.getElementById('remoteFlowBreadcrumb');
    const providerPanel = this.shadowRoot?.getElementById('remoteProviderPanel');
    const configPanel = this.shadowRoot?.getElementById('providerConfig');
    if (!rootActions || !remoteFlow || !backBtn || !breadcrumb || !providerPanel || !configPanel) {
      return;
    }

    const inRoot = this.model.addHostLevel === 'root';
    rootActions.classList.toggle('is-hidden', !inRoot);
    remoteFlow.classList.toggle('is-hidden', inRoot);
    backBtn.classList.toggle('is-hidden', inRoot);

    if (inRoot) {
      breadcrumb.textContent = '';
      return;
    }

    const subtitleByType = {
      git: 'Remote host / Git repository / Provider',
      s3: 'Remote host / Object storage',
      domain: 'Remote host / Custom domain',
    };
    if (this.model.addHostLevel === 'remote-config' && this.model.remoteSubtype === 'git') {
      breadcrumb.textContent = 'Remote host / Git repository / GitHub configuration';
    } else if (this.model.addHostLevel === 'remote-config' && this.model.remoteSubtype === 's3') {
      breadcrumb.textContent = 'Remote host / Object storage / S3-compatible configuration';
    } else {
      breadcrumb.textContent = subtitleByType[this.model.remoteSubtype] || 'Remote host';
    }

    const showingProviders = this.model.addHostLevel === 'remote-providers';
    const showingConfig = this.model.addHostLevel === 'remote-config';
    providerPanel.classList.toggle('is-hidden', !showingProviders);
    configPanel.classList.toggle('is-hidden', !showingConfig);

    if (showingProviders) {
      this.renderRemoteProviderCatalog();
    }
  }

  renderRemoteProviderCatalog() {
    const wrap = this.shadowRoot?.getElementById('remoteProviderPanel');
    if (!wrap) {
      return;
    }
    wrap.innerHTML = '';
    const providers = this.providersForCategory('remote', (entry) => entry.remoteSubtype === this.model.remoteSubtype);
    for (const entry of providers) {

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'provider-card';
      button.dataset.providerId = entry.id;
      button.disabled = entry.enabled === false;
      if (entry.enabled === false) {
        button.classList.add('is-disabled');
      }
      if (this.model.selectedProviderId === entry.id) {
        button.classList.add('is-selected');
      }

      button.innerHTML = `
        <div class="provider-card-label-row">
          <strong>${entry.label}</strong>
          <span class="pill ${entry.enabled === false ? 'is-muted' : ''}">${entry.statusLabel || 'Available'}</span>
        </div>
        <span class="panel-subtext">${entry.description || ''}</span>
      `;
      wrap.appendChild(button);
    }
  }

  hostStateFor(source) {
    if (source.needsCredentials) {
      return { label: 'Credentials missing', tone: 'warn' };
    }
    if (source.needsReconnect) {
      return { label: 'Needs reconnect', tone: 'warn' };
    }
    if (source.capabilities?.canPublish) {
      return { label: 'Publishable', tone: 'ok' };
    }
    return { label: 'Read-only', tone: 'neutral' };
  }

  renderSourcesList() {
    const list = this.shadowRoot?.getElementById('sourceList');
    if (!list) {
      return;
    }
    list.innerHTML = '';

    if (!this.model.sources.length) {
      const empty = document.createElement('div');
      empty.className = 'empty';
      empty.textContent = 'No hosts added yet.';
      list.appendChild(empty);
      return;
    }

    for (const source of this.model.sources) {
      const card = document.createElement('article');
      card.className = 'source-card';
      const isActive = this.model.activeSourceId === source.id;
      if (isActive) {
        card.classList.add('is-active');
      }

      const top = document.createElement('div');
      top.className = 'source-card-top';

      const labelBlock = document.createElement('div');
      const label = document.createElement('p');
      label.className = 'source-card-label';
      label.textContent = source.displayLabel || source.label;
      const detail = document.createElement('p');
      detail.className = 'panel-subtext';
      detail.textContent = source.detailLabel || `${source.providerLabel} | ${source.itemCount || 0} items`;
      labelBlock.append(label, detail);

      const badges = document.createElement('div');
      badges.className = 'badge-row';
      const readBadge = document.createElement('span');
      readBadge.className = 'pill';
      if (source.capabilities?.canPublish) {
        readBadge.textContent = 'Publish target';
      } else if (source.capabilities?.canSaveMetadata) {
        readBadge.textContent = 'Read + Write';
      } else {
        readBadge.textContent = 'Read';
      }
      const authBadge = document.createElement('span');
      authBadge.className = 'pill';
      if (source.needsCredentials) {
        authBadge.textContent = source.providerId === 's3' ? 'Credentials required' : 'Token required';
      } else if (source.authMode === 'token') {
        authBadge.textContent = 'Token auth';
      } else if (source.authMode === 'access-key') {
        authBadge.textContent = 'Access key auth';
      } else {
        authBadge.textContent = 'Public';
      }
      badges.append(readBadge, authBadge);
      top.append(labelBlock, badges);

      const status = document.createElement('p');
      status.className = 'panel-subtext';
      status.textContent = source.status || 'Connected';

      const hostState = this.hostStateFor(source);
      const meta = document.createElement('div');
      meta.className = 'source-card-meta';
      const statusPill = document.createElement('span');
      statusPill.className = `pill ${hostState.tone === 'warn' ? 'is-warn' : hostState.tone === 'ok' ? 'is-ok' : ''}`.trim();
      statusPill.textContent = hostState.label;
      const activePill = document.createElement('span');
      activePill.className = `pill ${isActive ? 'is-ok' : ''}`.trim();
      activePill.textContent = isActive ? 'Active host' : 'Inactive';
      const publishPill = document.createElement('span');
      publishPill.className = `pill ${source.capabilities?.canPublish ? 'is-ok' : 'is-muted'}`.trim();
      publishPill.textContent = source.capabilities?.canPublish ? 'Can publish' : 'Cannot publish';
      const countPill = document.createElement('span');
      countPill.className = 'pill';
      countPill.textContent = `${source.itemCount || 0} items`;
      const collectionPill = document.createElement('span');
      collectionPill.className = 'pill';
      collectionPill.textContent = `${source.collections?.length || 0} collections`;
      meta.append(activePill, statusPill, publishPill, countPill, collectionPill);

      if (source.lastPublishResult?.detail) {
        const publishDetail = document.createElement('p');
        publishDetail.className = 'panel-subtext';
        publishDetail.textContent = `Last publish: ${source.lastPublishResult.detail}`;
        card.append(top, status, publishDetail, meta);
      } else {
        card.append(top, status, meta);
      }

      const actions = document.createElement('div');
      actions.className = 'source-card-actions';
      actions.innerHTML = `
        <button type="button" class="btn" data-action="refresh" data-source-id="${source.id}">Refresh</button>
        <button type="button" class="btn" data-action="inspect" data-source-id="${source.id}">Inspect</button>
        <button type="button" class="btn" data-action="show-only" data-source-id="${source.id}">Show only</button>
        <button type="button" class="btn" data-action="remove" data-source-id="${source.id}">Remove</button>
      `;

      card.append(actions);
      list.appendChild(card);
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>${sourceManagerStyles}</style>
      <div class="source-manager">
        <div class="provider-layout single-column">
          <div id="rootActions">
            <p class="config-section-title">Add a host</p>
            <div class="provider-list">
              <button class="provider-card" id="addExampleHostBtn" type="button">
                <div class="provider-card-label-row"><strong>Add example host</strong></div>
                <span class="panel-subtext">Connect instantly to the built-in demo host.</span>
              </button>
              <button class="provider-card" id="addLocalFolderHostBtn" type="button">
                <div class="provider-card-label-row"><strong>Add local folder host</strong></div>
                <span class="panel-subtext">Pick a folder and add it as a writable local host.</span>
              </button>
              <div class="provider-config remote-card">
                <p class="config-section-title">Remote host</p>
                <p class="panel-subtext">Connect a remote publish target for your local-first workflow.</p>
                <div id="remoteSubtypeCatalog" class="dialog-actions">
                  <button class="btn" type="button" data-remote-subtype="git">Git repository</button>
                  <button class="btn" type="button" data-remote-subtype="s3">Object storage (S3 compatible)</button>
                  <button class="btn" type="button" data-remote-subtype="domain">Custom domain</button>
                </div>
              </div>
            </div>
          </div>

          <div id="remoteFlow" class="is-hidden">
            <div class="dialog-actions">
              <button class="btn" id="remoteBackBtn" type="button">Back</button>
            </div>
            <p id="remoteFlowBreadcrumb" class="panel-subtext"></p>
            <div id="remoteProviderPanel" class="provider-list"></div>

            <div id="providerConfig" class="provider-config is-hidden">
              <p id="providerConfigTitle" class="config-section-title">Host configuration</p>
              <p id="localFolderStatus" class="panel-subtext is-hidden">No folder selected.</p>
              <div class="field-row is-hidden"><label for="localPathInput">Collection path</label><input id="localPathInput" type="text" /></div>
              <input id="localFolderName" type="hidden" value="" />

              <div id="githubConfig" class="is-hidden">
                <div class="field-row"><label for="githubToken">GitHub token (PAT)</label><input id="githubToken" type="password" /></div>
                <div class="field-row"><label for="githubOwner">Repository owner</label><input id="githubOwner" type="text" /></div>
                <div class="field-row"><label for="githubRepo">Repository name</label><input id="githubRepo" type="text" /></div>
                <div class="field-row"><label for="githubBranch">Branch</label><input id="githubBranch" type="text" value="main" /></div>
                <div class="field-row"><label for="githubPath">Folder path (optional)</label><input id="githubPath" type="text" placeholder="media/" /></div>
              </div>

              <div id="s3Config" class="is-hidden">
                <p class="panel-subtext">S3-compatible hosts are configured now as publish targets. Upload/pull will be added next.</p>
                <div class="field-row"><label for="s3Endpoint">Endpoint URL</label><input id="s3Endpoint" type="text" placeholder="https://s3.example.org" /></div>
                <div class="field-row"><label for="s3Bucket">Bucket</label><input id="s3Bucket" type="text" /></div>
                <div class="field-row"><label for="s3Region">Region</label><input id="s3Region" type="text" placeholder="us-east-1" /></div>
                <div class="field-row"><label for="s3BasePath">Base path / prefix (optional)</label><input id="s3BasePath" type="text" placeholder="collections/" /></div>
                <div class="field-row"><label for="s3AccessKey">Access key</label><input id="s3AccessKey" type="password" /></div>
                <div class="field-row"><label for="s3SecretKey">Secret key</label><input id="s3SecretKey" type="password" /></div>
              </div>

              <div id="placeholderConfig" class="is-hidden">
                <div class="empty">This remote host type is not available yet in this MVP.</div>
              </div>

              <div class="dialog-actions">
                <button class="btn btn-primary" id="connectBtn" type="button">Add host</button>
              </div>
            </div>
          </div>
        </div>

        <p id="connectionStatus" class="panel-subtext">Not connected.</p>
      </div>
    `;
  }
}

if (!customElements.get('open-collections-source-manager')) {
  customElements.define('open-collections-source-manager', OpenCollectionsSourceManagerElement);
}

export { OpenCollectionsSourceManagerElement };
