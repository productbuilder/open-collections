import { MANAGER_CONFIG } from '../config.js';

export function activeCollectionRootPath(app) {
  const collectionId = (app.state.selectedCollectionId || '').trim();
  if (!collectionId || collectionId === 'all') {
    return '';
  }
  const activeSource = app.state.activeSourceFilter !== 'all' ? app.getSourceById(app.state.activeSourceFilter) : null;
  if (activeSource) {
    const sourceCollection = (activeSource.collections || []).find((entry) => entry.id === collectionId);
    if (sourceCollection?.rootPath) {
      return app.normalizeCollectionRootPath(sourceCollection.rootPath, collectionId);
    }
  }
  const localCollection = app.state.localDraftCollections.find((entry) => entry.id === collectionId);
  if (localCollection?.rootPath) {
    return app.normalizeCollectionRootPath(localCollection.rootPath, collectionId);
  }
  return app.normalizeCollectionRootPath(`${collectionId}/`, collectionId);
}

export function renderWorkspaceContext(app) {
  const source =
    app.state.activeSourceFilter !== 'all'
      ? app.getSourceById(app.state.activeSourceFilter)
      : null;
  const sourceLabel = source?.displayLabel || source?.label || 'none';
  const collectionId = app.state.selectedCollectionId && app.state.selectedCollectionId !== 'all'
    ? app.state.selectedCollectionId
    : 'none';
  const rootPath = collectionId !== 'none' ? app.activeCollectionRootPath() : 'n/a';
  app.dom.managerHeader?.setWorkspaceContext(`Host: ${sourceLabel} | Collection: ${collectionId} | Root: ${rootPath}`);
}

export function openNewCollectionDialog(app) {
  app.dom.newCollectionTitle.value = '';
  app.dom.newCollectionSlug.value = '';
  app.dom.newCollectionDescription.value = '';
  app.dom.newCollectionLicense.value = '';
  app.dom.newCollectionPublisher.value = '';
  app.dom.newCollectionLanguage.value = '';
  app.openDialog(app.dom.newCollectionDialog);
}

export function setCollectionMetaFields(app, meta = {}) {
  app.dom.collectionId.value = meta.id || app.dom.collectionId.value;
  app.dom.collectionTitle.value = meta.title || app.dom.collectionTitle.value;
  app.dom.collectionDescription.value = meta.description || '';
  app.dom.collectionLicense.value = meta.license || '';
  app.dom.collectionPublisher.value = meta.publisher || '';
  app.dom.collectionLanguage.value = meta.language || '';
}

export function ensureCollectionForSource(app, source) {
  const preferred = (app.state.selectedCollectionId || '').trim();
  const existing = source.collections || [];
  if (source.providerId === 'local') {
    if (preferred && preferred !== 'all' && existing.some((entry) => entry.id === preferred)) {
      source.selectedCollectionId = preferred;
      return preferred;
    }
    if (source.selectedCollectionId && existing.some((entry) => entry.id === source.selectedCollectionId)) {
      return source.selectedCollectionId;
    }
    const firstLocal = existing[0]?.id || '';
    if (firstLocal) {
      source.selectedCollectionId = firstLocal;
    }
    return firstLocal;
  }

  if (preferred && preferred !== 'all') {
    if (!existing.some((entry) => entry.id === preferred)) {
      const localEntry = app.state.localDraftCollections.find((entry) => entry.id === preferred);
      source.collections = [
        ...existing,
        {
          id: preferred,
          title: localEntry?.title || preferred,
          rootPath: app.normalizeCollectionRootPath(localEntry?.rootPath || `${preferred}/`, preferred),
        },
      ];
    }
    source.selectedCollectionId = preferred;
    return preferred;
  }

  if (source.selectedCollectionId && existing.some((entry) => entry.id === source.selectedCollectionId)) {
    return source.selectedCollectionId;
  }

  const first = existing[0]?.id;
  if (first) {
    source.selectedCollectionId = first;
    return first;
  }

  const fallback = `${source.id}::default-collection`;
  source.collections = [{ id: fallback, title: source.displayLabel || source.label || 'Default collection' }];
  source.selectedCollectionId = fallback;
  return fallback;
}

export function collectionLabelFor(source, collectionId) {
  const found = (source.collections || []).find((entry) => entry.id === collectionId);
  return found?.title || collectionId;
}

export function refreshSourceCollectionsAndCounts(app, sourceId) {
  const source = app.getSourceById(sourceId);
  if (!source) {
    return;
  }
  const sourceAssets = app.state.assets.filter((item) => item.sourceId === sourceId);
  const nextCollections = app.buildCollectionsForSource(source, sourceAssets);
  source.collections = nextCollections.map((collection) => {
    const existing = (source.collections || []).find((entry) => entry.id === collection.id);
    return existing ? { ...existing, ...collection } : collection;
  });
  source.itemCount = sourceAssets.length;
  if (!source.collections.some((entry) => entry.id === source.selectedCollectionId)) {
    source.selectedCollectionId = source.collections[0]?.id || null;
  }
}

export function renderCollectionFilter(app) {
  const previous = app.state.selectedCollectionId || 'all';
  const options = [{ value: 'all', label: 'All collections' }];

  let collections = [];
  if (app.state.activeSourceFilter !== 'all') {
    const activeSource = app.getSourceById(app.state.activeSourceFilter);
    collections = activeSource?.collections || [];
    if (previous !== 'all' && !collections.some((entry) => entry.id === previous)) {
      const localEntry = app.state.localDraftCollections.find((entry) => entry.id === previous);
      if (localEntry) {
        collections = [...collections, localEntry];
      }
    }
  } else if (app.state.localDraftCollections.length > 0) {
    collections = app.state.localDraftCollections;
  }

  for (const collection of collections) {
    options.push({ value: collection.id, label: collection.title || collection.id });
  }

  const stillExists = previous === 'all' || collections.some((entry) => entry.id === previous);
  app.state.selectedCollectionId = stillExists ? previous : 'all';
  app.dom.collectionBrowser.setCollectionOptions(options, app.state.selectedCollectionId);
  app.renderWorkspaceContext();
  app.renderSourceContext();
}

export function findSelectedCollectionMeta(app) {
  const id = app.state.selectedCollectionId;
  if (!id || id === 'all') {
    return null;
  }
  if (app.state.activeSourceFilter !== 'all') {
    const source = app.getSourceById(app.state.activeSourceFilter);
    const found = source?.collections?.find((entry) => entry.id === id);
    if (found) return found;
  }
  return app.state.localDraftCollections.find((entry) => entry.id === id) || null;
}

export function currentCollectionMeta(app) {
  const collectionId = app.dom.collectionId.value.trim() || MANAGER_CONFIG.defaultCollectionMeta.id;
  return {
    id: collectionId,
    title: app.dom.collectionTitle.value.trim() || MANAGER_CONFIG.defaultCollectionMeta.title,
    description:
      app.dom.collectionDescription.value.trim() || MANAGER_CONFIG.defaultCollectionMeta.description,
    license: app.dom.collectionLicense.value.trim(),
    publisher: app.dom.collectionPublisher.value.trim(),
    language: app.dom.collectionLanguage.value.trim(),
    rootPath: app.activeCollectionRootPath() || app.normalizeCollectionRootPath(`${collectionId}/`, collectionId),
  };
}
