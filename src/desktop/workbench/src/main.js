import '../../../apps/collection-manager/src/index.js';
import '../../../apps/collection-browser/src/index.js';
import '../../../apps/app-shell/src/index.js';

const STORAGE_KEYS = {
  activeApp: 'open-collections-workbench:active-app:v1',
  browserManifestUrl: 'open-collections-workbench:browser-manifest-url:v1',
  browserRecentManifestUrls: 'open-collections-browser:recent-manifest-urls:v1',
};

const APPS = {
  shell: {
    id: 'shell',
    title: 'Shell',
    tag: 'open-app-shell',
  },
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
const appInstances = new Map();

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

  return 'shell';
}

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
    // Ignore invalid persisted state and continue with the browser default.
  }

  return '';
}

function setActiveButton(appId) {
  for (const button of switcherButtons) {
    const isActive = button.dataset.app === appId;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  }
}

function createAppElement(appId) {
  const app = APPS[appId] || APPS.shell;
  const element = document.createElement(app.tag);
  element.setAttribute('data-workbench-embed', 'true');
  element.dataset.workbenchApp = app.id;
  element.hidden = true;
  element.setAttribute('aria-hidden', 'true');

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

  return element;
}

function ensureAppMounted(appId) {
  if (appInstances.has(appId)) {
    return appInstances.get(appId);
  }

  const element = createAppElement(appId);
  appInstances.set(appId, element);
  hostEl.append(element);
  return element;
}

function initializeMountedApps() {
  ensureAppMounted(APPS.shell.id);
  ensureAppMounted(APPS.manager.id);
  ensureAppMounted(APPS.browser.id);
}

function setActiveApp(appId) {
  const app = APPS[appId] || APPS.shell;
  ensureAppMounted(app.id);

  for (const [id, element] of appInstances.entries()) {
    const isActive = id === app.id;
    element.hidden = !isActive;
    element.setAttribute('aria-hidden', isActive ? 'false' : 'true');
  }

  setActiveButton(app.id);
  window.localStorage.setItem(STORAGE_KEYS.activeApp, app.id);
}

for (const button of switcherButtons) {
  button.addEventListener('click', () => {
    const appId = button.dataset.app;
    if (!appId || !APPS[appId]) {
      return;
    }
    setActiveApp(appId);
  });
}

initializeMountedApps();
setActiveApp(resolveStartupAppId());
