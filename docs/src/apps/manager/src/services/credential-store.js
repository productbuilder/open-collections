import { getPlatform } from '../../../../shared/platform/index.js';

const CREDENTIAL_NAMESPACES = {
  github: 'open-collections.manager.github-token.v1',
  s3: 'open-collections.manager.s3-credentials.v1',
};

const CREDENTIAL_LOG_PREFIX = '[credential-store]';

function logCredential(event, payload = {}) {
  try {
    console.info(`${CREDENTIAL_LOG_PREFIX} ${event}`, payload);
  } catch (_error) {
    // ignore logging failures
  }
}

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

function normalizeGithubPath(path) {
  const normalized = normalizeSegment(path || '/').replace(/\\/g, '/');
  const collapsed = normalized.replace(/\/{2,}/g, '/');
  const withoutLeading = collapsed.replace(/^\/+/, '');
  const withoutTrailing = withoutLeading.replace(/\/+$/, '');
  return withoutTrailing || '/';
}

function normalizeGithubPathLegacy(path) {
  const normalized = normalizeSegment(path || '/').replace(/\\/g, '/');
  return normalized || '/';
}

function githubStableAccount(config = {}, options = {}) {
  const owner = normalizeSegment(config.owner).toLowerCase();
  const repo = normalizeSegment(config.repo).toLowerCase();
  const branch = normalizeSegment(config.branch || 'main') || 'main';
  const path = options.legacyPath ? normalizeGithubPathLegacy(config.path) : normalizeGithubPath(config.path);
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
    const stableCanonical = githubStableAccount(config, { legacyPath: false });
    if (stableCanonical) {
      accounts.push(stableCanonical);
    }
    // Compatibility fallback for credentials stored before path canonicalization.
    const stableLegacy = githubStableAccount(config, { legacyPath: true });
    if (stableLegacy && !accounts.includes(stableLegacy)) {
      accounts.push(stableLegacy);
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

function summarizeSourceForLog(source = {}, config = {}) {
  if (source?.providerId === 'github') {
    return {
      providerId: source?.providerId || '',
      sourceId: source?.id || '',
      owner: normalizeSegment(config.owner),
      repo: normalizeSegment(config.repo),
      branch: normalizeSegment(config.branch || 'main') || 'main',
      path: normalizeSegment(config.path || ''),
      hasToken: Boolean(String(config.token || '').trim()),
      tokenLength: String(config.token || '').length,
    };
  }

  if (source?.providerId === 's3') {
    return {
      providerId: source?.providerId || '',
      sourceId: source?.id || '',
      endpoint: normalizeSegment(config.endpoint),
      bucket: normalizeSegment(config.bucket),
      region: normalizeSegment(config.region),
      basePath: normalizeSegment(config.basePath),
      hasAccessKey: Boolean(String(config.accessKey || '').trim()),
      accessKeyLength: String(config.accessKey || '').length,
      hasSecretKey: Boolean(String(config.secretKey || '').trim()),
      secretKeyLength: String(config.secretKey || '').length,
    };
  }

  return {
    providerId: source?.providerId || '',
    sourceId: source?.id || '',
  };
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
      const summary = summarizeSourceForLog(source, config);
      logCredential('store:start', {
        namespace,
        accounts,
        summary,
      });
      if (accounts.length === 0 || !payload) {
        logCredential('store:skipped', {
          reason: accounts.length === 0 ? 'no-accounts' : 'no-secret-payload',
          namespace,
          accounts,
          summary,
        });
        return;
      }

      const hasSecret = Object.values(payload).some((value) => String(value || '').trim());
      if (!hasSecret) {
        for (const account of accounts) {
          try {
            await platform.deleteCredential({ namespace, account });
            logCredential('store:delete-empty-secret:ok', { namespace, account, summary });
          } catch (error) {
            logCredential('store:delete-empty-secret:error', {
              namespace,
              account,
              summary,
              error: error?.message || String(error),
            });
          }
        }
        return;
      }
      const secret = source?.providerId === 'github'
        ? String(payload.token || '')
        : JSON.stringify(payload);
      for (const account of accounts) {
        await platform.setCredential({ namespace, account, secret });
        logCredential('store:set:ok', {
          namespace,
          account,
          summary,
          secretLength: secret.length,
        });
      }
    },

    async loadSourceSecret(source, config = {}) {
      const namespace = CREDENTIAL_NAMESPACES[source?.providerId];
      if (!namespace) {
        return { ...config };
      }

      const accounts = credentialAccountsFor(source, config);
      const summary = summarizeSourceForLog(source, config);
      logCredential('load:start', {
        namespace,
        accounts,
        summary,
      });
      let stored = null;
      let matchedAccount = '';
      for (const account of accounts) {
        try {
          stored = await platform.getCredential({ namespace, account });
          logCredential('load:attempt', {
            namespace,
            account,
            found: Boolean(stored),
            summary,
            secretLength: stored ? String(stored).length : 0,
          });
        } catch (error) {
          logCredential('load:attempt:error', {
            namespace,
            account,
            summary,
            error: error?.message || String(error),
          });
          stored = null;
        }
        if (stored) {
          matchedAccount = account;
          break;
        }
      }

      if (!stored) {
        logCredential('load:miss', {
          namespace,
          accounts,
          summary,
        });
        return mergeSecretPayload(source, config, null);
      }

      if (source?.providerId === 'github') {
        const decodedToken = decodeGithubSecret(stored);
        logCredential('load:hit:github', {
          namespace,
          matchedAccount,
          summary,
          decodedTokenLength: decodedToken.length,
        });
        return mergeSecretPayload(source, config, { token: decodedToken });
      }

      try {
        const parsed = JSON.parse(stored);
        logCredential('load:hit:s3', {
          namespace,
          matchedAccount,
          summary,
          hasAccessKey: Boolean(String(parsed?.accessKey || '').trim()),
          hasSecretKey: Boolean(String(parsed?.secretKey || '').trim()),
        });
        return mergeSecretPayload(source, config, parsed);
      } catch (_error) {
        logCredential('load:parse-error', {
          namespace,
          matchedAccount,
          summary,
        });
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
      logCredential('delete:start', {
        namespace,
        accounts,
        summary: summarizeSourceForLog(source, source?.config || {}),
      });
      for (const account of accounts) {
        try {
          await platform.deleteCredential({ namespace, account });
          logCredential('delete:ok', { namespace, account });
        } catch (error) {
          logCredential('delete:error', {
            namespace,
            account,
            error: error?.message || String(error),
          });
        }
      }
    },
  };
}
