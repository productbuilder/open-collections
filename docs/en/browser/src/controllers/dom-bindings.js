export function cacheDomElements(root) {
  return {
    browserContext: root.getElementById('browserContext'),
    browserManifest: root.getElementById('browserManifest'),
    browserHeaderStatus: root.getElementById('browserHeaderStatus'),
    browserViewport: root.getElementById('browserViewport'),
    manifestControls: root.getElementById('manifestControls'),
    metadataPanel: root.getElementById('metadataPanel'),
    viewerDialog: root.getElementById('viewerDialog'),
  };
}

export function bindDomEvents(app) {
  if (app._eventsBound) {
    return;
  }

  app._eventsBound = true;
  app._handleWindowResize = () => app.syncMetadataPanelVisibility();
  window.addEventListener('resize', app._handleWindowResize);

  app.dom.manifestControls?.addEventListener('manifest-load', async (event) => {
    await app.loadCollection({ manifestUrl: event.detail?.manifestUrl || '' });
  });
  app.dom.manifestControls?.addEventListener('manifest-input-change', (event) => {
    app.setManifestInput(event.detail?.manifestUrl || '');
  });
  app.dom.manifestControls?.addEventListener('recent-manifest-picked', (event) => {
    app.setManifestInput(event.detail?.manifestUrl || '');
  });
  app.dom.manifestControls?.addEventListener('clear-recent-manifests', () => {
    app.clearRecentManifestUrls();
    app.setStatus('Cleared recent manifest URLs for this browser.', 'neutral');
    app.renderManifestControls();
  });

  app.dom.browserViewport?.addEventListener('item-select', (event) => {
    app.selectItem(event.detail?.itemId || '');
  });
  app.dom.browserViewport?.addEventListener('item-view', (event) => {
    app.openViewer(event.detail?.itemId || '');
  });

  app.dom.metadataPanel?.addEventListener('close-metadata', () => {
    app.closeMobileMetadataPanel();
  });
  app.dom.viewerDialog?.addEventListener('close-viewer', () => {
    app.state.viewerItemId = null;
  });
}
