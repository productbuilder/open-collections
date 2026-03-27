import { createLocalProvider } from '../../../packages/provider-local/src/index.js';
import { createGithubProvider } from '../../../packages/provider-github/src/index.js';
import { createS3Provider } from '../../../packages/provider-s3/src/index.js';
import { pickHostDirectory, supportsHostDirectoryPicker } from '../../../shared/platform/host-directory.js';
import { MANAGER_CONFIG } from '../../collection-manager/src/config.js';
import { createCredentialStore, makeConnectionId } from '../../../shared/account/index.js';
import { renderShell } from './render/render-shell.js';
import '../../collection-manager/src/components/connections-list-panel.js';
import '../../collection-manager/src/components/add-connection-panel.js';

const ACCOUNT_SOURCES_STORAGE_KEY = 'open_collections_account_sources_v1';

function serializeLocalDirectoryHandle(handle) {
  if (!handle || handle.kind !== 'directory') {
    return null;
  }
  const path = String(handle.path || '').trim();
  if (!path) {
    return null;
  }
  const fallbackName = path.split(/[\\/]/).filter(Boolean).pop() || '';
  return {
    kind: 'directory',
    path,
    name: String(handle.name || fallbackName).trim() || fallbackName,
  };
}

class OpenCollectionsAccountElement extends HTMLElement {
  constructor() {
    super();
    this.state = {
      sources: [],
      activeSourceId: 'all',
      selectedProviderId: 'example',
      view: 'list',
      activeSection: 'connections',
    };

    this.pendingSourceRepair = null;
    this.selectedLocalDirectoryHandle = null;
    this.localFolderPickerSupported = supportsHostDirectoryPicker();
    this.credentialStore = createCredentialStore();

    this.providerFactories = {
      example: createLocalProvider(),
      local: createLocalProvider(),
      github: createGithubProvider(),
      s3: createS3Provider(),
    };

    this.providers = {
      example: createLocalProvider,
      local: createLocalProvider,
      github: createGithubProvider,
      s3: createS3Provider,
    };

    this.providerCatalog = [
      {
        ...this.providerFactories.example.getDescriptor(),
        id: 'example',
        category: 'example',
        label: 'Built-in example collections',
        description: 'Connect instantly to the built-in example collections from this repository.',
      },
      {
        ...this.providerFactories.local.getDescriptor(),
        category: 'local',
        label: 'Folder on this device',
        description: 'Use a folder on this device as a writable local connection (browser support required).',
      },
      {
        ...this.providerFactories.github.getDescriptor(),
        id: 'github',
        category: 'remote',
        remoteSubtype: 'git',
        label: 'GitHub',
        description: 'Connect a GitHub repository for managed collections.',
      },
      {
        id: 'gitlab',
        category: 'remote',
        remoteSubtype: 'git',
        label: 'GitLab',
        enabled: false,
        statusLabel: 'Coming soon',
        description: 'GitLab repository connections are planned but not yet available in this MVP.',
      },
      {
        id: 'gitea',
        category: 'remote',
        remoteSubtype: 'git',
        label: 'Gitea',
        enabled: false,
        statusLabel: 'Coming soon',
        description: 'Gitea repository connections are planned but not yet available in this MVP.',
      },
      {
        ...this.providerFactories.s3.getDescriptor(),
        id: 's3',
        category: 'remote',
        remoteSubtype: 's3',
        label: 'S3-compatible storage',
        statusLabel: 'Foundation',
        description: 'Configure an S3-compatible object storage connection as a publish target in a local-first workflow.',
      },
      {
        id: 'custom-domain',
        category: 'remote',
        remoteSubtype: 'domain',
        label: 'Custom domain',
        enabled: false,
        statusLabel: 'Planned',
        description: 'Connect a custom-hosted manifest endpoint.',
      },
    ];

    this.shadow = this.attachShadow({ mode: 'open' });
    renderShell(this.shadow);
    this.cacheDom();
  }

  connectedCallback() {
    this.bindEvents();
    this.dom.addConnectionPanel?.setLocalFolderSupport(this.localFolderPickerSupported);
    this.renderProviderCatalog();
    this.setSelectedProvider('example');
    this.setActiveSection('connections');
    this.renderConnectionsListPanel();
    this.restoreRememberedSources();
    this.setStatus(this.state.sources.length ? 'Select a connection to inspect or refresh.' : 'No connections yet.', 'neutral');
  }

