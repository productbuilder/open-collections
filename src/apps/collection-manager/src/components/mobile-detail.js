import { resolveItemPreviewUrl, resolveItemViewerMediaUrl } from '../utils/preview-utils.js';
import { backButtonStyles, renderBackButton } from './back-button.js';
import './metadata-editor.js';

const mobileDetailStyles = `
  :host {
    display: block;
    height: 100%;
    min-height: 0;
    background: #f3f5f8;
  }

  * {
    box-sizing: border-box;
  }

  [hidden] {
    display: none !important;
  }

  .mobile-detail {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    height: 100%;
    min-height: 0;
    background: #f3f5f8;
  }

  .detail-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.8rem;
    background: #ffffff;
    border-bottom: 1px solid #dbe3ec;
  }

  .detail-header-meta {
    min-width: 0;
    display: grid;
    gap: 0.2rem;
  }

  .detail-title {
    margin: 0;
    font-size: 1rem;
    color: #0f172a;
  }

  .detail-context {
    margin: 0;
    font-size: 0.78rem;
    color: #64748b;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .detail-header-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-shrink: 0;
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

  .btn-danger {
    background: #dc2626;
    color: #ffffff;
    border-color: #dc2626;
  }

  .detail-body {
    min-height: 0;
    overflow: auto;
    display: grid;
    gap: 0.85rem;
    align-content: start;
    padding: 0.85rem;
  }

  .media-panel,
  .summary-panel {
    background: #ffffff;
    border: 1px solid #dbe3ec;
    border-radius: 14px;
    overflow: hidden;
  }

  .media-wrap {
    display: grid;
    place-items: center;
    min-height: 220px;
    background: linear-gradient(180deg, #e2e8f0 0%, #f8fafc 100%);
  }

  .media-wrap img,
  .media-wrap video {
    display: block;
    width: 100%;
    max-height: 48vh;
    object-fit: contain;
    background: #0f172a;
  }

  .media-placeholder {
    padding: 2rem 1rem;
    text-align: center;
    color: #64748b;
    font-size: 0.9rem;
  }

  .summary-panel {
    padding: 0.8rem;
    display: grid;
    gap: 0.35rem;
  }

  .summary-kicker {
    margin: 0;
    font-size: 0.78rem;
    font-weight: 700;
    color: #0f6cc6;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .summary-heading {
    margin: 0;
    font-size: 1.1rem;
    color: #0f172a;
  }

  .summary-copy {
    margin: 0;
    color: #475569;
    font-size: 0.9rem;
    line-height: 1.5;
  }

  .metadata-panel {
    min-height: 0;
  }

  ${backButtonStyles}
`;

