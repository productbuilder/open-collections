export function isMobileViewport() {
  return typeof window !== 'undefined' && window.matchMedia('(max-width: 760px)').matches;
}

export function findSelectedItem(app) {
  return (app.state.collection?.items || []).find((item) => item.id === app.state.selectedItemId) || null;
}

export function findViewerItem(app) {
  return (app.state.collection?.items || []).find((item) => item.id === app.state.viewerItemId) || null;
}

export function selectItem(app, itemId) {
  if (!itemId) {
    return;
  }
  app.state.selectedItemId = itemId;
  app.renderViewport();
  app.renderMetadata();
  if (isMobileViewport()) {
    app.openMobileMetadataPanel();
  } else {
    app.syncMetadataPanelVisibility();
  }
}

export function openViewer(app, itemId) {
  const item = (app.state.collection?.items || []).find((entry) => entry.id === itemId);
  if (!item) {
    return;
  }
  app.state.viewerItemId = itemId;
  app.renderViewer();
  app.dom.viewerDialog?.open();
}

export function closeViewer(app) {
  app.state.viewerItemId = null;
  app.dom.viewerDialog?.clear();
  app.dom.viewerDialog?.close();
}
