import { normalizeGoogleDriveManifestUrl } from '../../../../packages/provider-gdrive/src/index.js';
import { MANAGER_CONFIG } from '../config.js';
import { makeSourceId } from '../utils/id-utils.js';

export function setSelectedProvider(app, providerId) {
  const selected = app.providerCatalog.find((entry) => entry.id === providerId);
  if (!selected) {
    return;
  }

  app.state.selectedProviderId = providerId;
  app.dom.sourceManager?.setSelectedProvider(providerId);
  if (providerId === 'gdrive') {
    renderGoogleDriveMode(app);
  }
  app.renderCapabilities(app.providerFactories[providerId]?.getCapabilities?.() || selected.capabilities || {});
}

export function renderGoogleDriveMode(app) {
  app.dom.sourceManager?.renderGoogleDriveMode();
  const mode = app.dom.sourceManager?.getGoogleDriveSourceMode() || 'auth-manifest-file';
  const isAuthMode = mode === 'auth-manifest-file';
  if (app.state.selectedProviderId === 'gdrive') {
    app.renderCapabilities({
      canListAssets: true,
      canGetAsset: true,
      canSaveMetadata: false,
      canExportCollection: true,
      authRequired: isAuthMode,
    });
  }
}

export function collectCurrentProviderConfig(app, providerId) {
  const config = app.dom.sourceManager?.getProviderConfig(providerId) || {};
  if (providerId === 'local') {
    config.localDirectoryName = (config.localDirectoryName || '').trim();
    config.path = (config.path || '').trim()
      || (config.localDirectoryName ? config.localDirectoryName : MANAGER_CONFIG.defaultLocalManifestPath);
    if (app.selectedLocalDirectoryHandle && app.selectedLocalDirectoryHandle.kind === 'directory') {
      config.localDirectoryHandle = app.selectedLocalDirectoryHandle;
    }
  }
  if (providerId === 'gdrive') {
    config.oauthScopes = MANAGER_CONFIG.googleDriveOAuth?.scope || 'https://www.googleapis.com/auth/drive.readonly';
  }
  return config;
}

export function sourceDisplayLabelFor(app, providerId, config, fallbackLabel) {
  if (providerId === 'github') {
    const repo = (config.repo || '').trim();
    return repo || 'GitHub';
  }

  if (providerId === 'public-url') {
    const manifestUrl = (config.manifestUrl || '').trim();
    if (!manifestUrl) {
      return 'Public URL';
    }

    try {
      const parsed = new URL(manifestUrl);
      const parts = parsed.pathname.split('/').filter(Boolean);
      if (parsed.hostname.includes('githubusercontent.com') && parts.length >= 2) {
        return parts[1];
      }

      const file = parts[parts.length - 1] || '';
      const name = file.replace(/\.[^.]+$/, '');
      if (name && !['collection', 'manifest', 'index'].includes(name.toLowerCase())) {
        return name;
      }

      return parsed.hostname.replace(/^www\./i, '') || 'Public URL';
    } catch (error) {
      return 'Public URL';
    }
  }

  if (providerId === 'gdrive') {
    const manifestTitle = (config._manifestTitle || '').trim();
    if (manifestTitle) {
      return manifestTitle;
    }
    if ((config.sourceMode || '') === 'auth-manifest-file') {
      return 'Google Drive (Auth)';
    }
    return 'Google Drive';
  }

  if (providerId === 'local') {
    return (config.localDirectoryName || '').trim() || app.hostNameFromPath(config.path, 'Local folder');
  }

  return fallbackLabel || 'Source';
}

export function sourceDetailLabelFor(app, providerId, config, fallbackLabel) {
  if (providerId === 'github') {
    const owner = (config.owner || '').trim();
    const repo = (config.repo || '').trim();
    const path = (config.path || '').trim();
    const branch = (config.branch || 'main').trim() || 'main';
    const base = owner && repo ? `${owner}/${repo}` : fallbackLabel;
    const scope = path || '/';
    return `${base} @ ${branch}:${scope}`;
  }

  if (providerId === 'public-url') {
    return (config.manifestUrl || '').trim() || 'Public URL manifest';
  }

  if (providerId === 'gdrive') {
    const fileId = (config._normalizedFileId || config.fileId || '').trim();
    const mode = (config.sourceMode || '').trim() || 'public-manifest-url';
    if (fileId) {
      return mode === 'auth-manifest-file' ? `Google Drive API file ${fileId}` : `Google Drive file ${fileId}`;
    }
    return mode === 'auth-manifest-file' ? 'Google Drive API manifest' : 'Google Drive manifest';
  }

  if (providerId === 'local') {
    const folderName = (config.localDirectoryName || '').trim();
    if (folderName) {
      return `${folderName} (host root)`;
    }
    return (config.path || '').trim() || 'Local folder';
  }

  return fallbackLabel || 'Source';
}

