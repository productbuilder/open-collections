export function getVisibleAssets(app) {
  let visible = app.state.assets;
  if (app.state.activeSourceFilter !== 'all') {
    visible = visible.filter((item) => item.sourceId === app.state.activeSourceFilter);
  }
  if (app.state.selectedCollectionId !== 'all') {
    visible = visible.filter((item) => item.collectionId === app.state.selectedCollectionId);
  }
  return visible;
}

export function getSelectedItemIds(app) {
  return Array.isArray(app.state.selectedItemIds) ? app.state.selectedItemIds : [];
}

export function repairSelectionState(app) {
  const existingIds = new Set(app.state.assets.map((item) => item.workspaceId));
  let allowedIds = existingIds;
  if (app.state.currentLevel === 'items' && app.state.openedCollectionId) {
    allowedIds = new Set(
      app.state.assets
        .filter((item) => item.collectionId === app.state.openedCollectionId)
        .map((item) => item.workspaceId),
    );
  }

  app.state.selectedItemIds = getSelectedItemIds(app).filter(
    (workspaceId) => existingIds.has(workspaceId) && allowedIds.has(workspaceId),
  );
  return app.state.selectedItemIds;
}

export function isItemSelected(app, itemId) {
  return getSelectedItemIds(app).includes(itemId);
}

export function toggleItemSelection(app, itemId, selected = null) {
  if (!itemId) {
    return getSelectedItemIds(app);
  }
  const current = new Set(repairSelectionState(app));
  const shouldSelect = selected == null ? !current.has(itemId) : Boolean(selected);
  if (shouldSelect) {
    current.add(itemId);
  } else {
    current.delete(itemId);
  }
  app.state.selectedItemIds = [...current];
  app.renderAssets();
  app.renderEditor();
  if (app.state.opfsAvailable) {
    app.persistWorkspaceToOpfs().catch(() => {});
  }
  return app.state.selectedItemIds;
}

export function clearItemSelection(app) {
  app.state.selectedItemIds = [];
  app.renderAssets();
  app.renderEditor();
  if (app.state.opfsAvailable) {
    app.persistWorkspaceToOpfs().catch(() => {});
  }
}

export function openViewer(app, itemId) {
  const item = app.state.assets.find((entry) => entry.workspaceId === itemId);
  if (!item) {
    return;
  }

  app.state.viewerItemId = itemId;
  if (app.state.selectedItemId !== itemId) {
    app.state.selectedItemId = itemId;
    app.syncMetadataModeFromState();
    app.renderAssets();
    app.renderEditor();
    if (app.isMobileViewport()) {
      app.openMobileEditor();
    }
  }

  app.renderViewer();
  app.dom.assetViewer?.open();
}

export function closeViewer(app) {
  app.state.viewerItemId = null;
  app.dom.assetViewer?.clear();
  app.dom.assetViewer?.close();
}

export function renderViewer(app) {
  const item = app.state.assets.find((entry) => entry.workspaceId === app.state.viewerItemId);
  if (!item) {
    app.closeViewer();
    return;
  }
  app.dom.assetViewer?.setItem(app.resolveItemForDisplay(item), (entry) => app.formatSourceBadge(entry));
}

export function renderAssets(app) {
  repairSelectionState(app);
  app.renderSourceContext();

  const activeLevel = app.state.currentLevel === 'items' ? 'items' : 'collections';
  const activeViewMode = app.state.browserViewModes?.[activeLevel] || 'cards';
  app.applyInspectorModeForViewMode(activeViewMode);

  if (app.state.currentLevel === 'collections') {
    let collections = [];
    if (app.state.activeSourceFilter !== 'all') {
      const src = app.getSourceById(app.state.activeSourceFilter);
      collections = src?.collections || [];
    } else {
      collections = app.state.localDraftCollections;
    }

    app.dom.collectionBrowser.update({
      currentLevel: 'collections',
      viewportTitle: 'Collections',
      assetCountText: `${collections.length} collections`,
      collections,
      items: [],
      selectedCollectionId: app.state.selectedCollectionId,
      focusedItemId: null,
      selectedItemIds: [],
      viewModes: app.state.browserViewModes,
    });
    return;
  }

  const visibleAssets = app.getVisibleAssets()
    .filter((item) => item.collectionId === app.state.openedCollectionId)
    .map((item) => app.resolveItemForDisplay(item));
  const collection = app.findSelectedCollectionMeta();
  app.dom.collectionBrowser.update({
    currentLevel: 'items',
    viewportTitle: collection?.title || app.state.openedCollectionId || 'Collection',
    assetCountText: `${visibleAssets.length} items`,
    collections: [],
    items: visibleAssets,
    selectedCollectionId: app.state.selectedCollectionId,
    focusedItemId: app.state.selectedItemId,
    selectedItemIds: app.state.selectedItemIds,
    viewModes: app.state.browserViewModes,
  });
}

