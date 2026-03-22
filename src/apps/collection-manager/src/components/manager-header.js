import { headerStyles } from '../css/header.css.js';
import { renderChevronDownIcon, renderMoreVertIcon } from './icons.js';

class OpenCollectionsHeaderElement extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._statusText = 'Not connected.';
    this._workspaceText = 'Connection: none | Collection: none';
    this._hostLabel = 'Select connection';
    this._statusTone = 'neutral';
    this._workingStatus = {
      label: 'Draft',
      detail: 'Connect a source or create a collection draft to get started.',
      tone: 'neutral',
    };
  }

  connectedCallback() {
    this.render();
    this.bindEvents();
    this.setStatus(this._statusText, this._statusTone);
    this.setWorkspaceContext(this._workspaceText);
    this.setHostLabel(this._hostLabel);
    this.setWorkingStatus(this._workingStatus);
  }

  bindEvents() {
    this.shadowRoot.getElementById('openHostManagerBtn')?.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('open-host-menu', { bubbles: true, composed: true }));
    });
    this.shadowRoot.getElementById('openHeaderMenuBtn')?.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('open-header-menu', { bubbles: true, composed: true }));
    });
  }

  setStatus(text, tone = 'neutral') {
    this._statusText = text;
    this._statusTone = tone;
    const colors = {
      neutral: '#64748b',
      ok: '#166534',
      warn: '#9a3412',
    };
    const status = this.shadowRoot?.getElementById('statusText');
    if (!status) {
      return;
    }
    status.textContent = text;
    status.style.color = colors[tone] || colors.neutral;
  }

  setWorkingStatus(status = {}) {
    this._workingStatus = {
      ...this._workingStatus,
      ...status,
    };
  }

  setWorkspaceContext(text) {
    this._workspaceText = text;
    const workspace = this.shadowRoot?.getElementById('workspaceContext');
    if (workspace) {
      workspace.textContent = text;
    }
  }

  setHostLabel(text) {
    this._hostLabel = text;
    const host = this.shadowRoot?.getElementById('activeHostLabel');
    if (host) {
      host.textContent = text;
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>${headerStyles}</style>

      <header class="topbar">
        <div class="brand">
          <h1 class="title">Collection Manager</h1>
        </div>
        <div class="top-actions">
          <button class="btn btn-connection" id="openHostManagerBtn" type="button" aria-label="Connections">
            <span id="activeHostLabel">Select connection</span>
            ${renderChevronDownIcon()}
          </button>
          <button class="icon-btn" id="openHeaderMenuBtn" type="button" aria-label="More actions">
            ${renderMoreVertIcon()}
          </button>
        </div>
      </header>
    `;
  }
}

if (!customElements.get('open-collections-header')) {
  customElements.define('open-collections-header', OpenCollectionsHeaderElement);
}

export { OpenCollectionsHeaderElement };