export function sanitizeSourceConfig(app, providerId, config = {}) {
  void app;
  if (providerId === 'github') {
    return {
      owner: (config.owner || '').trim(),
      repo: (config.repo || '').trim(),
      branch: (config.branch || 'main').trim() || 'main',
      path: (config.path || '').trim(),
    };
  }

  if (providerId === 'public-url') {
    return {
      manifestUrl: (config.manifestUrl || '').trim(),
    };
  }

  if (providerId === 'gdrive') {
    return {
      sourceMode: (config.sourceMode || 'public-manifest-url').trim() || 'public-manifest-url',
      manifestUrl: (config.manifestUrl || '').trim(),
      fileId: (config.fileId || '').trim(),
      oauthClientId: (config.oauthClientId || '').trim(),
    };
  }

  if (providerId === 'local') {
    return {
      path: (config.path || '').trim() || MANAGER_CONFIG.defaultLocalManifestPath,
      localDirectoryName: (config.localDirectoryName || '').trim(),
    };
  }

  return {};
}

export function toPersistedSource(app, source) {
  return {
    id: source.id,
    providerId: source.providerId,
    providerLabel: source.providerLabel,
    displayLabel: source.displayLabel || source.label,
    detailLabel: source.detailLabel || source.label,
    config: app.sanitizeSourceConfig(source.providerId, source.config),
    capabilities: source.capabilities || {},
    authMode: source.authMode || 'public',
    itemCount: source.itemCount || 0,
    status: source.status || '',
    needsReconnect: Boolean(source.needsReconnect),
    needsCredentials: Boolean(source.needsCredentials),
  };
}

