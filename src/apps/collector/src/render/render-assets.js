export function requiredFieldScore(item) {
  const checks = [
    Boolean(item.id),
    Boolean(item.title),
    Boolean(item.media && item.media.url),
    Boolean(item.license),
  ];

  return `${checks.filter(Boolean).length}/${checks.length}`;
}

export function createPreviewNode(component, item) {
  const mediaType = (item.media?.type || '').toLowerCase();
  const url = item.thumbnailPreviewUrl || item.previewUrl || item.media?.thumbnailUrl || item.media?.url;

  if (!url) {
    const placeholder = document.createElement('div');
    placeholder.className = 'thumb-placeholder';
    placeholder.textContent = 'No preview';
    return placeholder;
  }

  if (mediaType.includes('video')) {
    const video = document.createElement('video');
    video.className = 'thumb';
    video.src = url;
    video.muted = true;
    video.playsInline = true;
    video.preload = 'metadata';
    return video;
  }

  const image = document.createElement('img');
  image.className = 'thumb';
  image.src = url;
  image.alt = item.title || item.id;
  return image;
}

export function renderAssets(component) {
  const grid = component.dom.assetGrid;
  grid.innerHTML = '';
  component.renderSourceContext();

  if (component.state.currentLevel === 'collections') {
    component.dom.viewportTitle.textContent = 'Collections';
    component.dom.backToCollectionsBtn.classList.add('is-hidden');
    component.dom.addImagesBtn.textContent = 'Add collection';

    let collections = [];
    if (component.state.activeSourceFilter !== 'all') {
      const src = component.getSourceById(component.state.activeSourceFilter);
      collections = src?.collections || [];
    } else {
      collections = component.state.localDraftCollections;
    }
    component.dom.assetCount.textContent = `${collections.length} collections`;

    if (!collections.length) {
      const empty = document.createElement('div');
      empty.className = 'empty';
      empty.textContent = 'No collections yet. Add a collection to begin.';
      grid.appendChild(empty);
      return;
    }

    for (const collection of collections) {
      const card = document.createElement('article');
      card.className = 'asset-card';
      if (component.state.selectedCollectionId === collection.id) card.classList.add('is-selected');
      card.addEventListener('click', () => {
        component.state.selectedCollectionId = collection.id;
        component.state.metadataMode = 'collection';
        component.renderAssets();
        component.renderEditor();
        if (component.isMobileViewport()) {
          component.openMobileEditor();
        }
      });

      const title = document.createElement('p');
      title.className = 'card-title';
      title.textContent = collection.title || collection.id;

      const badges = document.createElement('div');
      badges.className = 'badge-row';
      const idBadge = document.createElement('span');
      idBadge.className = 'badge';
      idBadge.textContent = collection.id;
      badges.appendChild(idBadge);

      const actions = document.createElement('div');
      actions.className = 'card-actions';
      const openBtn = document.createElement('button');
      openBtn.type = 'button';
      openBtn.className = 'btn';
      openBtn.textContent = 'Open';
      openBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        component.openCollectionView(collection.id);
      });
      actions.appendChild(openBtn);

      card.append(title, badges, actions);
      grid.appendChild(card);
    }
    return;
  }

  const visibleAssets = component.getVisibleAssets().filter((item) => item.collectionId === component.state.openedCollectionId);
  const collection = component.findSelectedCollectionMeta();
  component.dom.viewportTitle.textContent = collection?.title || component.state.openedCollectionId || 'Collection';
  component.dom.backToCollectionsBtn.classList.remove('is-hidden');
  component.dom.addImagesBtn.textContent = 'Add item';
  component.dom.assetCount.textContent = `${visibleAssets.length} items`;

  if (visibleAssets.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.textContent = 'This collection has no items yet. Add item to begin.';
    grid.appendChild(empty);
    return;
  }

  for (const item of visibleAssets) {
    const card = document.createElement('article');
    card.className = 'asset-card';
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `Select item ${item.title || item.id}`);
    if (component.state.selectedItemId === item.workspaceId) card.classList.add('is-selected');
    card.addEventListener('click', () => component.selectItem(item.workspaceId));

    const preview = createPreviewNode(component, item);
    const title = document.createElement('p');
    title.className = 'card-title';
    title.textContent = item.title || '(Untitled)';

    const badges = document.createElement('div');
    badges.className = 'badge-row';
    const completeness = document.createElement('span');
    completeness.className = 'badge';
    completeness.textContent = `Completeness ${requiredFieldScore(item)}`;
    badges.append(completeness);

    const actions = document.createElement('div');
    actions.className = 'card-actions';
    const openBtn = document.createElement('button');
    openBtn.type = 'button';
    openBtn.className = 'btn';
    openBtn.textContent = 'View';
    openBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      component.openViewer(item.workspaceId);
    });
    actions.append(openBtn);
    card.append(preview, title, badges, actions);
    grid.appendChild(card);
  }
}
