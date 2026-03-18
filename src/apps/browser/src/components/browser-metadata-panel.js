import { metadataStyles } from '../css/metadata.css.js';

class OpenBrowserMetadataPanelElement extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.model = {
      title: 'Metadata',
      contextText: 'Read-only details for the selected item.',
      mobileOpen: false,
      fields: [],
      emptyText: 'Load a collection, then click a card to inspect metadata.',
    };
  }

  connectedCallback() {
    this.render();
    this.bindEvents();
    this.applyView();
    this.setMobileOpen(this.model.mobileOpen);
  }

  bindEvents() {
    this.shadowRoot.getElementById('closeBtn')?.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('close-metadata', { bubbles: true, composed: true }));
    });
  }

  setMobileOpen(open) {
    this.model.mobileOpen = Boolean(open);
    const panel = this.shadowRoot.querySelector('.metadata-panel');
    if (panel) {
      panel.classList.toggle('is-mobile-open', this.model.mobileOpen);
    }
  }

  setView(data = {}) {
    this.model = { ...this.model, ...data };
    this.applyView();
    this.setMobileOpen(this.model.mobileOpen);
  }

  applyView() {
    const title = this.shadowRoot.getElementById('panelTitle');
    const context = this.shadowRoot.getElementById('panelContext');
    const body = this.shadowRoot.getElementById('panelBody');
    if (!title || !context || !body) {
      return;
    }

    title.textContent = this.model.title || 'Metadata';
    context.textContent = this.model.contextText || '';
    body.innerHTML = '';

    if (!Array.isArray(this.model.fields) || this.model.fields.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty';
      empty.textContent = this.model.emptyText || 'Nothing selected.';
      body.appendChild(empty);
      return;
    }

    const list = document.createElement('dl');
    list.className = 'metadata-list';
    for (const field of this.model.fields) {
      const row = document.createElement('div');
      row.className = 'metadata-row';

      const term = document.createElement('dt');
      term.textContent = field.label || '';

      const definition = document.createElement('dd');
      definition.textContent = field.value || '-';

      row.append(term, definition);
      list.appendChild(row);
    }
    body.appendChild(list);
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>${metadataStyles}</style>
      <aside class="metadata-panel" aria-label="Metadata panel">
        <div class="panel-header">
          <div class="header-meta">
            <h2 id="panelTitle" class="panel-title">Metadata</h2>
            <p id="panelContext" class="panel-context">Read-only details for the selected item.</p>
          </div>
          <div class="header-actions">
            <button id="closeBtn" class="btn close-btn" type="button">Close</button>
          </div>
        </div>
        <div id="panelBody" class="panel-body"></div>
      </aside>
    `;
  }
}

if (!customElements.get('open-browser-metadata-panel')) {
  customElements.define('open-browser-metadata-panel', OpenBrowserMetadataPanelElement);
}

export { OpenBrowserMetadataPanelElement };
