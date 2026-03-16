export function makeSourceId(providerId) {
  return `${providerId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function toWorkspaceItemId(sourceId, itemId) {
  return `${sourceId}::${itemId}`;
}