export async function connectCurrentProvider(app) { /* delegated from app.js */
  const providerId = app.state.selectedProviderId;
  const providerFactory = app.providers[providerId];
  const selectedProvider = app.providerCatalog.find((entry) => entry.id === providerId);

  if (!providerFactory || selectedProvider?.enabled === false) {
    app.setConnectionStatus('Selected storage source type is not yet available.', false);
    app.setStatus('Selected storage source type is not yet available.', 'warn');
    return;
  }

  const config = app.collectCurrentProviderConfig(providerId);

  if (providerId === 'local' && !config.localDirectoryHandle) {
    app.setConnectionStatus('Select a local folder first.', false);
    app.setStatus('Select a local folder before adding this host.', 'warn');
    return;
  }

  const provider = providerFactory();

  if (providerId === 'gdrive' && config.sourceMode === 'public-manifest-url' && config.manifestUrl) {
    const normalized = normalizeGoogleDriveManifestUrl(config.manifestUrl);
    if (!normalized.ok) {
      app.setConnectionStatus(normalized.message || 'Invalid Google Drive file URL.', false);
      app.setStatus(normalized.message || 'Invalid Google Drive file URL.', 'warn');
      return;
    }
  }

  try {
    const result = await provider.connect(config);
    app.renderCapabilities(provider);

    if (!result.ok) {
      app.setConnectionStatus(result.message, false);
      app.setStatus(result.message, 'warn');
      app.renderAssets();
      app.renderEditor();
      return;
    }

    app.setConnectionStatus(result.message, true);

    const loaded = await provider.listAssets();
    const derivedConfig = { ...config };
    if (providerId === 'gdrive') {
      derivedConfig._manifestTitle = result.sourceDisplayLabel || '';
      derivedConfig._normalizedFileId = result.fileId || '';
      derivedConfig._normalizedManifestUrl = result.normalizedManifestUrl || '';
    }
    if (providerId === 'local' && result.sourceDisplayLabel) {
      derivedConfig.localDirectoryName = result.sourceDisplayLabel;
    }
    const displayLabel =
      result.sourceDisplayLabel ||
      app.sourceDisplayLabelFor(providerId, derivedConfig, selectedProvider?.label || providerId);
    const detailLabel =
      result.sourceDetailLabel ||
      app.sourceDetailLabelFor(providerId, derivedConfig, selectedProvider?.label || providerId);
    const source = {
      id: makeSourceId(providerId),
      providerId,
      providerLabel: selectedProvider?.label || providerId,
      label: detailLabel,
      displayLabel,
      detailLabel,
      config: { ...config, ...(providerId === 'gdrive' ? { fileId: result.fileId || '' } : {}) },
      capabilities: provider.getCapabilities(),
      status: result.message,
      authMode:
        providerId === 'github'
          ? (config.token || '').trim()
            ? 'token'
            : 'public'
          : providerId === 'local' && config.localDirectoryHandle
            ? 'local-folder'
            : providerId === 'gdrive' && config.sourceMode === 'auth-manifest-file'
              ? 'google-auth'
              : 'public',
      itemCount: loaded.length,
      provider,
      needsReconnect: false,
      needsCredentials: providerId === 'gdrive' && config.sourceMode === 'auth-manifest-file' ? !(config.accessToken || '').trim() : false,
      collections: [],
      selectedCollectionId: null,
    };

    const normalized = app.normalizeSourceAssets(source, loaded);
    const providerCollections = Array.isArray(result.collections)
      ? app.normalizeCollectionsFromProvider(result.collections)
      : null;
    const collections = providerCollections || app.buildCollectionsForSource(source, normalized);
    const defaultCollectionId = collections[0]?.id || null;
    const normalizedWithCollections = normalized.map((item) => ({
      ...item,
      collectionId: item.collectionId || defaultCollectionId,
      collectionLabel: item.collectionLabel || collections.find((entry) => entry.id === (item.collectionId || defaultCollectionId))?.title || '',
    }));
    source.collections = collections;
    source.selectedCollectionId = defaultCollectionId;
    if (providerId === 'local' && config.localDirectoryHandle) {
      app.selectedLocalDirectoryHandle = config.localDirectoryHandle;
    }
    app.state.sources = [...app.state.sources, source];
    app.state.assets = [...app.state.assets, ...normalizedWithCollections];
    if (providerId === 'local') {
      await app.hydrateLocalSourceAssetPreviews(source.id);
    }
    app.state.activeSourceFilter = source.id;
    app.state.selectedCollectionId = source.selectedCollectionId || 'all';
    app.state.currentLevel = 'collections';
    app.state.openedCollectionId = null;
    app.state.selectedItemId = null;
    app.syncMetadataModeFromState();
    app.closeMobileEditor();
    app.state.manifest = null;
    app.dom.manifestPreview.textContent = '{}';

    app.setStatus(`Added storage source ${displayLabel} (${loaded.length} items).`, 'ok');
    app.setWorkingStateFlags({ publishError: '' });
    app.renderSourcesList();
    app.renderSourceFilter();
    app.renderAssets();
    app.renderEditor();
    app.saveSourcesToStorage();
  } catch (error) {
    app.setConnectionStatus(`Connection error: ${error.message}`, false);
    app.setStatus(`Connection error: ${error.message}`, 'warn');
    app.refreshWorkingStatus();
  }
}

