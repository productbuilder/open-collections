import { buildTreeHierarchy } from '../controllers/browser-controller.js';
import { treeStyles } from '../css/tree.css.js';

class PbWorkspaceTreeElement extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.model = { treeNodes: [], activePath: '/', expandedPaths: ['/'] };
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
    this.shadowRoot.querySelectorAll('[data-tree-toggle]').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        this.dispatchEvent(new CustomEvent('tree-toggle', {
          detail: { path: button.dataset.path },
          bubbles: true,
          composed: true,
        }));
      });
    });

    this.shadowRoot.querySelectorAll('[data-tree-select]').forEach((button) => {
      button.addEventListener('click', () => {
        this.dispatchEvent(new CustomEvent('path-change', {
          detail: { path: button.dataset.path },
          bubbles: true,
          composed: true,
        }));
      });
    });
  }

  renderNode(node, expandedPaths) {
    const hasChildren = node.children.length > 0;
    const isExpanded = expandedPaths.has(node.path);
    const isActive = node.path === this.model.activePath;
    const childMarkup = hasChildren && isExpanded
      ? `<div class="tree-children" role="group">${node.children.map((child) => this.renderNode(child, expandedPaths)).join('')}</div>`
      : '';

    return `
      <div class="tree-node" role="treeitem" aria-expanded="${hasChildren ? String(isExpanded) : 'false'}" aria-selected="${String(isActive)}">
        <div class="tree-row ${isActive ? 'is-active' : ''}" style="--depth:${node.depth || 0}">
          <button
            class="disclosure ${hasChildren ? '' : 'is-placeholder'}"
            type="button"
            data-tree-toggle
            data-path="${node.path}"
            aria-label="${isExpanded ? 'Collapse' : 'Expand'} ${node.label}"
            ${hasChildren ? '' : 'disabled'}
          >
            <span class="caret ${isExpanded ? 'is-expanded' : ''}">▸</span>
          </button>
          <button
            class="tree-select ${isActive ? 'is-active' : ''}"
            type="button"
            data-tree-select
            data-path="${node.path}"
            title="${node.path}"
          >
            <span class="folder-icon">${node.kind === 'root' ? '⌂' : '🗀'}</span>
            <span class="tree-label">${node.label}</span>
          </button>
        </div>
        ${childMarkup}
      </div>
    `;
  }

  render() {
    const tree = buildTreeHierarchy(this.model.treeNodes);
    const expandedPaths = new Set(this.model.expandedPaths || []);
    const rows = tree.map((node) => this.renderNode(node, expandedPaths)).join('');

    this.shadowRoot.innerHTML = `
      <style>${treeStyles}</style>
      <section class="tree-panel">
        <div class="panel-header">
          <h2>Folders</h2>
          <p>Expand folders independently from the active path and asset selection state.</p>
        </div>
        <div class="tree-scroll" role="tree" aria-label="Workspace folders">${rows || '<p class="empty">No folders loaded.</p>'}</div>
      </section>
    `;
  }
}

if (!customElements.get('pb-workspace-tree')) {
  customElements.define('pb-workspace-tree', PbWorkspaceTreeElement);
}
