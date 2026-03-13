import { configuratorHeaderStyles } from '../css/header.css.js';

const WORKSPACE_LABELS = {
  general: 'General',
  products: 'Products',
  materials: 'Materials',
};

class OpenConfiguratorHeaderElement extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.model = {
      activeWorkspace: 'general',
      organizations: [{ id: 'org-default', label: 'Default organization' }],
      currentOrganizationId: 'org-default',
    };
    this.orgMenuOpen = false;
    this.handleDocumentPointerDown = this.onDocumentPointerDown.bind(this);
  }

  connectedCallback() {
    this.render();
    this.bindEvents();
    this.applyModel();
    document.addEventListener('pointerdown', this.handleDocumentPointerDown);
  }

  disconnectedCallback() {
    document.removeEventListener('pointerdown', this.handleDocumentPointerDown);
  }

  bindEvents() {
    this.shadowRoot.querySelectorAll('[data-workspace-id]').forEach((button) => {
      button.addEventListener('click', () => {
        const workspace = button.getAttribute('data-workspace-id') || 'general';
        this.dispatch('workspace-select', { workspace });
      });
    });

    this.shadowRoot.getElementById('organizationMenuBtn')?.addEventListener('click', () => {
      this.orgMenuOpen = !this.orgMenuOpen;
      this.render();
      this.bindEvents();
      this.applyModel();
    });

    this.shadowRoot.querySelectorAll('[data-org-menu-action]').forEach((button) => {
      button.addEventListener('click', () => {
        const action = button.getAttribute('data-org-menu-action') || '';
        if (!action) {
          return;
        }
        this.orgMenuOpen = false;
        this.render();
        this.bindEvents();
        this.applyModel();
        this.dispatch('organization-menu-action', { action });
      });
    });

    this.shadowRoot.getElementById('orgMenu')?.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') {
        return;
      }
      event.preventDefault();
      this.orgMenuOpen = false;
      this.render();
      this.bindEvents();
      this.applyModel();
    });
  }

  onDocumentPointerDown(event) {
    if (!this.orgMenuOpen) {
      return;
    }
    const path = typeof event.composedPath === 'function' ? event.composedPath() : [];
    if (path.includes(this)) {
      return;
    }
    this.orgMenuOpen = false;
    this.render();
    this.bindEvents();
    this.applyModel();
  }

  dispatch(name, detail = {}) {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }

  setState(nextState = {}) {
    this.model = { ...this.model, ...nextState };
    this.render();
    this.bindEvents();
    this.applyModel();
  }

  applyModel() {
    const orgLabel = this.shadowRoot.getElementById('organizationLabel');
    const current = (Array.isArray(this.model.organizations) ? this.model.organizations : []).find(
      (entry) => entry.id === this.model.currentOrganizationId,
    );
    if (orgLabel) {
      orgLabel.textContent = current?.label || 'Organization';
    }

    const menuButton = this.shadowRoot.getElementById('organizationMenuBtn');
    if (menuButton) {
      menuButton.setAttribute('aria-expanded', this.orgMenuOpen ? 'true' : 'false');
    }

    const menu = this.shadowRoot.getElementById('orgMenu');
    if (menu) {
      menu.hidden = !this.orgMenuOpen;
    }

    this.shadowRoot.querySelectorAll('[data-workspace-id]').forEach((button) => {
      const workspace = button.getAttribute('data-workspace-id');
      button.classList.toggle('is-active', workspace === this.model.activeWorkspace);
    });
  }

  render() {
    const workspaceTabs = Object.entries(WORKSPACE_LABELS).map(([id, label]) => `
      <button class="tab-btn ${this.model.activeWorkspace === id ? 'is-active' : ''}" type="button" data-workspace-id="${id}">
        ${label}
      </button>
    `).join('');

    this.shadowRoot.innerHTML = `
      <style>${configuratorHeaderStyles}</style>
      <header class="topbar">
        <div class="left-stack">
          <div class="title-row">
            <h1 class="title">Configurator Package Manager</h1>
            <div class="workspace-tabs" role="tablist" aria-label="Workspaces">
              ${workspaceTabs}
            </div>
          </div>
        </div>
        <div class="right-stack">
          <div class="org-menu-wrap">
            <button class="org-menu-btn" id="organizationMenuBtn" type="button" aria-haspopup="menu" aria-expanded="false">
              <span class="org-menu-prefix">Organization:</span>
              <span id="organizationLabel">Organization</span>
            </button>
            <div id="orgMenu" class="org-menu" role="menu" hidden>
              <button class="org-menu-item" type="button" data-org-menu-action="set-organization" role="menuitem">
                Set organization
              </button>
              <button class="org-menu-item" type="button" data-org-menu-action="set-sources" role="menuitem">
                Set sources
              </button>
            </div>
          </div>
        </div>
      </header>
    `;
  }
}

if (!customElements.get('open-configurator-header')) {
  customElements.define('open-configurator-header', OpenConfiguratorHeaderElement);
}

export { OpenConfiguratorHeaderElement };
