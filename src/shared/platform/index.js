import { browserPlatform } from './browser-platform.js';
import { tauriPlatform } from './tauri-platform.js';
import { capacitorPlatform } from './capacitor-platform.js';

function isTauriRuntime() {
  return Boolean(window.__TAURI_INTERNALS__ || window.__TAURI__?.core?.invoke);
}

function isCapacitorRuntime() {
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

const platform = isTauriRuntime()
  ? tauriPlatform
  : isCapacitorRuntime()
    ? capacitorPlatform
    : browserPlatform;

export function getPlatform() {
  return platform;
}

export function getPlatformType() {
  return platform.getPlatformType();
}

export function revivePlatformHandle(raw) {
  return platform.reviveHandle(raw);
}

export * from './platform-api.js';
