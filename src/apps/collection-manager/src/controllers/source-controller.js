import { MANAGER_CONFIG } from '../config.js';
import { makeSourceId } from '../utils/id-utils.js';

function localDirectoryPathFromHandle(handle) {
  const path = typeof handle?.path === 'string' ? handle.path.trim() : '';
  return path || '';
}

function serializeLocalDirectoryHandle(handle) {
  if (!handle || handle.kind !== 'directory') {
    return null;
  }
  const path = localDirectoryPathFromHandle(handle);
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

function logCredentialTrace(stage, payload = {}) {
  try {
    console.info(`[source-controller][credentials] ${stage}`, payload);
  } catch (_error) {
    // ignore logging failures
  }
}

export function setSelectedProvider(app, providerId) {
  const selected = app.providerCatalog.find((entry) => entry.id === providerId);
  if (!selected) {
    return;
  }

  app.state.selectedProviderId = providerId;
  app.dom.sourceManager?.setSelectedProvider(providerId);
  app.renderCapabilities(app.providerFactories[providerId]?.getCapabilities?.() || selected.capabilities || {});
}

export function collectCurrentProviderConfig(app, providerId) {
  const config = app.dom.sourceManager?.getProviderConfig(providerId) || {};
  if (providerId === 'local') {
    config.localDirectoryName = (config.localDirectoryName || '').trim();
    const selectedHandle =
      app.selectedLocalDirectoryHandle && app.selectedLocalDirectoryHandle.kind === 'directory'
        ? app.selectedLocalDirectoryHandle
        : null;
    if (selectedHandle) {
      config.localDirectoryHandle = selectedHandle;
      const handlePath = localDirectoryPathFromHandle(selectedHandle);
      if (handlePath) {
        config.path = handlePath;
      }
      if (!config.localDirectoryName) {
        config.localDirectoryName = String(selectedHandle.name || '').trim();
      }
    }
    config.path = (config.path || '').trim()
      || (config.localDirectoryName ? config.localDirectoryName : MANAGER_CONFIG.defaultLocalManifestPath);
  }

  if (providerId === 's3') {
    return {
      endpoint: (config.endpoint || '').trim(),
      bucket: (config.bucket || '').trim(),
      region: (config.region || '').trim(),
      basePath: (config.basePath || '').trim(),
      accessKey: (config.accessKey || '').trim(),
      secretKey: config.secretKey || '',
    };
  }

  if (providerId === 'example') {
    config.path = MANAGER_CONFIG.defaultLocalManifestPath;
  }
  return config;
}

export function sourceDisplayLabelFor(app, providerId, config, fallbackLabel) {
  if (providerId === 'github') {
    const repo = (config.repo || '').trim();
    return repo || 'GitHub';
  }

  if (providerId === 'example') {
    return 'Built-in examples';
  }

  if (providerId === 's3') {
    const bucket = (config.bucket || '').trim();
    return bucket || 'S3-compatible storage';
  }

  if (providerId === 'local') {
    return (config.localDirectoryName || '').trim() || app.hostNameFromPath(config.path, 'Folder on this device');
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

  if (providerId === 'example') {
    return MANAGER_CONFIG.defaultLocalManifestPath;
  }

  if (providerId === 's3') {
    const endpoint = (config.endpoint || '').trim();
    const bucket = (config.bucket || '').trim();
    const region = (config.region || '').trim();
    const basePath = (config.basePath || '').trim();
    const base = endpoint || 'S3 endpoint';
    const bucketPart = bucket ? `/${bucket}` : '';
    const prefixPart = basePath ? `/${basePath.replace(/^\/+/, '')}` : '';
    const regionPart = region ? ` (${region})` : '';
    return `${base}${bucketPart}${prefixPart}${regionPart}`;
  }

  if (providerId === 'local') {
    const folderName = (config.localDirectoryName || '').trim();
    if (folderName) {
      return `${folderName} (folder root)`;
    }
    return (config.path || '').trim() || 'Folder on this device';
  }

  return fallbackLabel || 'Source';
}

export function sanitizeSourceConfig(app, providerId, config = {}) {
  void app;
  if (providerId === 'github') {
    // NOTE: keep credentials/session secrets out of persisted workspace state.
    // TODO(desktop-secure-storage): move token persistence to OS-backed secure storage when available.
    return {
      owner: (config.owner || '').trim(),
      repo: (config.repo || '').trim(),
      branch: (config.branch || 'main').trim() || 'main',
      path: (config.path || '').trim(),
    };
  }

  if (providerId === 's3') {
    // NOTE: keep object storage credentials out of persisted workspace state.
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
    const localDirectoryPath = (config.localDirectoryPath || serializedHandle?.path || '').trim();
    return {
      path: (config.path || '').trim() || MANAGER_CONFIG.defaultLocalManifestPath,
      localDirectoryName: (config.localDirectoryName || '').trim(),
      ...(serializedHandle ? { localDirectoryHandle: serializedHandle } : {}),
      ...(localDirectoryPath ? { localDirectoryPath } : {}),
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
    lastPublishResult: source.lastPublishResult || null,
  };
}

export async function connectCurrentProvider(app, options = {}) { /* delegated from app.js */
  const providerId = options.providerId || app.state.selectedProviderId;
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
    app.setStatus('Select a local folder before adding this connection.', 'warn');
    return;
  }

  const provider = providerFactory();

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
    if (providerId === 'local' && result.sourceDisplayLabel) {
      derivedConfig.localDirectoryName = result.sourceDisplayLabel;
    }
    const displayLabel =
      result.sourceDisplayLabel ||
      app.sourceDisplayLabelFor(providerId, derivedConfig, selectedProvider?.label || providerId);
    const detailLabel =
      result.sourceDetailLabel ||
      app.sourceDetailLabelFor(providerId, derivedConfig, selectedProvider?.label || providerId);
    const pendingRepair = app.pendingSourceRepair || null;
    const repairingSource = pendingRepair?.sourceId ? app.getSourceById(pendingRepair.sourceId) : null;
    const draftSource = {
      id: repairingSource?.id || makeSourceId(providerId),
      providerId,
      providerLabel: selectedProvider?.label || providerId,
      label: detailLabel,
      displayLabel,
      detailLabel,
      config: { ...config },
      capabilities: provider.getCapabilities(),
      status: result.message,
      authMode:
        providerId === 'github'
          ? (config.token || '').trim()
            ? 'token'
            : 'public'
          : providerId === 'local' && config.localDirectoryHandle
            ? 'local-folder'
            : providerId === 's3'
              ? 'access-key'
              : providerId === 'example'
                ? 'example'
                : 'public',
      itemCount: loaded.length,
      provider,
      needsReconnect: false,
      needsCredentials: false,
      collections: repairingSource?.collections || [],
      selectedCollectionId: repairingSource?.selectedCollectionId || null,
      lastPublishResult: repairingSource?.lastPublishResult || null,
    };

    const existingWithSameIdentity = !repairingSource
      ? app.state.sources.find((entry) => app.sourceIdentityKey(entry) === app.sourceIdentityKey(draftSource))
      : null;
    const targetSource = existingWithSameIdentity || repairingSource;
    const source = {
      ...draftSource,
      id: targetSource?.id || draftSource.id,
      collections: targetSource?.collections || draftSource.collections,
      selectedCollectionId: targetSource?.selectedCollectionId || draftSource.selectedCollectionId,
      lastPublishResult: targetSource?.lastPublishResult || draftSource.lastPublishResult,
    };

    if (providerId === 'github' || providerId === 's3') {
      try {
        logCredentialTrace('store:start', {
          sourceId: source.id,
          providerId,
          summary: summarizeCredentialConfig(providerId, config),
        });
        await app.credentialStore.storeSourceSecret(source, config);
        logCredentialTrace('store:ok', {
          sourceId: source.id,
          providerId,
        });
      } catch (error) {
        logCredentialTrace('store:error', {
          sourceId: source.id,
          providerId,
          error: error?.message || String(error),
        });
        app.setStatus(`Connected, but secure credential storage failed: ${error.message}`, 'warn');
      }
    }

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
    const preferredCollectionId =
      (targetSource?.selectedCollectionId && collections.some((entry) => entry.id === targetSource.selectedCollectionId))
        ? targetSource.selectedCollectionId
        : defaultCollectionId;
    source.selectedCollectionId = preferredCollectionId;
    if (providerId === 'local' && config.localDirectoryHandle) {
      app.selectedLocalDirectoryHandle = config.localDirectoryHandle;
    }
    if (targetSource) {
      app.state.sources = app.sortSourcesForDisplay(
        app.state.sources.map((entry) => (entry.id === targetSource.id ? source : entry)),
      );
      app.mergeSourceAssets(targetSource.id, normalizedWithCollections);
    } else {
      app.state.sources = app.sortSourcesForDisplay([...app.state.sources, source]);
      app.state.assets = [...app.state.assets, ...normalizedWithCollections];
    }
    if (providerId === 'local') {
      await app.hydrateLocalSourceAssetPreviews(source.id);
    }
    if (options.activateSource !== false) {
      app.state.activeSourceFilter = source.id;
      app.state.selectedCollectionId = source.selectedCollectionId || 'all';
      app.state.currentLevel = 'collections';
      app.state.openedCollectionId = null;
      app.state.selectedItemId = null;
      app.state.selectedItemIds = [];
      app.syncMetadataModeFromState();
      app.closeMobileEditor();
    }
    app.state.manifest = null;
    app.dom.manifestPreview.textContent = '{}';

    app.setStatus(
      targetSource
        ? `Reconnected storage source ${displayLabel} (${loaded.length} items).`
        : `Added storage source ${displayLabel} (${loaded.length} items).`,
      'ok',
    );
    app.setWorkingStateFlags({ publishError: '' });
    app.renderSourcesList();
    app.renderSourceFilter();
    app.renderAssets();
    app.renderEditor();
    app.saveSourcesToStorage();
    app.clearPendingSourceRepair();
    app.renderSourcePicker();
    app.showConnectionsListView();
    if (options.openConnectionsDialog !== false && options.openSourcePicker !== false) {
      app.openDialog(app.dom.connectionsDialog);
    }
  } catch (error) {
    app.clearPendingSourceRepair();
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
  if (source.providerId === 's3') {
    nextConfigValues.s3Endpoint = source.config.endpoint || '';
    nextConfigValues.s3Bucket = source.config.bucket || '';
    nextConfigValues.s3Region = source.config.region || '';
    nextConfigValues.s3BasePath = source.config.basePath || '';
    nextConfigValues.s3AccessKey = source.config.accessKey || '';
    nextConfigValues.s3SecretKey = source.config.secretKey || '';
  }
  if (source.providerId === 'example') {
    nextConfigValues.localPathInput = MANAGER_CONFIG.defaultLocalManifestPath;
    nextConfigValues.localFolderName = '';
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

export async function refreshSource(app, sourceId, options = {}) {
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
    let refreshConfig = { ...(source.config || {}), ...(options.configOverrides || {}) };
    if (source.providerId === 'github' && !(refreshConfig.token || '').trim()) {
      logCredentialTrace('refresh:load-secret:start', {
        sourceId,
        providerId: source.providerId,
        summary: summarizeCredentialConfig(source.providerId, refreshConfig),
      });
      refreshConfig = await app.credentialStore.loadSourceSecret(source, refreshConfig);
      logCredentialTrace('refresh:load-secret:done', {
        sourceId,
        providerId: source.providerId,
        summary: summarizeCredentialConfig(source.providerId, refreshConfig),
      });
    }
    if (source.providerId === 's3' && (!(refreshConfig.accessKey || '').trim() || !(refreshConfig.secretKey || '').trim())) {
      logCredentialTrace('refresh:load-secret:start', {
        sourceId,
        providerId: source.providerId,
        summary: summarizeCredentialConfig(source.providerId, refreshConfig),
      });
      refreshConfig = await app.credentialStore.loadSourceSecret(source, refreshConfig);
      logCredentialTrace('refresh:load-secret:done', {
        sourceId,
        providerId: source.providerId,
        summary: summarizeCredentialConfig(source.providerId, refreshConfig),
      });
    }
    if (source.providerId === 'local') {
      const explicitHandle = options.configOverrides?.localDirectoryHandle;
      const repairHandle =
        app.pendingSourceRepair?.sourceId === sourceId && app.pendingSourceRepair?.mode === 'folder'
          ? app.selectedLocalDirectoryHandle
          : null;
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
      const next = {
        ...source,
        status: result.message,
        needsReconnect: true,
        needsCredentials: Boolean(result.capabilities?.requiresCredentials) && !Boolean(result.capabilities?.hasCredentials),
      };
      app.state.sources = app.sortSourcesForDisplay(
        app.state.sources.map((entry) => (entry.id === sourceId ? next : entry)),
      );
      app.renderSourcesList();
      app.saveSourcesToStorage();
      app.setConnectionStatus(result.message, false);
      app.setStatus(`Refresh failed: ${result.message}`, 'warn');
      app.refreshWorkingStatus();
      return;
    }

    const loaded = await provider.listAssets();
    const refreshedConfig = { ...refreshConfig };
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
      authMode: source.providerId === 's3' ? 'access-key' : source.authMode,
      displayLabel,
      detailLabel,
      label: detailLabel,
      config: refreshConfig,
      collections: source.collections || [],
      selectedCollectionId: source.selectedCollectionId || null,
      needsReconnect: false,
      needsCredentials: false,
      lastPublishResult: source.lastPublishResult || null,
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

    app.state.sources = app.sortSourcesForDisplay(
      app.state.sources.map((entry) => (entry.id === sourceId ? updatedSource : entry)),
    );
    if (source.providerId === 'local' && refreshedConfig.localDirectoryHandle?.kind === 'directory') {
      app.selectedLocalDirectoryHandle = refreshedConfig.localDirectoryHandle;
    }
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
    app.clearPendingSourceRepair();
  } catch (error) {
    const next = {
      ...source,
      status: `Refresh error: ${error.message}`,
      needsReconnect: true,
      needsCredentials: Boolean(source.capabilities?.requiresCredentials) && !Boolean(source.capabilities?.hasCredentials),
    };
    app.state.sources = app.sortSourcesForDisplay(
      app.state.sources.map((entry) => (entry.id === sourceId ? next : entry)),
    );
    app.renderSourcesList();
    app.saveSourcesToStorage();
    app.setConnectionStatus(`Refresh error: ${error.message}`, false);
    app.setStatus(`Refresh error: ${error.message}`, 'warn');
    app.refreshWorkingStatus();
    app.clearPendingSourceRepair();
  }
}

export function removeSource(app, sourceId) {
  const source = app.getSourceById(sourceId);
  if (!source) {
    return;
  }

  if (app.pendingSourceRepair?.sourceId === sourceId) {
    app.clearPendingSourceRepair();
  }
  app.credentialStore.deleteSourceSecret(source).catch(() => {});
  app.state.sources = app.sortSourcesForDisplay(app.state.sources.filter((entry) => entry.id !== sourceId));
  app.state.assets = app.state.assets.filter((entry) => entry.sourceId !== sourceId);
  if (app.state.sources.length === 0) {
    app.closeMobileEditor();
  }

  if (app.state.selectedItemId && !app.state.assets.some((item) => item.workspaceId === app.state.selectedItemId)) {
    app.state.selectedItemId = null;
  }
  app.state.selectedItemIds = app.getSelectedItemIds().filter((workspaceId) =>
    app.state.assets.some((item) => item.workspaceId === workspaceId),
  );
  if (app.state.viewerItemId && !app.state.assets.some((item) => item.workspaceId === app.state.viewerItemId)) {
    app.closeViewer();
  }
  app.syncMetadataModeFromState();

  if (app.state.sources.length === 0) {
    app.setConnectionStatus('No connections yet.', 'neutral');
    app.setStatus('No connections yet.', 'neutral');
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
