import * as DraftService from '../services/draft-service.js';
import { makeSourceId } from '../utils/id-utils.js';
import { getPlatformType, PLATFORM_TYPES, revivePlatformHandle } from '../../../../shared/platform/index.js';

const SOURCES_STORAGE_KEY = 'timemap_manager_sources_v1';
const WORKSPACE_SELECTION_STORAGE_KEY = 'timemap_manager_workspace_selection_v1';

function normalizeLocalDraftCollectionEntry(app, entry = {}) {
  return {
    id: String(entry.id || ''),
    title: entry.title || String(entry.id || ''),
    description: entry.description || '',
    license: entry.license || '',
    publisher: entry.publisher || '',
    language: entry.language || '',
    rootPath: app.normalizeCollectionRootPath(entry.rootPath || `${entry.id}/`, entry.id),
  };
}

function summarizeCredentialConfig(providerId, config = {}) {
  if (providerId === 'github') {
    return {
      owner: String(config.owner || '').trim(),
      repo: String(config.repo || '').trim(),
      branch: String(config.branch || '').trim() || 'main',
      path: String(config.path || '').trim(),
      hasToken: Boolean(String(config.token || '').trim()),
      tokenLength: String(config.token || '').length,
    };
  }
  if (providerId === 's3') {
    return {
      endpoint: String(config.endpoint || '').trim(),
      bucket: String(config.bucket || '').trim(),
      region: String(config.region || '').trim(),
      basePath: String(config.basePath || '').trim(),
      hasAccessKey: Boolean(String(config.accessKey || '').trim()),
      accessKeyLength: String(config.accessKey || '').length,
      hasSecretKey: Boolean(String(config.secretKey || '').trim()),
      secretKeyLength: String(config.secretKey || '').length,
    };
  }
  return {};
}

function logCredentialRestore(stage, payload = {}) {
  try {
    console.info(`[workspace-controller][credentials] ${stage}`, payload);
  } catch (_error) {
    // ignore logging failures
  }
}

function shouldAutoReconnectRememberedSource(source, platformType = PLATFORM_TYPES.BROWSER) {
  if (!source || typeof source !== 'object') {
    return false;
  }

  if (platformType === PLATFORM_TYPES.BROWSER) {
    return source.providerId === 'example';
  }

  if (source.providerId === 'local') {
    return Boolean(source.config?.localDirectoryHandle);
  }

  if (source.providerId === 'github' || source.providerId === 's3') {
    // Auto-reconnect remote hosts when non-secret config is remembered and credentials are available.
    return !source.needsCredentials;
  }

  return true;
}

export function currentWorkspaceSnapshot(app) {
  return {
    selectedSourceId: app.state.activeSourceFilter || 'all',
    selectedCollectionId: app.state.selectedCollectionId || 'all',
    selectedItemId: app.state.selectedItemId || null,
    selectedItemIds: Array.isArray(app.state.selectedItemIds) ? [...app.state.selectedItemIds] : [],
    collectionMeta: app.currentCollectionMeta(),
    draftCollectionId: app.draftCollectionId(),
    lastLocalSaveAt: app.state.lastLocalSaveAt || '',
    localDraftCollections: app.state.localDraftCollections || [],
  };
}

export function buildLocalDraftPayload(app) {
  return {
    savedAt: new Date().toISOString(),
    collectionMeta: app.currentCollectionMeta(),
    manifest: app.state.manifest || null,
    selectedItemId: app.state.selectedItemId || null,
    selectedItemIds: Array.isArray(app.state.selectedItemIds) ? [...app.state.selectedItemIds] : [],
    selectedSourceId: app.state.activeSourceFilter || 'all',
    selectedCollectionId: app.state.selectedCollectionId || 'all',
    localDraftCollections: app.state.localDraftCollections || [],
    assets: app.state.assets.map((item) => ({
      ...item,
      previewUrl: '',
      thumbnailPreviewUrl: '',
      draftUploadStatus: item.draftUploadStatus === 'uploading' ? 'pending-upload' : item.draftUploadStatus,
      workspaceId: item.workspaceId,
      sourceId: item.sourceId,
      sourceAssetId: item.sourceAssetId,
      sourceLabel: item.sourceLabel,
      sourceDisplayLabel: item.sourceDisplayLabel,
      providerId: item.providerId,
      collectionId: item.collectionId || null,
      collectionLabel: item.collectionLabel || '',
    })),
    sources: app.state.sources.map((source) => app.toPersistedSource(source)),
  };
}

