function hasPublishableSelection(state) {
  if (!state || state.activeSourceFilter === 'all' || !state.selectedCollectionId || state.selectedCollectionId === 'all') {
    return false;
  }

  const source = state.sources.find((entry) => entry.id === state.activeSourceFilter);
  if (!source || !source.provider || typeof source.provider.publishCollection !== 'function') {
    return false;
  }

  return Boolean(source.capabilities?.canPublish);
}

function activeSource(state) {
  if (!state || state.activeSourceFilter === 'all') {
    return null;
  }
  return state.sources.find((entry) => entry.id === state.activeSourceFilter) || null;
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
  const source = activeSource(state);
  const canPublish = Boolean(source?.capabilities?.canPublish);
  const hasSelection = hasPublishableSelection(state);
  const hasPendingAssets = hasPendingPublishAssets(state);
  const hasUnpublishedChanges = Boolean(state.hasUnsavedChanges) || hasPendingAssets;

  if (state.publishInProgress) {
    return {
      id: 'publishing',
      label: 'Publishing',
      detail: 'Publishing draft changes to the active host.',
      tone: 'neutral',
    };
  }

  if (state.publishError) {
    return {
      id: 'publish-failed',
      label: 'Publish failed',
      detail: state.lastPublishResult?.detail || 'Last publish attempt failed. Fix the issue and publish again.',
      tone: 'warn',
    };
  }

  if (source?.needsCredentials) {
    return {
      id: 'credentials-missing',
      label: 'Credentials missing',
      detail: 'The active host is missing credentials. Reconnect before publishing.',
      tone: 'warn',
    };
  }

  if (source?.needsReconnect) {
    return {
      id: 'host-needs-reconnect',
      label: 'Host needs reconnect',
      detail: 'The active host is remembered but not connected. Refresh/reconnect to publish.',
      tone: 'warn',
    };
  }

  if (source && !canPublish) {
    return {
      id: 'read-only-host',
      label: 'Read-only host',
      detail: 'Active host is connected but cannot publish from this manager yet.',
      tone: 'neutral',
    };
  }

  if (hasUnpublishedChanges && canPublish && hasSelection) {
    return {
      id: 'ready-to-publish',
      label: 'Ready to publish',
      detail: 'Unpublished draft changes detected. Publish will update the remote host.',
      tone: 'ok',
    };
  }

  if (hasUnpublishedChanges) {
    return {
      id: 'unpublished-changes',
      label: 'Unpublished changes',
      detail: 'You have draft-only changes that are not published yet.',
      tone: 'warn',
    };
  }

  if (state.lastPublishResult?.ok) {
    return {
      id: 'published',
      label: 'Published',
      detail: state.lastPublishResult.detail || 'Last publish completed successfully.',
      tone: 'ok',
    };
  }

  if (state.lastSaveTarget === 'source') {
    return {
      id: 'published',
      label: 'Published',
      detail: 'Latest changes are saved to the active host.',
      tone: 'ok',
    };
  }

  if (state.hasLocalDraft || state.lastSaveTarget === 'draft') {
    return {
      id: 'draft',
      label: 'Draft only',
      detail: 'Working in local draft mode. Connect a publishable host when ready.',
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
