import {
  PROVIDER_AVAILABILITY,
  READ_ONLY_CAPABILITIES,
  createProviderDescriptor,
  providerNotConnectedError,
} from '../../provider-core/src/provider.js';

function normalizePrefix(value = '') {
  return String(value || '').trim().replace(/^\/+/, '').replace(/\/+$/, '');
}

function normalizeEndpoint(value = '') {
  return String(value || '').trim().replace(/\/+$/, '');
}

function s3Capabilities({ configured = false, connected = false, credentialsPresent = false } = {}) {
  return {
    ...READ_ONLY_CAPABILITIES,
    canRead: false,
    canWrite: false,
    canPublish: false,
    canStoreAssets: false,
    canStoreManifest: false,
    requiresCredentials: true,
    supportsReconnect: true,
    supportsPull: false,
    supportsPush: false,
    canConfigure: configured,
    hasCredentials: credentialsPresent,
    connectionReady: connected,
  };
}

export function createS3Provider() {
  let connected = false;
  let configState = {
    endpoint: '',
    bucket: '',
    region: '',
    basePath: '',
    accessKey: '',
    secretKey: '',
  };

  let capabilities = s3Capabilities();

  const descriptor = createProviderDescriptor({
    id: 's3',
    label: 'S3-compatible storage',
    category: 'external',
    availability: PROVIDER_AVAILABILITY.experimental,
    description: 'Configure an S3-compatible object storage host as a publish target.',
    statusLabel: 'Foundation',
    capabilities,
  });

  return {
    ...descriptor,

    getDescriptor() {
      return descriptor;
    },

    async connect(config = {}) {
      configState = {
        endpoint: normalizeEndpoint(config.endpoint),
        bucket: String(config.bucket || '').trim(),
        region: String(config.region || '').trim(),
        basePath: normalizePrefix(config.basePath),
        accessKey: String(config.accessKey || '').trim(),
        secretKey: config.secretKey || '',
      };

      const configured = Boolean(configState.endpoint && configState.bucket);
      const credentialsPresent = Boolean(configState.accessKey && configState.secretKey);

      if (!configured) {
        connected = false;
        capabilities = s3Capabilities({ configured, connected, credentialsPresent });
        return {
          ok: false,
          message: 'Enter endpoint and bucket to configure this S3-compatible host.',
          capabilities,
        };
      }

      if (!credentialsPresent) {
        connected = false;
        capabilities = s3Capabilities({ configured, connected, credentialsPresent });
        return {
          ok: false,
          message: 'Credentials are required. Add access key and secret key to reconnect this host.',
          capabilities,
        };
      }

      connected = true;
      capabilities = s3Capabilities({ configured, connected, credentialsPresent });
      return {
        ok: true,
        message:
          'S3-compatible host configured. Publish and pull support will be added in a follow-up pass.',
        capabilities,
      };
    },

    async listAssets() {
      if (!connected) {
        throw providerNotConnectedError('s3');
      }
      return [];
    },

    async getAsset() {
      if (!connected) {
        throw providerNotConnectedError('s3');
      }
      return null;
    },

    async saveMetadata() {
      throw new Error('S3 metadata save is not implemented yet.');
    },

    async exportCollection(collectionMeta) {
      if (!connected) {
        throw providerNotConnectedError('s3');
      }

      return {
        id: collectionMeta.id,
        title: collectionMeta.title,
        description: collectionMeta.description,
        items: [],
      };
    },

    async publishCollection() {
      throw new Error('S3 publish is not implemented yet. Configure the host now and publish support will follow.');
    },

    getCapabilities() {
      return capabilities;
    },
  };
}
