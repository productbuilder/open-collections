export const PLATFORM_TYPES = Object.freeze({
  BROWSER: 'browser',
  TAURI: 'tauri',
});

export function createPlatformApi(implementation) {
  if (!implementation || typeof implementation !== 'object') {
    throw new Error('Platform implementation is required.');
  }

  const required = [
    'getPlatformType',
    'subscribeToFileDrops',
    'openTextFile',
    'openJsonFile',
    'saveTextFile',
    'saveJsonFile',
    'openDirectory',
    'readTextFile',
    'writeTextFile',
    'rememberWorkspaceState',
    'loadWorkspaceState',
    'setCredential',
    'getCredential',
    'deleteCredential',
    'reviveHandle',
  ];

  for (const key of required) {
    if (typeof implementation[key] !== 'function') {
      throw new Error(`Platform implementation is missing ${key}().`);
    }
  }

  return implementation;
}
