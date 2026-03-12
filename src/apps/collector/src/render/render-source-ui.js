export function renderSourceContext(component) {
  const source = component.getSourceById(component.state.activeSourceFilter);
  component.dom.activeHostLabel.textContent = source
    ? (source.displayLabel || source.label || source.providerLabel || 'Host')
    : 'Select host';
}

export function renderSourceFilter(component) {
  const previous = component.state.activeSourceFilter || 'all';
  component.dom.sourceFilter.innerHTML = '';

  const allOption = document.createElement('option');
  allOption.value = 'all';
  allOption.textContent = 'All hosts';
  component.dom.sourceFilter.appendChild(allOption);

  for (const source of component.state.sources) {
    const option = document.createElement('option');
    option.value = source.id;
    option.textContent = source.displayLabel || source.label || source.providerLabel || 'Source';
    component.dom.sourceFilter.appendChild(option);
  }

  const stillExists = previous === 'all' || component.state.sources.some((entry) => entry.id === previous);
  component.state.activeSourceFilter = stillExists ? previous : 'all';
  component.dom.sourceFilter.value = component.state.activeSourceFilter;
  component.renderCollectionFilter();
}

export function renderCollectionFilter(component) {
  const previous = component.state.selectedCollectionId || 'all';
  component.dom.collectionFilter.innerHTML = '';

  const allOption = document.createElement('option');
  allOption.value = 'all';
  allOption.textContent = 'All collections';
  component.dom.collectionFilter.appendChild(allOption);

  let collections = [];
  if (component.state.activeSourceFilter !== 'all') {
    const activeSource = component.getSourceById(component.state.activeSourceFilter);
    collections = activeSource?.collections || [];
    if (
      previous !== 'all' &&
      !collections.some((entry) => entry.id === previous)
    ) {
      const localEntry = component.state.localDraftCollections.find((entry) => entry.id === previous);
      if (localEntry) {
        collections = [...collections, localEntry];
      }
    }
  } else if (component.state.localDraftCollections.length > 0) {
    collections = component.state.localDraftCollections;
  }

  for (const collection of collections) {
    const option = document.createElement('option');
    option.value = collection.id;
    option.textContent = collection.title || collection.id;
    component.dom.collectionFilter.appendChild(option);
  }

  const stillExists = previous === 'all' || collections.some((entry) => entry.id === previous);
  component.state.selectedCollectionId = stillExists ? previous : 'all';
  component.dom.collectionFilter.value = component.state.selectedCollectionId;
  component.renderWorkspaceContext();
  component.renderSourceContext();
}

export function renderSourcesList(component) {
  const list = component.dom.sourceList;
  list.innerHTML = '';

  if (component.state.sources.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.textContent = 'No hosts added yet.';
    list.appendChild(empty);
    return;
  }

  for (const source of component.state.sources) {
    const card = document.createElement('article');
    card.className = 'source-card';

    const top = document.createElement('div');
    top.className = 'source-card-top';

    const labelBlock = document.createElement('div');
    const label = document.createElement('p');
    label.className = 'source-card-label';
    label.textContent = source.displayLabel || source.label;
    const detail = document.createElement('p');
    detail.className = 'panel-subtext';
    detail.textContent = source.detailLabel || `${source.providerLabel} | ${source.itemCount || 0} items`;
    labelBlock.append(label, detail);

    const badges = document.createElement('div');
    badges.className = 'badge-row';
    const readBadge = document.createElement('span');
    readBadge.className = 'badge ok';
    readBadge.textContent = source.capabilities?.canSaveMetadata ? 'Read + Write' : 'Read';
    const authBadge = document.createElement('span');
    authBadge.className = 'badge';
    if (source.needsCredentials) {
      authBadge.textContent = source.providerId === 'gdrive' ? 'Re-auth required' : 'Token required';
    } else if (source.authMode === 'google-auth') {
      authBadge.textContent = 'Google auth';
    } else if (source.authMode === 'token') {
      authBadge.textContent = 'Token auth';
    } else {
      authBadge.textContent = 'Public';
    }
    badges.append(readBadge, authBadge);

    top.append(labelBlock, badges);

    const status = document.createElement('p');
    status.className = 'panel-subtext';
    status.textContent = source.status || 'Connected';

    const meta = document.createElement('div');
    meta.className = 'source-card-meta';
    const statusPill = document.createElement('span');
    statusPill.className = 'pill';
    statusPill.textContent = source.needsReconnect ? 'Needs reconnect' : 'Connected';
    const countPill = document.createElement('span');
    countPill.className = 'pill';
    countPill.textContent = `${source.itemCount || 0} items`;
    const collectionPill = document.createElement('span');
    collectionPill.className = 'pill';
    collectionPill.textContent = `${source.collections?.length || 0} collections`;
    meta.append(statusPill, countPill, collectionPill);

    const actions = document.createElement('div');
    actions.className = 'source-card-actions';

    const refreshBtn = document.createElement('button');
    refreshBtn.type = 'button';
    refreshBtn.className = 'btn';
    refreshBtn.textContent = 'Refresh';
    refreshBtn.addEventListener('click', async () => {
      await component.refreshSource(source.id);
    });

    const inspectBtn = document.createElement('button');
    inspectBtn.type = 'button';
    inspectBtn.className = 'btn';
    inspectBtn.textContent = 'Inspect';
    inspectBtn.addEventListener('click', () => {
      component.inspectSource(source.id);
    });

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'btn';
    removeBtn.textContent = 'Remove';
    removeBtn.addEventListener('click', () => {
      component.removeSource(source.id);
    });

    const showBtn = document.createElement('button');
    showBtn.type = 'button';
    showBtn.className = 'btn';
    showBtn.textContent = 'Show only';
    showBtn.addEventListener('click', () => {
      component.state.activeSourceFilter = source.id;
      component.renderSourceFilter();
      const visible = component.getVisibleAssets();
      component.state.selectedItemId = visible[0]?.workspaceId || null;
      component.renderAssets();
      component.renderEditor();
    });

    actions.append(refreshBtn, inspectBtn, showBtn, removeBtn);
    card.append(top, status, meta, actions);
    list.appendChild(card);
  }
}

export function renderSourcePicker(component) {
  const wrap = component.dom.sourcePickerList;
  wrap.innerHTML = '';
  if (component.state.sources.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.textContent = 'No hosts connected yet. Use Host manager to add one.';
    wrap.appendChild(empty);
    return;
  }

  for (const source of component.state.sources) {
    const card = document.createElement('article');
    card.className = 'source-card';
    const label = source.displayLabel || source.label || source.providerLabel || 'Host';
    const type = document.createElement('p');
    type.className = 'source-card-label';
    type.textContent = label;
    const meta = document.createElement('p');
    meta.className = 'panel-subtext';
    meta.textContent = `${source.collections?.length || 0} collections`;
    const btn = document.createElement('button');
    btn.className = 'btn btn-primary';
    btn.type = 'button';
    btn.textContent = 'Use host';
    btn.addEventListener('click', () => {
      component.state.activeSourceFilter = source.id;
      component.state.currentLevel = 'collections';
      component.state.metadataMode = 'collection';
      component.state.openedCollectionId = null;
      component.state.selectedCollectionId = source.selectedCollectionId || 'all';
      component.closeMobileEditor();
      component.renderSourceFilter();
      component.renderSourceContext();
      component.renderAssets();
      component.renderEditor();
      component.closeDialog(component.dom.sourcePickerDialog);
    });
    card.append(type, meta, btn);
    wrap.appendChild(card);
  }
}
