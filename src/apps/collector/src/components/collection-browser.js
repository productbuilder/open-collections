class OpenCollectionsBrowserElement extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.model = {
      currentLevel: 'collections',
      viewportTitle: 'Collections',
      assetCountText: 'No assets loaded.',
      sourceOptions: [{ value: 'all', label: 'All hosts' }],
      sourceFilterValue: 'all',
      collectionOptions: [{ value: 'all', label: 'All collections' }],
      collectionFilterValue: 'all',
      collections: [],
      items: [],
      selectedCollectionId: null,
      selectedItemId: null,
      dropTargetActive: false,
    };
  }

  connectedCallback() {
    this.render();
    this.bindEvents();
    this.renderFrame();
    this.renderGrid();
    this.setDropTargetActive(this.model.dropTargetActive);
  }

  bindEvents() {
    this.shadowRoot.getElementById('backToCollectionsBtn')?.addEventListener('click', () => {
      this.dispatch('back-to-collections');
    });

    this.shadowRoot.getElementById('sourceFilter')?.addEventListener('change', (event) => {
      this.dispatch('source-filter-change', { value: event.target.value || 'all' });
    });

    this.shadowRoot.getElementById('collectionFilter')?.addEventListener('change', (event) => {
      this.dispatch('collection-filter-change', { value: event.target.value || 'all' });
    });

    this.shadowRoot.getElementById('addImagesBtn')?.addEventListener('click', () => {
      if (this.model.currentLevel === 'collections') {
        this.dispatch('add-collection');
        return;
      }
      this.dispatch('add-item');
      this.shadowRoot.getElementById('imageFileInput')?.click();
    });

    this.shadowRoot.getElementById('imageFileInput')?.addEventListener('change', (event) => {
      const files = Array.from(event.target?.files || []);
      if (files.length > 0) {
        this.dispatch('files-selected', { files });
      }
      event.target.value = '';
    });

    const assetWrap = this.shadowRoot.getElementById('assetWrap');
    assetWrap?.addEventListener('dragenter', (event) => {
      event.preventDefault();
      this.dispatch('drop-target-change', { active: true });
    });
    assetWrap?.addEventListener('dragover', (event) => {
      event.preventDefault();
      this.dispatch('drop-target-change', { active: true });
    });
    assetWrap?.addEventListener('dragleave', (event) => {
      event.preventDefault();
      if (!event.relatedTarget || !assetWrap.contains(event.relatedTarget)) {
        this.dispatch('drop-target-change', { active: false });
      }
    });
    assetWrap?.addEventListener('drop', (event) => {
      event.preventDefault();
      this.dispatch('drop-target-change', { active: false });
      const files = Array.from(event.dataTransfer?.files || []);
      if (files.length > 0) {
        this.dispatch('files-selected', { files });
      }
    });
  }

  dispatch(name, detail = {}) {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }

  setSourceOptions(options, selectedValue = 'all') {
    this.model.sourceOptions = Array.isArray(options) ? options : [];
    this.model.sourceFilterValue = selectedValue || 'all';
    this.renderFilters();
  }

  setCollectionOptions(options, selectedValue = 'all') {
    this.model.collectionOptions = Array.isArray(options) ? options : [];
    this.model.collectionFilterValue = selectedValue || 'all';
    this.renderFilters();
  }

  setDropTargetActive(active) {
    this.model.dropTargetActive = Boolean(active);
    const overlay = this.shadowRoot?.getElementById('assetDropOverlay');
    if (overlay) {
      overlay.classList.toggle('is-active', this.model.dropTargetActive);
    }
  }

  update(data = {}) {
    this.model = {
      ...this.model,
      ...data,
    };
    if (!this.shadowRoot?.getElementById('viewportTitle')) {
      return;
    }
    this.renderFrame();
    this.renderGrid();
    this.setDropTargetActive(this.model.dropTargetActive);
  }

  requiredFieldScore(item) {
    const checks = [
      Boolean(item.id),
      Boolean(item.title),
      Boolean(item.media && item.media.url),
      Boolean(item.license),
    ];
    return `${checks.filter(Boolean).length}/${checks.length}`;
  }

  createPreviewNode(item) {
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

  renderFilters() {
    const sourceFilter = this.shadowRoot?.getElementById('sourceFilter');
    const collectionFilter = this.shadowRoot?.getElementById('collectionFilter');
    if (!sourceFilter || !collectionFilter) {
      return;
    }

    sourceFilter.innerHTML = '';
    for (const optionData of this.model.sourceOptions) {
      const option = document.createElement('option');
      option.value = optionData.value;
      option.textContent = optionData.label;
      sourceFilter.appendChild(option);
    }
    sourceFilter.value = this.model.sourceFilterValue || 'all';

    collectionFilter.innerHTML = '';
    for (const optionData of this.model.collectionOptions) {
      const option = document.createElement('option');
      option.value = optionData.value;
      option.textContent = optionData.label;
      collectionFilter.appendChild(option);
    }
    collectionFilter.value = this.model.collectionFilterValue || 'all';
  }

  renderFrame() {
    const title = this.shadowRoot.getElementById('viewportTitle');
    const backBtn = this.shadowRoot.getElementById('backToCollectionsBtn');
    const addBtn = this.shadowRoot.getElementById('addImagesBtn');
    const count = this.shadowRoot.getElementById('assetCount');
    if (!title || !backBtn || !addBtn || !count) {
      return;
    }

    title.textContent = this.model.viewportTitle || 'Collections';
    count.textContent = this.model.assetCountText || 'No assets loaded.';
    addBtn.textContent = this.model.currentLevel === 'collections' ? 'Add collection' : 'Add item';
    backBtn.classList.toggle('is-hidden', this.model.currentLevel === 'collections');

    this.renderFilters();
  }

  renderGrid() {
    const grid = this.shadowRoot.getElementById('assetGrid');
    if (!grid) {
      return;
    }
    grid.innerHTML = '';

    if (this.model.currentLevel === 'collections') {
      const collections = Array.isArray(this.model.collections) ? this.model.collections : [];
      if (collections.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'empty';
        empty.textContent = 'No collections yet. Add a collection to begin.';
        grid.appendChild(empty);
        return;
      }

      for (const collection of collections) {
        const card = document.createElement('article');
        card.className = 'asset-card';
        if (this.model.selectedCollectionId === collection.id) {
          card.classList.add('is-selected');
        }
        card.addEventListener('click', () => {
          this.dispatch('collection-select', { collectionId: collection.id });
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
          this.dispatch('collection-open', { collectionId: collection.id });
        });
        actions.appendChild(openBtn);

        card.append(title, badges, actions);
        grid.appendChild(card);
      }
      return;
    }

    const items = Array.isArray(this.model.items) ? this.model.items : [];
    if (items.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty';
      empty.textContent = 'This collection has no items yet. Add item to begin.';
      grid.appendChild(empty);
      return;
    }

    for (const item of items) {
      const card = document.createElement('article');
      card.className = 'asset-card';
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', `Select item ${item.title || item.id}`);
      if (this.model.selectedItemId === item.workspaceId) {
        card.classList.add('is-selected');
      }
      card.addEventListener('click', () => {
        this.dispatch('item-select', { workspaceId: item.workspaceId });
      });

      const preview = this.createPreviewNode(item);
      const title = document.createElement('p');
      title.className = 'card-title';
      title.textContent = item.title || '(Untitled)';

      const badges = document.createElement('div');
      badges.className = 'badge-row';
      const completeness = document.createElement('span');
      completeness.className = 'badge';
      completeness.textContent = `Completeness ${this.requiredFieldScore(item)}`;
      badges.append(completeness);

      const actions = document.createElement('div');
      actions.className = 'card-actions';
      const openBtn = document.createElement('button');
      openBtn.type = 'button';
      openBtn.className = 'btn';
      openBtn.textContent = 'View';
      openBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        this.dispatch('item-view', { workspaceId: item.workspaceId });
      });
      actions.append(openBtn);
      card.append(preview, title, badges, actions);
      grid.appendChild(card);
    }
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

        .viewport-panel {
          display: grid;
          grid-template-rows: auto 1fr;
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

        .panel-header-meta {
          display: flex;
          align-items: center;
          gap: 0.55rem;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .panel-title {
          margin: 0;
          font-size: 0.95rem;
          color: #111827;
        }

        .panel-subtext {
          margin: 0;
          font-size: 0.83rem;
          color: #64748b;
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

        .viewport-actions {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          flex-wrap: wrap;
        }

        .source-filter {
          width: 220px;
          min-width: 220px;
          max-width: 220px;
          font: inherit;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 0.42rem 0.55rem;
          background: #ffffff;
          color: #0f172a;
        }

        .is-hidden {
          display: none;
        }

        .asset-wrap {
          padding: 0.9rem;
          overflow: auto;
          min-height: 0;
          position: relative;
        }

        .drop-overlay {
          position: absolute;
          inset: 0;
          border: 2px dashed #0f6cc6;
          border-radius: 10px;
          background: rgba(15, 108, 198, 0.08);
          display: none;
          align-items: center;
          justify-content: center;
          color: #0f4f8a;
          font-weight: 700;
          pointer-events: none;
          z-index: 4;
        }

        .drop-overlay.is-active {
          display: flex;
        }

        .asset-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 0.7rem;
        }

        .asset-card {
          border: 1px solid #dbe3ec;
          border-radius: 9px;
          padding: 0.55rem;
          background: #ffffff;
          display: grid;
          gap: 0.5rem;
          cursor: pointer;
          transition: border-color 120ms ease, box-shadow 120ms ease, background-color 120ms ease;
        }

        .asset-card:hover {
          border-color: #93c5fd;
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
          background: #f8fbff;
        }

        .asset-card.is-selected {
          border-color: #0f6cc6;
          box-shadow: 0 0 0 1px #66a6e8 inset, 0 3px 10px rgba(15, 108, 198, 0.16);
          background: #f5faff;
        }

        .thumb {
          width: 100%;
          height: 125px;
          object-fit: cover;
          border-radius: 7px;
          border: 1px solid #dbe3ec;
          background: #eef2f7;
        }

        .thumb-placeholder {
          width: 100%;
          height: 125px;
          border-radius: 7px;
          border: 1px dashed #cbd5e1;
          display: grid;
          place-items: center;
          color: #64748b;
          background: #f8fafc;
          font-size: 0.82rem;
        }

        .card-title {
          margin: 0;
          font-size: 0.88rem;
          font-weight: 700;
        }

        .badge-row {
          display: flex;
          flex-wrap: wrap;
          gap: 0.35rem;
        }

        .badge {
          font-size: 0.75rem;
          padding: 0.15rem 0.4rem;
          border-radius: 999px;
          border: 1px solid #cbd5e1;
          color: #475569;
          background: #f8fafc;
        }

        .card-actions {
          display: flex;
          gap: 0.45rem;
        }

        .card-actions .btn {
          flex: 1;
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

        @media (max-width: 760px) {
          .viewport-panel.panel {
            border: none;
            background: transparent;
            box-shadow: none;
          }

          .panel-header {
            border: none;
            background: transparent;
            padding: 0.1rem 0 0.45rem;
            position: sticky;
            top: 0;
            z-index: 2;
          }

          .panel-header-meta {
            width: 100%;
            justify-content: space-between;
            gap: 0.4rem;
            flex-wrap: nowrap;
          }

          .btn {
            padding: 0.3rem 0.52rem;
            font-size: 0.77rem;
            border-radius: 7px;
          }

          .asset-wrap {
            padding: 0;
          }

          .asset-grid {
            grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
            gap: 0.55rem;
          }

          .asset-card {
            padding: 0.48rem;
            gap: 0.4rem;
            box-shadow: 0 1px 2px rgba(15, 23, 42, 0.05);
          }

          .thumb,
          .thumb-placeholder {
            height: 108px;
          }

          .card-actions .btn {
            font-size: 0.76rem;
            padding: 0.26rem 0.44rem;
          }

          #assetCount,
          #sourceFilter,
          #collectionFilter {
            display: none;
          }
        }
      </style>

      <section class="panel viewport-panel" aria-label="Collection browser">
        <div class="panel-header">
          <h2 id="viewportTitle" class="panel-title">Collections</h2>
          <div class="panel-header-meta">
            <button class="btn is-hidden" id="backToCollectionsBtn" type="button">Back</button>
            <div class="viewport-actions">
              <button class="btn" id="addImagesBtn" type="button">Add item</button>
              <input id="imageFileInput" type="file" accept=".jpg,.jpeg,.png,.webp,.gif" multiple hidden />
            </div>
            <select id="sourceFilter" class="source-filter is-hidden" aria-label="Filter assets by source"></select>
            <select id="collectionFilter" class="source-filter is-hidden" aria-label="Choose active collection"></select>
            <p id="assetCount" class="panel-subtext">No assets loaded.</p>
          </div>
        </div>
        <div id="assetWrap" class="asset-wrap">
          <div id="assetDropOverlay" class="drop-overlay">Drop image files to add them to this collection draft</div>
          <div id="assetGrid" class="asset-grid"></div>
        </div>
      </section>
    `;
  }
}

if (!customElements.get('open-collections-browser')) {
  customElements.define('open-collections-browser', OpenCollectionsBrowserElement);
}

export { OpenCollectionsBrowserElement };

