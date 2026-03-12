export async function generateThumbnailBlob(manager, file) {
  const bitmap = await createImageBitmap(file);
  const maxWidth = 300;
  const ratio = bitmap.width > 0 ? Math.min(1, maxWidth / bitmap.width) : 1;
  const width = Math.max(1, Math.round(bitmap.width * ratio));
  const height = Math.max(1, Math.round(bitmap.height * ratio));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) {
    if (typeof bitmap.close === 'function') {
      bitmap.close();
    }
    return null;
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  if (typeof bitmap.close === 'function') {
    bitmap.close();
  }
  const blob = await new Promise((resolve) => {
    canvas.toBlob((value) => resolve(value), 'image/jpeg', 0.86);
  });
  return blob || null;
}

export async function rememberLocalAssetFiles(manager, item, originalBlob, thumbnailBlob) {
  manager.localAssetBlobs.set(item.workspaceId, {
    original: originalBlob || null,
    thumbnail: thumbnailBlob || null,
  });

  if (!manager.state.opfsAvailable) {
    return;
  }

  if (originalBlob && item.localFileRef) {
    await manager.opfsStorage.writeBlobFile(item.localFileRef, originalBlob);
  }
  if (thumbnailBlob && item.localThumbnailRef) {
    await manager.opfsStorage.writeBlobFile(item.localThumbnailRef, thumbnailBlob);
  }
}

export async function loadLocalAssetBlob(manager, item, kind = 'original') {
  const cached = manager.localAssetBlobs.get(item.workspaceId);
  if (kind === 'thumbnail' && cached?.thumbnail) {
    return cached.thumbnail;
  }
  if (kind === 'original' && cached?.original) {
    return cached.original;
  }

  if (!manager.state.opfsAvailable) {
    return null;
  }

  const path = kind === 'thumbnail' ? item.localThumbnailRef : item.localFileRef;
  if (!path) {
    return null;
  }
  const blob = await manager.opfsStorage.readBlobFile(path);
  if (!blob) {
    return null;
  }
  manager.localAssetBlobs.set(item.workspaceId, {
    original: kind === 'original' ? blob : cached?.original || null,
    thumbnail: kind === 'thumbnail' ? blob : cached?.thumbnail || null,
  });
  return blob;
}

export async function rehydrateLocalDraftAssetUrls(manager) {
  for (const item of manager.state.assets) {
    if (!item.isLocalDraftAsset) {
      continue;
    }
    if (!item.previewUrl) {
      const originalBlob = await loadLocalAssetBlob(manager, item, 'original');
      if (originalBlob) {
        item.previewUrl = URL.createObjectURL(originalBlob);
        manager.registerObjectUrl(item.previewUrl);
      }
    }
    if (!item.thumbnailPreviewUrl) {
      const thumbBlob = await loadLocalAssetBlob(manager, item, 'thumbnail');
      if (thumbBlob) {
        item.thumbnailPreviewUrl = URL.createObjectURL(thumbBlob);
        manager.registerObjectUrl(item.thumbnailPreviewUrl);
      }
    }
    if (!item.media?.thumbnailUrl && item.thumbnailRepoPath) {
      item.media = {
        ...(item.media || {}),
        thumbnailUrl: item.thumbnailRepoPath,
      };
    }
  }
}

export async function ingestImageFiles(manager, files) {
  const source = manager.getActiveIngestionSource();
  if (!source) {
    return;
  }

  const accepted = files.filter((file) => manager.isSupportedImageFile(file));
  if (accepted.length === 0) {
    manager.setStatus('No supported image files found. Use JPG, PNG, WEBP, or GIF.', 'warn');
    return;
  }

  const rejected = files.length - accepted.length;
  if (rejected > 0) {
    manager.setStatus(`Skipped ${rejected} unsupported file(s).`, 'warn');
  }

  const collectionId = manager.ensureCollectionForSource(source);
  const collectionLabel = manager.collectionLabelFor(source, collectionId);
  const collectionRootPath = manager.activeCollectionRootPath() || manager.normalizeCollectionRootPath(`${collectionId}/`, collectionId);
  const created = [];

  for (const file of accepted) {
    const ext = manager.extensionFromName(file.name, '.jpg');
    const baseId = manager.slugifySegment(file.name.replace(/\.[^.]+$/, ''), 'image');
    const itemId = manager.uniqueDraftItemId(baseId, source.id, collectionId);
    const workspaceId = manager.toWorkspaceItemId(source.id, itemId);
    const title = manager.readableTitleFromFilename(file.name, itemId);
    const mediaRepoPath = `media/${itemId}${ext}`;
    const thumbRepoPath = `thumbs/${itemId}.thumb.jpg`;
    const localFileRef = manager.collectionAssetPath(workspaceId, 'original', ext);
    const localThumbnailRef = manager.collectionAssetPath(workspaceId, 'thumbnail', '.jpg');

    const previewUrl = URL.createObjectURL(file);
    manager.registerObjectUrl(previewUrl);
    let thumbnailBlob = null;
    let thumbnailPreviewUrl = '';
    try {
      thumbnailBlob = await generateThumbnailBlob(manager, file);
    } catch (error) {
      thumbnailBlob = null;
    }

    if (thumbnailBlob) {
      thumbnailPreviewUrl = URL.createObjectURL(thumbnailBlob);
      manager.registerObjectUrl(thumbnailPreviewUrl);
    }

    const item = {
      id: itemId,
      title,
      description: '',
      creator: '',
      date: '',
      location: '',
      license: '',
      attribution: '',
      source: '',
      tags: [],
      include: true,
      media: {
        type: 'image',
        url: mediaRepoPath,
        thumbnailUrl: thumbRepoPath,
      },
      previewUrl,
      thumbnailPreviewUrl,
      thumbnailRepoPath: thumbRepoPath,
      isLocalDraftAsset: true,
      draftUploadStatus: 'pending-upload',
      uploadError: '',
      sourceAssetId: itemId,
      workspaceId,
      sourceId: source.id,
      sourceLabel: source.label,
      sourceDisplayLabel: source.displayLabel || source.label,
      providerId: source.providerId,
      collectionId,
      collectionLabel,
      collectionRootPath,
      localFileRef,
      localThumbnailRef: thumbnailBlob ? localThumbnailRef : '',
    };

    await rememberLocalAssetFiles(manager, item, file, thumbnailBlob);
    created.push(item);
  }

  if (created.length === 0) {
    return;
  }

  manager.state.assets = [...manager.state.assets, ...created];
  manager.refreshSourceCollectionsAndCounts(source.id);
  manager.state.selectedCollectionId = collectionId;
  manager.state.selectedItemId = created[0].workspaceId;
  manager.renderSourcesList();
  manager.renderSourceFilter();
  manager.renderCollectionFilter();
  manager.renderAssets();
  manager.renderEditor();

  if (manager.state.opfsAvailable) {
    await manager.saveLocalDraft();
  }

  manager.setStatus(
    `${created.length} file${created.length === 1 ? '' : 's'} added to local draft. Ready to publish.`,
    'ok',
  );
}
