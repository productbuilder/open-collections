import { createLocalProvider } from '../../../packages/provider-local/src/index.js';
import { createGithubProvider } from '../../../packages/provider-github/src/index.js';
import { createS3Provider } from '../../../packages/provider-s3/src/index.js';
import { MEDIA_MODES, normalizeMediaRef } from '../../../packages/collector-schema/src/schema.js';
import { MANAGER_CONFIG } from './config.js';
import { createOpfsStorage } from './services/opfs_storage.js';
import { pickLocalHostDirectory, subscribeToManagerFileDrops } from './platform/manager-source-api.js';
import { createInitialState } from './state/initial-state.js';
import { computeWorkingStatus } from './state/working-status.js';
import { toWorkspaceItemId } from './utils/id-utils.js';
import { bindDomEvents, cacheDomElements, initializeDomDefaults } from './controllers/dom-bindings.js';
import {
  collectCurrentProviderConfig,
  connectCurrentProvider,
  inspectSource,
  refreshSource,
  removeSource,
  sanitizeSourceConfig,
  setSelectedProvider,
  sourceDetailLabelFor,
  sourceDisplayLabelFor,
  toPersistedSource,
} from './controllers/source-controller.js';
import {
  applyLocalDraftPayload,
  applyWorkspaceSnapshot,
  buildLocalDraftPayload,
  currentWorkspaceSnapshot,
  discardLocalDraft,
  initializeLocalDraftState,
  restoreLocalDraft,
  restoreRememberedSources,
  saveLocalDraft,
  saveSourcesToStorage,
} from './controllers/workspace-controller.js';
import {
  activeCollectionRootPath,
  collectionLabelFor,
  currentCollectionMeta,
  ensureCollectionForSource,
  findSelectedCollectionMeta,
  openNewCollectionDialog,
  refreshSourceCollectionsAndCounts,
  renderCollectionFilter,
  renderWorkspaceContext,
  setCollectionMetaFields,
} from './controllers/collection-controller.js';
import {
  clearItemSelection,
  closeViewer,
  findSelectedItem,
  getSelectedItemIds,
  getVisibleAssets,
  isItemSelected,
  openViewer,
  repairSelectionState,
  renderAssets,
  renderEditor,
  renderMetadataMode,
  renderViewer,
  resolveMetadataMode,
  selectItem,
  setBrowserViewMode,
  syncMetadataModeFromState,
  toggleItemSelection,
} from './controllers/selection-controller.js';
import './components/manager-header.js';
import './components/collection-browser.js';
import './components/metadata-editor.js';
import './components/pane-layout.js';
import './components/source-manager.js';
import './components/asset-viewer.js';
import {
  slugifySegment as slugifySegmentUtil,
  hostNameFromPath as hostNameFromPathUtil,
  normalizeCollectionRootPath as normalizeCollectionRootPathUtil,
  joinCollectionRootPath as joinCollectionRootPathUtil,
} from './utils/path-utils.js';
import { renderShell } from './render/render-shell.js';
import { deriveItemEditorState, getItemOverridePatch, resolveItemMetadata } from './utils/metadata-inheritance.js';
import * as AssetService from './services/asset-service.js';
import * as CollectionService from './services/collection-service.js';
import * as ManifestService from './services/manifest-service.js';
import * as DraftService from './services/draft-service.js';
import { createCredentialStore } from './services/credential-store.js';
import { getPlatformType, PLATFORM_TYPES } from '../../../shared/platform/index.js';
import { renderTrashIcon } from './components/icons.js';
const COLLECTIONS_DIR_PATH = 'collections';
const SOURCES_DIR_PATH = 'sources';
const DRAFT_ASSETS_DIR_PATH = 'draft-assets';

class OpenCollectionsManagerElement extends HTMLElement {
  constructor() {
    super();

    // State buckets: workspace persistence, provider/source connectivity, active collection, selection, and UI mode.
    this.state = createInitialState();

    this.opfsStorage = createOpfsStorage();
    this.credentialStore = createCredentialStore();
    this._autosaveTimer = null;
    this._platformDropCleanup = null;
    this._platformDropReady = null;
    this.localAssetBlobs = new Map();
    this.objectUrls = new Set();
    this.selectedLocalDirectoryHandle = null;
    this.pendingSourceRepair = null;

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
        description: 'Connect instantly to the demo connection from this repository.',
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
    this.renderShell();
    this.cacheDom();
  }

  connectedCallback() {
    this.bindEvents();
    this.setStatus('No connections yet.', 'neutral');
    this.refreshWorkingStatus();
    this.setConnectionStatus('No connections yet.', 'neutral');
    this.renderCapabilities(this.providerFactories.example.getCapabilities());
    this.renderProviderCatalog();
    this.setSelectedProvider('example');
    this.renderSourcesList();
    this.renderSourceFilter();
    this.renderAssets();
    this.renderEditor();
    this.renderWorkspaceContext();
    this.renderSourceContext();
    this.setLocalDraftStatus('Checking local draft storage...', 'neutral');
    this.setLocalDraftControlsEnabled(false);
    this.initializeLocalDraftState();
    this.syncEditorVisibility();
    this._handleWindowResize = () => this.syncEditorVisibility();
    window.addEventListener('resize', this._handleWindowResize);
    this.initializePlatformFileDrops();
  }

  disconnectedCallback() {
    if (this._handleWindowResize) {
      window.removeEventListener('resize', this._handleWindowResize);
      this._handleWindowResize = null;
    }
    if (this._platformDropCleanup) {
      this._platformDropCleanup();
      this._platformDropCleanup = null;
    }
    this._platformDropReady = null;
  }

  renderShell() {
    renderShell(this.shadow);
  }

  cacheDom() {
    this.dom = cacheDomElements(this.shadow);
    initializeDomDefaults(this);
  }

  bindEvents() {
    bindDomEvents(this);
  }