export function inspectSource(app, sourceId) {
  const source = app.getSourceById(sourceId);
  if (!source) {
    return;
  }

  app.setSelectedProvider(source.providerId);
  const nextConfigValues = {};
  if (source.providerId === 'github') {
    nextConfigValues.githubToken = source.config.token || '';
    nextConfigValues.githubOwner = source.config.owner || '';
    nextConfigValues.githubRepo = source.config.repo || '';
    nextConfigValues.githubBranch = source.config.branch || 'main';
    nextConfigValues.githubPath = source.config.path || '';
  }
  if (source.providerId === 'public-url') {
    nextConfigValues.publicUrlInput = source.config.manifestUrl || '';
  }
  if (source.providerId === 'gdrive') {
    nextConfigValues.gdriveSourceMode = source.config.sourceMode || 'public-manifest-url';
    nextConfigValues.gdriveUrlInput = source.config.manifestUrl || '';
    nextConfigValues.gdriveFileIdInput = source.config.fileId || '';
    nextConfigValues.gdriveClientIdInput = source.config.oauthClientId || MANAGER_CONFIG.googleDriveOAuth?.clientId || '';
    nextConfigValues.gdriveAccessTokenInput = '';
    app.setGoogleDriveAuthStatus(
      source.config.sourceMode === 'auth-manifest-file'
        ? 'Re-authentication required before refresh.'
        : 'Public shared URL mode selected.',
      source.config.sourceMode === 'auth-manifest-file' ? 'warn' : 'neutral',
    );
  }
  if (source.providerId === 'local') {
    nextConfigValues.localPathInput = source.config.path || MANAGER_CONFIG.defaultLocalManifestPath;
    nextConfigValues.localFolderName = source.config.localDirectoryName || '';
    app.selectedLocalDirectoryHandle =
      source.config?.localDirectoryHandle && source.config.localDirectoryHandle.kind === 'directory'
        ? source.config.localDirectoryHandle
        : null;
  }
  app.dom.sourceManager?.setConfigValues(nextConfigValues);

  app.setConnectionStatus(`Inspecting storage source: ${source.label}`, true);
}

export async function refreshSource(app, sourceId) {
  const source = app.getSourceById(sourceId);
  if (!source) {
    return;
  }

  const providerFactory = app.providers[source.providerId];
  if (!providerFactory) {
    app.setStatus(`Storage source type for ${source.label} is unavailable.`, 'warn');
    return;
  }

  try {
    const provider = providerFactory();
    const refreshConfig = { ...(source.config || {}) };
    if (source.providerId === 'local' && app.selectedLocalDirectoryHandle) {
      refreshConfig.localDirectoryHandle = app.selectedLocalDirectoryHandle;
      if (!refreshConfig.localDirectoryName) {
        refreshConfig.localDirectoryName = app.selectedLocalDirectoryHandle.name || refreshConfig.localDirectoryName || '';
      }
    }
    const result = await provider.connect(refreshConfig);
    if (!result.ok) {
      const next = {
        ...source,
        status: result.message,
        needsReconnect: true,
        needsCredentials:
          source.providerId === 'github' ||
          (source.providerId === 'gdrive' && source.config?.sourceMode === 'auth-manifest-file'),
      };
      app.state.sources = app.state.sources.map((entry) => (entry.id === sourceId ? next : entry));
      app.renderSourcesList();
      app.saveSourcesToStorage();
      app.setConnectionStatus(result.message, false);
      app.setStatus(`Refresh failed: ${result.message}`, 'warn');
      app.refreshWorkingStatus();
      return;
    }

    const loaded = await provider.listAssets();
    const refreshedConfig = { ...refreshConfig };
    if (source.providerId === 'gdrive') {
      refreshedConfig._manifestTitle = result.sourceDisplayLabel || source.displayLabel || '';
      refreshedConfig._normalizedFileId = result.fileId || source.config?.fileId || '';
      refreshedConfig._normalizedManifestUrl = result.normalizedManifestUrl || '';
    }
    if (source.providerId === 'local' && result.sourceDisplayLabel) {
      refreshedConfig.localDirectoryName = result.sourceDisplayLabel;
    }
    const displayLabel =
      result.sourceDisplayLabel || app.sourceDisplayLabelFor(source.providerId, refreshedConfig, source.providerLabel);
    const detailLabel =
      result.sourceDetailLabel || app.sourceDetailLabelFor(source.providerId, refreshedConfig, source.providerLabel);
    const updatedSource = {
      ...source,
      provider,
      capabilities: provider.getCapabilities(),
      itemCount: loaded.length,
      status: result.message,
      authMode:
        source.providerId === 'gdrive' && source.config?.sourceMode === 'auth-manifest-file'
          ? 'google-auth'
          : source.authMode,
      displayLabel,
      detailLabel,
      label: detailLabel,
      config:
        source.providerId === 'gdrive'
          ? {
              ...refreshConfig,
              fileId: result.fileId || source.config?.fileId || '',
              sourceMode: source.config?.sourceMode || 'public-manifest-url',
            }
          : refreshConfig,
      collections: source.collections || [],
      selectedCollectionId: source.selectedCollectionId || null,
      needsReconnect: false,
      needsCredentials: false,
    };
    const normalized = app.normalizeSourceAssets(updatedSource, loaded);
    const providerCollections = Array.isArray(result.collections)
      ? app.normalizeCollectionsFromProvider(result.collections)
      : null;
    const collections = providerCollections || app.buildCollectionsForSource(updatedSource, normalized);
    const defaultCollectionId = collections[0]?.id || null;
    const normalizedWithCollections = normalized.map((item) => ({
      ...item,
      collectionId: item.collectionId || defaultCollectionId,
      collectionLabel: item.collectionLabel || collections.find((entry) => entry.id === (item.collectionId || defaultCollectionId))?.title || '',
    }));
    updatedSource.collections = collections;
    updatedSource.selectedCollectionId =
      (updatedSource.selectedCollectionId && collections.some((entry) => entry.id === updatedSource.selectedCollectionId))
        ? updatedSource.selectedCollectionId
        : defaultCollectionId;

    app.state.sources = app.state.sources.map((entry) => (entry.id === sourceId ? updatedSource : entry));
    app.mergeSourceAssets(sourceId, normalizedWithCollections);
    if (source.providerId === 'local') {
      await app.hydrateLocalSourceAssetPreviews(sourceId);
    }

    if (app.state.selectedItemId && !app.state.assets.some((item) => item.workspaceId === app.state.selectedItemId)) {
      app.state.selectedItemId = app.getVisibleAssets()[0]?.workspaceId || app.state.assets[0]?.workspaceId || null;
    }
    if (app.state.viewerItemId && !app.state.assets.some((item) => item.workspaceId === app.state.viewerItemId)) {
      app.closeViewer();
    } else if (app.state.viewerItemId) {
      app.renderViewer();
    }

    app.setConnectionStatus(`Refreshed storage source ${updatedSource.label}.`, true);
    app.setStatus(`Refreshed storage source ${updatedSource.label}.`, 'ok');
    app.refreshWorkingStatus();
    app.renderSourcesList();
    app.renderSourceFilter();
    app.renderAssets();
    app.renderEditor();
    app.saveSourcesToStorage();
  } catch (error) {
    const next = {
      ...source,
      status: `Refresh error: ${error.message}`,
      needsReconnect: true,
      needsCredentials:
        source.providerId === 'github' ||
        (source.providerId === 'gdrive' && source.config?.sourceMode === 'auth-manifest-file'),
    };
    app.state.sources = app.state.sources.map((entry) => (entry.id === sourceId ? next : entry));
    app.renderSourcesList();
    app.saveSourcesToStorage();
    app.setConnectionStatus(`Refresh error: ${error.message}`, false);
    app.setStatus(`Refresh error: ${error.message}`, 'warn');
    app.refreshWorkingStatus();
  }
}

