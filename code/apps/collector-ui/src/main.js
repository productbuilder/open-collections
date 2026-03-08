import {
  createManifest,
  validateCollectionShape,
} from '../../../packages/collector-schema/src/schema.js';
import { createLocalProvider } from '../../../packages/provider-local/src/index.js';
import { createPublicUrlProvider } from '../../../packages/provider-public-url/src/index.js';
import { createGithubProvider } from '../../../packages/provider-github/src/index.js';

const dom = {
  providerType: document.getElementById('providerType'),
  providerInput: document.getElementById('providerInput'),
  connectBtn: document.getElementById('connectBtn'),
  connectionStatus: document.getElementById('connectionStatus'),
  capabilities: document.getElementById('capabilities'),
  assetCount: document.getElementById('assetCount'),
  assetGrid: document.getElementById('assetGrid'),
  editorStatus: document.getElementById('editorStatus'),
  editorForm: document.getElementById('editorForm'),
  mediaPreview: document.getElementById('mediaPreview'),
  itemTitle: document.getElementById('itemTitle'),
  itemDescription: document.getElementById('itemDescription'),
  itemCreator: document.getElementById('itemCreator'),
  itemDate: document.getElementById('itemDate'),
  itemLocation: document.getElementById('itemLocation'),
  itemLicense: document.getElementById('itemLicense'),
  itemAttribution: document.getElementById('itemAttribution'),
  itemSource: document.getElementById('itemSource'),
  itemTags: document.getElementById('itemTags'),
  itemInclude: document.getElementById('itemInclude'),
  saveItemBtn: document.getElementById('saveItemBtn'),
  collectionId: document.getElementById('collectionId'),
  collectionTitle: document.getElementById('collectionTitle'),
  collectionDescription: document.getElementById('collectionDescription'),
  generateManifestBtn: document.getElementById('generateManifestBtn'),
  copyManifestBtn: document.getElementById('copyManifestBtn'),
  downloadManifestBtn: document.getElementById('downloadManifestBtn'),
  manifestPreview: document.getElementById('manifestPreview'),
};

const providers = {
  local: createLocalProvider(),
  'public-url': createPublicUrlProvider(),
  github: createGithubProvider(),
};

const state = {
  provider: null,
  connected: false,
  assets: [],
  selectedItemId: null,
  manifest: null,
};

function requiredFieldScore(item) {
  const checks = [
    Boolean(item.id),
    Boolean(item.title),
    Boolean(item.media && item.media.url),
    Boolean(item.license),
  ];
  const completed = checks.filter(Boolean).length;
  return `${completed}/${checks.length}`;
}

