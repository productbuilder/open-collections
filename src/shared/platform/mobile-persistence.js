// Lightweight mobile-safe key/value persistence for preferences, recents, and small draft metadata.
// Filesystem-grade draft assets and directory workflows remain deferred to desktop/OPFS runtimes.
const NATIVE_MIRROR_NAMESPACE = 'openCollections';

function getCapacitorPreferencesPlugin() {
  const capacitor = window.Capacitor;
  if (!capacitor) {
    return null;
  }
  const plugins = capacitor.Plugins || {};
  const plugin = plugins.Preferences;
  if (plugin && typeof plugin.get === 'function' && typeof plugin.set === 'function') {
    return plugin;
  }
  return null;
}

function isNativeCapacitorRuntime() {
  const capacitor = window.Capacitor;
  if (!capacitor) {
    return false;
  }
  if (typeof capacitor.isNativePlatform === 'function') {
    return Boolean(capacitor.isNativePlatform());
  }
  if (typeof capacitor.getPlatform === 'function') {
    return capacitor.getPlatform() !== 'web';
  }
  return false;
}

export function readLocalStorageString(key, fallback = '') {
  const normalizedKey = String(key || '').trim();
  if (!normalizedKey) {
    return String(fallback ?? '');
  }

  const value = window.localStorage.getItem(normalizedKey);
  if (typeof value !== 'string') {
    return String(fallback ?? '');
  }
  return value;
}

export async function mirrorNativePreferencesToLocalStorage(keys = []) {
  const plugin = getCapacitorPreferencesPlugin();
  if (!isNativeCapacitorRuntime() || !plugin || !Array.isArray(keys) || keys.length === 0) {
    return;
  }

  try {
    if (typeof plugin.configure === 'function') {
      await plugin.configure({ group: NATIVE_MIRROR_NAMESPACE });
    }
  } catch (_error) {
    // Ignore optional group configuration failures.
  }

  for (const rawKey of keys) {
    const key = String(rawKey || '').trim();
    if (!key) {
      continue;
    }

    try {
      const result = await plugin.get({ key });
      if (typeof result?.value === 'string') {
        window.localStorage.setItem(key, result.value);
      }
    } catch (_error) {
      // Leave localStorage as-is when native preferences are unavailable.
    }
  }
}

export async function persistLocalStateString(key, value) {
  const normalizedKey = String(key || '').trim();
  if (!normalizedKey) {
    return;
  }

  const normalizedValue = String(value ?? '');
  try {
    window.localStorage.setItem(normalizedKey, normalizedValue);
  } catch (_error) {
    // Ignore web storage failures and still attempt native preference storage.
  }

  const plugin = getCapacitorPreferencesPlugin();
  if (!isNativeCapacitorRuntime() || !plugin) {
    return;
  }

  try {
    if (typeof plugin.configure === 'function') {
      await plugin.configure({ group: NATIVE_MIRROR_NAMESPACE });
    }
    await plugin.set({ key: normalizedKey, value: normalizedValue });
  } catch (_error) {
    // Keep the localStorage fallback when native persistence fails.
  }
}

export function persistLocalStateStringSoon(key, value) {
  void persistLocalStateString(key, value);
}