class OpenCollectionsMobileDetailElement extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.model = {
      mode: 'none',
      item: null,
      canSaveItem: false,
      canDeleteItem: false,
    };
  }

  connectedCallback() {
    this.render();
    this.bindEvents();
    this.applyView();
  }

  bindEvents() {
    this.shadowRoot.getElementById('backBtn')?.addEventListener('click', () => {
      this.dispatch('back-to-browse');
    });
    this.shadowRoot.getElementById('saveBtn')?.addEventListener('click', () => {
      const editor = this.shadowRoot.getElementById('detailMetadataEditor');
      if (this.model.mode === 'item' && editor) {
        this.dispatch('save-item', { patch: editor.getItemPatch() });
      }
    });
    this.shadowRoot.getElementById('deleteBtn')?.addEventListener('click', () => {
      if (this.model.mode === 'item' && this.model.item?.workspaceId) {
        this.dispatch('delete-item', { workspaceId: this.model.item.workspaceId });
      }
    });

    this.shadowRoot.getElementById('detailMetadataEditor')?.addEventListener('save-item', (event) => {
      this.dispatch('save-item', event.detail || {});
    });
    this.shadowRoot.getElementById('detailMetadataEditor')?.addEventListener('save-collection', (event) => {
      this.dispatch('save-collection', event.detail || {});
    });
    this.shadowRoot.getElementById('detailMetadataEditor')?.addEventListener('delete-item', (event) => {
      this.dispatch('delete-item', event.detail || {});
    });
  }

  dispatch(name, detail = {}) {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }

  setView(data = {}) {
    this.model = {
      ...this.model,
      ...data,
    };
    this.applyView();
  }

  mediaMarkup(item) {
    if (!item) {
      return '<div class="media-placeholder">Select an item to view its media and metadata.</div>';
    }

    const mediaType = String(item.media?.type || '').toLowerCase();
    const viewerUrl = resolveItemViewerMediaUrl(item) || resolveItemPreviewUrl(item);
    if (!viewerUrl) {
      return '<div class="media-placeholder">No image or media preview is available for this item yet.</div>';
    }

    if (mediaType.includes('video')) {
      return `<video controls playsinline preload="metadata" src="${viewerUrl}"></video>`;
    }

    return `<img src="${viewerUrl}" alt="${item.title || item.id || 'Collection item'}" />`;
  }

  applyView() {
    const title = this.shadowRoot.getElementById('detailTitle');
    const context = this.shadowRoot.getElementById('detailContext');
    const summaryHeading = this.shadowRoot.getElementById('summaryHeading');
    const summaryCopy = this.shadowRoot.getElementById('summaryCopy');
    const mediaWrap = this.shadowRoot.getElementById('mediaWrap');
    const deleteBtn = this.shadowRoot.getElementById('deleteBtn');
    const saveBtn = this.shadowRoot.getElementById('saveBtn');
    const editor = this.shadowRoot.getElementById('detailMetadataEditor');

    if (!title || !context || !summaryHeading || !summaryCopy || !mediaWrap || !deleteBtn || !saveBtn || !editor) {
      return;
    }

    const item = this.model.mode === 'item' ? this.model.item : null;
    title.textContent = item?.title || item?.id || 'Item detail';
    context.textContent = item
      ? [item.collectionLabel || item.collectionId, item.sourceDisplayLabel || item.sourceLabel].filter(Boolean).join(' • ')
      : 'Select an item to inspect it.';
    summaryHeading.textContent = item?.title || item?.id || 'No item selected';
    summaryCopy.textContent = item?.description || item?.itemSpecific?.description || 'Media appears first on mobile, with editable metadata below for quick review and updates.';
    mediaWrap.innerHTML = this.mediaMarkup(item);
    deleteBtn.hidden = !this.model.canDeleteItem;
    saveBtn.hidden = !item;

    editor.setPresentation?.('embedded');
    editor.setView({
      mode: item ? 'item' : 'none',
      item,
      canSaveItem: this.model.canSaveItem,
      canDeleteItem: this.model.canDeleteItem,
    });
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>${mobileDetailStyles}</style>
      <section class="mobile-detail" aria-label="Item detail view">
        <header class="detail-header">
          <div class="detail-header-meta">
            <h2 id="detailTitle" class="detail-title">Item detail</h2>
            <p id="detailContext" class="detail-context">Select an item to inspect it.</p>
          </div>
          <div class="detail-header-actions">
            ${renderBackButton()}
            <button id="deleteBtn" class="btn btn-danger" type="button" hidden>Delete</button>
            <button id="saveBtn" class="btn btn-primary" type="button" hidden>Save</button>
          </div>
        </header>
        <div class="detail-body">
          <section class="media-panel">
            <div id="mediaWrap" class="media-wrap"></div>
          </section>
          <section class="summary-panel">
            <p class="summary-kicker">Detail</p>
            <h3 id="summaryHeading" class="summary-heading">No item selected</h3>
            <p id="summaryCopy" class="summary-copy">Media appears first on mobile, with editable metadata below for quick review and updates.</p>
          </section>
          <section class="metadata-panel">
            <open-collections-metadata id="detailMetadataEditor"></open-collections-metadata>
          </section>
        </div>
      </section>
    `;
  }
}

if (!customElements.get('open-collections-mobile-detail')) {
  customElements.define('open-collections-mobile-detail', OpenCollectionsMobileDetailElement);
}

export { OpenCollectionsMobileDetailElement };
