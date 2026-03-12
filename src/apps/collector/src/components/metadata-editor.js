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
    };
  }

  connectedCallback() {
    this.render();
    this.bindEvents();
    this.applyView();
    this.setMobileOpen(this.model.mobileOpen);
  }

  bindEvents() {
    this.shadowRoot.getElementById('closeEditorBtn')?.addEventListener('click', () => {
      this.dispatch('close-editor');
    });

    this.shadowRoot.getElementById('saveCollectionBtn')?.addEventListener('click', () => {
      this.dispatch('save-collection', { patch: this.getCollectionPatch() });
    });

    this.shadowRoot.getElementById('saveItemBtn')?.addEventListener('click', () => {
      this.dispatch('save-item', { patch: this.getItemPatch() });
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
    return {
      title: this.shadowRoot.getElementById('itemTitle')?.value.trim() || '',
      description: this.shadowRoot.getElementById('itemDescription')?.value.trim() || '',
      creator: this.shadowRoot.getElementById('itemCreator')?.value.trim() || '',
      date: this.shadowRoot.getElementById('itemDate')?.value.trim() || '',
      location: this.shadowRoot.getElementById('itemLocation')?.value.trim() || '',
      license: this.shadowRoot.getElementById('itemLicense')?.value.trim() || '',
      attribution: this.shadowRoot.getElementById('itemAttribution')?.value.trim() || '',
      source: this.shadowRoot.getElementById('itemSource')?.value.trim() || '',
      tags: this.tagsToArray(this.shadowRoot.getElementById('itemTags')?.value || ''),
      include: Boolean(this.shadowRoot.getElementById('itemInclude')?.checked),
      media: {
        type: this.shadowRoot.getElementById('itemType')?.value.trim() || '',
      },
    };
  }

  applyView() {
    const mode = this.model.mode || 'none';
    const title = this.shadowRoot?.getElementById('editorTitle');
    const context = this.shadowRoot?.getElementById('editorContext');
    const empty = this.shadowRoot?.getElementById('editorEmpty');
    const collectionForm = this.shadowRoot?.getElementById('collectionEditorForm');
    const itemForm = this.shadowRoot?.getElementById('editorForm');

    if (!title || !context || !empty || !collectionForm || !itemForm) {
      return;
    }

    empty.hidden = mode !== 'none';
    collectionForm.hidden = mode !== 'collection';
    itemForm.hidden = mode !== 'item';

    if (mode === 'collection') {
      const selected = this.model.collection || null;
      title.textContent = 'Collection metadata';
      if (!selected) {
        context.textContent = 'Select a collection.';
        empty.hidden = false;
        collectionForm.hidden = true;
        return;
      }

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
        itemForm.hidden = true;
        return;
      }

      context.textContent = this.model.canSaveItem
        ? `${selected.id} · ${selected.sourceDisplayLabel || selected.sourceLabel}`
        : `${selected.id} · ${selected.sourceDisplayLabel || selected.sourceLabel} (local edits)`;

      this.shadowRoot.getElementById('itemTitle').value = selected.title || '';
      this.shadowRoot.getElementById('itemDescription').value = selected.description || '';
      this.shadowRoot.getElementById('itemType').value = selected.media?.type || '';
      this.shadowRoot.getElementById('itemCreator').value = selected.creator || '';
      this.shadowRoot.getElementById('itemDate').value = selected.date || '';
      this.shadowRoot.getElementById('itemLocation').value = selected.location || '';
      this.shadowRoot.getElementById('itemLicense').value = selected.license || '';
      this.shadowRoot.getElementById('itemAttribution').value = selected.attribution || '';
      this.shadowRoot.getElementById('itemSource').value = selected.source || '';
      this.shadowRoot.getElementById('itemTags').value = Array.isArray(selected.tags) ? selected.tags.join(', ') : '';
      this.shadowRoot.getElementById('itemInclude').checked = selected.include !== false;
      this.shadowRoot.getElementById('saveItemBtn').disabled = false;
      return;
    }

    title.textContent = 'Metadata editor';
    context.textContent = 'Select a collection or item.';
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          min-height: 0;
        }

        * {
          box-sizing: border-box;
        }

        .panel {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
        }

        .editor-panel {
          display: grid;
          grid-template-rows: auto minmax(0, 1fr);
          min-height: 0;
          overflow: hidden;
        }

        .panel-header {
          padding: 0.8rem 0.95rem;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.7rem;
        }

        .panel-title {
          margin: 0;
          font-size: 0.95rem;
          color: #111827;
        }

        .editor-header-meta {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          min-width: 0;
          justify-content: flex-end;
        }

        .editor-context {
          margin: 0;
          font-size: 0.78rem;
          color: #64748b;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 200px;
        }

        .editor-content {
          min-height: 0;
          overflow: auto;
        }

        .editor-wrap {
          padding: 0.95rem;
          display: grid;
          gap: 0.6rem;
          align-content: start;
          min-height: 0;
        }

        .field-row {
          display: grid;
          gap: 0.25rem;
        }

        .field-row > label {
          font-size: 0.8rem;
          color: #475569;
          font-weight: 600;
        }

        input,
        textarea {
          width: 100%;
          font: inherit;
          font-size: 0.9rem;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 0.45rem 0.55rem;
          background: #ffffff;
          color: #0f172a;
        }

        textarea {
          resize: vertical;
          min-height: 78px;
        }

        .checkbox-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.84rem;
          color: #334155;
          padding-top: 0.2rem;
        }

        .checkbox-row input {
          width: auto;
        }

        .btn {
          border: 1px solid #cbd5e1;
          background: #ffffff;
          color: #0f172a;
          border-radius: 8px;
          padding: 0.42rem 0.7rem;
          cursor: pointer;
          font: inherit;
          font-size: 0.88rem;
          font-weight: 600;
        }

        .btn:hover {
          background: #f8fafc;
        }

        .btn-primary {
          background: #0f6cc6;
          color: #ffffff;
          border-color: #0f6cc6;
        }

        .btn-primary:hover {
          background: #0d5eae;
        }

        .editor-section {
          border-top: 1px solid #e2e8f0;
          padding-top: 0.6rem;
          display: grid;
          gap: 0.45rem;
        }

        .editor-section-title {
          margin: 0;
          font-size: 0.78rem;
          letter-spacing: 0.03em;
          text-transform: uppercase;
          color: #64748b;
          font-weight: 700;
        }

        .empty {
          border: 1px dashed #cbd5e1;
          border-radius: 8px;
          padding: 1rem;
          text-align: center;
          color: #64748b;
          background: #f8fafc;
          font-size: 0.9rem;
        }

        .editor-close-btn {
          display: none;
        }

        @media (max-width: 760px) {
          .editor-panel {
            position: fixed;
            inset: 0;
            z-index: 12;
            border: none;
            border-radius: 0;
            box-shadow: none;
            background: #f3f5f8;
            display: none;
          }

          .editor-panel.is-mobile-editor-open {
            display: grid;
          }

          .panel-header {
            padding: 0.7rem 0.8rem;
            background: #ffffff;
            border-bottom: 1px solid #e2e8f0;
            position: sticky;
            top: 0;
            z-index: 2;
          }

          .editor-context {
            max-width: 160px;
          }

          .editor-wrap {
            padding: 0.8rem;
          }

          .editor-close-btn {
            display: inline-flex;
          }

          .btn {
            padding: 0.3rem 0.52rem;
            font-size: 0.77rem;
            border-radius: 7px;
          }
        }
      </style>

      <aside class="panel editor-panel" aria-label="Metadata editor">
        <div class="panel-header">
          <h2 id="editorTitle" class="panel-title">Metadata editor</h2>
          <div class="editor-header-meta">
            <p id="editorContext" class="editor-context"></p>
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
            <button class="btn btn-primary" id="saveCollectionBtn" type="button">Save collection metadata</button>
          </form>
          <form id="editorForm" class="editor-wrap" hidden>
            <div class="editor-section">
              <p class="editor-section-title">Basic</p>
              <div class="field-row"><label for="itemTitle">Title</label><input id="itemTitle" type="text" /></div>
              <div class="field-row"><label for="itemDescription">Description</label><textarea id="itemDescription"></textarea></div>
              <div class="field-row"><label for="itemType">Type / Format</label><input id="itemType" type="text" /></div>
            </div>
            <div class="editor-section">
              <p class="editor-section-title">Authorship</p>
              <div class="field-row"><label for="itemCreator">Creator</label><input id="itemCreator" type="text" /></div>
              <div class="field-row"><label for="itemAttribution">Attribution</label><input id="itemAttribution" type="text" /></div>
            </div>
            <div class="editor-section">
              <p class="editor-section-title">Context</p>
              <div class="field-row"><label for="itemDate">Date / Period</label><input id="itemDate" type="text" /></div>
              <div class="field-row"><label for="itemLocation">Location</label><input id="itemLocation" type="text" /></div>
            </div>
            <div class="editor-section">
              <p class="editor-section-title">Rights</p>
              <div class="field-row"><label for="itemLicense">License</label><input id="itemLicense" type="text" /></div>
              <div class="field-row"><label for="itemSource">Source</label><input id="itemSource" type="text" /></div>
            </div>
            <div class="editor-section">
              <p class="editor-section-title">Classification</p>
              <div class="field-row"><label for="itemTags">Tags / Keywords (comma separated)</label><input id="itemTags" type="text" /></div>
            </div>
            <label class="checkbox-row" for="itemInclude"><span>Include in manifest</span><input id="itemInclude" type="checkbox" /></label>
            <button class="btn btn-primary" id="saveItemBtn" type="button">Save item metadata</button>
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
