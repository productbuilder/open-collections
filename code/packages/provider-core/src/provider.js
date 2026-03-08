export const READ_ONLY_CAPABILITIES = {
  canListAssets: true,
  canGetAsset: true,
  canSaveMetadata: false,
  canExportCollection: true,
};

export const READ_WRITE_CAPABILITIES = {
  canListAssets: true,
  canGetAsset: true,
  canSaveMetadata: true,
  canExportCollection: true,
};

export function cloneItem(item) {
  return JSON.parse(JSON.stringify(item));
}

export function mergeItem(item, patch) {
  return {
    ...item,
    ...patch,
    tags: Array.isArray(patch.tags) ? patch.tags : item.tags,
    media: {
      ...(item.media || {}),
      ...(patch.media || {}),
    },
  };
}

export function providerNotConnectedError(id) {
  return new Error(`Provider ${id} is not connected.`);
}
