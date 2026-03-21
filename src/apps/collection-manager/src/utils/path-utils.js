export function slugifySegment(value, fallback = 'item') {
  const slug = String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
  return slug || fallback;
}

export function hostNameFromPath(path, fallback = 'Local host') {
  const normalized = String(path || '').trim().replace(/\\/g, '/');
  if (!normalized) {
    return fallback;
  }
  const parts = normalized.split('/').filter(Boolean);
  if (parts.length === 0) {
    return fallback;
  }
  const tail = parts[parts.length - 1] || '';
  const name = tail.endsWith('.json') ? (parts[parts.length - 2] || '') : tail;
  return name || fallback;
}

export function normalizeCollectionRootPath(rootPath, fallbackId = '') {
  const fallback = `${slugifySegment(fallbackId || 'collection', 'collection')}/`;
  const raw = String(rootPath || '').trim();
  if (!raw) {
    return fallback;
  }
  const cleaned = raw
    .replace(/^\/+/, '')
    .replace(/\/+$/, '')
    .split('/')
    .map((segment) => slugifySegment(segment, 'collection'))
    .filter(Boolean)
    .join('/');
  return cleaned ? `${cleaned}/` : fallback;
}

export function joinCollectionRootPath(collectionRootPath, relativePath = '', selectedCollectionId = 'collection') {
  const root = normalizeCollectionRootPath(collectionRootPath, selectedCollectionId || 'collection');
  const relative = String(relativePath || '').replace(/^\/+/, '');
  return relative ? `${root}${relative}` : root;
}
