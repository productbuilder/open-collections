import { validateCollectionShape } from '../../../packages/collector-schema/src/schema.js';
import {
  PROVIDER_AVAILABILITY,
  READ_WRITE_CAPABILITIES,
  cloneItem,
  createProviderDescriptor,
  mergeItem,
  providerNotConnectedError,
} from '../../provider-core/src/provider.js';

export function createLocalProvider() {
  let connected = false;
  let sourcePath = '/site/examples/demo-host/collections.json';
  let collections = [];
  let itemsById = new Map();

  const descriptor = createProviderDescriptor({
    id: 'local',
    label: 'Example dataset',
    category: 'builtin',
    availability: PROVIDER_AVAILABILITY.available,
    description: 'Built-in sample collection for local development and quick demos.',
    statusLabel: 'Available',
    capabilities: READ_WRITE_CAPABILITIES,
  });

  function hostLabelFromPath(path) {
    const normalized = String(path || '').replace(/\\/g, '/');
    const parts = normalized.split('/').filter(Boolean);
    if (parts.length === 0) {
      return 'Local host';
    }
    const file = parts[parts.length - 1] || '';
    const dir = file.endsWith('.json') ? (parts[parts.length - 2] || '') : file;
    return dir || 'Local host';
  }

  function toAbsoluteUrl(path, basePath) {
    const raw = String(path || '').trim();
    if (/^[a-z][a-z0-9+.-]*:/i.test(raw)) {
      return new URL(raw).toString();
    }
    if (raw.startsWith('/')) {
      return new URL(raw, window.location.origin).toString();
    }
    return new URL(raw, basePath).toString();
  }

  function toRelativePath(url) {
    try {
      const parsed = new URL(url);
      return `${parsed.pathname}${parsed.search || ''}`;
    } catch (error) {
      return url;
    }
  }

  async function fetchJson(pathOrUrl, basePath = window.location.href) {
    const targetUrl = toAbsoluteUrl(pathOrUrl, basePath);
    const response = await fetch(targetUrl);
    if (!response.ok) {
      throw new Error(`Failed to load ${toRelativePath(targetUrl)} (${response.status}).`);
    }
    const json = await response.json();
    return { json, url: targetUrl };
  }

  function normalizeCollectionManifest(manifest, fallbackId, fallbackTitle, manifestUrl) {
    const collectionId = String(manifest.id || fallbackId || '').trim() || 'collection';
    const collectionTitle = String(manifest.title || fallbackTitle || collectionId).trim() || collectionId;
    const rootPath = String(manifest.rootPath || `${collectionId}/`).trim() || `${collectionId}/`;
    const normalizedItems = (manifest.items || []).map((item) => ({
      ...cloneItem(item),
      collectionId,
      collectionLabel: collectionTitle,
      collectionRootPath: rootPath,
      source: item.source || toRelativePath(manifestUrl),
    }));
    return {
      id: collectionId,
      title: collectionTitle,
      rootPath,
      manifestUrl,
      items: normalizedItems,
    };
  }

  function rebuildIndex() {
    itemsById = new Map();
    for (const collection of collections) {
      for (const item of collection.items || []) {
        const key = item.id;
        if (!itemsById.has(key)) {
          itemsById.set(key, cloneItem(item));
          continue;
        }
        let suffix = 2;
        let nextKey = `${key}-${suffix}`;
        while (itemsById.has(nextKey)) {
          suffix += 1;
          nextKey = `${key}-${suffix}`;
        }
        itemsById.set(nextKey, {
          ...cloneItem(item),
          id: nextKey,
          sourceAssetId: key,
        });
      }
    }
  }

  return {
    ...descriptor,

    getDescriptor() {
      return descriptor;
    },

    async connect(config = {}) {
      sourcePath = config.path || sourcePath;
      const sourceLabel = hostLabelFromPath(sourcePath);
      try {
        const { json, url } = await fetchJson(sourcePath);

        if (Array.isArray(json.collections)) {
          const loadedCollections = [];
          for (const entry of json.collections) {
            if (!entry || typeof entry !== 'object') {
              continue;
            }
            const manifestPath = String(entry.manifest || '').trim();
            if (!manifestPath) {
              continue;
            }
            const { json: manifest, url: manifestUrl } = await fetchJson(manifestPath, url);
            const validationErrors = validateCollectionShape(manifest);
            if (validationErrors.length > 0) {
              throw new Error(`Collection schema invalid for ${manifestPath}: ${validationErrors.join(' ')}`);
            }
            loadedCollections.push(
              normalizeCollectionManifest(
                manifest,
                entry.id || '',
                entry.title || entry.id || '',
                manifestUrl,
              ),
            );
          }

          if (loadedCollections.length === 0) {
            throw new Error('No valid collection manifests were found in collections.json.');
          }

          collections = loadedCollections;
          rebuildIndex();
          connected = true;
          return {
            ok: true,
            message: `Connected to ${sourcePath}`,
            sourceDisplayLabel: sourceLabel,
            sourceDetailLabel: sourcePath,
            capabilities: READ_WRITE_CAPABILITIES,
          };
        }

        const validationErrors = validateCollectionShape(json);
        if (validationErrors.length > 0) {
          throw new Error(`Collection schema invalid: ${validationErrors.join(' ')}`);
        }

        collections = [
          normalizeCollectionManifest(
            cloneItem(json),
            json.id || sourceLabel,
            json.title || sourceLabel,
            url,
          ),
        ];
        rebuildIndex();
        connected = true;

        return {
          ok: true,
          message: `Connected to ${sourcePath}`,
          sourceDisplayLabel: sourceLabel,
          sourceDetailLabel: sourcePath,
          capabilities: READ_WRITE_CAPABILITIES,
        };
      } catch (error) {
        connected = false;
        collections = [];
        itemsById = new Map();
        return {
          ok: false,
          message: error.message,
          capabilities: READ_WRITE_CAPABILITIES,
        };
      }
    },

    async listAssets() {
      if (!connected) {
        throw providerNotConnectedError('local');
      }
      return Array.from(itemsById.values()).map(cloneItem);
    },

    async getAsset(id) {
      if (!connected) {
        throw providerNotConnectedError('local');
      }
      return itemsById.has(id) ? cloneItem(itemsById.get(id)) : null;
    },

    async saveMetadata(id, patch) {
      if (!connected) {
        throw providerNotConnectedError('local');
      }

      const existing = itemsById.get(id);
      if (!existing) {
        return null;
      }

      const updated = mergeItem(existing, patch);
      itemsById.set(id, updated);
      return cloneItem(updated);
    },

    async exportCollection(collectionMeta) {
      if (!connected) {
        throw providerNotConnectedError('local');
      }

      const items = Array.from(itemsById.values()).map(cloneItem);
      return {
        id: collectionMeta.id,
        title: collectionMeta.title,
        description: collectionMeta.description,
        items,
      };
    },

    getCapabilities() {
      return READ_WRITE_CAPABILITIES;
    },
  };
}
