import { MANAGER_CONFIG } from '../config.js';

export function cacheDomElements(root) {
  return {
    managerHeader: root.getElementById('managerHeader'),
    paneLayout: root.getElementById('paneLayout'),
    collectionBrowser: root.getElementById('collectionBrowser'),
    mobileFlow: root.getElementById('mobileFlow'),
    metadataEditor: root.getElementById('metadataEditor'),
    connectionsListPanel: root.getElementById('connectionsListPanel'),
    addConnectionPanel: root.getElementById('addConnectionPanel'),
    assetViewer: root.getElementById('assetViewer'),
    connectionsDialog: root.getElementById('connectionsDialog'),
    publishDialog: root.getElementById('publishDialog'),
    newCollectionDialog: root.getElementById('newCollectionDialog'),
    registerDialog: root.getElementById('registerDialog'),
    headerMenuDialog: root.getElementById('headerMenuDialog'),
    connectionsDialogTitle: root.getElementById('connectionsDialogTitle'),
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
  app.dom.addConnectionPanel?.setConfigValues({
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

  app.dom.connectionsListPanel.addEventListener('open-add-connection', () => {
    app.openAddHostDialog();
  });
  app.dom.connectionsListPanel.addEventListener('select-connection', (event) => {
    const sourceId = event.detail?.sourceId || '';
    if (!sourceId) {
      return;
    }
    const source = app.getSourceById(sourceId);
    if (!source) {
      return;
    }
    app.activateSource(source);
    app.renderConnectionsListPanel();
  });
  app.dom.connectionsListPanel.addEventListener('refresh-connection', async (event) => {
    const sourceId = event.detail?.sourceId || '';
    if (sourceId) {
      await app.refreshSource(sourceId);
    }
  });
  app.dom.connectionsListPanel.addEventListener('repair-connection', async (event) => {
    const sourceId = event.detail?.sourceId || '';
    const mode = event.detail?.mode || '';
    if (!sourceId || !mode) {
      return;
    }
    if (mode === 'credentials') {
      app.openCredentialRepairDialog(sourceId);
      return;
    }
    if (mode === 'folder') {
      app.prepareSourceRepair(sourceId, 'folder');
      const didPick = await app.pickLocalFolder();
      if (didPick) {
        await app.refreshSource(sourceId, { configOverrides: { localDirectoryHandle: app.selectedLocalDirectoryHandle } });
      }
      return;
    }
    app.prepareSourceRepair(sourceId, 'reconnect');
    await app.refreshSource(sourceId);
  });
  app.dom.connectionsListPanel.addEventListener('remove-connection', (event) => {
    const sourceId = event.detail?.sourceId || '';
    if (sourceId) {
      app.removeSource(sourceId);
    }
  });

  app.dom.addConnectionPanel.addEventListener('back-to-connections', () => {
    app.clearPendingSourceRepair();
    app.dom.addConnectionPanel?.resetFlow?.();
    app.showConnectionsListView();
  });
  app.dom.addConnectionPanel.addEventListener('open-storage-options', () => app.openDialog(app.dom.storageOptionsDialog));
  app.dom.addConnectionPanel.addEventListener('select-provider', (event) => {
    const providerId = event.detail?.providerId || '';
    if (providerId) {
      app.setSelectedProvider(providerId);
    }
  });
  app.dom.addConnectionPanel.addEventListener('connect-provider', async () => {
    await app.connectCurrentProvider();
  });
  app.dom.addConnectionPanel.addEventListener('add-example-connection', async () => {
    app.clearPendingSourceRepair();
    app.setSelectedProvider('example');
    await app.connectCurrentProvider();
  });
  app.dom.addConnectionPanel.addEventListener('add-local-folder-connection', async () => {
    app.clearPendingSourceRepair();
    app.setSelectedProvider('local');
    const didPick = await app.pickLocalFolder();
    if (didPick) {
      await app.connectCurrentProvider();
    }
  });

  app.dom.openRegisterFromMenuBtn.addEventListener('click', () => {
    app.closeDialog(app.dom.headerMenuDialog);
    app.openDialog(app.dom.registerDialog);
  });

  const bindBrowserSurface = (target) => {
    if (!target) {
      return;
    }

    target.addEventListener('back-to-collections', () => {
      app.leaveCollectionView();
      app.refreshWorkingStatus();
    });
    target.addEventListener('source-filter-change', (event) => {
      app.state.activeSourceFilter = event.detail?.value || 'all';
      app.state.selectedCollectionId = 'all';
      app.state.currentLevel = 'collections';
      app.state.openedCollectionId = null;
      app.state.selectedItemId = null;
      app.state.selectedItemIds = [];
      app.renderCollectionFilter();
      app.syncMetadataModeFromState();
      app.closeMobileDetail();
      app.renderSourceContext();
      app.renderAssets();
      app.renderEditor();
      app.refreshWorkingStatus();
      if (app.state.opfsAvailable) {
        app.persistWorkspaceToOpfs().catch(() => {});
      }
    });
    target.addEventListener('collection-filter-change', (event) => {
      app.state.selectedCollectionId = event.detail?.value || 'all';
      if (app.state.currentLevel === 'items') {
        if (app.state.selectedCollectionId === 'all') {
          app.state.currentLevel = 'collections';
          app.state.openedCollectionId = null;
          app.state.selectedItemId = null;
          app.state.selectedItemIds = [];
          app.closeMobileDetail();
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
    target.addEventListener('collection-select', (event) => {
      app.state.selectedCollectionId = event.detail?.collectionId || 'all';
      app.state.currentLevel = 'collections';
      app.state.openedCollectionId = null;
      app.state.selectedItemId = null;
      app.state.selectedItemIds = [];
      app.syncMetadataModeFromState();
      app.renderAssets();
      app.renderEditor();
      app.refreshWorkingStatus();
    });
    target.addEventListener('collection-open', (event) => {
      app.openCollectionView(event.detail?.collectionId || '');
      app.refreshWorkingStatus();
    });
    target.addEventListener('item-select', (event) => {
      app.selectItem(event.detail?.workspaceId || '');
    });
    target.addEventListener('item-toggle-selected', (event) => {
      app.toggleItemSelection(event.detail?.workspaceId || '', event.detail?.selected);
    });
    target.addEventListener('clear-item-selection', () => {
      app.clearItemSelection();
    });
    target.addEventListener('delete-selected-items', async () => {
      await app.deleteSelectedItems();
    });
    target.addEventListener('item-view', (event) => {
      app.openViewer(event.detail?.workspaceId || '');
    });
    target.addEventListener('view-mode-change', (event) => {
      app.setBrowserViewMode(event.detail?.level || 'collections', event.detail?.mode || 'cards');
    });
    target.addEventListener('add-collection', () => {
      app.openNewCollectionDialog();
    });
    target.addEventListener('add-item', async () => {
      await app.createEmptyDraftItem();
    });
    target.addEventListener('attach-media-upload', async (event) => {
      const itemId = event.detail?.itemId || '';
      if (!itemId) {
        return;
      }
      const picker = document.createElement('input');
      picker.type = 'file';
      picker.accept = '.jpg,.jpeg,.png,.webp,.gif';
      picker.hidden = true;
      document.body.appendChild(picker);
      picker.addEventListener(
        'change',
        async () => {
          const file = picker.files && picker.files[0] ? picker.files[0] : null;
          picker.remove();
          if (!file) {
            return;
          }
          await app.attachUploadedMediaToItem(itemId, file);
        },
        { once: true },
      );
      picker.click();
    });
    target.addEventListener('attach-media-url', async (event) => {
      const itemId = event.detail?.itemId || '';
      if (!itemId) {
        return;
      }
      const current = app.state.assets.find((item) => item.workspaceId === itemId);
      const initialValue = current?.media?.mode === 'referenced' ? String(current?.media?.url || '').trim() : '';
      const value = window.prompt('Enter image URL', initialValue);
      if (value === null) {
        return;
      }
      await app.attachReferencedMediaToItem(itemId, value);
    });
    target.addEventListener('publish-collection', async () => {
      await app.publishActiveSourceDraft();
    });
    target.addEventListener('files-selected', async (event) => {
      const files = Array.isArray(event.detail?.files) ? event.detail.files : [];
      if (files.length > 0) {
        await app.ingestImageFiles(files);
      }
    });
    target.addEventListener('drop-target-change', (event) => {
      app.setDropTargetState(Boolean(event.detail?.active));
    });
  };

  const bindMetadataSurface = (target) => {
    if (!target) {
      return;
    }

    target.addEventListener('save-item', async (event) => {
      const selected = app.findSelectedItem();
      if (!selected) {
        return;
      }
      const rawEditorState = event.detail?.patch || (typeof target.getItemPatch === 'function' ? target.getItemPatch() : null);
      const patch = app.buildItemPatchFromEditor(rawEditorState, selected);
      await app.updateItem(selected.workspaceId, patch, { explicitSave: true });
    });
    target.addEventListener('save-collection', async (event) => {
      const patch = event.detail?.patch || (typeof target.getCollectionPatch === 'function' ? target.getCollectionPatch() : null);
      await app.saveSelectedCollectionMetadata(patch);
    });
    target.addEventListener('delete-item', async (event) => {
      const workspaceId = event.detail?.workspaceId || '';
      if (workspaceId) {
        await app.deleteItem(workspaceId);
      }
    });
  };

  bindBrowserSurface(app.dom.collectionBrowser);
  bindBrowserSurface(app.dom.mobileFlow);
  bindMetadataSurface(app.dom.metadataEditor);
  bindMetadataSurface(app.dom.mobileFlow);

  app.dom.metadataEditor.addEventListener('close-editor', () => app.closeMobileDetail());
  app.dom.mobileFlow?.addEventListener('back-to-browse', () => app.closeMobileDetail());
  app.dom.assetViewer.addEventListener('close-viewer', () => {
    app.state.viewerItemId = null;
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