export function removeSource(app, sourceId) {
  const source = app.getSourceById(sourceId);
  if (!source) {
    return;
  }

  app.state.sources = app.state.sources.filter((entry) => entry.id !== sourceId);
  app.state.assets = app.state.assets.filter((entry) => entry.sourceId !== sourceId);
  if (app.state.sources.length === 0) {
    app.closeMobileEditor();
  }

  if (app.state.selectedItemId && !app.state.assets.some((item) => item.workspaceId === app.state.selectedItemId)) {
    app.state.selectedItemId = null;
  }
  if (app.state.viewerItemId && !app.state.assets.some((item) => item.workspaceId === app.state.viewerItemId)) {
    app.closeViewer();
  }
  app.syncMetadataModeFromState();

  if (app.state.sources.length === 0) {
    app.setConnectionStatus('No hosts connected.', 'neutral');
    app.setStatus('No hosts connected.', 'neutral');
    app.setWorkingStateFlags({ hasUnsavedChanges: false, lastSaveTarget: '', publishError: '' });
  } else {
    app.setStatus(`Removed storage source ${source.label}.`, 'ok');
    app.refreshWorkingStatus();
  }

  app.state.manifest = null;
  app.dom.manifestPreview.textContent = '{}';
  app.renderSourcesList();
  app.renderSourceFilter();
  app.renderAssets();
  app.renderEditor();
  app.saveSourcesToStorage();
}
