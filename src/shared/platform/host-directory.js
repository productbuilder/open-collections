import { getPlatform, PLATFORM_TYPES } from './index.js';

export function supportsHostDirectoryPicker() {
  const platform = getPlatform();
  const platformType = platform.getPlatformType();

  if (platformType === PLATFORM_TYPES.TAURI) {
    return true;
  }

  if (platformType === PLATFORM_TYPES.BROWSER) {
    return typeof window.showDirectoryPicker === 'function';
  }

  return false;
}

export async function pickHostDirectory() {
  const platform = getPlatform();
  return platform.openDirectory();
}