  openDialog(dialog) {
    if (!dialog) {
      return;
    }

    if (dialog.open) {
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

    if (!dialog.open) {
      return;
    }

    if (typeof dialog.close === 'function') {
      dialog.close();
      return;
    }

    dialog.removeAttribute('open');
  }

  setProviderDialogHeader(title = 'Add connection') {
    const normalizedTitle = String(title || '').trim() || 'Add connection';
    if (this.dom?.providerDialog) {
      this.dom.providerDialog.setAttribute('aria-label', normalizedTitle);
      const heading = this.dom.providerDialog.querySelector('.dialog-title');
      if (heading) {
        heading.textContent = normalizedTitle;
      }
    }
  }

  openAddHostDialog() {
    this.clearPendingSourceRepair();
    this.dom.sourceManager?.resetFlow?.();
    this.setProviderDialogHeader('Add connection');
    this.openDialog(this.dom.providerDialog);
  }

  openCredentialRepairDialog(sourceId) {
    const source = this.prepareSourceRepair(sourceId, 'credentials');
    if (!source || !['github', 's3'].includes(source.providerId)) {
      return;
    }
    const providerLabel = source.providerLabel || (source.providerId === 'github' ? 'GitHub' : 'S3-compatible');
    this.inspectSource(source.id);
    this.dom.sourceManager?.openRepairCredentials?.(source.providerId);
    this.setProviderDialogHeader(`Update ${providerLabel} credentials`);
    this.openDialog(this.dom.providerDialog);
  }

  isMobileViewport() {
    return typeof window !== 'undefined' && window.matchMedia('(max-width: 760px)').matches;
  }

  openMobileEditor() {
    this.state.mobileEditorOpen = true;
    this.syncEditorVisibility();
  }

  closeMobileEditor() {
    this.state.mobileEditorOpen = false;
    this.syncEditorVisibility();
  }

  syncEditorVisibility() {
    if (!this.dom?.metadataEditor || !this.dom?.paneLayout) {
      return;
    }

    // Shell controls inspector placement; browser view mode should not hard-code layout.
    const inspectorPlacement = this.normalizeInspectorPlacement(this.state.inspectorPlacement);
    this.state.inspectorPlacement = inspectorPlacement;
    this.dom.paneLayout.inspectorPlacement = inspectorPlacement;

    const shouldShowOverlay = this.isMobileViewport() && this.state.mobileEditorOpen;
    this.dom.metadataEditor.setMobileOpen(shouldShowOverlay);
  }

  normalizeInspectorPlacement(placement) {
    return placement === 'bottom' || placement === 'hidden' || placement === 'right' ? placement : 'right';
  }

  setInspectorPlacement(placement = 'right') {
    this.state.inspectorPlacement = this.normalizeInspectorPlacement(placement);
    this.syncEditorVisibility();
  }

  applyInspectorModeForViewMode(mode) {
    void mode;
    // Intentionally no-op: inspector placement is a shell-level concern.
  }

  renderProviderCatalog() {
    this.dom.sourceManager?.setProviderCatalog(this.providerCatalog);
  }

  setSelectedProvider(providerId) {
    return setSelectedProvider(this, providerId);
  }

  setStatus(text, tone = 'neutral') {
    this.dom.managerHeader?.setStatus(text, tone);
  }

  setWorkingStateFlags(patch = {}) {
    Object.assign(this.state, patch || {});
    this.refreshWorkingStatus();
  }

  markDirty() {
    this.setWorkingStateFlags({
      hasUnsavedChanges: true,
      lastSaveTarget: '',
      publishError: '',
    });
  }

  markSavedToSource() {
    this.setWorkingStateFlags({
      hasUnsavedChanges: false,
      lastSaveTarget: 'source',
      publishError: '',
    });
  }

  markSavedToDraft() {
    this.setWorkingStateFlags({
      hasUnsavedChanges: false,
      hasLocalDraft: true,
      lastSaveTarget: 'draft',
      publishError: '',
    });
  }

  refreshWorkingStatus() {
    const workingStatus = computeWorkingStatus(this.state);
    this.dom.collectionBrowser?.setPublishActionState?.(this.getPublishActionState());
    this.dom.managerHeader?.setWorkingStatus(workingStatus);
  }

  setConnectionStatus(text, tone = false) {
    const resolvedTone = typeof tone === 'boolean' ? (tone ? 'ok' : 'warn') : tone;
    this.dom.sourceManager?.setConnectionStatus(text, resolvedTone);
  }

  setLocalDraftStatus(text, tone = 'neutral') {
    const colors = {
      neutral: '#64748b',
      ok: '#166534',
      warn: '#9a3412',
    };
    this.state.opfsStatus = text;
    if (this.dom?.localDraftStatus) {
      this.dom.localDraftStatus.textContent = text;
      this.dom.localDraftStatus.style.color = colors[tone] || colors.neutral;
    }
  }

  setLocalDraftControlsEnabled(enabled) {
    const disabled = !enabled;
    if (this.dom?.saveLocalDraftBtn) {
      this.dom.saveLocalDraftBtn.disabled = disabled;
      this.dom.restoreLocalDraftBtn.disabled = disabled;
      this.dom.discardLocalDraftBtn.disabled = disabled;
    }
  }

  draftCollectionId() {
    return (
      this.dom.collectionId.value.trim() ||
      MANAGER_CONFIG.defaultCollectionMeta.id ||
      'collection-draft'
    );
  }

  draftFilePath(collectionId = this.draftCollectionId()) {
    return `${COLLECTIONS_DIR_PATH}/${collectionId}.json`;
  }

  sourceFilePath(sourceId) {
    return `${SOURCES_DIR_PATH}/${sourceId}.json`;
  }

  setDropTargetState(active) {
    this.state.isDropTargetActive = Boolean(active);
    this.dom.collectionBrowser?.setDropTargetActive(this.state.isDropTargetActive);
  }

  canAcceptPlatformFileDrops() {
    return this.isConnected && !this.hidden;
  }

  async initializePlatformFileDrops() {
    if (this._platformDropCleanup || this._platformDropReady) {
      return this._platformDropReady;
    }

    this._platformDropReady = subscribeToManagerFileDrops(async (event) => {
      if (!this.canAcceptPlatformFileDrops()) {
        return;
      }

      const type = event?.type || '';
      if (type === 'enter' || type === 'over') {
        this.setDropTargetState(true);
        return;
      }
      if (type === 'leave') {
        this.setDropTargetState(false);
        return;
      }
      if (type === 'drop') {
        this.setDropTargetState(false);
        const files = Array.isArray(event?.files) ? event.files : [];
        if (files.length > 0) {
          await this.ingestImageFiles(files);
        }
      }
    }).then((cleanup) => {
      this._platformDropCleanup = typeof cleanup === 'function' ? cleanup : null;
      return this._platformDropCleanup;
    }).catch((error) => {
      console.warn('[open-collections-manager] Failed to initialize platform file drops.', error);
      return null;
    });

    return this._platformDropReady;
  }

  isSupportedImageFile(file) {
    if (!file) {
      return false;
    }
    const mime = (file.type || '').toLowerCase();
    if (mime.startsWith('image/jpeg') || mime.startsWith('image/png') || mime.startsWith('image/webp') || mime.startsWith('image/gif')) {
      return true;
    }
    return /\.(jpe?g|png|webp|gif)$/i.test(file.name || '');
  }

  toWorkspaceItemId(sourceId, itemId) {
    return toWorkspaceItemId(sourceId, itemId);
  }

  slugifySegment(value, fallback = 'item') {
    return slugifySegmentUtil(value, fallback);
  }

  hostNameFromPath(path, fallback = 'Local host') {
    return hostNameFromPathUtil(path, fallback);
  }

  normalizeCollectionRootPath(rootPath, fallbackId = '') {
    return normalizeCollectionRootPathUtil(rootPath, fallbackId);
  }

  joinCollectionRootPath(collectionRootPath, relativePath = '') {
    return joinCollectionRootPathUtil(
      collectionRootPath,
      relativePath,
      this.state.selectedCollectionId || 'collection',
    );
  }

  activeCollectionRootPath() {
    return activeCollectionRootPath(this);
  }

  renderWorkspaceContext() {
    return renderWorkspaceContext(this);
  }

  readableTitleFromFilename(name, fallbackId) {
    const base = String(name || '').replace(/\.[^.]+$/, '');
    const cleaned = base.replace(/[_-]+/g, ' ').trim();
    return cleaned || fallbackId;
  }

  openNewCollectionDialog() {
    return openNewCollectionDialog(this);
  }

  setCollectionMetaFields(meta = {}) {
    return setCollectionMetaFields(this, meta);
  }

  collectionIdExists(collectionId) {
    return CollectionService.collectionIdExists(this, collectionId);
  }

  ensureUniqueCollectionId(baseId) {
    return CollectionService.ensureUniqueCollectionId(this, baseId);
  }

  buildInitialCollectionManifest(meta) {
    return CollectionService.buildInitialCollectionManifest(this, meta);
  }

  async createNewCollectionDraft() {
    return CollectionService.createNewCollectionDraft(this);
  }

  extensionFromName(name = '', fallback = '.jpg') {
    const match = String(name).toLowerCase().match(/\.[a-z0-9]+$/);
    return match ? match[0] : fallback;
  }

  uniqueDraftItemId(base, sourceId, collectionId) {
    const existing = new Set(
      this.state.assets
        .filter((item) => item.sourceId === sourceId && item.collectionId === collectionId)
        .map((item) => item.id),
    );
    if (!existing.has(base)) {
      return base;
    }
    let index = 2;
    while (existing.has(`${base}-${index}`)) {
      index += 1;
    }
    return `${base}-${index}`;
  }

  getActiveIngestionSource() {
    if (!this.state.sources.length) {
      this.setStatus('Connect a writable storage source before adding images.', 'warn');
      return null;
    }

    if (this.state.activeSourceFilter === 'all') {
      this.setStatus('Select a specific storage source before adding images.', 'warn');
      return null;
    }

    const source = this.getSourceById(this.state.activeSourceFilter);
    if (!source) {
      this.setStatus('Selected storage source was not found.', 'warn');
      return null;
    }

    if (source.providerId !== 'github' && source.providerId !== 'local') {
      this.setStatus('Image upload is currently available for GitHub and local folder connections.', 'warn');
      return null;
    }

    if (source.providerId === 'github' && (source.needsReconnect || source.needsCredentials)) {
      this.setStatus('Reconnect the selected GitHub source before adding local draft assets.', 'warn');
      return null;
    }

    if (source.providerId === 'local') {
      if (source.needsReconnect || !source.provider) {
        this.setStatus('Reconnect the selected local connection before adding images.', 'warn');
        return null;
      }
      if (!source.capabilities?.canSaveMetadata) {
        this.setStatus('Selected local connection is read-only. Reconnect with a writable folder.', 'warn');
        return null;
      }
    }

    return source;
  }

  ensureCollectionForSource(source) {
    return ensureCollectionForSource(this, source);
  }

  collectionLabelFor(source, collectionId) {
    return collectionLabelFor(source, collectionId);
  }

  collectionAssetPath(workspaceId, kind = 'original', extension = '.jpg') {
    return `${DRAFT_ASSETS_DIR_PATH}/${workspaceId}/${kind}${extension}`;
  }

  registerObjectUrl(url) {
    if (url) {
      this.objectUrls.add(url);
    }
  }

  async generateThumbnailBlob(file) {
    return AssetService.generateThumbnailBlob(this, file);
  }

  async rememberLocalAssetFiles(item, originalBlob, thumbnailBlob) {
    return AssetService.rememberLocalAssetFiles(this, item, originalBlob, thumbnailBlob);
  }

  async loadLocalAssetBlob(item, kind = 'original') {
    return AssetService.loadLocalAssetBlob(this, item, kind);
  }

  async rehydrateLocalDraftAssetUrls() {
    return AssetService.rehydrateLocalDraftAssetUrls(this);
  }

  async cleanupRemovedItemArtifacts(item) {
    return AssetService.cleanupRemovedItemArtifacts(this, item);
  }

  async hydrateLocalSourceAssetPreviews(sourceId) {
    return AssetService.hydrateLocalSourceAssetPreviews(this, sourceId);
  }

  refreshSourceCollectionsAndCounts(sourceId) {
    return refreshSourceCollectionsAndCounts(this, sourceId);
  }

  async ingestImageFiles(files) {
    return AssetService.ingestImageFiles(this, files);
  }

  renderCapabilities(capabilitiesOrProvider) {
    const capabilities =
      typeof capabilitiesOrProvider?.getCapabilities === 'function'
        ? capabilitiesOrProvider.getCapabilities()
        : capabilitiesOrProvider || {};
    this.dom.sourceManager?.setCapabilities(capabilities);
  }

  getSourceById(sourceId) {
    return this.state.sources.find((entry) => entry.id === sourceId) || null;
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

  sourceHasAccessibleContent(source) {
    if (!source) {
      return false;
    }
    const hasCollections = Array.isArray(source.collections) && source.collections.length > 0;
    const hasAssets = this.state.assets.some((item) => item.sourceId === source.id);
    return hasCollections || hasAssets;
  }

  isExampleSource(source) {
    return Boolean(source && source.providerId === 'example');
  }

  isBrowserRuntime() {
    return getPlatformType() === PLATFORM_TYPES.BROWSER;
  }

  sortSourcesForDisplay(sources = []) {
    if (!Array.isArray(sources) || sources.length <= 1) {
      return Array.isArray(sources) ? [...sources] : [];
    }

    const exampleSources = [];
    const otherSources = [];
    for (const source of sources) {
      if (this.isExampleSource(source)) {
        exampleSources.push(source);
      } else {
        otherSources.push(source);
      }
    }
    return [...exampleSources, ...otherSources];
  }

  getExampleSource() {
    return this.state.sources.find((source) => this.isExampleSource(source)) || null;
  }

  activatePreferredBrowserStartupSource() {
    if (!this.isBrowserRuntime()) {
      return false;
    }

    const exampleSource = this.getExampleSource();
    if (!exampleSource) {
      return false;
    }

    this.activateSource(exampleSource);
    return true;
  }

  sourceRepairGuidance(source) {
    if (!source) {
      return '';
    }
    if (this.isExampleSource(source)) {
      return 'Viewing example content. Connect a source to refresh from your own storage or publish changes.';
    }
    const hasAccessibleContent = this.sourceHasAccessibleContent(source);
    if (source.providerId === 'local' && source.needsReconnect) {
      return hasAccessibleContent
        ? 'Folder access must be re-selected to refresh or publish. Previously loaded content remains available locally.'
        : 'Folder access must be re-selected. Publish remains blocked until reconnect succeeds.';
    }
    if (source.needsCredentials) {
      return 'Missing credentials. Update credentials to reconnect and unblock publish.';
    }
    if (source.needsReconnect) {
      return hasAccessibleContent
        ? 'Connection is disconnected, but previously loaded content is still available locally. Reconnect to refresh or publish.'
        : 'Connection needs reconnect before publish is available.';
    }
    if (!source.capabilities?.canPublish) {
      return 'Connected read-only connection. Publish is currently unavailable.';
    }
    return '';
  }

  getVisibleAssets() {
    return getVisibleAssets(this);
  }

  renderSourceFilter() {
    const previous = this.state.activeSourceFilter || 'all';
    const options = [{ value: 'all', label: 'All connections' }];
    for (const source of this.state.sources) {
      options.push({
        value: source.id,
        label: source.displayLabel || source.label || source.providerLabel || 'Source',
      });
    }
    const stillExists = previous === 'all' || this.state.sources.some((entry) => entry.id === previous);
    this.state.activeSourceFilter = stillExists ? previous : 'all';
    this.dom.collectionBrowser.setSourceOptions(options, this.state.activeSourceFilter);
    this.renderCollectionFilter();
  }

  renderCollectionFilter() {
    return renderCollectionFilter(this);
  }

  formatSourceBadge(item) {
    const display = (item.sourceDisplayLabel || '').trim();
    if (display) {
      return display;
    }
    const providerName = this.providerCatalog.find((entry) => entry.id === item.providerId)?.label || item.providerId || '';
    return providerName || 'Source';
  }

  renderSourcesList() {
    this.dom.sourceManager?.setSources(this.state.sources);
    this.dom.sourceManager?.setActiveSourceId(this.state.activeSourceFilter || 'all');
  }

  collectCurrentProviderConfig(providerId) {
    return collectCurrentProviderConfig(this, providerId);
  }

  async pickLocalFolder() {
    try {
      const handle = await pickLocalHostDirectory();
      const folderName = (handle?.name || '').trim() || 'Selected folder';
      const folderPath = String(handle?.path || '').trim();
      this.selectedLocalDirectoryHandle = handle || null;
      this.dom.sourceManager?.setConfigValues({
        localFolderName: folderName,
        localPathInput: folderPath || folderName,
      });
      this.dom.sourceManager?.setLocalFolderStatus(`Selected folder: ${folderPath || folderName}`, 'ok');
      this.setStatus(`Selected local folder: ${folderPath || folderName}`, 'ok');
      return true;
    } catch (error) {
      if (error?.name === 'AbortError') {
        this.dom.sourceManager?.setLocalFolderStatus('Folder selection cancelled.', 'neutral');
        return false;
      }
      this.dom.sourceManager?.setLocalFolderStatus(`Folder selection failed: ${error.message}`, 'warn');
      this.setStatus(`Folder selection failed: ${error.message}`, 'warn');
      return false;
    }
  }

  sourceDisplayLabelFor(providerId, config, fallbackLabel) {
    return sourceDisplayLabelFor(this, providerId, config, fallbackLabel);
  }

  sourceDetailLabelFor(providerId, config, fallbackLabel) {
    return sourceDetailLabelFor(this, providerId, config, fallbackLabel);
  }

  publishDestinationDetail(source, collectionRootPath = '') {
    if (!source) {
      return '';
    }

    if (source.providerId === 'github') {
      const owner = (source.config?.owner || '').trim() || 'owner';
      const repo = (source.config?.repo || '').trim() || 'repo';
      const branch = (source.config?.branch || 'main').trim() || 'main';
      const basePath = (source.config?.path || '').trim();
      const root = collectionRootPath || '';
      const fullPath = [basePath, root].filter(Boolean).join('/').replace(/\/+/g, '/').replace(/^\/+/, '') || '/';
      return `GitHub ${owner}/${repo} @ ${branch}:${fullPath}`;
    }

    if (source.providerId === 's3') {
      const bucket = (source.config?.bucket || '').trim() || 'bucket';
      const basePath = (source.config?.basePath || '').trim();
      const root = collectionRootPath || '';
      const prefix = [basePath, root].filter(Boolean).join('/').replace(/\/+/g, '/').replace(/^\/+/, '');
      return prefix ? `S3 s3://${bucket}/${prefix}` : `S3 s3://${bucket}`;
    }

    if (source.providerId === 'local' || source.providerId === 'example') {
      const root = (collectionRootPath || '').replace(/^\/+/, '');
      return root ? `Local path ${root}` : 'Local connection';
    }

    return source.detailLabel || source.displayLabel || source.providerLabel || 'Active connection';
  }

  activeHostStateLabel(source) {
    if (!source) {
      return 'No active connection';
    }
    if (this.isExampleSource(source)) {
      return 'Example';
    }
    if (source.needsCredentials) {
      return 'Credentials missing';
    }
    if (source.needsReconnect) {
      return this.sourceHasAccessibleContent(source) ? 'Disconnected (cached content)' : 'Needs reconnect';
    }
    if (!source.capabilities?.canPublish) {
      return 'Read-only';
    }
    return 'Ready';
  }

  sanitizeSourceConfig(providerId, config = {}) {
    return sanitizeSourceConfig(this, providerId, config);
  }

  toPersistedSource(source) {
    return toPersistedSource(this, source);
  }

  currentWorkspaceSnapshot() {
    return currentWorkspaceSnapshot(this);
  }

  buildLocalDraftPayload() {
    return buildLocalDraftPayload(this);
  }

  async persistSourcesToOpfs(payload) {
    return DraftService.persistSourcesToOpfs(this, payload);
  }

  async persistWorkspaceToOpfs(extra = {}) {
    return DraftService.persistWorkspaceToOpfs(this, extra);
  }

  async loadRememberedSourcesFromOpfs() {
    return DraftService.loadRememberedSourcesFromOpfs(this);
  }

  applyWorkspaceSnapshot(snapshot = {}) {
    return applyWorkspaceSnapshot(this, snapshot);
  }

  saveSourcesToStorage() {
    return saveSourcesToStorage(this);
  }

  async restoreRememberedSources() {
    return restoreRememberedSources(this);
  }

  async initializeLocalDraftState() {
    return initializeLocalDraftState(this);
  }

  async saveLocalDraft() {
    return saveLocalDraft(this);
  }

  applyLocalDraftPayload(payload) {
    return applyLocalDraftPayload(this, payload);
  }

  async restoreLocalDraft(options = {}) {
    return restoreLocalDraft(this, options);
  }

  async discardLocalDraft() {
    return discardLocalDraft(this);
  }

  normalizeSourceAssets(source, rawItems) {
    return (rawItems || []).map((item) => {
      const sourceAssetId = item.id;
      const media = normalizeMediaRef(item.media);
      const mediaPath = String(media?.url || '').trim();
      const fileName = mediaPath
        ? mediaPath.replace(/\\/g, '/').split('/').filter(Boolean).pop() || mediaPath
        : '';
      return {
        ...item,
        media,
        fileName: item.fileName || fileName,
        workspaceId: toWorkspaceItemId(source.id, sourceAssetId),
        sourceAssetId,
        sourceId: source.id,
        sourceLabel: source.label,
        sourceDisplayLabel: source.displayLabel || source.label,
        providerId: source.providerId,
        collectionId: item.collectionId || null,
        collectionLabel: item.collectionLabel || '',
        collectionRootPath: item.collectionRootPath || '',
      };
    });
  }

  buildCollectionsForSource(source, normalizedAssets) {
    const grouped = new Map();
    for (const item of normalizedAssets) {
      const collectionId = (item.collectionId || '').trim();
      const collectionLabel = (item.collectionLabel || '').trim();
      if (!collectionId) {
        continue;
      }
      if (!grouped.has(collectionId)) {
        grouped.set(collectionId, {
          id: collectionId,
          title: collectionLabel || collectionId,
          rootPath: this.normalizeCollectionRootPath(item.collectionRootPath || `${collectionId}/`, collectionId),
        });
      }
    }

    if (grouped.size > 0) {
      return Array.from(grouped.values());
    }

    const fallbackId = `${source.id}::default-collection`;
    return [
      {
        id: fallbackId,
        title: source.displayLabel || source.providerLabel || 'Default collection',
        rootPath: this.normalizeCollectionRootPath(`${fallbackId}/`, fallbackId),
      },
    ];
  }

  normalizeCollectionsFromProvider(entries = []) {
    if (!Array.isArray(entries)) {
      return [];
    }
    return entries
      .filter((entry) => entry && typeof entry === 'object' && entry.id)
      .map((entry) => ({
        id: String(entry.id),
        title: entry.title || String(entry.id),
        description: entry.description || '',
        license: entry.license || '',
        publisher: entry.publisher || '',
        language: entry.language || '',
        rootPath: this.normalizeCollectionRootPath(entry.rootPath || `${entry.id}/`, entry.id),
        path: entry.path || '',
        collectionJsonPath: entry.collectionJsonPath || '',
        updatedAt: entry.updatedAt || '',
      }));
  }

  mergeSourceAssets(sourceId, nextItems) {
    const withoutSource = this.state.assets.filter((item) => item.sourceId !== sourceId);
    this.state.assets = [...withoutSource, ...nextItems];
  }

  openViewer(itemId) {
    return openViewer(this, itemId);
  }

  closeViewer() {
    return closeViewer(this);
  }

  renderViewer() {
    return renderViewer(this);
  }

  renderSourceContext() {
    const source = this.getSourceById(this.state.activeSourceFilter);
    const sourceName = source
      ? (source.displayLabel || source.label || source.providerLabel || 'Connection')
      : 'Select connection';
    this.dom.managerHeader?.setHostLabel(sourceName);
    this.refreshWorkingStatus();
  }

  sourceIdentityKey(source) {
    if (!source || typeof source !== 'object') {
      return '';
    }
    const providerId = source.providerId || 'unknown';
    const config = this.sanitizeSourceConfig(providerId, source.config || {});
    const hasConfig = Object.keys(config).length > 0;
    return hasConfig
      ? `${providerId}:${JSON.stringify(config)}`
      : `${providerId}:${source.id || source.displayLabel || source.label || ''}`;
  }

  uniqueSourcesForManageHosts(sources = []) {
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

  activateSource(source) {
    this.state.activeSourceFilter = source.id;
    this.state.currentLevel = 'collections';
    this.state.openedCollectionId = null;
    this.state.selectedCollectionId = source.selectedCollectionId || 'all';
    this.state.selectedItemId = null;
    this.state.selectedItemIds = [];
    this.syncMetadataModeFromState();
    this.closeMobileEditor();
    this.renderSourceFilter();
    this.renderSourceContext();
    this.renderAssets();
    this.renderEditor();
    this.refreshWorkingStatus();
  }

  renderSourcePicker() {
    const wrap = this.dom.sourcePickerList;
    wrap.innerHTML = '';
    const uniqueSources = this.uniqueSourcesForManageHosts(this.state.sources);
    if (uniqueSources.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty';
      empty.textContent = 'No connections added yet. Use Add connection to connect one.';
      wrap.appendChild(empty);
      return;
    }

    for (const source of uniqueSources) {
      const isActive = this.state.activeSourceFilter === source.id;
      const card = document.createElement('article');
      card.className = `source-card${isActive ? ' is-active-source' : ''}`;
      const label = source.displayLabel || source.label || source.providerLabel || 'Connection';
      const typeLabel = this.isExampleSource(source)
        ? 'Example'
        : source.providerId === 'local'
          ? 'Local'
          : 'Remote';
      const collectionCount = source.collections?.length || 0;
      const locationText = source.detailLabel
        || ((source.providerId === 'local' || source.providerId === 'example')
          ? source.config?.path
          : null)
        || (source.providerId === 'github'
          ? `${source.config?.owner || 'owner'}/${source.config?.repo || 'repo'}`
          : source.providerId === 's3'
            ? source.config?.endpoint || source.config?.bucket || 'Remote connection'
            : source.config?.path || 'Local connection');
      const statusText = this.activeHostStateLabel(source);

      card.tabIndex = 0;
      card.setAttribute('role', 'button');
      card.setAttribute('aria-pressed', String(isActive));
      card.setAttribute('aria-label', `${isActive ? 'Active' : 'Select'} connection ${label}`);

      const selectCard = () => {
        if (!isActive) {
          this.activateSource(source);
          this.renderSourcePicker();
        }
      };
      card.addEventListener('click', (event) => {
        if (event.target.closest('button')) {
          return;
        }
        selectCard();
      });
      card.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          selectCard();
        }
      });

      const header = document.createElement('div');
      header.className = 'source-card-header';

      const heading = document.createElement('div');
      heading.className = 'source-card-heading';

      const title = document.createElement('p');
      title.className = 'source-card-title';
      title.textContent = label;

      const typeBadge = document.createElement('span');
      typeBadge.className = 'pill';
      typeBadge.textContent = typeLabel;

      const countBadge = document.createElement('span');
      countBadge.className = 'pill';
      countBadge.textContent = `${collectionCount} coll.`;

      const activePill = document.createElement('span');
      activePill.className = `pill source-card-active-pill${isActive ? ' is-ok' : ''}`;
      activePill.textContent = isActive ? 'Active' : 'Available';

      heading.append(title, typeBadge, countBadge);
      header.append(heading, activePill);

      const location = document.createElement('p');
      location.className = 'source-card-location';
      location.textContent = locationText;

      const status = document.createElement('p');
      status.className = 'source-card-status';
      status.textContent = statusText;

      const actions = document.createElement('div');
      actions.className = 'source-card-actions';

      if (source.providerId === 'local' && source.needsReconnect) {
        const reselectBtn = document.createElement('button');
        reselectBtn.className = 'btn btn-primary';
        reselectBtn.type = 'button';
        reselectBtn.textContent = 'Re-select folder';
        reselectBtn.addEventListener('click', async () => {
          this.prepareSourceRepair(source.id, 'folder');
          const didPick = await this.pickLocalFolder();
          if (didPick) {
            await this.refreshSource(source.id, { configOverrides: { localDirectoryHandle: this.selectedLocalDirectoryHandle } });
          }
          this.renderSourcePicker();
        });
        actions.append(reselectBtn);
      } else if ((source.providerId === 'github' || source.providerId === 's3') && source.needsCredentials) {
        const credsBtn = document.createElement('button');
        credsBtn.className = 'btn btn-primary';
        credsBtn.type = 'button';
        credsBtn.textContent = 'Update credentials';
        credsBtn.addEventListener('click', () => {
          this.openCredentialRepairDialog(source.id);
        });
        actions.append(credsBtn);
      } else if (source.needsReconnect) {
        const reconnectBtn = document.createElement('button');
        reconnectBtn.className = 'btn btn-primary';
        reconnectBtn.type = 'button';
        reconnectBtn.textContent = 'Reconnect';
        reconnectBtn.addEventListener('click', async () => {
          this.prepareSourceRepair(source.id, 'reconnect');
          await this.refreshSource(source.id);
          this.renderSourcePicker();
        });
        actions.append(reconnectBtn);
      } else if (!this.isExampleSource(source) || source.capabilities?.canPublish || source.capabilities?.canSaveMetadata) {
        const refreshBtn = document.createElement('button');
        refreshBtn.className = 'btn';
        refreshBtn.type = 'button';
        refreshBtn.textContent = 'Refresh';
        refreshBtn.addEventListener('click', async () => {
          this.prepareSourceRepair(source.id, 'refresh');
          await this.refreshSource(source.id);
          this.renderSourcePicker();
        });
        actions.append(refreshBtn);
      }

      const removeBtn = document.createElement('button');
      removeBtn.className = 'btn source-card-remove';
      removeBtn.type = 'button';
      removeBtn.innerHTML = `${renderTrashIcon()}<span>Remove</span>`;
      removeBtn.addEventListener('click', () => {
        this.removeSource(source.id);
        this.renderSourcePicker();
      });

      actions.append(removeBtn);
      card.append(header, location);
      if (statusText) {
        card.append(status);
      }
      card.append(actions);
      wrap.appendChild(card);
    }
  }

