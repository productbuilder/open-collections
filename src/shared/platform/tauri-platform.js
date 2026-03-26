import { PLATFORM_TYPES, createPlatformApi } from './platform-api.js';

function getInvoke() {
  if (window.__TAURI__?.core?.invoke) {
    return window.__TAURI__.core.invoke;
  }
  if (window.__TAURI_INTERNALS__?.invoke) {
    return window.__TAURI_INTERNALS__.invoke;
  }
  throw new Error('Tauri invoke API is unavailable.');
}

async function invoke(command, args = {}) {
  const fn = getInvoke();
  return fn(command, args);
}

async function pickFilesWithInput({ accept = '', multiple = false } = {}) {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = String(accept || '');
    input.multiple = Boolean(multiple);
    input.style.display = 'none';
    input.addEventListener('change', () => {
      resolve(Array.from(input.files || []));
      input.remove();
    });
    input.addEventListener('cancel', () => {
      resolve([]);
      input.remove();
    });
    input.addEventListener('error', () => {
      reject(new Error('Failed to pick files.'));
      input.remove();
    });
    document.body.appendChild(input);
    input.click();
  });
}

function logCredentialBridge(event, payload = {}) {
  try {
    console.info(`[tauri-platform][credentials] ${event}`, payload);
  } catch (_error) {
    // ignore logging failures
  }
}

function createFsError(name, message) {
  const error = new Error(message);
  error.name = name;
  return error;
}

function toByteArray(value) {
  if (value == null) {
    return [];
  }
  if (typeof value === 'string') {
    return null;
  }
  if (value instanceof ArrayBuffer) {
    return Array.from(new Uint8Array(value));
  }
  if (ArrayBuffer.isView(value)) {
    return Array.from(new Uint8Array(value.buffer, value.byteOffset, value.byteLength));
  }
  return null;
}

class TauriFileHandle {
  constructor(path) {
    this.kind = 'file';
    this.path = String(path || '');
    this.name = this.path.split(/[/\\]/).pop() || '';
  }

  async getFile() {
    const bytes = await invoke('platform_read_binary_file', { path: this.path });
    const payload = Uint8Array.from(Array.isArray(bytes) ? bytes : []);
    if (typeof File === 'function') {
      return new File([payload], this.name || 'file');
    }
    return new Blob([payload]);
  }

  async createWritable() {
    const path = this.path;
    return {
      async write(value) {
        if (value instanceof Blob) {
          const bytes = Array.from(new Uint8Array(await value.arrayBuffer()));
          await invoke('platform_write_binary_file', { path, bytes });
          return;
        }
        const bytes = toByteArray(value);
        if (bytes) {
          await invoke('platform_write_binary_file', { path, bytes });
          return;
        }
        await invoke('platform_write_text_file', { path, text: String(value ?? '') });
      },
      async close() {},
    };
  }
}

class TauriDirectoryHandle {
  constructor(path) {
    this.kind = 'directory';
    this.path = String(path || '');
    this.name = this.path.split(/[/\\]/).pop() || this.path;
  }

  async getDirectoryHandle(name, options = {}) {
    const nextPath = await invoke('platform_join_path', { base: this.path, name });
    const exists = await invoke('platform_directory_exists', { path: nextPath });
    if (!exists && options?.create) {
      await invoke('platform_create_directory', { path: nextPath });
      return new TauriDirectoryHandle(nextPath);
    }
    if (!exists) {
      throw createFsError('NotFoundError', `Directory not found: ${name}`);
    }
    return new TauriDirectoryHandle(nextPath);
  }

  async getFileHandle(name, options = {}) {
    const nextPath = await invoke('platform_join_path', { base: this.path, name });
    const exists = await invoke('platform_file_exists', { path: nextPath });
    if (!exists && options?.create) {
      await invoke('platform_write_binary_file', { path: nextPath, bytes: [] });
      return new TauriFileHandle(nextPath);
    }
    if (!exists) {
      throw createFsError('NotFoundError', `File not found: ${name}`);
    }
    return new TauriFileHandle(nextPath);
  }

  async *entries() {
    const entries = await invoke('platform_read_directory', { path: this.path });
    for (const entry of entries) {
      if (entry.kind === 'directory') {
        yield [entry.name, new TauriDirectoryHandle(entry.path)];
      } else {
        yield [entry.name, new TauriFileHandle(entry.path)];
      }
    }
  }
}

