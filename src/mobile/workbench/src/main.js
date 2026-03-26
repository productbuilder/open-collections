import '../../../apps/collection-browser/src/index.js';

const STORAGE_KEYS = {
  browserManifestUrl: 'open-collections-workbench:browser-manifest-url:v1',
  browserRecentManifestUrls: 'open-collections-browser:recent-manifest-urls:v1',
};

const hostEl = document.getElementById('host');

function resolveStartupBrowserManifestUrl() {
  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get('manifest') || '';
  if (fromQuery.trim()) {
    return fromQuery.trim();
  }

  const remembered = window.localStorage.getItem(STORAGE_KEYS.browserManifestUrl) || '';
  if (remembered.trim()) {
    return remembered.trim();
  }

  try {
    const recentUrls = JSON.parse(window.localStorage.getItem(STORAGE_KEYS.browserRecentManifestUrls) || '[]');
    if (Array.isArray(recentUrls) && typeof recentUrls[0] === 'string' && recentUrls[0].trim()) {
      return recentUrls[0].trim();
    }
  } catch {
    // Ignore invalid persisted state and continue with browser defaults.
  }

  return '';
}

function mountBrowser() {
  const browserEl = document.createElement('timemap-browser');
  browserEl.setAttribute('data-workbench-embed', 'true');

  const startupManifestUrl = resolveStartupBrowserManifestUrl();
  if (startupManifestUrl) {
    browserEl.setAttribute('startup-manifest-url', startupManifestUrl);
  }

  browserEl.addEventListener('browser-manifest-url-change', (event) => {
    const manifestUrl = event?.detail?.manifestUrl;
    if (!manifestUrl || !manifestUrl.trim()) {
      return;
    }
    window.localStorage.setItem(STORAGE_KEYS.browserManifestUrl, manifestUrl.trim());
  });

  hostEl.replaceChildren(browserEl);
}

mountBrowser();
