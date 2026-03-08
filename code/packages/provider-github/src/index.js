import {
  PROVIDER_AVAILABILITY,
  READ_ONLY_CAPABILITIES,
  cloneItem,
  createProviderDescriptor,
  providerNotConnectedError,
} from '../../provider-core/src/provider.js';

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

export function createGithubProvider() {
  let connected = false;
  let token = '';
  let owner = '';
  let repo = '';
  let branch = 'main';
  let contentPath = '';
  let items = [];

  const descriptor = createProviderDescriptor({
    id: 'github',
    label: 'GitHub',
    category: 'external',
    availability: PROVIDER_AVAILABILITY.available,
    description: 'Connect to a GitHub repository using a Personal Access Token and load media files.',
    statusLabel: 'Available (token auth)',
    capabilities: READ_ONLY_CAPABILITIES,
  });

  async function fetchRepoContents(pathValue) {
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
      const errorBody = await response.text();
      throw new Error(`GitHub API ${response.status}: ${errorBody.slice(0, 220)}`);
    }

    return response.json();
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

        const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${asRawPath(child.path)}`;
        files.push({
          id: itemIdFromPath(child.path),
          title: titleFromPath(child.path),
          description: '',
          source: `https://github.com/${owner}/${repo}/blob/${branch}/${child.path}`,
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
      contentPath = (config.path || '').trim();

      if (!token || !owner || !repo) {
        connected = false;
        return {
          ok: false,
          message: 'Enter token, owner, and repository to connect GitHub.',
          capabilities: READ_ONLY_CAPABILITIES,
        };
      }

      try {
        items = await listMediaFilesRecursive(contentPath);
        connected = true;
        const where = contentPath ? `${owner}/${repo}/${contentPath}` : `${owner}/${repo}`;
        return {
          ok: true,
          message: `Connected to GitHub repo ${where} (${items.length} media assets).`,
          capabilities: READ_ONLY_CAPABILITIES,
        };
      } catch (error) {
        connected = false;
        items = [];
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
        items: items.map(cloneItem),
      };
    },

    getCapabilities() {
      return READ_ONLY_CAPABILITIES;
    },
  };
}