function reviveHandle(raw) {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  if (raw.kind === 'file' && raw.path) {
    return new TauriFileHandle(raw.path);
  }
  if (raw.kind === 'directory' && raw.path) {
    return new TauriDirectoryHandle(raw.path);
  }
  return null;
}

function inferMimeTypeFromPath(path = '') {
  const normalizedPath = String(path || '').toLowerCase();
  if (normalizedPath.endsWith('.jpg') || normalizedPath.endsWith('.jpeg')) {
    return 'image/jpeg';
  }
  if (normalizedPath.endsWith('.png')) {
    return 'image/png';
  }
  if (normalizedPath.endsWith('.webp')) {
    return 'image/webp';
  }
  if (normalizedPath.endsWith('.gif')) {
    return 'image/gif';
  }
  return '';
}

function fileNameFromPath(path = '') {
  return String(path || '').split(/[/\\]/).pop() || '';
}

async function fileFromPath(path) {
  const normalizedPath = String(path || '').trim();
  if (!normalizedPath) {
    return null;
  }

  const bytes = await invoke('platform_read_binary_file', { path: normalizedPath });
  const payload = Uint8Array.from(Array.isArray(bytes) ? bytes : []);
  const fileName = fileNameFromPath(normalizedPath) || 'file';
  const type = inferMimeTypeFromPath(normalizedPath);

  if (typeof File === 'function') {
    return new File([payload], fileName, { type });
  }

  const blob = new Blob([payload], { type });
  return Object.assign(blob, {
    name: fileName,
    path: normalizedPath,
    lastModified: Date.now(),
  });
}

async function filesFromPaths(paths = []) {
  const files = await Promise.all((Array.isArray(paths) ? paths : []).map(async (path) => {
    try {
      return await fileFromPath(path);
    } catch (_error) {
      return null;
    }
  }));
  return files.filter(Boolean);
}

function normalizeDropPayload(type, payload = {}) {
  return {
    type,
    paths: Array.isArray(payload.paths) ? payload.paths.map((path) => String(path || '')).filter(Boolean) : [],
    position: payload.position || null,
  };
}

async function subscribeWithWebviewApi(handler) {
  const getCurrentWebview = window.__TAURI__?.webview?.getCurrentWebview;
  if (typeof getCurrentWebview !== 'function') {
    return null;
  }

  const webview = getCurrentWebview();
  if (!webview || typeof webview.onDragDropEvent !== 'function') {
    return null;
  }

  return webview.onDragDropEvent(async (event) => {
    const payload = normalizeDropPayload(event?.payload?.type, event?.payload || {});
    if (payload.type === 'drop') {
      payload.files = await filesFromPaths(payload.paths);
    }
    await handler(payload);
  });
}

async function subscribeWithEventApi(handler) {
  const eventApi = window.__TAURI__?.event;
  const listen = eventApi?.listen;
  const events = eventApi?.TauriEvent;
  if (typeof listen !== 'function' || !events) {
    return null;
  }

  const registrations = await Promise.all([
    ['enter', events.DRAG_ENTER],
    ['over', events.DRAG_OVER],
    ['leave', events.DRAG_LEAVE],
    ['drop', events.DRAG_DROP],
  ].map(async ([type, eventName]) => listen(eventName, async (event) => {
    const payload = normalizeDropPayload(type, event?.payload || {});
    if (type === 'drop') {
      payload.files = await filesFromPaths(payload.paths);
    }
    await handler(payload);
  })));

  return () => {
    for (const unlisten of registrations) {
      try {
        unlisten();
      } catch (_error) {
        // Ignore cleanup failures during teardown.
      }
    }
  };
}

