const STUB_CAPABILITIES = {
  canListAssets: false,
  canGetAsset: false,
  canSaveMetadata: false,
  canExportCollection: false,
};

export function createGithubProvider() {
  return {
    id: 'github',
    label: 'GitHub (Stub)',

    async connect() {
      return {
        ok: false,
        message:
          'GitHub provider is not implemented in this MVP pass. TODO: add repo selection, token auth, and collection read/write.',
        capabilities: STUB_CAPABILITIES,
      };
    },

    async listAssets() {
      throw new Error('GitHub provider stub: listAssets not implemented yet.');
    },

    async getAsset() {
      throw new Error('GitHub provider stub: getAsset not implemented yet.');
    },

    async saveMetadata() {
      throw new Error('GitHub provider stub: saveMetadata not implemented yet.');
    },

    async exportCollection() {
      throw new Error('GitHub provider stub: exportCollection not implemented yet.');
    },

    getCapabilities() {
      return STUB_CAPABILITIES;
    },
  };
}
