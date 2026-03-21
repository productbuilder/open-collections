function normalizeUrl(value) {
  return String(value || '').trim();
}

export function isAbsoluteMediaUrl(value) {
  const url = normalizeUrl(value);
  if (!url) {
    return false;
  }
  return /^(https?:|data:|blob:)/i.test(url);
}

function firstAbsolute(...values) {
  for (const value of values) {
    const url = normalizeUrl(value);
    if (isAbsoluteMediaUrl(url)) {
      return url;
    }
  }
  return '';
}

export function resolveItemPreviewUrl(item) {
  const hydrated = normalizeUrl(item?.thumbnailPreviewUrl) || normalizeUrl(item?.previewUrl);
  if (hydrated) {
    return hydrated;
  }

  const mediaThumb = normalizeUrl(item?.media?.thumbnailUrl);
  const mediaUrl = normalizeUrl(item?.media?.url);

  if (item?.providerId === 'local') {
    return firstAbsolute(mediaThumb, mediaUrl);
  }

  return mediaThumb || mediaUrl;
}

export function resolveItemViewerMediaUrl(item) {
  const hydrated = normalizeUrl(item?.previewUrl) || normalizeUrl(item?.thumbnailPreviewUrl);
  if (hydrated) {
    return hydrated;
  }

  const mediaUrl = normalizeUrl(item?.media?.url);
  const mediaThumb = normalizeUrl(item?.media?.thumbnailUrl);

  if (item?.providerId === 'local') {
    return firstAbsolute(mediaUrl, mediaThumb);
  }

  return mediaUrl || mediaThumb;
}

export function resolveItemOriginalUrl(item) {
  const mediaUrl = normalizeUrl(item?.media?.url);
  if (item?.providerId === 'local') {
    return isAbsoluteMediaUrl(mediaUrl)
      ? mediaUrl
      : (normalizeUrl(item?.previewUrl) || normalizeUrl(item?.thumbnailPreviewUrl));
  }
  return mediaUrl || resolveItemViewerMediaUrl(item);
}