export const tauriPlatform = createPlatformApi({
  getPlatformType() {
    return PLATFORM_TYPES.TAURI;
  },

  async subscribeToFileDrops(handler) {
    if (typeof handler !== 'function') {
      return () => {};
    }

    const webviewUnlisten = await subscribeWithWebviewApi(handler);
    if (typeof webviewUnlisten === 'function') {
      return webviewUnlisten;
    }

    const eventUnlisten = await subscribeWithEventApi(handler);
    if (typeof eventUnlisten === 'function') {
      return eventUnlisten;
    }

    return () => {};
  },

  async openTextFile() {
    const result = await invoke('platform_open_text_file');
    if (!result) {
      return null;
    }
    return { ...result, handle: new TauriFileHandle(result.path) };
  },

  async openJsonFile() {
    const result = await invoke('platform_open_json_file');
    if (!result) {
      return null;
    }
    return { ...result, handle: new TauriFileHandle(result.path) };
  },

  async pickImageFiles({ multiple = true } = {}) {
    return pickFilesWithInput({
      accept: '.jpg,.jpeg,.png,.webp,.gif,.avif,.heic,.heif,image/*',
      multiple,
    });
  },

  async pickDocumentFiles({ multiple = false } = {}) {
    return pickFilesWithInput({
      accept: '.json,.txt,.md,.csv,.pdf,.doc,.docx,.odt,.rtf,text/plain,application/json,application/pdf',
      multiple,
    });
  },

  async saveTextFile(text, { suggestedName = 'file.txt', handle = null } = {}) {
    if (handle?.path) {
      await invoke('platform_write_text_file', { path: handle.path, text: String(text ?? '') });
      return { path: handle.path, name: handle.name || suggestedName, handle };
    }
    const result = await invoke('platform_save_text_file', { text: String(text ?? ''), suggestedName });
    if (!result) {
      return null;
    }
    return { ...result, handle: new TauriFileHandle(result.path) };
  },

  async saveJsonFile(data, options = {}) {
    const text = `${JSON.stringify(data, null, 2)}\n`;
    return this.saveTextFile(text, { suggestedName: options.suggestedName || 'data.json', handle: options.handle || null });
  },

  async openDirectory() {
    const path = await invoke('platform_open_directory');
    if (!path) {
      return null;
    }
    return new TauriDirectoryHandle(path);
  },

  async readTextFile(pathOrHandle) {
    const path = typeof pathOrHandle === 'string' ? pathOrHandle : pathOrHandle?.path;
    if (!path) {
      throw new Error('File path is required.');
    }
    return invoke('platform_read_text_file', { path });
  },

  async writeTextFile(pathOrHandle, text) {
    const path = typeof pathOrHandle === 'string' ? pathOrHandle : pathOrHandle?.path;
    if (!path) {
      throw new Error('File path is required.');
    }
    await invoke('platform_write_text_file', { path, text: String(text ?? '') });
  },

  async rememberWorkspaceState(snapshot) {
    await invoke('platform_remember_workspace_state', { snapshot });
  },

  async loadWorkspaceState() {
    return invoke('platform_load_workspace_state');
  },

  async setCredential({ namespace, account, secret }) {
    const normalizedSecret = String(secret ?? '');
    logCredentialBridge('set:start', {
      namespace,
      account,
      secretLength: normalizedSecret.length,
    });
    try {
      await invoke('platform_set_credential', { namespace, account, secret: normalizedSecret });
      logCredentialBridge('set:ok', {
        namespace,
        account,
      });
    } catch (error) {
      logCredentialBridge('set:error', {
        namespace,
        account,
        error: error?.message || String(error),
      });
      throw error;
    }
  },

  async getCredential({ namespace, account }) {
    logCredentialBridge('get:start', { namespace, account });
    try {
      const value = await invoke('platform_get_credential', { namespace, account });
      logCredentialBridge('get:done', {
        namespace,
        account,
        found: Boolean(value),
        secretLength: value ? String(value).length : 0,
      });
      return value;
    } catch (error) {
      logCredentialBridge('get:error', {
        namespace,
        account,
        error: error?.message || String(error),
      });
      throw error;
    }
  },

  async deleteCredential({ namespace, account }) {
    logCredentialBridge('delete:start', { namespace, account });
    try {
      await invoke('platform_delete_credential', { namespace, account });
      logCredentialBridge('delete:ok', { namespace, account });
    } catch (error) {
      logCredentialBridge('delete:error', {
        namespace,
        account,
        error: error?.message || String(error),
      });
      throw error;
    }
  },
  async openExternalUrl(url) {
    const normalized = String(url || '').trim();
    if (!normalized) {
      return;
    }
    try {
      await invoke('platform_open_external_url', { url: normalized });
    } catch (_error) {
      window.open(normalized, '_blank', 'noopener');
    }
  },

  reviveHandle,
});
