import { getPlatform } from '../../../../shared/platform/index.js';

const CREDENTIAL_NAMESPACES = {
  github: 'open-collections.manager.github-token.v1',
  s3: 'open-collections.manager.s3-credentials.v1',
};

function sourceAccountId(source = {}) {
  return `${source.providerId || 'unknown'}::${source.id || ''}`;
}

function secretPayloadFor(source, config = {}) {
  if (source?.providerId === 'github') {
    return {
      token: (config.token || '').trim(),
    };
  }

  if (source?.providerId === 's3') {
    return {
      accessKey: (config.accessKey || '').trim(),
      secretKey: config.secretKey || '',
    };
  }

  return null;
}

function mergeSecretPayload(source, config = {}, payload = null) {
  if (source?.providerId === 'github') {
    return {
      ...config,
      token: (payload?.token || '').trim(),
    };
  }

  if (source?.providerId === 's3') {
    return {
      ...config,
      accessKey: (payload?.accessKey || '').trim(),
      secretKey: payload?.secretKey || '',
    };
  }

  return { ...config };
}

export function createCredentialStore() {
  const platform = getPlatform();

  return {
    async storeSourceSecret(source, config = {}) {
      const namespace = CREDENTIAL_NAMESPACES[source?.providerId];
      if (!namespace) {
        return;
      }

      const payload = secretPayloadFor(source, config);
      const account = sourceAccountId(source);
      if (!account || !payload) {
        return;
      }

      const hasSecret = Object.values(payload).some((value) => String(value || '').trim());
      if (!hasSecret) {
        await platform.deleteCredential({ namespace, account });
        return;
      }

      await platform.setCredential({ namespace, account, secret: JSON.stringify(payload) });
    },

    async loadSourceSecret(source, config = {}) {
      const namespace = CREDENTIAL_NAMESPACES[source?.providerId];
      if (!namespace) {
        return { ...config };
      }

      const account = sourceAccountId(source);
      const stored = account
        ? await platform.getCredential({ namespace, account })
        : null;

      if (!stored) {
        return mergeSecretPayload(source, config, null);
      }

      if (source?.providerId === 'github') {
        return mergeSecretPayload(source, config, { token: stored });
      }

      try {
        return mergeSecretPayload(source, config, JSON.parse(stored));
      } catch (_error) {
        return mergeSecretPayload(source, config, null);
      }
    },

    async deleteSourceSecret(source) {
      const namespace = CREDENTIAL_NAMESPACES[source?.providerId];
      if (!namespace) {
        return;
      }
      const account = sourceAccountId(source);
      if (!account) {
        return;
      }
      await platform.deleteCredential({ namespace, account });
    },
  };
}
