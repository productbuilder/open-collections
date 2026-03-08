import { validateCollectionShape } from '../../../packages/collector-schema/src/schema.js';
import {
  READ_ONLY_CAPABILITIES,
  cloneItem,
  providerNotConnectedError,
} from '../../provider-core/src/provider.js';

export function createPublicUrlProvider() {
  let connected = false;
  let manifestUrl = '';
  let collection = null;

  return {
    id: 'public-url',
    label: 'Public URL',

    async connect(config = {}) {
      manifestUrl = config.manifestUrl || '';
      if (!manifestUrl) {
        connected = false;
        return {
          ok: false,
          message: 'Enter a manifest URL to connect.',
          capabilities: READ_ONLY_CAPABILITIES,
        };
      }

      try {
        const response = await fetch(manifestUrl);
        if (!response.ok) {
          connected = false;
          return {
            ok: false,
            message: `Failed to fetch manifest (${response.status}).`,
            capabilities: READ_ONLY_CAPABILITIES,
          };
        }

        const json = await response.json();
        const validationErrors = validateCollectionShape(json);
        if (validationErrors.length > 0) {
          connected = false;
          return {
            ok: false,
            message: `Manifest schema invalid: ${validationErrors.join(' ')}`,
            capabilities: READ_ONLY_CAPABILITIES,
          };
        }

        collection = cloneItem(json);
        connected = true;
        return {
          ok: true,
          message: `Connected to ${manifestUrl}`,
          capabilities: READ_ONLY_CAPABILITIES,
        };
      } catch (error) {
        connected = false;
        return {
          ok: false,
          message: `Could not load manifest URL: ${error.message}`,
          capabilities: READ_ONLY_CAPABILITIES,
        };
      }
    },

    async listAssets() {
      if (!connected) {
        throw providerNotConnectedError('public-url');
      }
      return (collection.items || []).map(cloneItem);
    },

    async getAsset(id) {
      if (!connected) {
        throw providerNotConnectedError('public-url');
      }

      const item = (collection.items || []).find((entry) => entry.id === id);
      return item ? cloneItem(item) : null;
    },

    async saveMetadata() {
      throw new Error('Public URL mode is read-only in MVP.');
    },

    async exportCollection(collectionMeta) {
      if (!connected) {
        throw providerNotConnectedError('public-url');
      }

      return {
        id: collectionMeta.id,
        title: collectionMeta.title,
        description: collectionMeta.description,
        items: (collection.items || []).map(cloneItem),
      };
    },

    getCapabilities() {
      return READ_ONLY_CAPABILITIES;
    },
  };
}
