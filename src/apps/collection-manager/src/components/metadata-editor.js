import { metadataStyles } from '../css/metadata.css.js';

const ITEM_OVERRIDE_FIELD_CONFIG = {
  description: {
    label: 'Description',
    inputId: 'itemOverrideDescription',
    hintId: 'itemOverrideDescriptionHint',
    previewId: 'itemOverrideDescriptionPreview',
    tag: 'textarea',
  },
  license: {
    label: 'License',
    inputId: 'itemOverrideLicense',
    hintId: 'itemOverrideLicenseHint',
    previewId: 'itemOverrideLicensePreview',
    tag: 'input',
  },
  attribution: {
    label: 'Attribution',
    inputId: 'itemOverrideAttribution',
    hintId: 'itemOverrideAttributionHint',
    previewId: 'itemOverrideAttributionPreview',
    tag: 'input',
  },
  language: {
    label: 'Language',
    inputId: 'itemOverrideLanguage',
    hintId: 'itemOverrideLanguageHint',
    previewId: 'itemOverrideLanguagePreview',
    tag: 'input',
  },
};

class OpenCollectionsMetadataElement extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.model = {
      mode: 'none',
      contextText: 'Select a collection or item.',
      collection: null,
      item: null,
      canSaveItem: false,
      mobileOpen: false,
      canDeleteItem: false,
      presentation: 'inspector',
    };
  }

  connectedCallback() {
    this.render();
    this.bindEvents();
    this.applyView();
    this.setMobileOpen(this.model.mobileOpen);
    this.setPresentation(this.model.presentation);
  }

  bindEvents() {
    this.shadowRoot.getElementById('closeEditorBtn')?.addEventListener('click', () => {
      this.dispatch('close-editor');
    });

    this.shadowRoot.getElementById('headerSaveBtn')?.addEventListener('click', () => {
      if (this.model.mode === 'collection') {
        this.dispatch('save-collection', { patch: this.getCollectionPatch() });
        return;
      }
      if (this.model.mode === 'item') {
        this.dispatch('save-item', { patch: this.getItemPatch() });
      }
    });
    this.shadowRoot.getElementById('headerDeleteBtn')?.addEventListener('click', () => {
      if (this.model.mode === 'item' && this.model.item?.workspaceId) {
        this.dispatch('delete-item', { workspaceId: this.model.item.workspaceId });
      }
    });

    this.shadowRoot.addEventListener('click', (event) => {
      const button = event.target instanceof Element ? event.target.closest('[data-override-toggle]') : null;
      if (!button) {
        return;
      }
      const field = button.getAttribute('data-override-toggle') || '';
      if (!field) {
        return;
      }
      this.setOverrideEnabled(field, !this.isOverrideEnabled(field));
    });
  }

  dispatch(name, detail = {}) {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }

  setMobileOpen(open) {
    this.model.mobileOpen = Boolean(open);
    const panel = this.shadowRoot?.querySelector('.editor-panel');
    if (panel) {
      panel.classList.toggle('is-mobile-editor-open', this.model.mobileOpen);
    }
  }

  setPresentation(presentation = 'inspector') {
    this.model.presentation = presentation === 'embedded' ? 'embedded' : 'inspector';
    const panel = this.shadowRoot?.querySelector('.editor-panel');
    if (panel) {
      panel.dataset.presentation = this.model.presentation;
    }
    const header = this.shadowRoot?.querySelector('.panel-header');
    if (header) {
      header.hidden = this.model.presentation === 'embedded';
    }
  }

  setView(data = {}) {
    this.model = {
      ...this.model,
      ...data,
    };
    this.applyView();
  }

  getCollectionPatch() {
    return {
      title: this.shadowRoot.getElementById('collectionEditorTitle')?.value.trim() || '',
      description: this.shadowRoot.getElementById('collectionEditorDescription')?.value.trim() || '',
      license: this.shadowRoot.getElementById('collectionEditorLicense')?.value.trim() || '',
      publisher: this.shadowRoot.getElementById('collectionEditorPublisher')?.value.trim() || '',
      language: this.shadowRoot.getElementById('collectionEditorLanguage')?.value.trim() || '',
    };
  }

  tagsToArray(rawValue) {
    return String(rawValue || '')
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  getItemPatch() {
    const overrides = {};
    const overrideStates = {};

    for (const [field, config] of Object.entries(ITEM_OVERRIDE_FIELD_CONFIG)) {
      const enabled = this.isOverrideEnabled(field);
      overrideStates[field] = enabled;
      overrides[field] = this.shadowRoot.getElementById(config.inputId)?.value.trim() || '';
    }

    return {
      title: this.shadowRoot.getElementById('itemTitle')?.value.trim() || '',
      creator: this.shadowRoot.getElementById('itemCreator')?.value.trim() || '',
      date: this.shadowRoot.getElementById('itemDate')?.value.trim() || '',
      location: this.shadowRoot.getElementById('itemLocation')?.value.trim() || '',
      source: this.shadowRoot.getElementById('itemSource')?.value.trim() || '',
      tags: this.tagsToArray(this.shadowRoot.getElementById('itemTags')?.value || ''),
      include: Boolean(this.shadowRoot.getElementById('itemInclude')?.checked),
      mediaType: this.shadowRoot.getElementById('itemType')?.value.trim() || '',
      overrides,
      overrideStates,
    };
  }

  isOverrideEnabled(field) {
    const container = this.shadowRoot?.querySelector(`[data-override-row="${field}"]`);
    return container?.dataset.overrideEnabled === 'true';
  }

  setOverrideEnabled(field, enabled) {
    const container = this.shadowRoot?.querySelector(`[data-override-row="${field}"]`);
    if (!container) {
      return;
    }

    const state = this.model.item?.overrideFields?.[field] || {};
    const nextEnabled = Boolean(enabled);
    container.dataset.overrideEnabled = nextEnabled ? 'true' : 'false';
    container.classList.toggle('is-override-active', nextEnabled);

    const inputWrap = container.querySelector('[data-override-editor]');
    const preview = container.querySelector('[data-override-preview]');
    const hint = container.querySelector('[data-override-hint]');
    const button = container.querySelector('[data-override-toggle]');

    if (inputWrap) {
      inputWrap.hidden = !nextEnabled;
    }
    if (preview) {
      preview.hidden = nextEnabled;
    }
    if (hint) {
      hint.textContent = nextEnabled
        ? 'Saved only for this item. Remove the override to use the collection value again.'
        : this.inheritedHelpText(state);
    }
    if (button) {
      button.textContent = nextEnabled ? 'Use collection default' : 'Override';
    }
  }

  inheritedHelpText(state = {}) {
    if (state.isInherited && state.inheritedValue) {
      return 'Inherited from collection.';
    }
    if (state.isInherited && !state.inheritedValue) {
      return 'Collection default is empty. Add an override only if this item needs its own value.';
    }
    if (state.source === 'item') {
      return 'Using the item value because there is no collection default.';
    }
    if (state.source === 'legacy-raw') {
      return 'This item already had its own value before collection defaults were introduced.';
    }
    return 'Add an override only when this item needs to differ from the collection.';
  }

  inheritedPreviewText(state = {}) {
    if (state.isInherited && state.inheritedValue) {
      return `${state.inheritedValue} (inherited from collection)`;
    }
    if (state.isInherited) {
      return 'Inherited value is currently empty.';
    }
    if (state.source === 'item' && state.resolvedValue) {
      return `${state.resolvedValue} (item value)`;
    }
    return state.resolvedValue || 'No value yet.';
  }

  applyOverrideView(field, state = {}) {
    const config = ITEM_OVERRIDE_FIELD_CONFIG[field];
    if (!config) {
      return;
    }

    const input = this.shadowRoot.getElementById(config.inputId);
    const preview = this.shadowRoot.getElementById(config.previewId);
    const hint = this.shadowRoot.getElementById(config.hintId);
    if (input) {
      input.value = state.overrideActive ? state.overrideValue || '' : state.resolvedValue || '';
    }
    if (preview) {
      preview.textContent = this.inheritedPreviewText(state);
    }
    if (hint) {
      hint.textContent = this.inheritedHelpText(state);
    }

    this.setOverrideEnabled(field, Boolean(state.overrideActive));
  }

  applyView() {
    const mode = this.model.mode || 'none';
    const title = this.shadowRoot?.getElementById('editorTitle');
    const context = this.shadowRoot?.getElementById('editorContext');
    const empty = this.shadowRoot?.getElementById('editorEmpty');
    const collectionForm = this.shadowRoot?.getElementById('collectionEditorForm');
    const itemForm = this.shadowRoot?.getElementById('editorForm');
    const headerSaveBtn = this.shadowRoot?.getElementById('headerSaveBtn');
    const headerDeleteBtn = this.shadowRoot?.getElementById('headerDeleteBtn');

    if (!title || !context || !empty || !collectionForm || !itemForm || !headerSaveBtn || !headerDeleteBtn) {
      return;
    }

    empty.hidden = true;
    collectionForm.hidden = true;
    itemForm.hidden = true;
    headerSaveBtn.hidden = true;
    headerDeleteBtn.hidden = true;

    if (mode === 'collection') {
      const selected = this.model.collection || null;
      title.textContent = 'Collection metadata';
      if (!selected) {
        context.textContent = 'Select a collection.';
        empty.hidden = false;
        return;
      }

      collectionForm.hidden = false;
      headerSaveBtn.hidden = false;
      headerSaveBtn.textContent = 'Save collection';
      context.textContent = selected.id || '';
      this.shadowRoot.getElementById('collectionEditorTitle').value = selected.title || '';
      this.shadowRoot.getElementById('collectionEditorDescription').value = selected.description || '';
      this.shadowRoot.getElementById('collectionEditorLicense').value = selected.license || '';
      this.shadowRoot.getElementById('collectionEditorPublisher').value = selected.publisher || '';
      this.shadowRoot.getElementById('collectionEditorLanguage').value = selected.language || '';
      return;
    }

    if (mode === 'item') {
      const selected = this.model.item || null;
      title.textContent = 'Item metadata';
      if (!selected) {
        context.textContent = 'Select an item.';
        empty.hidden = false;
        return;
      }

      itemForm.hidden = false;
      headerSaveBtn.hidden = false;
      headerSaveBtn.textContent = 'Save item';
      headerDeleteBtn.hidden = !this.model.canDeleteItem;
      const filePath = selected.fileName || selected.media?.url || selected.media?.thumbnailUrl || '';
      context.textContent = this.model.canSaveItem
        ? `${selected.id} - ${selected.sourceDisplayLabel || selected.sourceLabel}${filePath ? ` - ${filePath}` : ''}`
        : `${selected.id} - ${selected.sourceDisplayLabel || selected.sourceLabel} (local edits)${filePath ? ` - ${filePath}` : ''}`;

      this.shadowRoot.getElementById('itemTitle').value = selected.itemSpecific?.title || selected.title || '';
      this.shadowRoot.getElementById('itemType').value = selected.itemSpecific?.mediaType || selected.media?.type || '';
      this.shadowRoot.getElementById('itemFilePath').value = filePath;
      this.shadowRoot.getElementById('itemCreator').value = selected.itemSpecific?.creator || selected.creator || '';
      this.shadowRoot.getElementById('itemDate').value = selected.itemSpecific?.date || selected.date || '';
      this.shadowRoot.getElementById('itemLocation').value = selected.itemSpecific?.location || selected.location || '';
      this.shadowRoot.getElementById('itemSource').value = selected.itemSpecific?.source || selected.source || '';
      this.shadowRoot.getElementById('itemTags').value = Array.isArray(selected.itemSpecific?.tags) ? selected.itemSpecific.tags.join(', ') : '';
      this.shadowRoot.getElementById('itemInclude').checked = selected.itemSpecific?.include !== false;

      for (const field of Object.keys(ITEM_OVERRIDE_FIELD_CONFIG)) {
        this.applyOverrideView(field, selected.overrideFields?.[field] || {});
      }
      return;
    }

    title.textContent = 'Metadata editor';
    context.textContent = 'Select a collection or item.';
    empty.hidden = false;
  }

  renderOverrideField(field, label, { tag, inputId, hintId, previewId }) {
    const inputMarkup = tag === 'textarea'
      ? `<textarea id="${inputId}"></textarea>`
      : `<input id="${inputId}" type="text" />`;

    return `
      <div class="field-row override-field" data-override-row="${field}" data-override-enabled="false">
        <div class="override-row-header">
          <label for="${inputId}">${label}</label>
          <button class="btn btn-secondary" data-override-toggle="${field}" type="button">Override</button>
        </div>
        <p id="${hintId}" class="field-help" data-override-hint></p>
        <div id="${previewId}" class="inheritance-preview" data-override-preview></div>
        <div data-override-editor hidden>
          ${inputMarkup}
        </div>
      </div>
    `;
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>${metadataStyles}</style>

      <aside class="panel editor-panel" data-presentation="${this.model.presentation || 'inspector'}" aria-label="Metadata editor">
        <div class="panel-header">
          <div class="editor-header-meta">
            <h2 id="editorTitle" class="panel-title">Metadata editor</h2>
            <p id="editorContext" class="editor-context"></p>
          </div>
          <div class="editor-header-actions">
            <button class="btn btn-danger" id="headerDeleteBtn" type="button" hidden>Delete item</button>
            <button class="btn btn-primary" id="headerSaveBtn" type="button" hidden>Save</button>
            <button class="btn editor-close-btn" id="closeEditorBtn" type="button">Close</button>
          </div>
        </div>
        <div class="editor-content">
          <div id="editorEmpty" class="editor-wrap">
            <div class="empty">Select a card to edit metadata.</div>
          </div>
          <form id="collectionEditorForm" class="editor-wrap" hidden>
            <div class="editor-section">
              <p class="editor-section-title">Collection details</p>
              <div class="field-row"><label for="collectionEditorTitle">Title</label><input id="collectionEditorTitle" type="text" /></div>
              <div class="field-row"><label for="collectionEditorDescription">Description</label><textarea id="collectionEditorDescription"></textarea></div>
              <div class="field-row"><label for="collectionEditorLicense">License</label><input id="collectionEditorLicense" type="text" /></div>
              <div class="field-row"><label for="collectionEditorPublisher">Publisher</label><input id="collectionEditorPublisher" type="text" /></div>
              <div class="field-row"><label for="collectionEditorLanguage">Language</label><input id="collectionEditorLanguage" type="text" /></div>
            </div>
          </form>
          <form id="editorForm" class="editor-wrap" hidden>
            <div class="editor-section">
              <p class="editor-section-title">Item-specific</p>
              <div class="field-row"><label for="itemTitle">Title</label><input id="itemTitle" type="text" /></div>
              <div class="field-row"><label for="itemType">Type / Format</label><input id="itemType" type="text" /></div>
              <div class="field-row"><label for="itemFilePath">File</label><input id="itemFilePath" type="text" readonly /></div>
            </div>
            <div class="editor-section">
              <p class="editor-section-title">Authorship</p>
              <div class="field-row"><label for="itemCreator">Creator</label><input id="itemCreator" type="text" /></div>
            </div>
            <div class="editor-section">
              <p class="editor-section-title">Context</p>
              <div class="field-row"><label for="itemDate">Date / Period</label><input id="itemDate" type="text" /></div>
              <div class="field-row"><label for="itemLocation">Location</label><input id="itemLocation" type="text" /></div>
              <div class="field-row"><label for="itemSource">Source</label><input id="itemSource" type="text" /></div>
            </div>
            <div class="editor-section">
              <p class="editor-section-title">Classification</p>
              <div class="field-row"><label for="itemTags">Tags / Keywords (comma separated)</label><input id="itemTags" type="text" /></div>
            </div>
            <div class="editor-section">
              <p class="editor-section-title">Override shared metadata</p>
              <p class="section-help">Collection metadata is the default. Only create an override when this item needs to differ.</p>
              ${this.renderOverrideField('description', 'Description', ITEM_OVERRIDE_FIELD_CONFIG.description)}
              ${this.renderOverrideField('license', 'License', ITEM_OVERRIDE_FIELD_CONFIG.license)}
              ${this.renderOverrideField('attribution', 'Attribution', ITEM_OVERRIDE_FIELD_CONFIG.attribution)}
              ${this.renderOverrideField('language', 'Language', ITEM_OVERRIDE_FIELD_CONFIG.language)}
            </div>
            <label class="checkbox-row" for="itemInclude"><span>Include in manifest</span><input id="itemInclude" type="checkbox" /></label>
          </form>
        </div>
      </aside>
    `;
  }
}

if (!customElements.get('open-collections-metadata')) {
  customElements.define('open-collections-metadata', OpenCollectionsMetadataElement);
}

export { OpenCollectionsMetadataElement };
