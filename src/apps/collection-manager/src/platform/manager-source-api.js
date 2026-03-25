import { getPlatform } from '../../../../shared/platform/index.js';

const platform = getPlatform();

export function supportsLocalHostDirectoryPicker() {
  if (platform.getPlatformType() === 'tauri') {
    return true;
  }
  return typeof window.showDirectoryPicker === 'function';
}

export async function pickLocalHostDirectory() {
  return platform.openDirectory();
}

export async function subscribeToManagerFileDrops(listener) {
  return platform.subscribeToFileDrops(listener);
}