  findSelectedCollectionMeta() {
    return findSelectedCollectionMeta(this);
  }

  openCollectionView(collectionId) {
    return CollectionService.openCollectionView(this, collectionId);
  }

  leaveCollectionView() {
    return CollectionService.leaveCollectionView(this);
  }

  async saveSelectedCollectionMetadata(patch = null) {
    return CollectionService.saveSelectedCollectionMetadata(this, patch || this.dom.metadataEditor.getCollectionPatch());
  }

  renderAssets() {
    return renderAssets(this);
  }

  selectItem(itemId) {
    return selectItem(this, itemId);
  }

  getSelectedItemIds() {
    return getSelectedItemIds(this);
  }

  isItemSelected(itemId) {
    return isItemSelected(this, itemId);
  }

  repairSelectionState() {
    return repairSelectionState(this);
  }

  toggleItemSelection(itemId, selected = null) {
    return toggleItemSelection(this, itemId, selected);
  }

  clearItemSelection() {
    return clearItemSelection(this);
  }

  findSelectedItem() {
    return findSelectedItem(this);
  }

  resolveMetadataMode() {
    return resolveMetadataMode(this);
  }

  syncMetadataModeFromState() {
    return syncMetadataModeFromState(this);
  }

  renderMetadataMode(mode) {
    return renderMetadataMode(this, mode);
  }

