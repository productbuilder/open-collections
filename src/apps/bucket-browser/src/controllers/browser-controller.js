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

function comparePaths(a, b) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

export function getAncestorPaths(path) {
  const normalizedPath = normalizePath(path);
  if (normalizedPath === '/') {
    return ['/'];
  }

  const segments = normalizedPath.split('/').filter(Boolean);
  const ancestors = ['/'];
  let currentPath = '';

  segments.forEach((segment) => {
    currentPath += `/${segment}`;
    ancestors.push(currentPath);
  });

  return ancestors;
}

export function createExpandedPaths(treeNodes, activePath = '/') {
  const availablePaths = new Set(treeNodes.map((node) => normalizePath(node.path)));
  return getAncestorPaths(activePath).filter((path) => availablePaths.has(path));
}

export function ensureExpandedPath(expandedPaths, treeNodes, path) {
  const availablePaths = new Set(treeNodes.map((node) => normalizePath(node.path)));
  return getAncestorPaths(path).filter((ancestorPath) => availablePaths.has(ancestorPath) || expandedPaths.includes(ancestorPath));
}

export function buildTreeHierarchy(treeNodes = []) {
  const nodesByPath = new Map();
  const roots = [];

  treeNodes.forEach((node) => {
    const path = normalizePath(node.path);
    nodesByPath.set(path, {
      ...node,
      path,
      depth: path === '/' ? 0 : path.split('/').filter(Boolean).length,
      children: [],
    });
  });

  const sortedNodes = [...nodesByPath.values()].sort((left, right) => comparePaths(left.path, right.path));

  sortedNodes.forEach((node) => {
    if (node.path === '/') {
      roots.push(node);
      return;
    }

    const parentPath = node.path.split('/').slice(0, -1).join('/') || '/';
    const parent = nodesByPath.get(parentPath);
    if (parent) {
      parent.children.push(node);
      return;
    }

    roots.push(node);
  });

  sortedNodes.forEach((node) => {
    node.children.sort((left, right) => comparePaths(left.label || left.path, right.label || right.path));
  });

  return roots;
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
