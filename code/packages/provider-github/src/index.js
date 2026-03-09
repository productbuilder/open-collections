import {
  PROVIDER_AVAILABILITY,
  READ_ONLY_CAPABILITIES,
  cloneItem,
  createProviderDescriptor,
  providerNotConnectedError,
} from '../../provider-core/src/provider.js';
import { validateCollectionShape } from '../../../packages/collector-schema/src/schema.js';

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov', '.m4v'];

function extensionFor(path = '') {
  const lower = path.toLowerCase();
  const dot = lower.lastIndexOf('.');
  return dot === -1 ? '' : lower.slice(dot);
}

function mediaTypeForPath(path) {
  const ext = extensionFor(path);
  if (IMAGE_EXTENSIONS.includes(ext)) {
    return 'image';
  }
  if (VIDEO_EXTENSIONS.includes(ext)) {
    return 'video';
  }
  return null;
}

function itemIdFromPath(path) {
  return path.replace(/\//g, '__');
}

function titleFromPath(path) {
  const file = path.split('/').pop() || path;
  return file.replace(/\.[^.]+$/, '');
}

function asApiPath(path) {
  return path ? path.replace(/^\/+/, '').replace(/\/+$/, '') : '';
}

function asRawPath(path) {
  return path ? path.replace(/^\/+/, '') : '';
}

function joinRepoPath(...parts) {
  return parts
    .filter(Boolean)
    .map((part) => String(part).replace(/^\/+/, '').replace(/\/+$/, ''))
    .filter(Boolean)
    .join('/');
}

function normalizeFolderPath(path = '') {
  const trimmed = String(path).trim();
  if (!trimmed || trimmed === '/') {
    return '';
  }
  return asApiPath(trimmed);
}

function isAbsoluteUrl(value = '') {
  return /^https?:\/\//i.test(value) || /^data:/i.test(value);
}

export function createGithubProvider() {
  let connected = false;
  let token = '';
  let owner = '';
  let repo = '';
  let branch = 'main';
  let contentPath = '';
  let items = [];
  let collection = null;

  const descriptor = createProviderDescriptor({
    id: 'github',
    label: 'GitHub',
    category: 'external',
    availability: PROVIDER_AVAILABILITY.available,
    description: 'Connect to a GitHub repository using a Personal Access Token and load media files.',
    statusLabel: 'Available (token auth)',
    capabilities: READ_ONLY_CAPABILITIES,
  });

  function rawUrlForRepoPath(pathValue) {
    return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${asRawPath(pathValue)}`;
  }

  function blobUrlForRepoPath(pathValue) {
    return `https://github.com/${owner}/${repo}/blob/${branch}/${asRawPath(pathValue)}`;
  }

  async function fetchRepoContents(pathValue, options = {}) {
    const targetPath = asApiPath(pathValue);
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${targetPath}?ref=${branch}`;
    const response = await fetch(url, {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (!response.ok) {
      if (response.status === 404 && options.allowNotFound) {
        return null;
      }

      const errorBody = await response.text();
      if (response.status === 401 || response.status === 403) {
        throw new Error('Authentication failed or repository access denied.');
      }

      if (response.status === 404) {
        const location = targetPath || '/';
        throw new Error(`Repository or path not accessible: ${location}`);
      }

      throw new Error(`GitHub API ${response.status}: ${errorBody.slice(0, 220)}`);
    }

    return response.json();
  }

  async function decodeContentEntry(entry) {
    if (typeof entry.content === 'string' && entry.encoding === 'base64') {
      const binary = atob(entry.content.replace(/\n/g, ''));
      const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
      return new TextDecoder().decode(bytes);
    }

    if (entry.download_url) {
      const response = await fetch(entry.download_url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch manifest content (${response.status}).`);
      }

      return response.text();
    }

    throw new Error('Unable to read collection.json content from GitHub response.');
  }

  function resolveRepoReference(reference, manifestFolderPath) {
    const raw = typeof reference === 'string' ? reference.trim() : '';
    if (!raw || isAbsoluteUrl(raw)) {
      return null;
    }

    if (raw.startsWith('/')) {
      return asApiPath(raw);
    }

    return joinRepoPath(manifestFolderPath, raw);
  }

  function resolveMediaUrl(url, manifestFolderPath) {
    const raw = typeof url === 'string' ? url.trim() : '';
    if (!raw) {
      return '';
    }

    if (isAbsoluteUrl(raw)) {
      return raw;
    }

    const repoPath = resolveRepoReference(raw, manifestFolderPath);
    return repoPath ? rawUrlForRepoPath(repoPath) : raw;
  }

  function resolveSourceUrl(url, manifestFolderPath) {
    const raw = typeof url === 'string' ? url.trim() : '';
    if (!raw) {
      return '';
    }

    if (isAbsoluteUrl(raw)) {
      return raw;
    }

    const repoPath = resolveRepoReference(raw, manifestFolderPath);
    return repoPath ? blobUrlForRepoPath(repoPath) : raw;
  }

  function normalizeManifestItem(item, index, manifestFolderPath) {
    const media = item && typeof item.media === 'object' ? item.media : {};
    const mediaUrl = resolveMediaUrl(media.url, manifestFolderPath);
    const thumbnailUrl = resolveMediaUrl(media.thumbnailUrl, manifestFolderPath);
    const mediaType = (media.type || mediaTypeForPath(media.url || '') || mediaTypeForPath(mediaUrl || '') || 'image')
      .toLowerCase();

    const fallbackId = `manifest_item_${index + 1}`;
    const fallbackTitle =
      titleFromPath(resolveRepoReference(media.url || media.thumbnailUrl || '', manifestFolderPath) || fallbackId) ||
      `Item ${index + 1}`;

    return {
      ...item,
      id: (item.id || '').trim() || fallbackId,
      title: (item.title || '').trim() || fallbackTitle,
      description: item.description || '',
      creator: item.creator || '',
      date: item.date || '',
      location: item.location || '',
      license: item.license || '',
      attribution: item.attribution || '',
      source: resolveSourceUrl(item.source, manifestFolderPath),
      tags: Array.isArray(item.tags) ? item.tags : [],
      include: item.include !== false,
      media: {
        ...media,
        type: mediaType,
        url: mediaUrl,
        thumbnailUrl: thumbnailUrl || (mediaType === 'image' ? mediaUrl : ''),
      },
    };
  }

  async function loadCollectionManifest(rootFolderPath) {
    const manifestPath = joinRepoPath(rootFolderPath, 'collection.json');
    const manifestEntry = await fetchRepoContents(manifestPath, { allowNotFound: true });
    if (!manifestEntry || Array.isArray(manifestEntry) || manifestEntry.type !== 'file') {
      return { found: false, manifestPath };
    }

    const manifestText = await decodeContentEntry(manifestEntry);
    let manifestJson;
    try {
      manifestJson = JSON.parse(manifestText);
    } catch (error) {
      throw new Error(`collection.json could not be parsed: ${error.message}`);
    }

    const validationErrors = validateCollectionShape(manifestJson);
    if (validationErrors.length > 0) {
      throw new Error(`collection.json schema invalid: ${validationErrors.join(' ')}`);
    }

    const normalizedItems = (manifestJson.items || []).map((item, index) =>
      normalizeManifestItem(item, index, rootFolderPath),
    );

    return {
      found: true,
      manifestPath,
      collection: {
        ...manifestJson,
        items: normalizedItems,
      },
      items: normalizedItems,
    };
  }

  async function listMediaFilesRecursive(pathValue) {
    const entry = await fetchRepoContents(pathValue);

    if (!Array.isArray(entry)) {
      return [];
    }

    const files = [];
    for (const child of entry) {
      if (child.type === 'dir') {
        const nested = await listMediaFilesRecursive(child.path);
        files.push(...nested);
      }

      if (child.type === 'file') {
        const mediaType = mediaTypeForPath(child.path);
        if (!mediaType) {
          continue;
        }

        const rawUrl = rawUrlForRepoPath(child.path);
        files.push({
          id: itemIdFromPath(child.path),
          title: titleFromPath(child.path),
          description: '',
          source: blobUrlForRepoPath(child.path),
          include: true,
          tags: [],
          license: '',
          attribution: owner,
          media: {
            type: mediaType,
            url: rawUrl,
            thumbnailUrl: mediaType === 'image' ? rawUrl : undefined,
          },
        });
      }
    }

    return files;
  }

  return {
    ...descriptor,

    getDescriptor() {
      return descriptor;
    },

    async connect(config = {}) {
      token = (config.token || '').trim();
      owner = (config.owner || '').trim();
      repo = (config.repo || '').trim();
      branch = (config.branch || 'main').trim() || 'main';
      contentPath = normalizeFolderPath(config.path || '');

      if (!token || !owner || !repo) {
        connected = false;
        return {
          ok: false,
          message: 'Enter token, owner, and repository to connect GitHub.',
          capabilities: READ_ONLY_CAPABILITIES,
        };
      }

      try {
        await fetchRepoContents(contentPath || '');
        const manifestResult = await loadCollectionManifest(contentPath);

        if (manifestResult.found) {
          collection = cloneItem(manifestResult.collection);
          items = manifestResult.items.map(cloneItem);
        } else {
          collection = null;
          items = await listMediaFilesRecursive(contentPath);
        }

        connected = true;
        const where = contentPath ? `${owner}/${repo}/${contentPath}` : `${owner}/${repo}/`;
        const message = manifestResult.found
          ? `Connected to GitHub repo ${where}. Found ${manifestResult.manifestPath} and loaded ${items.length} manifest items.`
          : `Connected to GitHub repo ${where}. No manifest found at ${manifestResult.manifestPath}; loaded ${items.length} media assets from file browser.`;
        return {
          ok: true,
          message,
          capabilities: READ_ONLY_CAPABILITIES,
        };
      } catch (error) {
        connected = false;
        items = [];
        collection = null;
        return {
          ok: false,
          message: `GitHub connection failed: ${error.message}`,
          capabilities: READ_ONLY_CAPABILITIES,
        };
      }
    },

    async listAssets() {
      if (!connected) {
        throw providerNotConnectedError('github');
      }
      return items.map(cloneItem);
    },

    async getAsset(id) {
      if (!connected) {
        throw providerNotConnectedError('github');
      }
      const item = items.find((entry) => entry.id === id);
      return item ? cloneItem(item) : null;
    },

    async saveMetadata() {
      throw new Error('GitHub provider is read-only in this MVP pass.');
    },

    async exportCollection(collectionMeta) {
      if (!connected) {
        throw providerNotConnectedError('github');
      }

      return {
        id: collectionMeta.id,
        title: collectionMeta.title,
        description: collectionMeta.description,
        items: (collection?.items || items).map(cloneItem),
      };
    },

    getCapabilities() {
      return READ_ONLY_CAPABILITIES;
    },
  };
}
