const MOCK_WORKSPACES = [
  {
    id: 'open-collections-demo',
    name: 'Open Collections Demo',
    description: 'Shared browser shell pointed at a sample Open Collections workspace.',
    rootLabel: 'collections/',
  },
  {
    id: 'productbuilder-studio',
    name: 'Productbuilder Studio',
    description: 'Shared browser shell pointed at a sample Productbuilder workspace.',
    rootLabel: 'projects/',
  },
];

const MOCK_TREE_BY_WORKSPACE = {
  'open-collections-demo': [
    { id: 'collections-root', path: '/', label: 'collections/', kind: 'root' },
    { id: 'collections-images', path: '/images', label: 'images', kind: 'folder' },
    { id: 'collections-images-archival', path: '/images/archival', label: 'archival', kind: 'folder' },
    { id: 'collections-images-archival-glass', path: '/images/archival/glass-plates', label: 'glass-plates', kind: 'folder' },
    { id: 'collections-images-featured', path: '/images/featured', label: 'featured', kind: 'folder' },
    { id: 'collections-oral-histories', path: '/oral-histories', label: 'oral-histories', kind: 'folder' },
    { id: 'collections-oral-histories-transcripts', path: '/oral-histories/transcripts', label: 'transcripts', kind: 'folder' },
    { id: 'collections-oral-histories-review', path: '/oral-histories/review', label: 'review', kind: 'folder' },
    { id: 'collections-drafts', path: '/drafts', label: 'drafts', kind: 'folder' },
    { id: 'collections-drafts-incoming', path: '/drafts/incoming', label: 'incoming', kind: 'folder' },
  ],
  'productbuilder-studio': [
    { id: 'projects-root', path: '/', label: 'projects/', kind: 'root' },
    { id: 'projects-alpha', path: '/alpha', label: 'alpha', kind: 'folder' },
    { id: 'projects-alpha-design', path: '/alpha/design', label: 'design', kind: 'folder' },
    { id: 'projects-alpha-design-research', path: '/alpha/design/research', label: 'research', kind: 'folder' },
    { id: 'projects-assets', path: '/assets', label: 'assets', kind: 'folder' },
    { id: 'projects-assets-renders', path: '/assets/renders', label: 'renders', kind: 'folder' },
    { id: 'projects-reviews', path: '/reviews', label: 'reviews', kind: 'folder' },
    { id: 'projects-reviews-qa', path: '/reviews/qa', label: 'qa', kind: 'folder' },
  ],
};

const MOCK_ASSETS_BY_WORKSPACE = {
  'open-collections-demo': [
    {
      id: 'asset-lantern-slide',
      workspaceId: 'open-collections-demo',
      path: '/images',
      name: 'Lantern Slide 1908',
      kind: 'image',
      sizeLabel: '12.4 MB',
      syncState: 'local + remote',
      summary: 'Digitized slide ready for preview, metadata review, and future publication flows.',
      thumbnailLabel: 'LS',
      updatedAt: '2026-03-16',
    },
    {
      id: 'asset-glass-plate',
      workspaceId: 'open-collections-demo',
      path: '/images/archival/glass-plates',
      name: 'Glass Plate Negative',
      kind: 'image',
      sizeLabel: '18.1 MB',
      syncState: 'local + remote',
      summary: 'Deeply nested preservation image used to validate recursive tree navigation.',
      thumbnailLabel: 'GP',
      updatedAt: '2026-03-20',
    },
    {
      id: 'asset-field-notes',
      workspaceId: 'open-collections-demo',
      path: '/oral-histories/transcripts',
      name: 'Field Notes Transcript',
      kind: 'document',
      sizeLabel: '480 KB',
      syncState: 'local only',
      summary: 'Transcript draft with local edits not yet synced to a remote bucket.',
      thumbnailLabel: 'FN',
      updatedAt: '2026-03-18',
    },
    {
      id: 'asset-ship-plan',
      workspaceId: 'open-collections-demo',
      path: '/drafts/incoming',
      name: 'Harbor Ship Plan',
      kind: 'image',
      sizeLabel: '6.8 MB',
      syncState: 'remote only',
      summary: 'Remote reference asset surfaced through the shared workspace browser.',
      thumbnailLabel: 'SP',
      updatedAt: '2026-03-19',
    },
  ],
  'productbuilder-studio': [
    {
      id: 'asset-alpha-ui',
      workspaceId: 'productbuilder-studio',
      path: '/alpha/design',
      name: 'Alpha UI Board',
      kind: 'image',
      sizeLabel: '4.1 MB',
      syncState: 'local + remote',
      summary: 'Concept board for Productbuilder project workspace layout testing.',
      thumbnailLabel: 'UI',
      updatedAt: '2026-03-20',
    },
    {
      id: 'asset-build-spec',
      workspaceId: 'productbuilder-studio',
      path: '/assets/renders',
      name: 'Build Spec v2',
      kind: 'document',
      sizeLabel: '220 KB',
      syncState: 'local only',
      summary: 'Planning document that will later participate in explicit working-copy flows.',
      thumbnailLabel: 'BS',
      updatedAt: '2026-03-15',
    },
    {
      id: 'asset-review-reel',
      workspaceId: 'productbuilder-studio',
      path: '/reviews/qa',
      name: 'Review Reel',
      kind: 'video',
      sizeLabel: '88 MB',
      syncState: 'remote only',
      summary: 'Video preview placeholder for higher-bandwidth workspace viewers.',
      thumbnailLabel: 'RR',
      updatedAt: '2026-03-14',
    },
  ],
};

export function createWorkspaceService() {
  return {
    async listWorkspaces() {
      return structuredClone(MOCK_WORKSPACES);
    },

    async loadWorkspace(workspaceId) {
      const workspace = MOCK_WORKSPACES.find((entry) => entry.id === workspaceId) || null;
      return {
        workspace: workspace ? structuredClone(workspace) : null,
        treeNodes: structuredClone(MOCK_TREE_BY_WORKSPACE[workspaceId] || []),
        assets: structuredClone(MOCK_ASSETS_BY_WORKSPACE[workspaceId] || []),
      };
    },

    async performBulkAction(actionId, assetIds) {
      return {
        actionId,
        assetIds: [...assetIds],
        message: `Placeholder bulk action "${actionId}" queued for ${assetIds.length} asset(s).`,
      };
    },
  };
}
