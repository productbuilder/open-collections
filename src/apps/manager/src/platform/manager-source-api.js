import { getPlatform } from '../../../../shared/platform/index.js';

const platform = getPlatform();

export async function pickLocalHostDirectory() {
  return platform.openDirectory();
}

export async function subscribeToManagerFileDrops(listener) {
  return platform.subscribeToFileDrops(listener);
}
