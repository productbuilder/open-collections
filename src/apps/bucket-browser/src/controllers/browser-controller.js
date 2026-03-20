function normalizePath(path) {
  const trimmed = String(path || '/').trim();
  if (!trimmed || trimmed === '.') {
    return '/';
  }
  if (trimmed === '/') {
    return '/';
  }
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

export function resolveActiveWorkspace(state) {
  return state.workspaces.find((workspace) => workspace.id === state.activeWorkspaceId) || null;
}

export function getVisibleAssets(state) {
  const activePath = normalizePath(state.activePath);
  const query = String(state.searchQuery || '').trim().toLowerCase();
  const availability = state.filters?.availability || 'all';
  const kind = state.filters?.kind || 'all';

  return state.assets.filter((asset) => {
    if (normalizePath(asset.path) !== activePath) {
      return false;
    }
    if (availability !== 'all' && asset.syncState !== availability) {
      return false;
    }
    if (kind !== 'all' && asset.kind !== kind) {
      return false;
    }
    if (!query) {
      return true;
    }
    const haystack = `${asset.name} ${asset.summary} ${asset.kind} ${asset.syncState}`.toLowerCase();
    return haystack.includes(query);
  });
}

export function resolveFocusedAsset(state) {
  return state.assets.find((asset) => asset.id === state.focusedAssetId) || null;
}

export function resolvePreviewAsset(state) {
  return state.assets.find((asset) => asset.id === state.previewAssetId) || null;
}

export function buildViewModel(state) {
  const activeWorkspace = resolveActiveWorkspace(state);
  const visibleAssets = getVisibleAssets(state);
  const focusedAsset = resolveFocusedAsset(state) || visibleAssets[0] || null;
  const previewAsset = resolvePreviewAsset(state);
  const selectionCount = state.selectedAssetIds.length;

  return {
    activeWorkspace,
    visibleAssets,
    focusedAsset,
    previewAsset,
    selectionCount,
    currentPathLabel: state.activePath || '/',
    currentViewMode: state.currentViewMode,
    status: state.status,
  };
}

export function ensureFocusState(state) {
  const assetIds = new Set(state.assets.map((asset) => asset.id));
  if (state.focusedAssetId && !assetIds.has(state.focusedAssetId)) {
    state.focusedAssetId = null;
  }
  if (state.previewAssetId && !assetIds.has(state.previewAssetId)) {
    state.previewAssetId = null;
  }
  state.selectedAssetIds = state.selectedAssetIds.filter((assetId) => assetIds.has(assetId));
}

export function toggleSelection(selectedAssetIds, assetId) {
  const set = new Set(selectedAssetIds);
  if (set.has(assetId)) {
    set.delete(assetId);
  } else {
    set.add(assetId);
  }
  return [...set];
}