  cacheDom() {
    this.dom = {
      accountStatus: this.shadow.getElementById('accountStatus'),
      sectionButtons: Array.from(this.shadow.querySelectorAll('[data-section-button]')),
      connectionsSection: this.shadow.getElementById('connectionsSection'),
      settingsSection: this.shadow.getElementById('settingsSection'),
      connectionsListPanel: this.shadow.getElementById('connectionsListPanel'),
      addConnectionPanel: this.shadow.getElementById('addConnectionPanel'),
    };
  }

  bindEvents() {
    if (this._eventsBound) {
      return;
    }
    this._eventsBound = true;

    this.dom.sectionButtons?.forEach((button) => {
      button.addEventListener('click', () => {
        const section = button.dataset.sectionButton || '';
        if (section) {
          this.setActiveSection(section);
        }
      });
    });

    this.dom.connectionsListPanel?.addEventListener('open-add-connection', () => this.openAddConnectionView());
    this.dom.connectionsListPanel?.addEventListener('select-connection', (event) => {
      const source = this.getSourceById(event.detail?.sourceId || '');
      if (!source) {
        return;
      }
      this.state.activeSourceId = source.id;
      this.renderConnectionsListPanel();
      this.setStatus(`Selected connection ${source.displayLabel || source.providerLabel || source.id}.`, 'neutral');
    });
    this.dom.connectionsListPanel?.addEventListener('refresh-connection', async (event) => {
      const sourceId = event.detail?.sourceId || '';
      if (sourceId) {
        await this.refreshSource(sourceId);
      }
    });
    this.dom.connectionsListPanel?.addEventListener('repair-connection', async (event) => {
      const sourceId = event.detail?.sourceId || '';
      const mode = event.detail?.mode || '';
      if (!sourceId || !mode) {
        return;
      }
      if (mode === 'credentials') {
        this.openCredentialRepairView(sourceId);
        return;
      }
      if (mode === 'folder') {
        this.prepareSourceRepair(sourceId, 'folder');
        const didPick = await this.pickLocalFolder();
        if (didPick) {
          await this.refreshSource(sourceId, { configOverrides: { localDirectoryHandle: this.selectedLocalDirectoryHandle } });
        }
        return;
      }
      this.prepareSourceRepair(sourceId, 'reconnect');
      await this.refreshSource(sourceId);
    });
    this.dom.connectionsListPanel?.addEventListener('remove-connection', (event) => {
      const sourceId = event.detail?.sourceId || '';
      if (sourceId) {
        this.removeSource(sourceId);
      }
    });

    this.dom.addConnectionPanel?.addEventListener('back-to-connections', () => {
      this.clearPendingSourceRepair();
      this.dom.addConnectionPanel?.resetFlow?.();
      this.showConnectionsListView();
    });
    this.dom.addConnectionPanel?.addEventListener('select-provider', (event) => {
      const providerId = event.detail?.providerId || '';
      if (providerId) {
        this.setSelectedProvider(providerId);
      }
    });
    this.dom.addConnectionPanel?.addEventListener('connect-provider', async () => {
      await this.connectCurrentProvider();
    });
    this.dom.addConnectionPanel?.addEventListener('add-example-connection', async () => {
      this.clearPendingSourceRepair();
      this.setSelectedProvider('example');
      await this.connectCurrentProvider();
    });
    this.dom.addConnectionPanel?.addEventListener('add-local-folder-connection', async () => {
      this.clearPendingSourceRepair();
      this.setSelectedProvider('local');
      const didPick = await this.pickLocalFolder();
      if (didPick) {
        await this.connectCurrentProvider();
      }
    });
  }

  setStatus(text, tone = 'neutral') {
    if (!this.dom.accountStatus) {
      return;
    }
    this.dom.accountStatus.textContent = text;
    this.dom.accountStatus.dataset.tone = tone;
  }

  setConnectionStatus(text, tone = 'neutral') {
    this.dom.addConnectionPanel?.setConnectionStatus(text, tone);
  }

