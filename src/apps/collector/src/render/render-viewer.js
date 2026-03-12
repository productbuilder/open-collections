export function openViewer(component, itemId) {
  const item = component.state.assets.find((entry) => entry.workspaceId === itemId);
  if (!item) {
    return;
  }

  component.state.viewerItemId = itemId;
  if (component.state.selectedItemId !== itemId) {
    component.state.selectedItemId = itemId;
    component.state.metadataMode = 'item';
    component.renderAssets();
    component.renderEditor();
    if (component.isMobileViewport()) {
      component.openMobileEditor();
    }
  }

  component.renderViewer();
  component.openDialog(component.dom.assetViewerDialog);
}

export function closeViewer(component) {
  component.state.viewerItemId = null;
  component.closeDialog(component.dom.assetViewerDialog);
}

export function renderViewer(component) {
  const item = component.state.assets.find((entry) => entry.workspaceId === component.state.viewerItemId);
  if (!item) {
    component.closeViewer();
    return;
  }

  component.dom.viewerTitle.textContent = item.title || item.id || 'Asset viewer';
  component.dom.viewerDescription.textContent = item.description || 'No description available.';
  component.dom.viewerBadges.innerHTML = '';
  component.dom.viewerMedia.innerHTML = '';

  const sourceBadge = document.createElement('span');
  sourceBadge.className = 'badge source-badge';
  sourceBadge.textContent = component.formatSourceBadge(item);

  const typeBadge = document.createElement('span');
  typeBadge.className = 'badge';
  typeBadge.textContent = `Type: ${item.media?.type || 'unknown'}`;

  const licenseBadge = document.createElement('span');
  const hasLicense = Boolean(item.license);
  licenseBadge.className = `badge ${hasLicense ? 'ok' : 'warn'}`;
  licenseBadge.textContent = hasLicense ? `License: ${item.license}` : 'License missing';
  component.dom.viewerBadges.append(sourceBadge, typeBadge, licenseBadge);

  const mediaType = (item.media?.type || '').toLowerCase();
  const mediaUrl = item.previewUrl || item.thumbnailPreviewUrl || item.media?.url || item.media?.thumbnailUrl || '';
  if (mediaUrl && mediaType.includes('image')) {
    const image = document.createElement('img');
    image.className = 'viewer-image';
    image.src = mediaUrl;
    image.alt = item.title || item.id || 'Asset image';
    component.dom.viewerMedia.appendChild(image);
  } else if (mediaUrl && mediaType.includes('video')) {
    const video = document.createElement('video');
    video.className = 'viewer-video';
    video.src = mediaUrl;
    video.controls = true;
    video.preload = 'metadata';
    component.dom.viewerMedia.appendChild(video);
  } else {
    const placeholder = document.createElement('div');
    placeholder.className = 'empty';
    placeholder.textContent = mediaUrl
      ? 'Large preview is not available for this media type yet.'
      : 'No media URL available for this asset.';
    component.dom.viewerMedia.appendChild(placeholder);
  }

  const openOriginalUrl = item.media?.url || mediaUrl;
  if (openOriginalUrl) {
    component.dom.viewerOpenOriginal.href = openOriginalUrl;
    component.dom.viewerOpenOriginal.classList.remove('is-hidden');
  } else {
    component.dom.viewerOpenOriginal.removeAttribute('href');
    component.dom.viewerOpenOriginal.classList.add('is-hidden');
  }
}
