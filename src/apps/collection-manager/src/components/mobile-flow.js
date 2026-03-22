import './collection-browser.js';
import './mobile-detail.js';

const mobileFlowStyles = `
  :host {
    display: block;
    height: 100%;
    min-height: 0;
    background: #f3f5f8;
  }

  [hidden] {
    display: none !important;
  }

  .mobile-flow {
    height: 100%;
    min-height: 0;
    display: grid;
  }

  .mobile-level {
    min-height: 0;
    height: 100%;
  }
`;

class OpenCollectionsMobileFlowElement extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.mobileView = 'browse';
  }

  connectedCallback() {
    this.render();
    this.bindEvents();
    this.applyView();
  }

  bindEvents() {
    const browser = this.shadowRoot.getElementById('mobileBrowser');
    const detail = this.shadowRoot.getElementById('mobileDetail');
    const forward = (source, name) => {
      source?.addEventListener(name, (event) => {
        const detailData = event.detail ? { ...event.detail } : {};
        if (name === 'collection-select') {
          this.dispatch('collection-open', detailData);
          return;
        }
        this.dispatch(name, detailData);
      });
    };

    [
      'back-to-collections',
      'collection-select',
      'collection-open',
      'item-select',
      'item-toggle-selected',
      'clear-item-selection',
      'delete-selected-items',
      'item-view',
      'view-mode-change',
      'add-collection',
      'publish-collection',
      'files-selected',
      'drop-target-change',
    ].forEach((name) => forward(browser, name));

    ['back-to-browse', 'save-item', 'save-collection', 'delete-item'].forEach((name) => forward(detail, name));
  }

  dispatch(name, detail = {}) {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }

  setMobileView(view = 'browse') {
    this.mobileView = view === 'detail' ? 'detail' : 'browse';
    this.applyView();
  }

  setBrowserState(state = {}) {
    this.shadowRoot.getElementById('mobileBrowser')?.update(state);
  }

  setDetailState(state = {}) {
    this.shadowRoot.getElementById('mobileDetail')?.setView(state);
  }

  applyView() {
    const browseLevel = this.shadowRoot.getElementById('browseLevel');
    const detailLevel = this.shadowRoot.getElementById('detailLevel');
    if (!browseLevel || !detailLevel) {
      return;
    }
    browseLevel.hidden = this.mobileView !== 'browse';
    detailLevel.hidden = this.mobileView !== 'detail';
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>${mobileFlowStyles}</style>
      <section class="mobile-flow" aria-label="Mobile collection manager flow">
        <div id="browseLevel" class="mobile-level">
          <open-collections-browser id="mobileBrowser"></open-collections-browser>
        </div>
        <div id="detailLevel" class="mobile-level" hidden>
          <open-collections-mobile-detail id="mobileDetail"></open-collections-mobile-detail>
        </div>
      </section>
    `;
  }
}

if (!customElements.get('open-collections-mobile-flow')) {
  customElements.define('open-collections-mobile-flow', OpenCollectionsMobileFlowElement);
}

export { OpenCollectionsMobileFlowElement };
