import { statusBarStyles } from '../css/status-bar.css.js';

class PbWorkspaceStatusBarElement extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.model = { status: { tone: 'neutral', text: '' }, activeWorkspaceName: 'No workspace', activePath: '/', selectionCount: 0 };
  }

  connectedCallback() {
    this.render();
  }

  update(model = {}) {
    this.model = {
      ...this.model,
      ...model,
      status: { ...this.model.status, ...(model.status || {}) },
    };
    if (this.isConnected) {
      this.render();
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>${statusBarStyles}</style>
      <footer class="status-bar" data-tone="${this.model.status.tone}">
        <span>${this.model.status.text}</span>
        <span>${this.model.activeWorkspaceName}</span>
        <span>${this.model.activePath}</span>
        <span>${this.model.selectionCount} selected</span>
      </footer>
    `;
  }
}

if (!customElements.get('pb-workspace-status-bar')) {
  customElements.define('pb-workspace-status-bar', PbWorkspaceStatusBarElement);
}
