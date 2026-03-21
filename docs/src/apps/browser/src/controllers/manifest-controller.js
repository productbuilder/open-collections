const RECENT_MANIFEST_STORAGE_KEY = 'open-collections-browser:recent-manifest-urls:v1';
const MAX_RECENT_MANIFEST_URLS = 8;

export function readRecentManifestUrls() {
  try {
    const raw = window.localStorage.getItem(RECENT_MANIFEST_STORAGE_KEY) || '[]';
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .map((value) => normalizePersistedManifestUrl(value))
      .filter(Boolean)
      .slice(0, MAX_RECENT_MANIFEST_URLS);
  } catch {
    return [];
  }
}

export function writeRecentManifestUrls(app, urls) {
  app.state.recentManifestUrls = urls;
  try {
    window.localStorage.setItem(RECENT_MANIFEST_STORAGE_KEY, JSON.stringify(urls));
  } catch {
    // Ignore storage failures and keep in-memory state for this session.
  }
}

export function normalizePersistedManifestUrl(manifestUrl) {
  const trimmed = String(manifestUrl || '').trim();
  if (!trimmed) {
    return '';
  }

  try {
    const resolvedUrl = new URL(trimmed, window.location.href);
    const protocol = resolvedUrl.protocol.toLowerCase();
    if (!['http:', 'https:'].includes(protocol)) {
      return '';
    }
    if (resolvedUrl.username || resolvedUrl.password) {
      return '';
    }
    const sensitiveParamNames = new Set(['access_token', 'auth', 'key', 'secret', 'sig', 'signature', 'token', 'x-amz-signature']);
    const hasSensitiveParams = Array.from(resolvedUrl.searchParams.keys())
      .some((name) => sensitiveParamNames.has(String(name || '').toLowerCase()));
    if (hasSensitiveParams) {
      return '';
    }
    return resolvedUrl.href;
  } catch {
    return '';
  }
}

export function rememberRecentManifestUrl(app, manifestUrl) {
  const normalizedUrl = normalizePersistedManifestUrl(manifestUrl);
  if (!normalizedUrl) {
    return;
  }
  const nextUrls = [normalizedUrl, ...app.state.recentManifestUrls.filter((url) => url !== normalizedUrl)]
    .slice(0, MAX_RECENT_MANIFEST_URLS);
  writeRecentManifestUrls(app, nextUrls);
}

export function clearRecentManifestUrls(app) {
  writeRecentManifestUrls(app, []);
}

export function resolveStartupManifestUrl(app, fallbackUrl) {
  const attrStartupUrl = app.getAttribute('startup-manifest-url') || app.dataset.startupManifestUrl || '';
  const queryStartupUrl = new URLSearchParams(window.location.search).get('manifest') || '';
  const rememberedRecentUrl = app.state.recentManifestUrls[0] || '';
  return attrStartupUrl.trim() || queryStartupUrl.trim() || rememberedRecentUrl || fallbackUrl;
}

export function announceManifestUrl(app, manifestUrl) {
  app.dispatchEvent(new CustomEvent('browser-manifest-url-change', {
    detail: { manifestUrl },
    bubbles: true,
    composed: true,
  }));
}
