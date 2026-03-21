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

function sourceHasAccessibleContent(state, source) {
  if (!state || !source) {
    return false;
  }

  const hasCollections = Array.isArray(source.collections) && source.collections.length > 0;
  const hasAssets = Array.isArray(state.assets) && state.assets.some((item) => item.sourceId === source.id);
  return hasCollections || hasAssets;
}

function isExampleSource(source) {
  return Boolean(source && source.providerId === 'example');
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
      detail: 'The active host is missing credentials. Use Update credentials, then publish again.',
      tone: 'warn',
    };
  }

  if (isExampleSource(source)) {
    return {
      id: 'example-content',
      label: 'Viewing example content',
      detail: 'Example/demo collections are available for browsing. Connect a host to refresh from your own storage or publish changes.',
      tone: 'neutral',
    };
  }

  if (source?.needsReconnect) {
    const hasAccessibleContent = sourceHasAccessibleContent(state, source);
    return {
      id: 'host-needs-reconnect',
      label: hasAccessibleContent ? 'Disconnected host (cached content available)' : 'Host needs reconnect',
      detail: hasAccessibleContent
        ? 'The active host is disconnected, but previously loaded collections remain available locally. Reconnect to refresh from the host or publish.'
        : 'The active host is remembered but disconnected. Re-select folder, refresh, or reconnect to publish.',
      tone: 'warn',
    };
  }

  if (source && !canPublish) {
    return {
      id: 'read-only-host',
      label: 'Read-only host',
      detail: 'Active host is connected but read-only for publish uploads.',
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
