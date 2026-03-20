import { treeStyles } from '../css/tree.css.js';

class PbWorkspaceTreeElement extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.model = { treeNodes: [], activePath: '/' };
  }

  connectedCallback() {
    this.render();
    this.bindEvents();
  }

  update(model = {}) {
    this.model = { ...this.model, ...model };
    if (this.isConnected) {
      this.render();
      this.bindEvents();
    }
  }

  bindEvents() {
    this.shadowRoot.querySelectorAll('[data-path]').forEach((button) => {
      button.addEventListener('click', () => {
        this.dispatchEvent(new CustomEvent('path-change', {
          detail: { path: button.dataset.path },
          bubbles: true,
          composed: true,
        }));
      });
    });
  }

  render() {
    const rows = this.model.treeNodes.map((node) => `
      <button class="tree-node ${node.path === this.model.activePath ? 'is-active' : ''}" type="button" data-path="${node.path}" style="--depth:${node.depth || 0}">
        <span class="tree-kind">${node.kind === 'root' ? '⌂' : '▸'}</span>
        <span class="tree-label">${node.label}</span>
      </button>
    `).join('');

    this.shadowRoot.innerHTML = `
      <style>${treeStyles}</style>
      <section class="tree-panel">
        <div class="panel-header">
          <h2>Folders</h2>
          <p>Path navigation remains separate from selection and preview state.</p>
        </div>
        <div class="tree-list">${rows || '<p class="empty">No folders loaded.</p>'}</div>
      </section>
    `;
  }
}

if (!customElements.get('pb-workspace-tree')) {
  customElements.define('pb-workspace-tree', PbWorkspaceTreeElement);
}
