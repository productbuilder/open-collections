import { MANAGER_CONFIG } from '../config.js';

export function cacheDomElements(root) {
  return {
    managerHeader: root.getElementById('managerHeader'),
    paneLayout: root.getElementById('paneLayout'),
    collectionBrowser: root.getElementById('collectionBrowser'),
    metadataEditor: root.getElementById('metadataEditor'),
    sourceManager: root.getElementById('sourceManager'),
    assetViewer: root.getElementById('assetViewer'),
    connectionsDialog: root.getElementById('connectionsDialog'),
    sourcePickerList: root.getElementById('sourcePickerList'),
    publishDialog: root.getElementById('publishDialog'),
    newCollectionDialog: root.getElementById('newCollectionDialog'),
    registerDialog: root.getElementById('registerDialog'),
    headerMenuDialog: root.getElementById('headerMenuDialog'),
    connectionsDialogTitle: root.getElementById('connectionsDialogTitle'),
    connectionsBackBtn: root.getElementById('connectionsBackBtn'),
    addConnectionView: root.getElementById('addConnectionView'),
    openRegisterFromMenuBtn: root.getElementById('openRegisterFromMenuBtn'),
    storageOptionsDialog: root.getElementById('storageOptionsDialog'),
    collectionId: root.getElementById('collectionId'),
    collectionTitle: root.getElementById('collectionTitle'),
    collectionDescription: root.getElementById('collectionDescription'),
    collectionLicense: root.getElementById('collectionLicense'),
    collectionPublisher: root.getElementById('collectionPublisher'),
    collectionLanguage: root.getElementById('collectionLanguage'),
    newCollectionTitle: root.getElementById('newCollectionTitle'),
    newCollectionSlug: root.getElementById('newCollectionSlug'),
    newCollectionDescription: root.getElementById('newCollectionDescription'),
    newCollectionLicense: root.getElementById('newCollectionLicense'),
    newCollectionPublisher: root.getElementById('newCollectionPublisher'),
    newCollectionLanguage: root.getElementById('newCollectionLanguage'),
    createCollectionBtn: root.getElementById('createCollectionBtn'),
    generateManifestBtn: root.getElementById('generateManifestBtn'),
    publishToSourceBtn: root.getElementById('publishToSourceBtn'),
    copyManifestBtn: root.getElementById('copyManifestBtn'),
    downloadManifestBtn: root.getElementById('downloadManifestBtn'),
    saveLocalDraftBtn: root.getElementById('saveLocalDraftBtn'),
    restoreLocalDraftBtn: root.getElementById('restoreLocalDraftBtn'),
    discardLocalDraftBtn: root.getElementById('discardLocalDraftBtn'),
    localDraftStatus: root.getElementById('localDraftStatus'),
    manifestPreview: root.getElementById('manifestPreview'),
  };
}

export function initializeDomDefaults(app) {
  app.dom.sourceManager?.setConfigValues({
    localPathInput: MANAGER_CONFIG.defaultLocalManifestPath,
    localFolderName: '',
    githubBranch: 'main',
  });
  app.dom.collectionId.value = MANAGER_CONFIG.defaultCollectionMeta.id;
  app.dom.collectionTitle.value = MANAGER_CONFIG.defaultCollectionMeta.title;
  app.dom.collectionDescription.value = MANAGER_CONFIG.defaultCollectionMeta.description;
  app.dom.collectionLicense.value = '';
  app.dom.collectionPublisher.value = '';
  app.dom.collectionLanguage.value = '';
  app.dom.manifestPreview.textContent = '{}';
}