export function applyWorkspaceSnapshot(app, snapshot = {}) {
  if (!snapshot || typeof snapshot !== 'object') {
    return;
  }
  if (Array.isArray(snapshot.localDraftCollections)) {
    app.state.localDraftCollections = snapshot.localDraftCollections
      .filter((entry) => entry && entry.id)
      .map((entry) => normalizeLocalDraftCollectionEntry(app, entry));
  }

  if (snapshot.collectionMeta && typeof snapshot.collectionMeta === 'object') {
    app.setCollectionMetaFields({
      id: snapshot.collectionMeta.id || app.dom.collectionId.value,
      title: snapshot.collectionMeta.title || app.dom.collectionTitle.value,
      description: snapshot.collectionMeta.description || app.dom.collectionDescription.value,
      license: snapshot.collectionMeta.license || app.dom.collectionLicense.value,
      publisher: snapshot.collectionMeta.publisher || app.dom.collectionPublisher.value,
      language: snapshot.collectionMeta.language || app.dom.collectionLanguage.value,
    });
  }

  if (snapshot.selectedSourceId && (snapshot.selectedSourceId === 'all' || app.state.sources.some((entry) => entry.id === snapshot.selectedSourceId))) {
    app.state.activeSourceFilter = snapshot.selectedSourceId;
  }
  app.renderSourceFilter();

  if (snapshot.selectedCollectionId) {
    app.state.selectedCollectionId = snapshot.selectedCollectionId;
    app.renderCollectionFilter();
  }

  if (
    snapshot.selectedItemId &&
    app.state.assets.some((entry) => entry.workspaceId === snapshot.selectedItemId)
  ) {
    app.state.selectedItemId = snapshot.selectedItemId;
  }
  if (Array.isArray(snapshot.selectedItemIds)) {
    const visibleSelection = snapshot.selectedItemIds.filter(
      (workspaceId) => typeof workspaceId === 'string' && app.state.assets.some((entry) => entry.workspaceId === workspaceId),
    );
    app.state.selectedItemIds = visibleSelection;
  }
}

export function applyLocalDraftPayload(app, payload) {
  if (!payload || typeof payload !== 'object') {
    return;
  }
  if (Array.isArray(payload.localDraftCollections)) {
    app.state.localDraftCollections = payload.localDraftCollections
      .filter((entry) => entry && entry.id)
      .map((entry) => normalizeLocalDraftCollectionEntry(app, entry));
  }

  if (payload.collectionMeta && typeof payload.collectionMeta === 'object') {
    app.setCollectionMetaFields({
      id: payload.collectionMeta.id || app.dom.collectionId.value,
      title: payload.collectionMeta.title || app.dom.collectionTitle.value,
      description: payload.collectionMeta.description || app.dom.collectionDescription.value,
      license: payload.collectionMeta.license || app.dom.collectionLicense.value,
      publisher: payload.collectionMeta.publisher || app.dom.collectionPublisher.value,
      language: payload.collectionMeta.language || app.dom.collectionLanguage.value,
    });
  }

  if (Array.isArray(payload.assets)) {
    app.state.assets = payload.assets.map((item) => ({ ...item }));
    for (const source of app.state.sources) {
      app.refreshSourceCollectionsAndCounts(source.id);
    }
    app.renderSourcesList();
  }

  if (payload.manifest && typeof payload.manifest === 'object') {
    app.state.manifest = payload.manifest;
    app.dom.manifestPreview.textContent = JSON.stringify(payload.manifest, null, 2);
  }

  if (payload.selectedSourceId) {
    app.state.activeSourceFilter = payload.selectedSourceId;
  }
  app.renderSourceFilter();

  if (payload.selectedCollectionId) {
    app.state.selectedCollectionId = payload.selectedCollectionId;
    app.renderCollectionFilter();
  }

  if (
    payload.selectedItemId &&
    app.state.assets.some((entry) => entry.workspaceId === payload.selectedItemId)
  ) {
    app.state.selectedItemId = payload.selectedItemId;
  }
  if (Array.isArray(payload.selectedItemIds)) {
    app.state.selectedItemIds = payload.selectedItemIds.filter(
      (workspaceId) => typeof workspaceId === 'string' && app.state.assets.some((entry) => entry.workspaceId === workspaceId),
    );
  }

  app.renderAssets();
  app.renderEditor();
  app.setWorkingStateFlags({ hasLocalDraft: true, publishError: '' });
}

