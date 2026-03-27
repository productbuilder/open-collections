import { renderShellNav } from './components/shell-nav.js';
import { appShellStyles } from './styles/shell.css.js';
import { SHELL_SECTION_ADAPTERS } from './components/section-adapters.js';
import {
  APP_RUNTIME_MODES,
  APP_LIFECYCLE_EVENTS,
  createAppRuntimeContext,
} from '../../../shared/runtime/app-mount-contract.js';
import { createHostCapabilities } from '../../../shared/runtime/host-capabilities.js';
import { createToastLayer } from '../../../shared/ui/app-runtime/primitives.js';

const DEFAULT_SECTION_KEY = 'browse';

class OpenAppShellElement extends HTMLElement {
  constructor() {
    super();
    this.state = {
      activeSectionKey: DEFAULT_SECTION_KEY,
    };

    this.shadow = this.attachShadow({ mode: 'open' });
    this.activeSectionSession = null;
    this.toastLayer = null;
    this.render();
  }

  connectedCallback() {
    this.bindEvents();
    this.mountActiveSection();
  }

  disconnectedCallback() {
    this.unmountActiveSection();
    this.destroyToastLayer();
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

    this.addEventListener(APP_LIFECYCLE_EVENTS.NAVIGATE, (event) => {
      const detail = event.detail || {};
      if (detail.targetAppId !== 'collection-account') {
        return;
      }
      event.preventDefault();
      this.setActiveSection('account');
    });
  }

  ensureToastLayer() {
    if (this.toastLayer) {
      return this.toastLayer;
    }
    this.toastLayer = createToastLayer(this.shadow);
    return this.toastLayer;
  }

  destroyToastLayer() {
    this.toastLayer?.destroy();
    this.toastLayer = null;
  }

  createHostCapabilities() {
    return createHostCapabilities({
      mode: APP_RUNTIME_MODES.EMBEDDED,
      notify: (message, options = {}) => {
        this.ensureToastLayer().show(message, {
          tone: options.tone || 'neutral',
          timeout: options.timeout ?? 2600,
        });
      },
    });
  }

  setActiveSection(sectionKey) {
    if (!SHELL_SECTION_ADAPTERS[sectionKey]) {
      return;
    }

    this.unmountActiveSection();
    this.state.activeSectionKey = sectionKey;
    this.render();
    this.mountActiveSection();
  }

  mountActiveSection() {
    const mountTarget = this.shadow.getElementById('shellViewportContent');
    const section = SHELL_SECTION_ADAPTERS[this.state.activeSectionKey] || SHELL_SECTION_ADAPTERS[DEFAULT_SECTION_KEY];

    if (!mountTarget || !section) {
      return;
    }

    const runtimeContext = createAppRuntimeContext({
      appId: section.appId,
      mode: APP_RUNTIME_MODES.EMBEDDED,
      target: mountTarget,
      config: {
        sectionKey: this.state.activeSectionKey,
      },
      hostCapabilities: this.createHostCapabilities(),
      onEvent: (type, detail) => {
        if (type === 'app:request-notification' && detail.message) {
          this.ensureToastLayer().show(detail.message, { tone: detail.tone || 'neutral' });
        }
      },
    });

    this.activeSectionSession = section.adapter.mount(runtimeContext);
  }

  unmountActiveSection() {
    this.activeSectionSession?.unmount?.();
    this.activeSectionSession = null;
  }

  render() {
    const activeSectionKey = this.state.activeSectionKey;

    this.shadow.innerHTML = `
      <style>${appShellStyles}</style>
      <div class="oc-app-frame">
        <header class="oc-app-bar">
          <h1 class="shell-title">Open Collections</h1>
        </header>

        <nav class="oc-app-nav" aria-label="Open Collections sections">
          ${renderShellNav(activeSectionKey)}
        </nav>

        <main class="oc-app-viewport" id="shellViewport" tabindex="-1">
          <div id="shellViewportContent" class="shell-section-mount"></div>
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
