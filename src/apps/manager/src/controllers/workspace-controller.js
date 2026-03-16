import * as DraftService from '../services/draft-service.js';
import { makeSourceId } from '../utils/id-utils.js';

const SOURCES_STORAGE_KEY = 'timemap_manager_sources_v1';

export function currentWorkspaceSnapshot(app) {
  return {
    selectedSourceId: app.state.activeSourceFilter || 'all',
    selectedCollectionId: app.state.selectedCollectionId || 'all',
    selectedItemId: app.state.selectedItemId || null,
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
      .map((entry) => ({
        id: String(entry.id),
        title: entry.title || String(entry.id),
        rootPath: app.normalizeCollectionRootPath(entry.rootPath || `${entry.id}/`, entry.id),
      }));
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
}

export function applyLocalDraftPayload(app, payload) {
  if (!payload || typeof payload !== 'object') {
    return;
  }
  if (Array.isArray(payload.localDraftCollections)) {
    app.state.localDraftCollections = payload.localDraftCollections
      .filter((entry) => entry && entry.id)
      .map((entry) => ({
        id: String(entry.id),
        title: entry.title || String(entry.id),
        rootPath: app.normalizeCollectionRootPath(entry.rootPath || `${entry.id}/`, entry.id),
      }));
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

  app.renderAssets();
  app.renderEditor();
}

export function saveSourcesToStorage(app) {
  const payload = app.state.sources.map((source) => app.toPersistedSource(source));

  try {
    window.localStorage.setItem(SOURCES_STORAGE_KEY, JSON.stringify(payload));
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

  if (!Array.isArray(remembered) || remembered.length === 0) {
    return;
  }

  const restored = remembered
    .filter((entry) => entry && typeof entry === 'object')
    .map((entry) => ({
      id: entry.id || makeSourceId(entry.providerId || 'source'),
      providerId: entry.providerId,
      providerLabel: entry.providerLabel || app.providerCatalog.find((p) => p.id === entry.providerId)?.label || 'Source',
      displayLabel: entry.displayLabel || entry.label || 'Source',
      detailLabel: entry.detailLabel || entry.label || 'Source',
      label: entry.detailLabel || entry.label || entry.displayLabel || 'Source',
      config: app.sanitizeSourceConfig(entry.providerId, entry.config || {}),
      capabilities: entry.capabilities || app.providerFactories[entry.providerId]?.getCapabilities?.() || {},
      status: (() => {
        if (entry.providerId === 'github') {
          return 'Remembered storage source. Token is not stored; re-enter token if repository requires it.';
        }
        if (entry.providerId === 'gdrive' && entry.config?.sourceMode === 'auth-manifest-file') {
          return 'Remembered storage source. Google access token is session-only; reconnect authentication before refresh.';
        }
        if (entry.providerId === 'local' && entry.config?.localDirectoryName) {
          return 'Remembered local host. Re-select the folder before refresh because browser folder handles are session-scoped.';
        }
        return 'Remembered storage source. Click Refresh to reconnect.';
      })(),
      authMode:
        entry.providerId === 'github'
          ? 'token'
          : entry.providerId === 'gdrive' && entry.config?.sourceMode === 'auth-manifest-file'
            ? 'google-auth'
            : entry.authMode || 'public',
      itemCount: Number(entry.itemCount) || 0,
      provider: null,
      needsReconnect: true,
      needsCredentials: entry.providerId === 'github' || (entry.providerId === 'gdrive' && entry.config?.sourceMode === 'auth-manifest-file'),
    }));

  app.state.sources = restored;
  app.state.assets = [];
  app.state.selectedItemId = null;
  app.state.activeSourceFilter = 'all';
  app.state.currentLevel = 'collections';
  app.state.openedCollectionId = null;
  app.syncMetadataModeFromState();
  app.closeMobileEditor();

  app.setStatus(`Restored ${restored.length} remembered storage source definitions.`, 'neutral');
  app.setConnectionStatus('Remembered storage sources loaded. Refresh to reconnect.', 'neutral');
  app.renderSourcesList();
  app.renderSourceFilter();
  app.renderAssets();
  app.renderEditor();

  for (const source of restored) {
    if (
      source.providerId !== 'github' &&
      !(source.providerId === 'gdrive' && source.config?.sourceMode === 'auth-manifest-file') &&
      !(source.providerId === 'local' && source.config?.localDirectoryName)
    ) {
      await app.refreshSource(source.id);
    }
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
