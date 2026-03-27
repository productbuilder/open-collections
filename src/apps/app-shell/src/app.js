import { renderShellNav } from './components/shell-nav.js';
import { SHELL_VIEW_RENDERERS } from './components/shell-view.js';
import { appShellStyles } from './styles/shell.css.js';

const DEFAULT_SECTION_KEY = 'browse';

class OpenAppShellElement extends HTMLElement {
  constructor() {
    super();
    this.state = {
      activeSectionKey: DEFAULT_SECTION_KEY,
    };

    this.shadow = this.attachShadow({ mode: 'open' });
    this.render();
  }

  connectedCallback() {
    this.bindEvents();
  }

  bindEvents() {
    if (this._isBound) {
      return;
    }

    this._isBound = true;
    this.shadow.addEventListener('click', (event) => {
      const button = event.target instanceof HTMLElement ? event.target.closest('button[data-section-key]') : null;
      const sectionKey = button?.dataset.sectionKey;
      if (!sectionKey || sectionKey === this.state.activeSectionKey) {
        return;
      }
      this.setActiveSection(sectionKey);
    });
  }

  setActiveSection(sectionKey) {
    if (!SHELL_VIEW_RENDERERS[sectionKey]) {
      return;
    }

    this.state.activeSectionKey = sectionKey;
    this.render();
  }

  render() {
    const activeSectionKey = this.state.activeSectionKey;
    const renderView = SHELL_VIEW_RENDERERS[activeSectionKey] || SHELL_VIEW_RENDERERS[DEFAULT_SECTION_KEY];

    this.shadow.innerHTML = `
      <style>${appShellStyles}</style>
      <div class="shell">
        <header class="shell-header">
          <h1 class="shell-title">Open Collections</h1>
          <p class="shell-subtitle">Shared app shell scaffold</p>
        </header>

        <nav class="shell-nav" aria-label="Open Collections sections">
          ${renderShellNav(activeSectionKey)}
        </nav>

        <main class="shell-viewport" id="shellViewport" tabindex="-1">
          ${renderView()}
        </main>
      </div>
    `;

    const activeButton = this.shadow.querySelector(`button[data-section-key="${activeSectionKey}"]`);
    activeButton?.setAttribute('aria-current', 'page');
  }
}

if (!customElements.get('open-app-shell')) {
  customElements.define('open-app-shell', OpenAppShellElement);
}

export { OpenAppShellElement };