export function bindDomEvents(app) {
  if (app._eventsBound) {
    return;
  }

  app._eventsBound = true;

  app.dom.managerHeader.addEventListener('open-host-menu', () => {
    app.openConnectionsDialog();
  });
  app.dom.managerHeader.addEventListener('open-header-menu', () => app.openDialog(app.dom.headerMenuDialog));
  app.dom.sourceManager.addEventListener('open-storage-options', () => app.openDialog(app.dom.storageOptionsDialog));
  app.dom.sourceManager.addEventListener('select-provider', (event) => {
    const providerId = event.detail?.providerId || '';
    if (providerId) {
      app.setSelectedProvider(providerId);
    }
  });
  app.dom.sourceManager.addEventListener('connect-provider', async () => {
    await app.connectCurrentProvider();
  });
  app.dom.sourceManager.addEventListener('add-example-host', async () => {
    app.clearPendingSourceRepair();
    app.setSelectedProvider('example');
    await app.connectCurrentProvider();
  });
  app.dom.sourceManager.addEventListener('add-local-folder-host', async () => {
    app.clearPendingSourceRepair();
    app.setSelectedProvider('local');
    const didPick = await app.pickLocalFolder();
    if (didPick) {
      await app.connectCurrentProvider();
    }
  });
  app.dom.sourceManager.addEventListener('refresh-source', async (event) => {
    const sourceId = event.detail?.sourceId || '';
    if (sourceId) {
      await app.refreshSource(sourceId);
    }
  });
  app.dom.sourceManager.addEventListener('inspect-source', (event) => {
    const sourceId = event.detail?.sourceId || '';
    if (sourceId) {
      app.inspectSource(sourceId);
    }
  });
  app.dom.sourceManager.addEventListener('repair-source-credentials', (event) => {
    const sourceId = event.detail?.sourceId || '';
    if (!sourceId) {
      return;
    }
    app.openCredentialRepairDialog(sourceId);
  });
  app.dom.sourceManager.addEventListener('repair-source-folder', async (event) => {
    const sourceId = event.detail?.sourceId || '';
    if (!sourceId) {
      return;
    }
    app.prepareSourceRepair(sourceId, 'folder');
    const didPick = await app.pickLocalFolder();
    if (didPick) {
      await app.refreshSource(sourceId, { configOverrides: { localDirectoryHandle: app.selectedLocalDirectoryHandle } });
    }
  });
  app.dom.sourceManager.addEventListener('repair-source-reconnect', async (event) => {
    const sourceId = event.detail?.sourceId || '';
    if (!sourceId) {
      return;
    }
    app.prepareSourceRepair(sourceId, 'reconnect');
    await app.refreshSource(sourceId);
  });
  app.dom.sourceManager.addEventListener('remove-source', (event) => {
    const sourceId = event.detail?.sourceId || '';
    if (sourceId) {
      app.removeSource(sourceId);
    }
  });
  app.dom.sourceManager.addEventListener('show-only-source', (event) => {
    const sourceId = event.detail?.sourceId || '';
    if (!sourceId) {
      return;
    }
    app.state.activeSourceFilter = sourceId;
    app.renderSourceFilter();
    const visible = app.getVisibleAssets();
    app.state.selectedItemId = visible[0]?.workspaceId || null;
    app.state.selectedItemIds = [];
    app.renderAssets();
    app.renderEditor();
    app.renderSourceContext();
    app.refreshWorkingStatus();
  });
  app.dom.sourceManager.addEventListener('pick-local-folder', async () => {
    await app.pickLocalFolder();
  });
  app.dom.connectionsBackBtn?.addEventListener('click', () => {
    app.showConnectionsListView();
  });
  app.dom.openRegisterFromMenuBtn.addEventListener('click', () => {
    app.closeDialog(app.dom.headerMenuDialog);
    app.openDialog(app.dom.registerDialog);
  });
  app.dom.collectionBrowser.addEventListener('back-to-collections', () => {
    app.leaveCollectionView();
    app.refreshWorkingStatus();
  });
  app.dom.metadataEditor.addEventListener('close-editor', () => app.closeMobileEditor());
  app.dom.assetViewer.addEventListener('close-viewer', () => {
    app.state.viewerItemId = null;
  });
  app.dom.collectionBrowser.addEventListener('source-filter-change', (event) => {
    app.state.activeSourceFilter = event.detail?.value || 'all';
    app.state.selectedCollectionId = 'all';
    app.state.currentLevel = 'collections';
    app.state.openedCollectionId = null;
    app.state.selectedItemId = null;
    app.state.selectedItemIds = [];
    app.renderCollectionFilter();
    app.syncMetadataModeFromState();
    app.closeMobileEditor();
    app.renderSourceContext();
    app.renderAssets();
    app.renderEditor();
    app.refreshWorkingStatus();
    if (app.state.opfsAvailable) {
      app.persistWorkspaceToOpfs().catch(() => {});
    }
  });
  app.dom.collectionBrowser.addEventListener('collection-filter-change', (event) => {
    app.state.selectedCollectionId = event.detail?.value || 'all';
    if (app.state.currentLevel === 'items') {
      if (app.state.selectedCollectionId === 'all') {
        app.state.currentLevel = 'collections';
        app.state.openedCollectionId = null;
        app.state.selectedItemId = null;
        app.state.selectedItemIds = [];
        app.closeMobileEditor();
      } else if (app.state.openedCollectionId !== app.state.selectedCollectionId) {
        app.state.openedCollectionId = app.state.selectedCollectionId;
        app.state.selectedItemId = null;
        app.state.selectedItemIds = [];
      }
    }
    app.syncMetadataModeFromState();
    app.renderAssets();
    app.renderEditor();
    app.refreshWorkingStatus();
    if (app.state.opfsAvailable) {
      app.persistWorkspaceToOpfs().catch(() => {});
    }
  });
  app.dom.collectionBrowser.addEventListener('collection-select', (event) => {
    app.state.selectedCollectionId = event.detail?.collectionId || 'all';
    app.state.currentLevel = 'collections';
    app.state.openedCollectionId = null;
    app.state.selectedItemId = null;
    app.state.selectedItemIds = [];
    app.syncMetadataModeFromState();
    app.renderAssets();
    app.renderEditor();
    app.refreshWorkingStatus();
    if (app.isMobileViewport()) {
      app.openMobileEditor();
    }
  });
  app.dom.collectionBrowser.addEventListener('collection-open', (event) => {
    app.openCollectionView(event.detail?.collectionId || '');
    app.refreshWorkingStatus();
  });
  app.dom.collectionBrowser.addEventListener('item-select', (event) => {
    app.selectItem(event.detail?.workspaceId || '');
  });
  app.dom.collectionBrowser.addEventListener('item-toggle-selected', (event) => {
    app.toggleItemSelection(event.detail?.workspaceId || '', event.detail?.selected);
  });
  app.dom.collectionBrowser.addEventListener('clear-item-selection', () => {
    app.clearItemSelection();
  });
  app.dom.collectionBrowser.addEventListener('delete-selected-items', async () => {
    await app.deleteSelectedItems();
  });
  app.dom.collectionBrowser.addEventListener('item-view', (event) => {
    app.openViewer(event.detail?.workspaceId || '');
  });
  app.dom.collectionBrowser.addEventListener('view-mode-change', (event) => {
    app.setBrowserViewMode(event.detail?.level || 'collections', event.detail?.mode || 'cards');
  });
  app.dom.collectionBrowser.addEventListener('add-collection', () => {
    app.openNewCollectionDialog();
  });
  app.dom.collectionBrowser.addEventListener('publish-collection', async () => {
    await app.publishActiveSourceDraft();
  });
  app.dom.collectionBrowser.addEventListener('files-selected', async (event) => {
    const files = Array.isArray(event.detail?.files) ? event.detail.files : [];
    if (files.length > 0) {
      await app.ingestImageFiles(files);
    }
  });
  app.dom.collectionBrowser.addEventListener('drop-target-change', (event) => {
    app.setDropTargetState(Boolean(event.detail?.active));
  });
  app.dom.metadataEditor.addEventListener('save-item', async (event) => {
    const selected = app.findSelectedItem();
    if (!selected) {
      return;
    }
    const rawEditorState = event.detail?.patch || app.dom.metadataEditor.getItemPatch();
    const patch = app.buildItemPatchFromEditor(rawEditorState, selected);
    await app.updateItem(selected.workspaceId, patch, { explicitSave: true });
  });
  app.dom.metadataEditor.addEventListener('save-collection', async (event) => {
    const patch = event.detail?.patch || null;
    await app.saveSelectedCollectionMetadata(patch);
  });
  app.dom.metadataEditor.addEventListener('delete-item', async (event) => {
    const workspaceId = event.detail?.workspaceId || '';
    if (workspaceId) {
      await app.deleteItem(workspaceId);
    }
  });

  app.shadow.querySelectorAll('[data-close]').forEach((button) => {
    button.addEventListener('click', () => {
      const dialogId = button.getAttribute('data-close');
      app.closeDialog(app.shadow.getElementById(dialogId));
    });
  });
  app.dom.newCollectionTitle.addEventListener('input', () => {
    const currentSlug = (app.dom.newCollectionSlug.value || '').trim();
    if (!currentSlug) {
      app.dom.newCollectionSlug.value = app.slugifySegment(app.dom.newCollectionTitle.value.trim(), 'new-collection');
    }
  });
  app.dom.createCollectionBtn.addEventListener('click', async () => {
    await app.createNewCollectionDraft();
  });

  app.dom.generateManifestBtn.addEventListener('click', async () => {
    await app.generateManifest();
  });

  app.dom.copyManifestBtn.addEventListener('click', async () => {
    await app.copyManifestToClipboard();
  });

  app.dom.downloadManifestBtn.addEventListener('click', () => {
    app.downloadManifest();
  });
  app.dom.publishToSourceBtn.addEventListener('click', async () => {
    await app.publishActiveSourceDraft();
  });
  app.dom.saveLocalDraftBtn.addEventListener('click', async () => {
    await app.saveLocalDraft();
  });
  app.dom.restoreLocalDraftBtn.addEventListener('click', async () => {
    await app.restoreLocalDraft();
  });
  app.dom.discardLocalDraftBtn.addEventListener('click', async () => {
    await app.discardLocalDraft();
  });
}