  setBrowserViewMode(level, mode) {
    return setBrowserViewMode(this, level, mode);
  }

  renderEditor() {
    return renderEditor(this);
  }

  collectEditorPatch() {
    const selected = this.findSelectedItem();
    return selected
      ? this.buildItemPatchFromEditor(this.dom.metadataEditor.getItemPatch(), selected)
      : this.dom.metadataEditor.getItemPatch();
  }

  confirmDeleteItems(items) {
    const count = Array.isArray(items) ? items.length : 0;
    if (count === 0) {
      return false;
    }
    const heading = count === 1
      ? 'Remove this item from the collection?'
      : `Remove ${count} selected items from this collection?`;
    const body = count === 1
      ? 'This removes the item from the collection. It does not delete the original media file.'
      : 'This removes them from the collection. It does not delete the original media files.';
    return window.confirm(`${heading}\n\n${body}`);
  }

  repairFocusAfterDeletion(removedIds = []) {
    const removed = new Set((Array.isArray(removedIds) ? removedIds : []).filter(Boolean));
    this.state.selectedItemIds = this.getSelectedItemIds().filter((workspaceId) => !removed.has(workspaceId));

    if (this.state.viewerItemId && removed.has(this.state.viewerItemId)) {
      this.closeViewer();
    }

    if (!this.state.selectedItemId || !removed.has(this.state.selectedItemId)) {
      this.repairSelectionState();
      return;
    }

    const fallback = this.getVisibleAssets().find((item) => {
      if (this.state.currentLevel === 'items' && this.state.openedCollectionId) {
        return item.collectionId === this.state.openedCollectionId && !removed.has(item.workspaceId);
      }
      return !removed.has(item.workspaceId);
    });
    this.state.selectedItemId = fallback?.workspaceId || null;
    this.repairSelectionState();
  }

