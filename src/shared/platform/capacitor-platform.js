import { PLATFORM_TYPES, createPlatformApi } from './platform-api.js';
import { persistLocalStateString, readLocalStorageString, mirrorNativePreferencesToLocalStorage } from './mobile-persistence.js';

const WORKSPACE_KEY = 'open-collections:workspace-state:v1';
const sessionCredentials = new Map();

function credentialKey(namespace, account) {
  return `${String(namespace || '')}::${String(account || '')}`;
}

function getCapacitorPlugins() {
  return window.Capacitor?.Plugins || {};
}

function unsupportedFeatureError(feature, details = '') {
  const suffix = details ? ` ${details}` : '';
  return new Error(`${feature} is not supported on the Capacitor adapter.${suffix}`);
}

function decodeBase64(base64) {
  if (typeof base64 !== 'string' || !base64) {
    return '';
  }
  try {
    return atob(base64);
  } catch (_error) {
    return '';
  }
}

async function pickSingleFile(accept = '.json,application/json,text/plain') {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.style.display = 'none';
    input.addEventListener('change', () => {
      resolve(input.files?.[0] || null);
      input.remove();
    });
    input.addEventListener('cancel', () => {
      resolve(null);
      input.remove();
    });
    input.addEventListener('error', () => {
      reject(new Error('Failed to pick file.'));
      input.remove();
    });
    document.body.appendChild(input);
    input.click();
  });
}

async function openFileWithInputFallback(accept, suggestedType = 'application/octet-stream') {
  const file = await pickSingleFile(accept);
  if (!file) {
    return null;
  }
  return {
    name: file.name,
    path: '',
    text: await file.text(),
    type: file.type || suggestedType,
    handle: file,
  };
}

async function openFileWithCapacitorPicker(extensions = ['json', 'txt', 'md']) {
  const { FilePicker } = getCapacitorPlugins();
  if (!FilePicker || typeof FilePicker.pickFiles !== 'function') {
    return null;
  }

  const result = await FilePicker.pickFiles({
    multiple: false,
    readData: true,
    types: extensions,
  });

  const [first] = Array.isArray(result?.files) ? result.files : [];
  if (!first) {
    return null;
  }

  const text = first.data ? decodeBase64(first.data) : '';
  return {
    name: first.name || 'file',
    path: String(first.path || ''),
    text,
    type: first.mimeType || 'application/octet-stream',
    handle: first,
  };
}

async function triggerDownload(text, suggestedName, type = 'application/json') {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = suggestedName;
  link.click();
  URL.revokeObjectURL(url);
}

export const capacitorPlatform = createPlatformApi({
  getPlatformType() {
    return PLATFORM_TYPES.CAPACITOR;
  },

  async subscribeToFileDrops() {
    // Mobile webviews do not provide desktop drag/drop semantics.
    return () => {};
  },

  async openTextFile() {
    const picked = await openFileWithCapacitorPicker(['txt', 'md', 'json']);
    if (picked) {
      return picked;
    }
    return openFileWithInputFallback('.json,application/json,text/plain', 'text/plain');
  },

  async openJsonFile() {
    const picked = await openFileWithCapacitorPicker(['json']);
    if (picked) {
      return picked;
    }
    return openFileWithInputFallback('.json,application/json', 'application/json');
  },

  async saveTextFile(text, { suggestedName = 'file.txt' } = {}) {
    await triggerDownload(String(text ?? ''), suggestedName, 'text/plain;charset=utf-8');
    return { handle: null, path: '', name: suggestedName };
  },

  async saveJsonFile(data, options = {}) {
    const text = `${JSON.stringify(data, null, 2)}\n`;
    await triggerDownload(text, options.suggestedName || 'data.json', 'application/json');
    return { handle: null, path: '', name: options.suggestedName || 'data.json' };
  },

  async openDirectory() {
    // Explicit boundary: local directory handles are desktop/browser-only.
    throw unsupportedFeatureError('Directory selection', 'Use cloud providers (GitHub/S3) on mobile.');
  },

  async readTextFile(pathOrHandle) {
    if (pathOrHandle && typeof pathOrHandle.text === 'function') {
      return pathOrHandle.text();
    }
    if (typeof pathOrHandle?.data === 'string') {
      return decodeBase64(pathOrHandle.data);
    }
    throw unsupportedFeatureError('Reading arbitrary local files', 'Provide a File object returned by openTextFile/openJsonFile.');
  },

  async writeTextFile(pathOrHandle, text) {
    if (pathOrHandle && typeof pathOrHandle.createWritable === 'function') {
      const writable = await pathOrHandle.createWritable();
      await writable.write(text);
      await writable.close();
      return;
    }
    throw unsupportedFeatureError('In-place file writes', 'Use saveTextFile() to export content on mobile.');
  },

  async rememberWorkspaceState(snapshot) {
    await persistLocalStateString(WORKSPACE_KEY, JSON.stringify(snapshot));
  },

  async loadWorkspaceState() {
    await mirrorNativePreferencesToLocalStorage([WORKSPACE_KEY]);
    const raw = readLocalStorageString(WORKSPACE_KEY, '');
    if (!raw) {
      return null;
    }
    return JSON.parse(raw);
  },

  async setCredential({ namespace, account, secret }) {
    sessionCredentials.set(credentialKey(namespace, account), String(secret ?? ''));
  },

  async getCredential({ namespace, account }) {
    const value = sessionCredentials.get(credentialKey(namespace, account));
    return typeof value === 'string' ? value : null;
  },

  async deleteCredential({ namespace, account }) {
    sessionCredentials.delete(credentialKey(namespace, account));
  },

  async openExternalUrl(url) {
    const normalized = String(url || '').trim();
    if (!normalized) {
      return;
    }

    const { Browser, App } = getCapacitorPlugins();
    if (Browser && typeof Browser.open === 'function') {
      await Browser.open({ url: normalized });
      return;
    }
    if (App && typeof App.openUrl === 'function') {
      await App.openUrl({ url: normalized });
      return;
    }
    window.open(normalized, '_blank', 'noopener');
  },

  reviveHandle(raw) {
    return raw || null;
  },
});
