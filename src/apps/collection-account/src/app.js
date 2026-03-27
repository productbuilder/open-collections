import { pickHostDirectory, supportsHostDirectoryPicker } from '../../../shared/platform/host-directory.js';
import { MANAGER_CONFIG } from '../../collection-manager/src/config.js';
import {
  createConnectionsRuntime,
  createCredentialStore,
  makeConnectionId,
  uniqueConnectionsForDisplay,
} from '../../../shared/account/index.js';
import { renderShell } from './render/render-shell.js';
import '../../collection-manager/src/components/connections-list-panel.js';
import '../../collection-manager/src/components/add-connection-panel.js';

const ACCOUNT_SOURCES_STORAGE_KEY = 'open_collections_account_sources_v1';

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
    this.connectionsRuntime = createConnectionsRuntime({
      defaultManifestPath: MANAGER_CONFIG.defaultLocalManifestPath,
      storageKey: ACCOUNT_SOURCES_STORAGE_KEY,
      credentialStore: this.credentialStore,
      makeConnectionId,
    });
    this.providerFactories = this.connectionsRuntime.providerFactories;
    this.providers = this.connectionsRuntime.providers;
    this.providerCatalog = this.connectionsRuntime.providerCatalog;

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

  renderConnectionsListPanel() {
    const unique = uniqueConnectionsForDisplay(this.state.sources, MANAGER_CONFIG.defaultLocalManifestPath);
    this.dom.connectionsListPanel?.setSources(unique);
    this.dom.connectionsListPanel?.setActiveSourceId(this.state.activeSourceId || 'all');
  }

  collectCurrentProviderConfig(providerId) {
    const config = this.dom.addConnectionPanel?.getProviderConfig(providerId) || {};
    return this.connectionsRuntime.collectProviderConfig(providerId, config, this.selectedLocalDirectoryHandle);
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
    const config = this.collectCurrentProviderConfig(providerId);
    const repairingSource = this.pendingSourceRepair?.sourceId ? this.getSourceById(this.pendingSourceRepair.sourceId) : null;

    try {
      const result = await this.connectionsRuntime.connectSource({
        providerId,
        config,
        pendingRepairSource: repairingSource,
        sources: this.state.sources,
      });
      if (!result.ok) {
        this.setConnectionStatus(result.message || 'Connection failed.', 'warn');
        this.setStatus(result.message || 'Connection failed.', 'warn');
        return;
      }
      this.renderCapabilities(result.source.provider?.getCapabilities?.() || {});

      if (providerId === 'local' && config.localDirectoryHandle) {
        this.selectedLocalDirectoryHandle = config.localDirectoryHandle;
      }

      this.state.sources = result.sources;
      this.state.activeSourceId = result.source.id;
      this.clearPendingSourceRepair();
      this.showConnectionsListView();
      this.persistSources();
      this.renderConnectionsListPanel();
      this.setConnectionStatus(result.source.status || 'Connected.', 'ok');
      this.setStatus(
        result.target
          ? `Reconnected ${result.source.displayLabel} (${result.source.itemCount} assets found).`
          : `Added ${result.source.displayLabel} (${result.source.itemCount} assets found).`,
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

    try {
      const result = await this.connectionsRuntime.refreshSource({
        source,
        sources: this.state.sources,
        configOverrides: options.configOverrides || {},
        pendingSourceRepair: this.pendingSourceRepair,
        selectedLocalDirectoryHandle: this.selectedLocalDirectoryHandle,
      });
      if (!result.ok) {
        this.state.sources = result.sources || this.state.sources;
        this.renderConnectionsListPanel();
        this.persistSources();
        this.setConnectionStatus(result.message || 'Refresh failed.', 'warn');
        this.setStatus(`Refresh failed: ${result.message || 'Connection failed.'}`, 'warn');
        return;
      }
      this.state.sources = result.sources;
      this.state.activeSourceId = result.source.id;
      this.clearPendingSourceRepair();
      this.persistSources();
      this.renderConnectionsListPanel();
      this.setConnectionStatus(`Refreshed ${result.source.displayLabel}.`, 'ok');
      this.setStatus(`Refreshed ${result.source.displayLabel} (${result.source.itemCount} assets found).`, 'ok');
    } catch (error) {
      this.clearPendingSourceRepair();
      this.setConnectionStatus(`Refresh error: ${error.message}`, 'warn');
      this.setStatus(`Refresh error: ${error.message}`, 'warn');
    }
  }

  async removeSource(sourceId) {
    const result = await this.connectionsRuntime.removeSource({
      sourceId,
      sources: this.state.sources,
      activeSourceId: this.state.activeSourceId,
    });
    if (!result.ok) {
      return;
    }
    this.state.sources = result.sources;
    this.state.activeSourceId = result.activeSourceId;
    if (this.pendingSourceRepair?.sourceId === sourceId) {
      this.clearPendingSourceRepair();
    }

    this.persistSources();
    this.renderConnectionsListPanel();
    if (this.state.sources.length === 0) {
      this.setConnectionStatus('No connections yet.', 'neutral');
      this.setStatus('No connections yet.', 'neutral');
    } else {
      this.setStatus(`Removed ${result.removedSource.displayLabel || result.removedSource.id}.`, 'ok');
    }
  }

  persistSources() {
    this.connectionsRuntime.persistSources(this.state.sources);
  }

  restoreRememberedSources() {
    const remembered = this.connectionsRuntime.restoreRememberedSources();
    if (!remembered.length) {
      return;
    }
    this.state.sources = remembered;
    this.state.activeSourceId = this.state.sources[0]?.id || 'all';
    this.renderConnectionsListPanel();
    this.setStatus(`Loaded ${this.state.sources.length} remembered connection${this.state.sources.length === 1 ? '' : 's'}.`, 'neutral');
  }
}

if (!customElements.get('open-collections-account')) {
  customElements.define('open-collections-account', OpenCollectionsAccountElement);
}

export { OpenCollectionsAccountElement };
