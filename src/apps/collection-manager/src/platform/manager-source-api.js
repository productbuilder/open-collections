import { getPlatform, PLATFORM_TYPES } from '../../../../shared/platform/index.js';

const platform = getPlatform();

export function supportsLocalHostDirectoryPicker() {
  const platformType = platform.getPlatformType();
  if (platformType === PLATFORM_TYPES.TAURI) {
    return true;
  }
  if (platformType === PLATFORM_TYPES.BROWSER) {
    return typeof window.showDirectoryPicker === 'function';
  }
  // Mobile/Capacitor currently does not expose a directory-handle equivalent.
  return false;
}

export async function pickLocalHostDirectory() {
  return platform.openDirectory();
}

export async function subscribeToManagerFileDrops(listener) {
  return platform.subscribeToFileDrops(listener);
}

export async function pickManagerImageFiles({ multiple = true } = {}) {
  if (typeof platform.pickImageFiles !== 'function') {
    throw new Error('Image picking is not supported on this platform adapter.');
  }
  const files = await platform.pickImageFiles({ multiple });
  return Array.isArray(files) ? files : [];
}

export async function pickManagerDocumentFiles({ multiple = false } = {}) {
  if (typeof platform.pickDocumentFiles !== 'function') {
    throw new Error('Document picking is not supported on this platform adapter.');
  }
  const files = await platform.pickDocumentFiles({ multiple });
  return Array.isArray(files) ? files : [];
}