  setActiveSection(sectionId) {
    const nextSection = sectionId === 'settings' ? 'settings' : 'connections';
    this.state.activeSection = nextSection;

    this.dom.connectionsSection?.classList.toggle('is-hidden', nextSection !== 'connections');
    this.dom.settingsSection?.classList.toggle('is-hidden', nextSection !== 'settings');

    this.dom.sectionButtons?.forEach((button) => {
      const isActive = button.dataset.sectionButton === nextSection;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
  }

  showConnectionsListView() {
    this.state.view = 'list';
    this.setActiveSection('connections');
    this.dom.connectionsListPanel?.classList.remove('is-hidden');
    this.dom.addConnectionPanel?.classList.add('is-hidden');
    this.renderConnectionsListPanel();
  }

  openAddConnectionView() {
    this.clearPendingSourceRepair();
    this.dom.addConnectionPanel?.resetFlow?.();
    this.showAddConnectionView();
  }

  showAddConnectionView() {
    this.state.view = 'add';
    this.setActiveSection('connections');
    this.dom.connectionsListPanel?.classList.add('is-hidden');
    this.dom.addConnectionPanel?.classList.remove('is-hidden');
  }

  openCredentialRepairView(sourceId) {
    const source = this.prepareSourceRepair(sourceId, 'credentials');
    if (!source || !['github', 's3'].includes(source.providerId)) {
      return;
    }
    this.inspectSource(source.id);
    this.dom.addConnectionPanel?.openRepairCredentials?.(source.providerId);
    this.showAddConnectionView();
  }

  renderProviderCatalog() {
    this.dom.addConnectionPanel?.setProviderCatalog(this.providerCatalog);
  }

  setSelectedProvider(providerId) {
    const selected = this.providerCatalog.find((entry) => entry.id === providerId);
    if (!selected) {
      return;
    }
    this.state.selectedProviderId = providerId;
    this.dom.addConnectionPanel?.setSelectedProvider(providerId);
    this.renderCapabilities(this.providerFactories[providerId]?.getCapabilities?.() || selected.capabilities || {});
  }

  renderCapabilities(capabilities) {
    this.dom.addConnectionPanel?.setCapabilities(capabilities || {});
  }

  getSourceById(sourceId) {
    return this.state.sources.find((source) => source.id === sourceId) || null;
  }

  clearPendingSourceRepair() {
    this.pendingSourceRepair = null;
  }

  prepareSourceRepair(sourceId, mode = 'reconnect') {
    const source = this.getSourceById(sourceId);
    if (!source) {
      return null;
    }
    this.pendingSourceRepair = { sourceId, mode };
    return source;
  }

  sourceDisplayLabelFor(providerId, config, fallbackLabel) {
    if (providerId === 'github') {
      return (config.repo || '').trim() || 'GitHub';
    }
    if (providerId === 'example') {
      return 'Built-in examples';
    }
    if (providerId === 's3') {
      return (config.bucket || '').trim() || 'S3-compatible storage';
    }
    if (providerId === 'local') {
      return (config.localDirectoryName || '').trim() || (config.path || '').trim() || 'Folder on this device';
    }
    return fallbackLabel || 'Connection';
  }

  sourceDetailLabelFor(providerId, config, fallbackLabel) {
    if (providerId === 'github') {
      const owner = (config.owner || '').trim();
      const repo = (config.repo || '').trim();
      const path = (config.path || '').trim();
      const branch = (config.branch || 'main').trim() || 'main';
      const base = owner && repo ? `${owner}/${repo}` : fallbackLabel;
      const scope = path || '/';
      return `${base} @ ${branch}:${scope}`;
    }
    if (providerId === 'example') {
      return MANAGER_CONFIG.defaultLocalManifestPath;
    }
    if (providerId === 's3') {
      const endpoint = (config.endpoint || '').trim();
      const bucket = (config.bucket || '').trim();
      const basePath = (config.basePath || '').trim();
      const region = (config.region || '').trim();
      const base = endpoint || 'S3 endpoint';
      const bucketPart = bucket ? `/${bucket}` : '';
      const prefixPart = basePath ? `/${basePath.replace(/^\/+/, '')}` : '';
      const regionPart = region ? ` (${region})` : '';
      return `${base}${bucketPart}${prefixPart}${regionPart}`;
    }
    if (providerId === 'local') {
      return (config.path || '').trim() || 'Folder on this device';
    }
    return fallbackLabel || 'Connection';
  }

  sanitizeSourceConfig(providerId, config = {}) {
    if (providerId === 'github') {
      return {
        owner: (config.owner || '').trim(),
        repo: (config.repo || '').trim(),
        branch: (config.branch || 'main').trim() || 'main',
        path: (config.path || '').trim(),
      };
    }
    if (providerId === 's3') {
      return {
        endpoint: (config.endpoint || '').trim(),
        bucket: (config.bucket || '').trim(),
        region: (config.region || '').trim(),
        basePath: (config.basePath || '').trim(),
      };
    }
    if (providerId === 'example') {
      return {
        path: MANAGER_CONFIG.defaultLocalManifestPath,
        localDirectoryName: '',
      };
    }
    if (providerId === 'local') {
      const serializedHandle = serializeLocalDirectoryHandle(config.localDirectoryHandle);
      return {
        path: (config.path || '').trim() || MANAGER_CONFIG.defaultLocalManifestPath,
        localDirectoryName: (config.localDirectoryName || '').trim(),
        ...(serializedHandle ? { localDirectoryHandle: serializedHandle } : {}),
      };
    }
    return {};
  }

  sourceIdentityKey(source) {
    if (!source) {
      return '';
    }
    const providerId = source.providerId || 'unknown';
    const sanitized = this.sanitizeSourceConfig(providerId, source.config || {});
    return `${providerId}:${JSON.stringify(sanitized)}`;
  }

  uniqueSourcesForDisplay(sources = []) {
    const result = [];
    const seen = new Set();
    for (const source of sources) {
      const key = this.sourceIdentityKey(source);
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      result.push(source);
    }
    return result;
  }

  renderConnectionsListPanel() {
    const unique = this.uniqueSourcesForDisplay(this.state.sources);
    this.dom.connectionsListPanel?.setSources(unique);
    this.dom.connectionsListPanel?.setActiveSourceId(this.state.activeSourceId || 'all');
  }

  collectCurrentProviderConfig(providerId) {
    const config = this.dom.addConnectionPanel?.getProviderConfig(providerId) || {};

    if (providerId === 'local') {
      config.localDirectoryName = (config.localDirectoryName || '').trim();
      const selectedHandle = this.selectedLocalDirectoryHandle && this.selectedLocalDirectoryHandle.kind === 'directory'
        ? this.selectedLocalDirectoryHandle
        : null;
      if (selectedHandle) {
        config.localDirectoryHandle = selectedHandle;
        const path = String(selectedHandle.path || '').trim();
        if (path) {
          config.path = path;
        }
        if (!config.localDirectoryName) {
          config.localDirectoryName = String(selectedHandle.name || '').trim();
        }
      }
      config.path = (config.path || '').trim() || MANAGER_CONFIG.defaultLocalManifestPath;
    }

    if (providerId === 'example') {
      config.path = MANAGER_CONFIG.defaultLocalManifestPath;
    }

    if (providerId === 'github') {
      return {
        token: String(config.token || ''),
        owner: String(config.owner || '').trim(),
        repo: String(config.repo || '').trim(),
        branch: String(config.branch || 'main').trim() || 'main',
        path: String(config.path || '').trim(),
      };
    }

    if (providerId === 's3') {
      return {
        endpoint: String(config.endpoint || '').trim(),
        bucket: String(config.bucket || '').trim(),
        region: String(config.region || '').trim(),
        basePath: String(config.basePath || '').trim(),
        accessKey: String(config.accessKey || '').trim(),
        secretKey: String(config.secretKey || ''),
      };
    }

    return config;
  }

  async pickLocalFolder() {
    if (!this.localFolderPickerSupported) {
      this.dom.addConnectionPanel?.setLocalFolderStatus('Local folder requires a supported browser or the desktop app.', 'warn');
      this.setStatus('Local folder is unavailable in this browser. Use the desktop app, GitHub, or S3.', 'warn');
      return false;
    }

    try {
      const handle = await pickHostDirectory();
      const folderName = (handle?.name || '').trim() || 'Selected folder';
      const folderPath = String(handle?.path || '').trim();
      this.selectedLocalDirectoryHandle = handle || null;
      this.dom.addConnectionPanel?.setConfigValues({
        localFolderName: folderName,
        localPathInput: folderPath || folderName,
      });
      this.dom.addConnectionPanel?.setLocalFolderStatus(`Selected folder: ${folderPath || folderName}`, 'ok');
      this.setStatus(`Selected local folder: ${folderPath || folderName}`, 'ok');
      return true;
    } catch (error) {
      if (error?.name === 'AbortError') {
        this.dom.addConnectionPanel?.setLocalFolderStatus('Folder selection cancelled.', 'neutral');
        return false;
      }
      this.dom.addConnectionPanel?.setLocalFolderStatus(`Folder selection failed: ${error.message}`, 'warn');
      this.setStatus(`Folder selection failed: ${error.message}`, 'warn');
      return false;
    }
  }

  async connectCurrentProvider() {
    const providerId = this.state.selectedProviderId;
    const providerFactory = this.providers[providerId];
    const providerMeta = this.providerCatalog.find((entry) => entry.id === providerId);

    if (!providerFactory || providerMeta?.enabled === false) {
      this.setConnectionStatus('Selected connection type is not available yet.', 'warn');
      this.setStatus('Selected connection type is not available yet.', 'warn');
      return;
    }

    const config = this.collectCurrentProviderConfig(providerId);
    if (providerId === 'local' && !config.localDirectoryHandle) {
      this.setConnectionStatus('Select a local folder first.', 'warn');
      this.setStatus('Select a local folder before adding this connection.', 'warn');
      return;
    }

    const provider = providerFactory();

    try {
      const result = await provider.connect(config);
      this.renderCapabilities(provider.getCapabilities?.() || {});
      if (!result.ok) {
        this.setConnectionStatus(result.message || 'Connection failed.', 'warn');
        this.setStatus(result.message || 'Connection failed.', 'warn');
        return;
      }

      const loaded = await provider.listAssets();
      const displayLabel = result.sourceDisplayLabel
        || this.sourceDisplayLabelFor(providerId, config, providerMeta?.label || providerId);
      const detailLabel = result.sourceDetailLabel
        || this.sourceDetailLabelFor(providerId, config, providerMeta?.label || providerId);

      const repairingSource = this.pendingSourceRepair?.sourceId ? this.getSourceById(this.pendingSourceRepair.sourceId) : null;
      const draftSource = {
        id: repairingSource?.id || makeConnectionId(providerId),
        providerId,
        providerLabel: providerMeta?.label || providerId,
        label: detailLabel,
        displayLabel,
        detailLabel,
        config: { ...config },
        capabilities: provider.getCapabilities(),
        status: result.message || 'Connected',
        authMode:
          providerId === 'github'
            ? (config.token || '').trim() ? 'token' : 'public'
            : providerId === 'local' ? 'local-folder' : providerId === 's3' ? 'access-key' : providerId,
        itemCount: Array.isArray(loaded) ? loaded.length : 0,
        provider,
        needsReconnect: false,
        needsCredentials: false,
      };

      const duplicate = !repairingSource
        ? this.state.sources.find((entry) => this.sourceIdentityKey(entry) === this.sourceIdentityKey(draftSource))
        : null;
      const target = duplicate || repairingSource;
      const source = {
        ...draftSource,
        id: target?.id || draftSource.id,
      };

      if (providerId === 'github' || providerId === 's3') {
        await this.credentialStore.storeSourceSecret(source, config);
      }

      if (providerId === 'local' && config.localDirectoryHandle) {
        this.selectedLocalDirectoryHandle = config.localDirectoryHandle;
      }

      if (target) {
        this.state.sources = this.state.sources.map((entry) => (entry.id === target.id ? source : entry));
      } else {
        this.state.sources = [...this.state.sources, source];
      }
      this.state.activeSourceId = source.id;
      this.clearPendingSourceRepair();
      this.showConnectionsListView();
      this.persistSources();
      this.renderConnectionsListPanel();
      this.setConnectionStatus(result.message || 'Connected.', 'ok');
      this.setStatus(
        target
          ? `Reconnected ${displayLabel} (${source.itemCount} assets found).`
          : `Added ${displayLabel} (${source.itemCount} assets found).`,
        'ok',
      );
    } catch (error) {
      this.clearPendingSourceRepair();
      this.setConnectionStatus(`Connection error: ${error.message}`, 'warn');
      this.setStatus(`Connection error: ${error.message}`, 'warn');
    }
  }

  inspectSource(sourceId) {
    const source = this.getSourceById(sourceId);
    if (!source) {
      return;
    }

    this.setSelectedProvider(source.providerId);
    const values = {};
    if (source.providerId === 'github') {
      values.githubToken = source.config?.token || '';
      values.githubOwner = source.config?.owner || '';
      values.githubRepo = source.config?.repo || '';
      values.githubBranch = source.config?.branch || 'main';
      values.githubPath = source.config?.path || '';
    }
    if (source.providerId === 's3') {
      values.s3Endpoint = source.config?.endpoint || '';
      values.s3Bucket = source.config?.bucket || '';
      values.s3Region = source.config?.region || '';
      values.s3BasePath = source.config?.basePath || '';
      values.s3AccessKey = source.config?.accessKey || '';
      values.s3SecretKey = source.config?.secretKey || '';
    }
    if (source.providerId === 'local') {
      values.localPathInput = source.config?.path || MANAGER_CONFIG.defaultLocalManifestPath;
      values.localFolderName = source.config?.localDirectoryName || '';
      this.selectedLocalDirectoryHandle = source.config?.localDirectoryHandle || null;
    }
    if (source.providerId === 'example') {
      values.localPathInput = MANAGER_CONFIG.defaultLocalManifestPath;
      values.localFolderName = '';
    }
    this.dom.addConnectionPanel?.setConfigValues(values);
    this.setConnectionStatus(`Inspecting connection: ${source.displayLabel || source.label}`, 'ok');
  }

  async refreshSource(sourceId, options = {}) {
    const source = this.getSourceById(sourceId);
    if (!source) {
      return;
    }

    const providerFactory = this.providers[source.providerId];
    if (!providerFactory) {
      this.setStatus(`Connection type for ${source.displayLabel || source.id} is unavailable.`, 'warn');
      return;
    }

    try {
      const provider = providerFactory();
      let refreshConfig = { ...(source.config || {}), ...(options.configOverrides || {}) };

      if (source.providerId === 'github' && !(refreshConfig.token || '').trim()) {
        refreshConfig = await this.credentialStore.loadSourceSecret(source, refreshConfig);
      }
      if (source.providerId === 's3' && (!(refreshConfig.accessKey || '').trim() || !(refreshConfig.secretKey || '').trim())) {
        refreshConfig = await this.credentialStore.loadSourceSecret(source, refreshConfig);
      }
      if (source.providerId === 'local') {
        const explicitHandle = options.configOverrides?.localDirectoryHandle;
        const repairHandle = this.pendingSourceRepair?.sourceId === sourceId ? this.selectedLocalDirectoryHandle : null;
        const handle = explicitHandle || refreshConfig.localDirectoryHandle || repairHandle;
        if (handle) {
          refreshConfig.localDirectoryHandle = handle;
          if (!refreshConfig.localDirectoryName) {
            refreshConfig.localDirectoryName = handle.name || refreshConfig.localDirectoryName || '';
          }
        }
      }

      const result = await provider.connect(refreshConfig);
      if (!result.ok) {
        const failed = {
          ...source,
          status: result.message,
          needsReconnect: true,
          needsCredentials: Boolean(result.capabilities?.requiresCredentials) && !Boolean(result.capabilities?.hasCredentials),
        };
        this.state.sources = this.state.sources.map((entry) => (entry.id === sourceId ? failed : entry));
        this.renderConnectionsListPanel();
        this.persistSources();
        this.setConnectionStatus(result.message || 'Refresh failed.', 'warn');
        this.setStatus(`Refresh failed: ${result.message || 'Connection failed.'}`, 'warn');
        return;
      }

      const loaded = await provider.listAssets();
      const updated = {
        ...source,
        provider,
        config: refreshConfig,
        itemCount: Array.isArray(loaded) ? loaded.length : 0,
        status: result.message || 'Connected',
        displayLabel: result.sourceDisplayLabel || this.sourceDisplayLabelFor(source.providerId, refreshConfig, source.providerLabel),
        detailLabel: result.sourceDetailLabel || this.sourceDetailLabelFor(source.providerId, refreshConfig, source.providerLabel),
        needsReconnect: false,
        needsCredentials: false,
        capabilities: provider.getCapabilities(),
      };

      this.state.sources = this.state.sources.map((entry) => (entry.id === sourceId ? updated : entry));
      this.state.activeSourceId = updated.id;
      this.clearPendingSourceRepair();
      this.persistSources();
      this.renderConnectionsListPanel();
      this.setConnectionStatus(`Refreshed ${updated.displayLabel}.`, 'ok');
      this.setStatus(`Refreshed ${updated.displayLabel} (${updated.itemCount} assets found).`, 'ok');
    } catch (error) {
      this.clearPendingSourceRepair();
      this.setConnectionStatus(`Refresh error: ${error.message}`, 'warn');
      this.setStatus(`Refresh error: ${error.message}`, 'warn');
    }
  }

  async removeSource(sourceId) {
    const source = this.getSourceById(sourceId);
    if (!source) {
      return;
    }

    await this.credentialStore.deleteSourceSecret(source).catch(() => {});
    this.state.sources = this.state.sources.filter((entry) => entry.id !== sourceId);
    if (this.state.activeSourceId === sourceId) {
      this.state.activeSourceId = this.state.sources[0]?.id || 'all';
    }
    if (this.pendingSourceRepair?.sourceId === sourceId) {
      this.clearPendingSourceRepair();
    }

    this.persistSources();
    this.renderConnectionsListPanel();
    if (this.state.sources.length === 0) {
      this.setConnectionStatus('No connections yet.', 'neutral');
      this.setStatus('No connections yet.', 'neutral');
    } else {
      this.setStatus(`Removed ${source.displayLabel || source.id}.`, 'ok');
    }
  }

  toPersistedSource(source) {
    return {
      id: source.id,
      providerId: source.providerId,
      providerLabel: source.providerLabel,
      displayLabel: source.displayLabel,
      detailLabel: source.detailLabel,
      label: source.label,
      config: this.sanitizeSourceConfig(source.providerId, source.config || {}),
      capabilities: source.capabilities || {},
      authMode: source.authMode || 'public',
      itemCount: source.itemCount || 0,
      status: source.status || '',
      needsReconnect: Boolean(source.needsReconnect),
      needsCredentials: Boolean(source.needsCredentials),
    };
  }

  persistSources() {
    const payload = this.state.sources.map((source) => this.toPersistedSource(source));
    try {
      localStorage.setItem(ACCOUNT_SOURCES_STORAGE_KEY, JSON.stringify(payload));
    } catch (_error) {
      // Ignore localStorage failures in private/restricted runtime modes.
    }
  }

  restoreRememberedSources() {
    let remembered = [];
    try {
      remembered = JSON.parse(localStorage.getItem(ACCOUNT_SOURCES_STORAGE_KEY) || '[]');
    } catch (_error) {
      remembered = [];
    }

    if (!Array.isArray(remembered) || remembered.length === 0) {
      return;
    }

    this.state.sources = remembered
      .filter((entry) => entry && typeof entry === 'object' && entry.providerId)
      .map((entry) => ({
        id: entry.id || makeConnectionId(entry.providerId || 'source'),
        providerId: entry.providerId,
        providerLabel: entry.providerLabel || this.providerCatalog.find((provider) => provider.id === entry.providerId)?.label || 'Connection',
        displayLabel: entry.displayLabel || entry.label || 'Connection',
        detailLabel: entry.detailLabel || entry.label || 'Connection',
        label: entry.label || entry.detailLabel || entry.displayLabel || 'Connection',
        config: this.sanitizeSourceConfig(entry.providerId, entry.config || {}),
        capabilities: entry.capabilities || this.providerFactories[entry.providerId]?.getCapabilities?.() || {},
        authMode: entry.authMode || 'public',
        itemCount: Number(entry.itemCount) || 0,
        status: 'Remembered connection. Refresh to reconnect.',
        needsReconnect: true,
        needsCredentials: Boolean(entry.needsCredentials),
        provider: null,
      }));

    this.state.activeSourceId = this.state.sources[0]?.id || 'all';
    this.renderConnectionsListPanel();
    this.setStatus(`Loaded ${this.state.sources.length} remembered connection${this.state.sources.length === 1 ? '' : 's'}.`, 'neutral');
  }
}

if (!customElements.get('open-collections-account')) {
  customElements.define('open-collections-account', OpenCollectionsAccountElement);
}

export { OpenCollectionsAccountElement };
