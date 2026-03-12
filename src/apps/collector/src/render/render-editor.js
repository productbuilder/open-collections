export function renderMetadataMode(component, mode) {
  const activeMode = mode === 'collection' || mode === 'item' ? mode : 'none';
  const activeView = component.editorViews[activeMode] || null;

  Object.values(component.editorViews).forEach((node) => {
    if (!node) {
      return;
    }
    if (node.parentElement === component.dom.editorContent) {
      component.dom.editorContent.removeChild(node);
    }
    node.hidden = false;
  });

  if (activeView) {
    component.dom.editorContent.appendChild(activeView);
  }

  return activeMode;
}

export function renderEditor(component) {
  const metadataMode = component.state.metadataMode || 'none';
  const activeMode = renderMetadataMode(component, metadataMode);

  if (activeMode === 'collection') {
    component.dom.editorTitle.textContent = 'Collection metadata';
    const selectedCollection = component.findSelectedCollectionMeta();
    if (!selectedCollection) {
      component.dom.editorContext.textContent = 'Select a collection.';
      renderMetadataMode(component, 'none');
      component.syncEditorVisibility();
      return;
    }
    component.dom.editorContext.textContent = selectedCollection.id;
    component.dom.collectionEditorTitle.value = selectedCollection.title || '';
    component.dom.collectionEditorDescription.value = selectedCollection.description || '';
    component.dom.collectionEditorLicense.value = selectedCollection.license || '';
    component.dom.collectionEditorPublisher.value = selectedCollection.publisher || '';
    component.dom.collectionEditorLanguage.value = selectedCollection.language || '';
    component.syncEditorVisibility();
    return;
  }

  if (activeMode === 'item') {
    component.dom.editorTitle.textContent = 'Item metadata';
    const selected = component.findSelectedItem();
    const selectedSource = selected ? component.getSourceById(selected.sourceId) : null;
    const canSave = Boolean(selectedSource?.capabilities?.canSaveMetadata);

    if (!selected) {
      component.dom.editorContext.textContent = 'Select an item.';
      renderMetadataMode(component, 'none');
      component.syncEditorVisibility();
      return;
    }

    component.dom.editorContext.textContent = canSave
      ? `${selected.id} - ${selected.sourceDisplayLabel || selected.sourceLabel}`
      : `${selected.id} - ${selected.sourceDisplayLabel || selected.sourceLabel} (local edits)`;

    component.dom.itemTitle.value = selected.title || '';
    component.dom.itemDescription.value = selected.description || '';
    component.dom.itemType.value = selected.media?.type || '';
    component.dom.itemCreator.value = selected.creator || '';
    component.dom.itemDate.value = selected.date || '';
    component.dom.itemLocation.value = selected.location || '';
    component.dom.itemLicense.value = selected.license || '';
    component.dom.itemAttribution.value = selected.attribution || '';
    component.dom.itemSource.value = selected.source || '';
    component.dom.itemTags.value = Array.isArray(selected.tags) ? selected.tags.join(', ') : '';
    component.dom.itemInclude.checked = selected.include !== false;
    component.dom.saveItemBtn.disabled = false;
    component.syncEditorVisibility();
    return;
  }

  component.dom.editorTitle.textContent = 'Metadata editor';
  component.dom.editorContext.textContent = 'Select a collection or item.';
  component.syncEditorVisibility();
}
