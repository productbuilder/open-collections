import { getPlatform } from '../../../../shared/platform/index.js';

const CREDENTIAL_NAMESPACE = 'open-collections.manager.github-token.v1';

function sourceAccountId(source = {}) {
  return `${source.providerId || 'unknown'}::${source.id || ''}`;
}

export function createCredentialStore() {
  const platform = getPlatform();

  return {
    async storeSourceSecret(source, config = {}) {
      if (source?.providerId !== 'github') {
        return;
      }
      const token = (config.token || '').trim();
      const account = sourceAccountId(source);
      if (!account) {
        return;
      }
      if (!token) {
        await platform.deleteCredential({ namespace: CREDENTIAL_NAMESPACE, account });
        return;
      }
      await platform.setCredential({ namespace: CREDENTIAL_NAMESPACE, account, secret: token });
    },

    async loadSourceSecret(source, config = {}) {
      if (source?.providerId !== 'github') {
        return { ...config };
      }
      const account = sourceAccountId(source);
      const token = account
        ? await platform.getCredential({ namespace: CREDENTIAL_NAMESPACE, account })
        : null;
      return {
        ...config,
        token: (token || '').trim(),
      };
    },

    async deleteSourceSecret(source) {
      if (source?.providerId !== 'github') {
        return;
      }
      const account = sourceAccountId(source);
      if (!account) {
        return;
      }
      await platform.deleteCredential({ namespace: CREDENTIAL_NAMESPACE, account });
    },
  };
}
