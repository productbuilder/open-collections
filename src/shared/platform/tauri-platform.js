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

export const tauriPlatform = createPlatformApi({
  getPlatformType() {
    return PLATFORM_TYPES.TAURI;
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

  reviveHandle,
});