  async deleteItemsFromState(items = []) {
    for (const item of items) {
      await this.cleanupRemovedItemArtifacts(item);
    }
    const removedIds = new Set(items.map((item) => item.workspaceId));
    this.state.assets = this.state.assets.filter((item) => !removedIds.has(item.workspaceId));
    return [...removedIds];
  }

  async deleteSelectedItems() {
    const selectedIds = this.getSelectedItemIds();
    const items = this.state.assets.filter((item) => selectedIds.includes(item.workspaceId));
    return this.deleteItems(items, { mode: 'bulk' });
  }

  async deleteItem(workspaceId) {
    const item = this.state.assets.find((entry) => entry.workspaceId === workspaceId);
    if (!item) {
      this.setStatus('Select an item to remove.', 'warn');
      return false;
    }
    return this.deleteItems([item], { mode: 'single' });
  }

  async deleteItems(items = [], options = {}) {
    const candidates = Array.from(
      new Map((Array.isArray(items) ? items : []).filter(Boolean).map((item) => [item.workspaceId, item])).values(),
    );
    if (candidates.length === 0) {
      this.setStatus('Select one or more items to remove.', 'warn');
      return false;
    }

    if (!this.confirmDeleteItems(candidates)) {
      return false;
    }

    const grouped = new Map();
    for (const item of candidates) {
      const key = `${item.sourceId}::${item.collectionId || ''}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key).push(item);
    }

    const removedIds = [];
    let removedCount = 0;
    let removedLocalDraftItems = false;
    let removedPersistedItems = false;

    for (const [, groupItems] of grouped.entries()) {
      const sample = groupItems[0];
      const source = this.getSourceById(sample.sourceId);
      const allLocalDraftItems = groupItems.every((item) => item.isLocalDraftAsset);

      if (allLocalDraftItems) {
        const deletedIds = await this.deleteItemsFromState(groupItems);
        removedIds.push(...deletedIds);
        removedCount += deletedIds.length;
        removedLocalDraftItems = true;
        if (source?.id) {
          this.refreshSourceCollectionsAndCounts(source.id);
        }
        continue;
      }

      if (!source?.provider || typeof source.provider.removeItemsFromCollection !== 'function' || !source.capabilities?.canSaveMetadata) {
        const sourceLabel = source?.displayLabel || source?.label || 'this source';
        this.setStatus(`Remove failed: ${sourceLabel} does not currently support safe collection removal.`, 'warn');
        return false;
      }

      this.setStatus(`Removing ${groupItems.length} item(s) from the collection...`, 'neutral');
      await source.provider.removeItemsFromCollection(
        sample.collectionId,
        groupItems.map((item) => item.sourceAssetId),
      );
      const deletedIds = await this.deleteItemsFromState(groupItems);
      removedIds.push(...deletedIds);
      removedCount += deletedIds.length;
      removedPersistedItems = true;
      this.refreshSourceCollectionsAndCounts(source.id);
    }

    this.repairFocusAfterDeletion(removedIds);
    this.renderSourcesList();
    this.renderSourceFilter();
    this.renderCollectionFilter();
    this.renderAssets();
    this.renderEditor();
    this.refreshWorkingStatus();

    if (this.state.opfsAvailable) {
      if (candidates.some((item) => item.isLocalDraftAsset)) {
        await this.saveLocalDraft();
      } else {
        await this.persistWorkspaceToOpfs();
      }
    }
    this.saveSourcesToStorage();

    const actionLabel = options.mode === 'single' ? 'Removed item from the collection.' : `Removed ${removedCount} item(s) from the collection.`;
    this.setStatus(actionLabel, 'ok');
    if (removedPersistedItems) {
      this.markSavedToSource();
    } else if (removedLocalDraftItems && this.state.opfsAvailable) {
      this.markSavedToDraft();
    } else {
      this.markDirty();
    }
    return true;
  }

  async updateItem(id, patch, options = {}) {
    const current = this.state.assets.find((item) => item.workspaceId === id);
    if (!current) {
      this.setStatus(`Could not find item ${id}`, 'warn');
      return;
    }

    const source = this.getSourceById(current.sourceId);
    const canSave = Boolean(source?.capabilities?.canSaveMetadata) && !current.isLocalDraftAsset;

    if (canSave && source?.provider) {
      try {
        this.setStatus('Saving metadata...', 'neutral');
        const updated = await source.provider.saveMetadata(current.sourceAssetId, patch);
        if (!updated) {
          this.setStatus(`Save failed: provider returned no updated item for ${current.id}`, 'warn');
          return;
        }

        const next = {
          ...updated,
          workspaceId: current.workspaceId,
          sourceAssetId: updated.id || current.sourceAssetId,
          sourceId: current.sourceId,
          sourceLabel: current.sourceLabel,
          sourceDisplayLabel: current.sourceDisplayLabel,
          providerId: current.providerId,
        };
        this.state.assets = this.state.assets.map((item) => (item.workspaceId === id ? next : item));
        this.setStatus(
          source?.providerId === 'github' ? 'Metadata saved to GitHub.' : 'Metadata saved.',
          'ok',
        );
        this.markSavedToSource();
      } catch (error) {
        this.state.assets = this.state.assets.map((item) => {
          if (item.workspaceId !== id) {
            return item;
          }
          return {
            ...item,
            ...patch,
            media: {
              ...(item.media || {}),
              ...(patch.media || {}),
            },
          };
        });
        this.setStatus(`Save failed: ${error.message}. Local edits were kept.`, 'warn');
        this.markDirty();
      }
    } else {
      this.state.assets = this.state.assets.map((item) => {
        if (item.workspaceId !== id) {
          return item;
        }
        return {
          ...item,
          ...patch,
          media: {
            ...(item.media || {}),
            ...(patch.media || {}),
          },
        };
      });
      this.setStatus('Source is read-only. Changes are local to this workspace session.', 'warn');
      this.markDirty();
    }

    if (options.explicitSave && !canSave) {
      if (current.isLocalDraftAsset) {
        this.setStatus('Local draft metadata saved. Publish to upload this asset.', 'ok');
        this.markDirty();
      } else {
        this.setStatus('Selected item source is read-only. Changes are local only.', 'warn');
      }
    }

    this.renderAssets();
    this.renderEditor();
    this.refreshWorkingStatus();
  }

  async connectCurrentProvider(options = {}) {
    return connectCurrentProvider(this, options);
  }

  inspectSource(sourceId) {
    return inspectSource(this, sourceId);
  }

  async refreshSource(sourceId, options = {}) {
    return refreshSource(this, sourceId, options);
  }

  removeSource(sourceId) {
    return removeSource(this, sourceId);
  }

  currentCollectionMeta() {
    return currentCollectionMeta(this);
  }

  findCollectionMetaById(collectionId, sourceId = '') {
    const normalizedId = String(collectionId || '').trim();
    if (!normalizedId || normalizedId === 'all') {
      return null;
    }

    const localDraftCollection = this.state.localDraftCollections.find((entry) => entry.id === normalizedId) || null;

    if (sourceId) {
      const source = this.getSourceById(sourceId);
      const sourceCollection = source?.collections?.find((entry) => entry.id === normalizedId);
      if (sourceCollection) {
        return localDraftCollection ? { ...sourceCollection, ...localDraftCollection } : sourceCollection;
      }
    }

    for (const source of this.state.sources) {
      const sourceCollection = (source.collections || []).find((entry) => entry.id === normalizedId);
      if (sourceCollection) {
        return localDraftCollection ? { ...sourceCollection, ...localDraftCollection } : sourceCollection;
      }
    }

    return localDraftCollection;
  }

  resolveItemMetadata(item) {
    const collection = this.findCollectionMetaById(item?.collectionId, item?.sourceId) || {};
    return resolveItemMetadata(item, collection);
  }

  resolveItemForDisplay(item) {
    const resolved = this.resolveItemMetadata(item);
    return {
      ...item,
      description: resolved.description || '',
      license: resolved.license || '',
      attribution: resolved.attribution || '',
      language: resolved.language || '',
      metadataResolution: resolved.metadataResolution || {},
      overrides: item?.overrides && typeof item.overrides === 'object' ? { ...item.overrides } : {},
    };
  }

  deriveItemEditorState(item) {
    const collection = this.findCollectionMetaById(item?.collectionId, item?.sourceId) || {};
    return deriveItemEditorState(item, collection);
  }

  buildItemPatchFromEditor(editorState, previousItem) {
    const collection = this.findCollectionMetaById(previousItem?.collectionId, previousItem?.sourceId) || {};
    return getItemOverridePatch(editorState, collection, previousItem);
  }

  toManifestItem(item) {
    return ManifestService.toManifestItem(this, item);
  }

  buildManifestFromState() {
    return ManifestService.buildManifestFromState(this);
  }

  async generateManifest(options = {}) {
    return ManifestService.generateManifest(this, options);
  }

  resolvePublishSource() {
    if (!this.state.sources.length) {
      return null;
    }
    if (this.state.activeSourceFilter === 'all') {
      return null;
    }
    return this.getSourceById(this.state.activeSourceFilter);
  }

  resolvePublishCollectionId() {
    if (this.state.currentLevel === 'items' && this.state.openedCollectionId) {
      return this.state.openedCollectionId;
    }
    const selectedCollectionId = this.state.selectedCollectionId || 'all';
    return selectedCollectionId === 'all' ? '' : selectedCollectionId;
  }

  getPublishActionState() {
    const collectionId = this.resolvePublishCollectionId();
    const source = this.resolvePublishSource();
    const visible = this.state.currentLevel === 'items' || Boolean(collectionId);

    if (!visible) {
      return {
        label: 'Publish collection',
        visible: false,
        disabled: true,
        reason: 'Select a collection to publish.',
      };
    }

    if (this.state.publishInProgress) {
      return {
        label: 'Publish collection',
        visible: true,
        disabled: true,
        reason: 'Publishing is already in progress.',
      };
    }

    if (!collectionId) {
      return {
        label: 'Publish collection',
        visible: true,
        disabled: true,
        reason: 'Open or select a collection to publish.',
      };
    }

    if (!source) {
      return {
        label: 'Publish collection',
        visible: true,
        disabled: true,
        reason: 'Select a single active connection to publish this collection.',
      };
    }

    if (!source.capabilities?.canPublish) {
      let reason = 'The active connection does not currently support publishing.';
      if (source.needsCredentials) {
        reason = 'Reconnect this connection and provide credentials before publishing.';
      } else if (source.needsReconnect || source.capabilities?.requiresCredentials) {
        reason = 'Reconnect or validate this connection before publishing.';
      }
      return {
        label: 'Publish collection',
        visible: true,
        disabled: true,
        reason,
      };
    }

    if (!source.provider || typeof source.provider.publishCollection !== 'function') {
      return {
        label: 'Publish collection',
        visible: true,
        disabled: true,
        reason: 'This connection is connected, but upload publishing is not available yet.',
      };
    }

    return {
      label: 'Publish collection',
      visible: true,
      disabled: false,
      reason: '',
    };
  }

  async publishActiveSourceDraft() {
    const source = this.resolvePublishSource();
    if (!source) {
      this.setStatus('Select a single source in the viewport filter before publishing.', 'warn');
      return;
    }

    if (!source.capabilities?.canPublish) {
      if (source.needsCredentials) {
        this.setStatus('Publish blocked: this connection is missing credentials. Reconnect and re-enter credentials.', 'warn');
      } else if (source.needsReconnect || source.capabilities?.requiresCredentials) {
        this.setStatus('Publish blocked: this connection needs reconnect/validation before publishing.', 'warn');
      } else {
        this.setStatus('Publish blocked: this connection does not currently support publish uploads.', 'warn');
      }
      return;
    }

    if (!source.provider || typeof source.provider.publishCollection !== 'function') {
      this.setStatus('This source does not support upload publishing yet.', 'warn');
      return;
    }
    const collectionId = this.resolvePublishCollectionId();
    if (!collectionId) {
      this.setStatus('Select one collection before publishing.', 'warn');
      return;
    }
    if (this.state.selectedCollectionId !== collectionId) {
      this.state.selectedCollectionId = collectionId;
    }

    const manifest = await this.generateManifest({ silent: true });
    if (!manifest) {
      return;
    }
    const collectionRootPath = this.activeCollectionRootPath() || this.normalizeCollectionRootPath(`${manifest.id}/`, manifest.id);

    const pending = this.state.assets.filter(
      (item) =>
        item.sourceId === source.id &&
        item.collectionId === collectionId &&
        item.isLocalDraftAsset &&
        normalizeMediaRef(item.media).mode === MEDIA_MODES.managed &&
        item.include !== false &&
        item.draftUploadStatus !== 'uploaded',
    );

    if (pending.length === 0) {
      this.setStatus('No pending local assets. Publishing manifest only...', 'neutral');
    } else {
      this.setStatus(`Publishing ${pending.length} asset(s) to the active connection...`, 'neutral');
    }
    this.setWorkingStateFlags({ publishInProgress: true, publishError: '', lastPublishResult: null });

    this.state.assets = this.state.assets.map((item) => {
      if (!pending.some((entry) => entry.workspaceId === item.workspaceId)) {
        return item;
      }
      return {
        ...item,
        draftUploadStatus: 'uploading',
        uploadError: '',
      };
    });
    this.renderAssets();
    this.renderEditor();

    const uploads = [];
    let failedPreparationCount = 0;
    for (const item of pending) {
      // Referenced media stays as a link in the manifest and is not prepared for upload.
      const original = await this.loadLocalAssetBlob(item, 'original');
      if (!original) {
        failedPreparationCount += 1;
        this.state.assets = this.state.assets.map((entry) =>
          entry.workspaceId === item.workspaceId
            ? { ...entry, draftUploadStatus: 'failed', uploadError: 'Original file missing from local draft storage.' }
            : entry,
        );
        continue;
      }

      uploads.push({
        path: this.joinCollectionRootPath(collectionRootPath, item.media?.url || ''),
        blob: original,
        message: `Upload ${item.id} original via Open Collections Manager`,
      });

      const thumb = await this.loadLocalAssetBlob(item, 'thumbnail');
      if (thumb && item.thumbnailRepoPath) {
        uploads.push({
          path: this.joinCollectionRootPath(collectionRootPath, item.thumbnailRepoPath),
          blob: thumb,
          message: `Upload ${item.id} thumbnail via Open Collections Manager`,
        });
      }
    }

    if (failedPreparationCount > 0) {
      this.renderAssets();
      this.renderEditor();
      this.setStatus(`${failedPreparationCount} asset(s) failed local draft preparation. Fix and retry publish.`, 'warn');
      this.setWorkingStateFlags({ publishInProgress: false, publishError: 'Local draft preparation failed.' });
      return;
    }

    try {
      await source.provider.publishCollection({
        manifest,
        uploads,
        collectionRootPath,
        commitMessage: `Publish collection ${manifest.id} via Open Collections Manager`,
      });

      this.state.assets = this.state.assets.map((item) => {
        if (item.sourceId !== source.id || !item.isLocalDraftAsset) {
          return item;
        }
        const nextMediaRelativePath = item.media?.url || '';
        const nextThumbRelativePath = item.thumbnailRepoPath || item.media?.thumbnailUrl || '';
        return {
          ...item,
          media: {
            ...normalizeMediaRef(item.media),
            url: nextMediaRelativePath,
            thumbnailUrl: nextThumbRelativePath,
          },
          draftUploadStatus: 'uploaded',
          isLocalDraftAsset: false,
          uploadError: '',
        };
      });

      const destinationDetail = this.publishDestinationDetail(source, collectionRootPath);
      const publishSummary = {
        ok: true,
        hostId: source.id,
        hostLabel: source.displayLabel || source.label || source.providerLabel || 'Host',
        providerId: source.providerId,
        destination: destinationDetail,
        detail: `Published ${manifest.id} to ${destinationDetail}`,
        at: new Date().toISOString(),
      };
      source.status = publishSummary.detail;
      source.lastPublishResult = publishSummary;
      this.state.manifest = manifest;
      this.dom.manifestPreview.textContent = JSON.stringify(manifest, null, 2);
      this.refreshSourceCollectionsAndCounts(source.id);
      this.renderSourcesList();
      this.renderSourceFilter();
      this.renderCollectionFilter();
      this.state.currentLevel = 'collections';
      this.state.openedCollectionId = null;
      this.state.selectedItemId = null;
      this.state.selectedItemIds = [];
      this.syncMetadataModeFromState();
      this.closeMobileEditor();
      this.renderSourceContext();
      this.renderAssets();
      this.renderEditor();

      if (this.state.opfsAvailable) {
        await this.saveLocalDraft();
      }
      this.saveSourcesToStorage();
      this.setStatus(`Publish complete via ${publishSummary.hostLabel}. Destination: ${publishSummary.destination}.`, 'ok');
      this.setWorkingStateFlags({
        publishInProgress: false,
        publishError: '',
        lastPublishResult: publishSummary,
        hasUnsavedChanges: false,
        lastSaveTarget: 'source',
      });
    } catch (error) {
      this.state.assets = this.state.assets.map((item) => {
        if (item.sourceId !== source.id || item.draftUploadStatus !== 'uploading') {
          return item;
        }
        return {
          ...item,
          draftUploadStatus: 'failed',
          uploadError: error.message,
        };
      });
      this.renderAssets();
      this.renderEditor();
      const destinationDetail = this.publishDestinationDetail(source, collectionRootPath);
      const failureSummary = {
        ok: false,
        hostId: source.id,
        hostLabel: source.displayLabel || source.label || source.providerLabel || 'Host',
        providerId: source.providerId,
        destination: destinationDetail,
        detail: `Publish to ${destinationDetail} failed: ${error.message || 'Unknown error.'}`,
        at: new Date().toISOString(),
      };
      source.status = failureSummary.detail;
      source.lastPublishResult = failureSummary;
      this.saveSourcesToStorage();
      this.setStatus(failureSummary.detail, 'warn');
      this.setWorkingStateFlags({ publishInProgress: false, publishError: error.message || 'Publish failed.', lastPublishResult: failureSummary });
    }
  }

  async copyManifestToClipboard() {
    return ManifestService.copyManifestToClipboard(this);
  }

  downloadManifest() {
    return ManifestService.downloadManifest(this);
  }
}

if (!customElements.get('open-collections-manager')) {
  customElements.define('open-collections-manager', OpenCollectionsManagerElement);
}