function tagsToArray(input) {
  return input
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

function findSelectedItem() {
  return state.assets.find((item) => item.id === state.selectedItemId) || null;
}

function setConnectionStatus(text, isOk = false) {
  dom.connectionStatus.textContent = text;
  dom.connectionStatus.style.color = isOk ? '#2e7d32' : '#7a1f1f';
}

function renderCapabilities(provider) {
  dom.capabilities.textContent = JSON.stringify(provider.getCapabilities(), null, 2);
}

function renderAssets() {
  if (!state.connected) {
    dom.assetCount.textContent = 'No assets loaded.';
    dom.assetGrid.innerHTML = '';
    return;
  }

  dom.assetCount.textContent = `${state.assets.length} assets loaded`;
  dom.assetGrid.innerHTML = '';

  for (const item of state.assets) {
    const card = document.createElement('article');
    card.className = 'asset-card';
    if (state.selectedItemId === item.id) {
      card.classList.add('selected');
    }

    const thumb = document.createElement('img');
    thumb.className = 'asset-thumb';
    thumb.src = item.media?.thumbnailUrl || item.media?.url || '';
    thumb.alt = item.title || item.id;

    const title = document.createElement('p');
    title.className = 'card-title';
    title.textContent = item.title || '(Untitled)';

    const badgeRow = document.createElement('div');
    badgeRow.className = 'badge-row';

    const metaBadge = document.createElement('span');
    metaBadge.className = 'badge';
    metaBadge.textContent = `Completeness ${requiredFieldScore(item)}`;

    const licenseBadge = document.createElement('span');
    const hasLicense = Boolean(item.license);
    licenseBadge.className = `badge ${hasLicense ? 'ok' : 'warn'}`;
    licenseBadge.textContent = hasLicense ? `License: ${item.license}` : 'License missing';

    const includeBadge = document.createElement('span');
    const included = item.include !== false;
    includeBadge.className = `badge ${included ? 'ok' : 'warn'}`;
    includeBadge.textContent = included ? 'Included' : 'Excluded';

    badgeRow.append(metaBadge, licenseBadge, includeBadge);

    const actions = document.createElement('div');
    actions.className = 'card-actions';

    const openBtn = document.createElement('button');
    openBtn.type = 'button';
    openBtn.textContent = 'Open';
    openBtn.addEventListener('click', () => {
      state.selectedItemId = item.id;
      renderAssets();
      renderEditor();
    });

    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.textContent = included ? 'Exclude' : 'Include';
    toggleBtn.addEventListener('click', async () => {
      await updateItem(item.id, { include: !included });
    });

    actions.append(openBtn, toggleBtn);
    card.append(thumb, title, badgeRow, actions);
    dom.assetGrid.appendChild(card);
  }
}

function renderEditor() {
  const selected = findSelectedItem();
  if (!selected) {
    dom.editorStatus.textContent = 'Select an item card to edit metadata.';
    dom.editorForm.classList.add('hidden');
    return;
  }

  dom.editorStatus.textContent = `Editing item: ${selected.id}`;
  dom.editorForm.classList.remove('hidden');

  dom.mediaPreview.src = selected.media?.url || '';
  dom.itemTitle.value = selected.title || '';
  dom.itemDescription.value = selected.description || '';
  dom.itemCreator.value = selected.creator || '';
  dom.itemDate.value = selected.date || '';
  dom.itemLocation.value = selected.location || '';
  dom.itemLicense.value = selected.license || '';
  dom.itemAttribution.value = selected.attribution || '';
  dom.itemSource.value = selected.source || '';
  dom.itemTags.value = Array.isArray(selected.tags) ? selected.tags.join(', ') : '';
  dom.itemInclude.checked = selected.include !== false;

  const canSave = state.provider?.getCapabilities().canSaveMetadata;
  dom.saveItemBtn.disabled = !canSave;
  if (!canSave) {
    dom.editorStatus.textContent += ' (read-only provider)';
  }
}

function currentCollectionMeta() {
  return {
    id: dom.collectionId.value.trim() || 'col-mvp-export',
    title: dom.collectionTitle.value.trim() || 'TimeMap Collector Export',
    description:
      dom.collectionDescription.value.trim() ||
      'Manifest generated from TimeMap Collector MVP.',
  };
}

async function updateItem(id, patch) {
  const canSave = state.provider.getCapabilities().canSaveMetadata;

  if (canSave) {
    const updated = await state.provider.saveMetadata(id, patch);
    if (!updated) {
      setConnectionStatus(`Could not update item ${id}`, false);
      return;
    }

    state.assets = state.assets.map((item) => (item.id === id ? updated : item));
  } else {
    // Read-only provider fallback keeps edits in local UI state only.
    state.assets = state.assets.map((item) => (item.id === id ? { ...item, ...patch } : item));
    setConnectionStatus('Provider is read-only: changes are local session only.', false);
  }

  renderAssets();
  renderEditor();
}

async function connectCurrentProvider() {
  const providerId = dom.providerType.value;
  const provider = providers[providerId];
  state.provider = provider;
  state.connected = false;
  state.assets = [];
  state.selectedItemId = null;
  renderAssets();
  renderEditor();

  const config = {};
  if (providerId === 'local') {
    config.path = dom.providerInput.value.trim() || '/examples/test-collection/collection.json';
  }

  if (providerId === 'public-url') {
    config.manifestUrl = dom.providerInput.value.trim();
  }

  const result = await provider.connect(config);
  renderCapabilities(provider);

  if (!result.ok) {
    setConnectionStatus(result.message, false);
    return;
  }

  state.connected = true;
  setConnectionStatus(result.message, true);

  state.assets = await provider.listAssets();

  if (state.assets.length > 0) {
    const first = state.assets[0];
    state.selectedItemId = first.id;
  }

  // Initialize collection meta defaults from provider data when available.
  dom.collectionTitle.value = providerId === 'local' ? 'TimeMap Collector MVP Test Collection' : dom.collectionTitle.value;
  dom.collectionDescription.value =
    providerId === 'local'
      ? 'Exported from local example dataset through Collector MVP.'
      : dom.collectionDescription.value;

  renderAssets();
  renderEditor();
}

async function generateManifest() {
  if (!state.provider || !state.connected) {
    setConnectionStatus('Connect a provider first.', false);
    return;
  }

  const baseManifest = await state.provider.exportCollection(currentCollectionMeta());
  const includedItems = (state.assets || []).filter((item) => item.include !== false);

  const manifest = createManifest(baseManifest, includedItems);
  const errors = validateCollectionShape(manifest);
  if (errors.length > 0) {
    setConnectionStatus(`Manifest validation failed: ${errors.join(' ')}`, false);
    return;
  }

  state.manifest = manifest;
  dom.manifestPreview.textContent = JSON.stringify(manifest, null, 2);
  setConnectionStatus('Manifest generated and validated.', true);
}

async function copyManifestToClipboard() {
  if (!state.manifest) {
    setConnectionStatus('Generate manifest before copying.', false);
    return;
  }

  try {
    await navigator.clipboard.writeText(JSON.stringify(state.manifest, null, 2));
    setConnectionStatus('Manifest copied to clipboard.', true);
  } catch (error) {
    setConnectionStatus(`Clipboard copy failed: ${error.message}`, false);
  }
}

function downloadManifest() {
  if (!state.manifest) {
    setConnectionStatus('Generate manifest before download.', false);
    return;
  }

  const json = JSON.stringify(state.manifest, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'collection.json';
  anchor.click();
  URL.revokeObjectURL(url);

  setConnectionStatus('Downloaded collection.json.', true);
}

function collectEditorPatch() {
  return {
    title: dom.itemTitle.value.trim(),
    description: dom.itemDescription.value.trim(),
    creator: dom.itemCreator.value.trim(),
    date: dom.itemDate.value.trim(),
    location: dom.itemLocation.value.trim(),
    license: dom.itemLicense.value.trim(),
    attribution: dom.itemAttribution.value.trim(),
    source: dom.itemSource.value.trim(),
    tags: tagsToArray(dom.itemTags.value),
    include: dom.itemInclude.checked,
  };
}

dom.providerType.addEventListener('change', () => {
  if (dom.providerType.value === 'local') {
    dom.providerInput.value = '/examples/test-collection/collection.json';
  }

  if (dom.providerType.value === 'public-url') {
    dom.providerInput.value = '';
    dom.providerInput.placeholder = 'https://example.org/collection.json';
  }

  if (dom.providerType.value === 'github') {
    dom.providerInput.value = '';
    dom.providerInput.placeholder = 'owner/repo/path/collection.json';
  }
});

dom.connectBtn.addEventListener('click', async () => {
  try {
    await connectCurrentProvider();
  } catch (error) {
    setConnectionStatus(`Connection error: ${error.message}`, false);
  }
});

dom.saveItemBtn.addEventListener('click', async () => {
  const selected = findSelectedItem();
  if (!selected) {
    return;
  }

  try {
    await updateItem(selected.id, collectEditorPatch());
    setConnectionStatus(`Saved metadata for ${selected.id}`, true);
  } catch (error) {
    setConnectionStatus(`Save failed: ${error.message}`, false);
  }
});

dom.generateManifestBtn.addEventListener('click', async () => {
  try {
    await generateManifest();
  } catch (error) {
    setConnectionStatus(`Manifest generation failed: ${error.message}`, false);
  }
});

dom.copyManifestBtn.addEventListener('click', async () => {
  await copyManifestToClipboard();
});

dom.downloadManifestBtn.addEventListener('click', () => {
  downloadManifest();
});

setConnectionStatus('Not connected.', false);
renderCapabilities(providers.local);
renderAssets();
renderEditor();