export function saveSourcesToStorage(app) {
  const payload = app.state.sources.map((source) => app.toPersistedSource(source));

  try {
    window.localStorage.setItem(SOURCES_STORAGE_KEY, JSON.stringify(payload));
    window.localStorage.setItem(
      WORKSPACE_SELECTION_STORAGE_KEY,
      JSON.stringify({
        selectedSourceId: app.state.activeSourceFilter || 'all',
      }),
    );
  } catch (error) {
    // Ignore storage failures in restricted/private browser modes.
  }

  if (!app.state.opfsAvailable) {
    return;
  }

  app.persistSourcesToOpfs(payload)
    .then(() => app.persistWorkspaceToOpfs())
    .catch((error) => {
      app.setLocalDraftStatus(`Local draft save failed: ${error.message}`, 'warn');
    });
}

export async function restoreRememberedSources(app) {
  const platformType = getPlatformType();
  const isTauriDesktop = platformType === PLATFORM_TYPES.TAURI;
  const isFilesystemLikePath = (value) => /^[a-z]:[\\/]/i.test(value) || value.startsWith('\\\\') || value.includes('\\');
  let remembered = [];

  if (app.state.opfsAvailable) {
    try {
      remembered = await app.loadRememberedSourcesFromOpfs();
    } catch (error) {
      remembered = [];
    }
  }

  if (!Array.isArray(remembered) || remembered.length === 0) {
    try {
      remembered = JSON.parse(window.localStorage.getItem(SOURCES_STORAGE_KEY) || '[]');
    } catch (error) {
      remembered = [];
    }
  }

  const restored = [];
  const seen = new Set();
  for (const entry of Array.isArray(remembered) ? remembered : []) {
    if (!entry || typeof entry !== 'object') {
      continue;
    }

    const source = {
      id: entry.id || makeSourceId(entry.providerId || 'source'),
      providerId: entry.providerId,
      providerLabel: entry.providerLabel || app.providerCatalog.find((p) => p.id === entry.providerId)?.label || 'Source',
      displayLabel: entry.displayLabel || entry.label || 'Source',
      detailLabel: entry.detailLabel || entry.label || 'Source',
      label: entry.detailLabel || entry.label || entry.displayLabel || 'Source',
      config: app.sanitizeSourceConfig(entry.providerId, entry.config || {}),
      capabilities: entry.capabilities || app.providerFactories[entry.providerId]?.getCapabilities?.() || {},
      status: 'Remembered storage source. Click Refresh to reconnect.',
      authMode: entry.authMode || 'public',
      itemCount: Number(entry.itemCount) || 0,
      provider: null,
      needsReconnect: true,
      needsCredentials: false,
      lastPublishResult: entry.lastPublishResult || null,
    };
    if (source.providerId === 'local') {
      const rawHandle =
        entry.config?.localDirectoryHandle && typeof entry.config.localDirectoryHandle === 'object'
          ? entry.config.localDirectoryHandle
          : null;
      const configuredPath = String(entry.config?.path || '').trim();
      const fallbackPath = String(entry.config?.localDirectoryPath || (isFilesystemLikePath(configuredPath) ? configuredPath : '')).trim();
      const fallbackName = String(entry.config?.localDirectoryName || '').trim();
      const revived = revivePlatformHandle(
        rawHandle
          || (fallbackPath
            ? {
                kind: 'directory',
                path: fallbackPath,
                name: fallbackName,
              }
            : null),
      );
      if (revived?.kind === 'directory') {
        source.config = {
          ...source.config,
          localDirectoryHandle: revived,
          localDirectoryPath: String(revived.path || fallbackPath).trim() || fallbackPath,
          localDirectoryName: source.config?.localDirectoryName || String(revived.name || fallbackName).trim(),
          path: source.config?.path || String(revived.path || fallbackPath).trim(),
        };
      }
    }

    const identity = app.sourceIdentityKey(source);
    if (seen.has(identity)) {
      continue;
    }
    seen.add(identity);

    if (source.providerId === 'github') {
      logCredentialRestore('restore:load-secret:start', {
        sourceId: source.id,
        identity,
        providerId: source.providerId,
        summary: summarizeCredentialConfig(source.providerId, source.config || {}),
      });
      const configWithToken = await app.credentialStore.loadSourceSecret(source, source.config || {});
      source.config = configWithToken;
      source.authMode = (configWithToken.token || '').trim() ? 'token' : 'public';
      source.needsCredentials = !(configWithToken.token || '').trim();
      logCredentialRestore('restore:load-secret:done', {
        sourceId: source.id,
        identity,
        providerId: source.providerId,
        summary: summarizeCredentialConfig(source.providerId, configWithToken || {}),
      });
      source.status = source.needsCredentials
        ? 'Remembered GitHub host. Credentials were not found in secure storage; reconnect required.'
        : 'Remembered GitHub host. Token restored from secure desktop storage.';
    } else if (source.providerId === 's3') {
      logCredentialRestore('restore:load-secret:start', {
        sourceId: source.id,
        identity,
        providerId: source.providerId,
        summary: summarizeCredentialConfig(source.providerId, source.config || {}),
      });
      const configWithSecret = await app.credentialStore.loadSourceSecret(source, source.config || {});
      source.config = configWithSecret;
      source.authMode = (configWithSecret.accessKey || '').trim() ? 'access-key' : 'public';
      source.needsCredentials = !((configWithSecret.accessKey || '').trim() && (configWithSecret.secretKey || '').trim());
      logCredentialRestore('restore:load-secret:done', {
        sourceId: source.id,
        identity,
        providerId: source.providerId,
        summary: summarizeCredentialConfig(source.providerId, configWithSecret || {}),
      });
      source.status = source.needsCredentials
        ? 'Remembered S3-compatible host. Credentials were not found in secure storage; reconnect required.'
        : 'Remembered S3-compatible host. Credentials restored from secure storage.';
    } else if (source.providerId === 'local' && source.config?.localDirectoryHandle) {
      source.status = isTauriDesktop
        ? 'Remembered local host. Restoring folder access from desktop workspace state.'
        : 'Remembered local host. Attempting reconnect with stored folder handle.';
    } else if (source.providerId === 'local' && source.config?.localDirectoryName) {
      source.status = 'Remembered local host. Re-select the folder before refresh because browser folder handles are session-scoped.';
    }

    restored.push(source);
  }

  const needsBrowserExample = platformType === PLATFORM_TYPES.BROWSER && !restored.some((source) => source.providerId === 'example');
  if (restored.length === 0 && !needsBrowserExample) {
    return;
  }

  let desiredActiveSourceId = 'all';
  try {
    const stored = JSON.parse(window.localStorage.getItem(WORKSPACE_SELECTION_STORAGE_KEY) || '{}');
    desiredActiveSourceId = stored.selectedSourceId || 'all';
  } catch (error) {
    desiredActiveSourceId = 'all';
  }

  app.state.sources = app.sortSourcesForDisplay(restored);
  const firstLocalHandle = app.state.sources.find((source) => source.providerId === 'local' && source.config?.localDirectoryHandle)?.config?.localDirectoryHandle || null;
  app.selectedLocalDirectoryHandle = firstLocalHandle;
  app.state.assets = [];
  app.state.selectedItemId = null;
  app.state.selectedItemIds = [];
  app.state.activeSourceFilter = platformType === PLATFORM_TYPES.BROWSER
    ? 'all'
    : app.state.sources.some((source) => source.id === desiredActiveSourceId)
      ? desiredActiveSourceId
      : 'all';
  app.state.currentLevel = 'collections';
  app.state.openedCollectionId = null;
  app.syncMetadataModeFromState();
  app.closeMobileEditor();

  app.setStatus(`Restored ${app.state.sources.length} remembered storage source definitions.`, 'neutral');
  app.refreshWorkingStatus();
  app.setConnectionStatus('Remembered storage sources loaded. Refresh to reconnect.', 'neutral');
  app.renderSourcesList();
  app.renderSourceFilter();
  app.renderAssets();
  app.renderEditor();

  if (needsBrowserExample) {
    await app.connectCurrentProvider({
      providerId: 'example',
      closeProviderDialog: false,
      openSourcePicker: false,
    });
  } else {
    app.activatePreferredBrowserStartupSource();
  }

  for (const source of app.state.sources) {
    const shouldAutoRefresh = shouldAutoReconnectRememberedSource(source, platformType);
    if (!shouldAutoRefresh) {
      continue;
    }
    await app.refreshSource(source.id);
  }
}

export async function initializeLocalDraftState(app) {
  return DraftService.initializeLocalDraftState(app);
}

export async function saveLocalDraft(app) {
  return DraftService.saveLocalDraft(app);
}

export async function restoreLocalDraft(app, options = {}) {
  return DraftService.restoreLocalDraft(app, options);
}

export async function discardLocalDraft(app) {
  return DraftService.discardLocalDraft(app);
}
