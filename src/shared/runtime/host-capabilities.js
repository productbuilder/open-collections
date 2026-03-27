import { APP_RUNTIME_MODES } from './app-mount-contract.js';

function noop() {}

function normalizeMode(mode) {
  return mode === APP_RUNTIME_MODES.EMBEDDED
    ? APP_RUNTIME_MODES.EMBEDDED
    : APP_RUNTIME_MODES.STANDALONE;
}

function createMemoryPersistence() {
  const store = new Map();
  return {
    async getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    async setItem(key, value) {
      store.set(key, value);
    },
    async removeItem(key) {
      store.delete(key);
    },
  };
}

export function createHostCapabilities({
  platformApi = null,
  persistence = null,
  mode = APP_RUNTIME_MODES.STANDALONE,
  safeAreaInsets = null,
  notify = null,
  openExternalLink = null,
  showDialog = null,
  closeDialog = null,
} = {}) {
  const resolvedPersistence = persistence || createMemoryPersistence();

  return {
    mode: normalizeMode(mode),

    notify(message, options = {}) {
      if (typeof notify === 'function') {
        notify(String(message || ''), options);
        return;
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('oc:host-toast', {
          detail: {
            message: String(message || ''),
            tone: options.tone || 'neutral',
          },
        }));
      }
    },

    async openExternalLink(url) {
      const normalized = String(url || '').trim();
      if (!normalized) {
        return;
      }
      if (typeof openExternalLink === 'function') {
        await openExternalLink(normalized);
        return;
      }
      if (platformApi?.openExternalUrl) {
        await platformApi.openExternalUrl(normalized);
        return;
      }
      window.open(normalized, '_blank', 'noopener');
    },

    async writeClipboardText(value) {
      const text = String(value || '');
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
      return false;
    },

    async share(data = {}) {
      if (navigator.share) {
        await navigator.share(data);
        return true;
      }
      return false;
    },

    async getPersistedState(key) {
      return resolvedPersistence.getItem(String(key || ''));
    },

    async setPersistedState(key, value) {
      await resolvedPersistence.setItem(String(key || ''), value);
    },

    async clearPersistedState(key) {
      await resolvedPersistence.removeItem(String(key || ''));
    },

    getLayoutHints() {
      return {
        safeAreaInsets: safeAreaInsets || {
          top: 'env(safe-area-inset-top, 0px)',
          right: 'env(safe-area-inset-right, 0px)',
          bottom: 'env(safe-area-inset-bottom, 0px)',
          left: 'env(safe-area-inset-left, 0px)',
        },
      };
    },

    showDialog: typeof showDialog === 'function' ? showDialog : noop,
    closeDialog: typeof closeDialog === 'function' ? closeDialog : noop,
  };
}
