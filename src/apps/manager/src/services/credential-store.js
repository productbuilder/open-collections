import { getPlatform } from '../../../../shared/platform/index.js';

const CREDENTIAL_NAMESPACES = {
  github: 'open-collections.manager.github-token.v1',
  s3: 'open-collections.manager.s3-credentials.v1',
};

function sourceAccountId(source = {}) {
  const sourceId = String(source.id || '').trim();
  if (!sourceId) {
    return '';
  }
  return `${source.providerId || 'unknown'}::${sourceId}`;
}

function normalizeSegment(value) {
  return String(value || '').trim();
}

function githubStableAccount(config = {}) {
  const owner = normalizeSegment(config.owner).toLowerCase();
  const repo = normalizeSegment(config.repo).toLowerCase();
  const branch = normalizeSegment(config.branch || 'main') || 'main';
  const path = normalizeSegment(config.path || '/');
  if (!owner || !repo) {
    return '';
  }
  return `github::${owner}/${repo}@${branch}:${path}`;
}

function s3StableAccount(config = {}) {
  const endpoint = normalizeSegment(config.endpoint).toLowerCase();
  const bucket = normalizeSegment(config.bucket).toLowerCase();
  const region = normalizeSegment(config.region).toLowerCase();
  const basePath = normalizeSegment(config.basePath);
  if (!endpoint || !bucket) {
    return '';
  }
  return `s3::${endpoint}/${bucket}:${region}:${basePath}`;
}

function credentialAccountsFor(source = {}, config = {}) {
  const accounts = [];
  if (source?.providerId === 'github') {
    const stable = githubStableAccount(config);
    if (stable) {
      accounts.push(stable);
    }
  } else if (source?.providerId === 's3') {
    const stable = s3StableAccount(config);
    if (stable) {
      accounts.push(stable);
    }
  }
  const legacy = sourceAccountId(source);
  if (legacy && !accounts.includes(legacy)) {
    accounts.push(legacy);
  }
  return accounts.filter(Boolean);
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

function decodeGithubSecret(stored) {
  const raw = String(stored || '').trim();
  if (!raw) {
    return '';
  }
  if (raw.startsWith('{')) {
    try {
      const parsed = JSON.parse(raw);
      return String(parsed?.token || '').trim();
    } catch (_error) {
      return '';
    }
  }
  return raw;
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
      const accounts = credentialAccountsFor(source, config);
      if (accounts.length === 0 || !payload) {
        return;
      }

      const hasSecret = Object.values(payload).some((value) => String(value || '').trim());
      if (!hasSecret) {
        await Promise.all(accounts.map((account) => platform.deleteCredential({ namespace, account }).catch(() => {})));
        return;
      }
      const secret = source?.providerId === 'github'
        ? String(payload.token || '')
        : JSON.stringify(payload);
      await Promise.all(accounts.map((account) => platform.setCredential({ namespace, account, secret })));
    },

    async loadSourceSecret(source, config = {}) {
      const namespace = CREDENTIAL_NAMESPACES[source?.providerId];
      if (!namespace) {
        return { ...config };
      }

      const accounts = credentialAccountsFor(source, config);
      let stored = null;
      for (const account of accounts) {
        try {
          stored = await platform.getCredential({ namespace, account });
        } catch (error) {
          console.warn(`Credential lookup failed for ${source?.providerId || 'source'} account "${account}": ${error.message}`);
          stored = null;
        }
        if (stored) {
          break;
        }
      }

      if (!stored) {
        return mergeSecretPayload(source, config, null);
      }

      if (source?.providerId === 'github') {
        return mergeSecretPayload(source, config, { token: decodeGithubSecret(stored) });
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
      const accounts = credentialAccountsFor(source, source?.config || {});
      if (accounts.length === 0) {
        return;
      }
      await Promise.all(accounts.map((account) => platform.deleteCredential({ namespace, account }).catch(() => {})));
    },
  };
}
