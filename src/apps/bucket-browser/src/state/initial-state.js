export function createInitialState() {
  return {
    workspaces: [],
    treeNodes: [],
    assets: [],
    activeWorkspaceId: null,
    activePath: '/',
    currentViewMode: 'grid',
    selectedAssetIds: [],
    focusedAssetId: null,
    previewAssetId: null,
    searchQuery: '',
    filters: {
      availability: 'all',
      kind: 'all',
    },
    mobileDetailsOpen: false,
    mobileTreeOpen: false,
    status: {
      tone: 'neutral',
      text: 'Loading workspace scaffold…',
    },
  };
}
