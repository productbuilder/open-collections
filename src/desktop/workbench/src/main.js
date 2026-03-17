import '../../../apps/manager/src/index.js';
import '../../../apps/browser/src/index.js';

const STORAGE_KEYS = {
  activeApp: 'open-collections-workbench:active-app:v1',
  browserManifestUrl: 'open-collections-workbench:browser-manifest-url:v1',
};

const APPS = {
  manager: {
    id: 'manager',
    title: 'Manager',
    tag: 'open-collections-manager',
  },
  browser: {
    id: 'browser',
    title: 'Browser',
    tag: 'timemap-browser',
  },
};

const hostEl = document.getElementById('host');
const switcherButtons = Array.from(document.querySelectorAll('button[data-app]'));

function resolveStartupAppId() {
  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get('app');
  if (fromQuery && APPS[fromQuery]) {
    return fromQuery;
  }

  const remembered = window.localStorage.getItem(STORAGE_KEYS.activeApp);
  if (remembered && APPS[remembered]) {
    return remembered;
  }

  return 'manager';
}

function resolveStartupBrowserManifestUrl() {
  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get('manifest') || '';
  if (fromQuery.trim()) {
    return fromQuery.trim();
  }

  const remembered = window.localStorage.getItem(STORAGE_KEYS.browserManifestUrl) || '';
  return remembered.trim();
}

function setActiveButton(appId) {
  for (const button of switcherButtons) {
    const isActive = button.dataset.app === appId;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  }
}

function mountApp(appId) {
  const app = APPS[appId] || APPS.manager;
  const element = document.createElement(app.tag);
  element.setAttribute('data-workbench-embed', 'true');
  if (app.id === 'browser') {
    const startupManifestUrl = resolveStartupBrowserManifestUrl();
    if (startupManifestUrl) {
      element.setAttribute('startup-manifest-url', startupManifestUrl);
    }
    element.addEventListener('browser-manifest-url-change', (event) => {
      const manifestUrl = event?.detail?.manifestUrl;
      if (!manifestUrl || !manifestUrl.trim()) {
        return;
      }
      window.localStorage.setItem(STORAGE_KEYS.browserManifestUrl, manifestUrl.trim());
    });
  }

  hostEl.replaceChildren(element);
  setActiveButton(app.id);
  window.localStorage.setItem(STORAGE_KEYS.activeApp, app.id);
}

for (const button of switcherButtons) {
  button.addEventListener('click', () => {
    const appId = button.dataset.app;
    if (!appId || !APPS[appId]) {
      return;
    }
    mountApp(appId);
  });
}

mountApp(resolveStartupAppId());