export function selectItem(app, itemId) {
  if (app.state.selectedItemId === itemId) {
    if (app.isMobileViewport()) {
      app.openMobileEditor();
    }
    return;
  }

  app.state.selectedItemId = itemId;
  app.syncMetadataModeFromState();
  app.renderAssets();
  app.renderEditor();
  if (app.isMobileViewport()) {
    app.openMobileEditor();
  }
  if (app.state.opfsAvailable) {
    app.persistWorkspaceToOpfs().catch(() => {});
  }
}

export function findSelectedItem(app) {
  return app.state.assets.find((item) => item.workspaceId === app.state.selectedItemId) || null;
}

export function resolveMetadataMode(app) {
  repairSelectionState(app);
  if (app.state.currentLevel === 'collections') {
    app.state.selectedItemId = null;
    const selectedCollection = app.findSelectedCollectionMeta();
    return selectedCollection ? 'collection' : 'none';
  }

  if (app.state.currentLevel === 'items') {
    if (!app.state.openedCollectionId) {
      app.state.selectedItemId = null;
      return 'none';
    }
    const visibleItems = app.getVisibleAssets().filter((item) => item.collectionId === app.state.openedCollectionId);
    const hasSelectedItem = visibleItems.some((item) => item.workspaceId === app.state.selectedItemId);
    if (!hasSelectedItem) {
      app.state.selectedItemId = null;
    }
    return hasSelectedItem ? 'item' : 'none';
  }

  app.state.selectedItemId = null;
  return 'none';
}

export function syncMetadataModeFromState(app) {
  const mode = app.resolveMetadataMode();
  app.state.metadataMode = mode;
  return mode;
}

export function renderMetadataMode(app, mode) {
  app.state.metadataMode = mode;
  app.renderEditor();
}

export function setBrowserViewMode(app, level, mode) {
  const normalizedLevel = level === 'items' ? 'items' : 'collections';
  const normalizedMode = mode === 'rows' ? 'rows' : 'cards';
  app.state.browserViewModes = {
    ...app.state.browserViewModes,
    [normalizedLevel]: normalizedMode,
  };
  const activeLevel = app.state.currentLevel === 'items' ? 'items' : 'collections';
  if (normalizedLevel === activeLevel) {
    app.applyInspectorModeForViewMode(normalizedMode);
  }
}

export function renderEditor(app) {
  const metadataMode = app.syncMetadataModeFromState();
  if (metadataMode === 'collection') {
    app.dom.metadataEditor.setView({
      mode: 'collection',
      collection: app.findSelectedCollectionMeta(),
    });
    app.syncEditorVisibility();
    return;
  }

  if (metadataMode === 'item') {
    const selected = app.findSelectedItem();
    const selectedSource = selected ? app.getSourceById(selected.sourceId) : null;
    const canSave = Boolean(selectedSource?.capabilities?.canSaveMetadata);
    app.dom.metadataEditor.setView({
      mode: 'item',
      item: selected ? app.deriveItemEditorState(selected) : null,
      canSaveItem: canSave,
      canDeleteItem: Boolean(selected),
    });
    app.syncEditorVisibility();
    return;
  }

  app.dom.metadataEditor.setView({ mode: 'none' });
  app.syncEditorVisibility();
}
