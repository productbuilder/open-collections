function hasPublishableSelection(state) {
  if (!state || state.activeSourceFilter === 'all' || !state.selectedCollectionId || state.selectedCollectionId === 'all') {
    return false;
  }

  const source = state.sources.find((entry) => entry.id === state.activeSourceFilter);
  if (!source || !source.provider || typeof source.provider.publishCollection !== 'function') {
    return false;
  }

  return source.providerId === 'github';
}

function hasPendingPublishAssets(state) {
  if (!state || state.activeSourceFilter === 'all' || !state.selectedCollectionId || state.selectedCollectionId === 'all') {
    return false;
  }

  return state.assets.some(
    (item) =>
      item.sourceId === state.activeSourceFilter &&
      item.collectionId === state.selectedCollectionId &&
      item.include !== false &&
      (item.isLocalDraftAsset || item.draftUploadStatus === 'pending-upload' || item.draftUploadStatus === 'failed'),
  );
}

export function computeWorkingStatus(state) {
  if (state.publishError) {
    return {
      id: 'publish-error',
      label: 'Publish error',
      detail: 'Last publish attempt failed. Fix the error and try again.',
      tone: 'warn',
    };
  }

  if (state.publishInProgress) {
    return {
      id: 'publishing',
      label: 'Publishing',
      detail: 'Publishing collection to the active host.',
      tone: 'neutral',
    };
  }

  if (state.hasUnsavedChanges) {
    return {
      id: 'dirty',
      label: 'Unsaved changes',
      detail: 'You have local changes that are not saved to the active host.',
      tone: 'warn',
    };
  }

  if (hasPublishableSelection(state) && hasPendingPublishAssets(state)) {
    return {
      id: 'ready-to-publish',
      label: 'Ready to publish',
      detail: 'Draft assets are ready to upload for the selected collection.',
      tone: 'ok',
    };
  }

  if (state.lastSaveTarget === 'source') {
    return {
      id: 'saved',
      label: 'Saved',
      detail: 'Changes are saved to the active host.',
      tone: 'ok',
    };
  }

  if (state.hasLocalDraft) {
    return {
      id: 'draft',
      label: 'Local draft',
      detail: 'Working in a local draft workspace.',
      tone: 'neutral',
    };
  }

  return {
    id: 'draft',
    label: 'Draft',
    detail: 'Connect a host or create a collection draft to get started.',
    tone: 'neutral',
  };
}
