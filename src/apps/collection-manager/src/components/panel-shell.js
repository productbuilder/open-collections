import { renderBackButton } from './back-button.js';
import { panelShellStyles } from '../css/panel-shell.css.js?v=20260322-titlebar-center';

class OpenPanelShellElement extends HTMLElement {
  static get observedAttributes() {
    return ['title', 'subtitle', 'show-back', 'status-label', 'status-tone'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.bindEvents();
  }

  attributeChangedCallback() {
    this.render();
    this.bindEvents();
  }

  bindEvents() {
    this.shadowRoot.getElementById('backBtn')?.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('panel-back', { bubbles: true, composed: true }));
    });
  }

  render() {
    const title = this.getAttribute('title') || '';
    const subtitle = this.getAttribute('subtitle') || '';
    const showBack = this.getAttribute('show-back') === 'true';
    const statusLabel = this.getAttribute('status-label') || '';
    const statusTone = this.getAttribute('status-tone') || 'neutral';
    const backButtonMarkup = showBack ? renderBackButton() : '';
    const statusMarkup = statusLabel
      ? `<span class="panel-status-chip" data-tone="${statusTone}">${statusLabel}</span>`
      : '';
    const subtitleMarkup = subtitle
      ? `<p class="panel-subtext">${subtitle}</p>`
      : '';

    this.shadowRoot.innerHTML = `
      <style>${panelShellStyles}</style>

      <section class="panel-shell">

        <header class="panel-titlebar">
          <div class="panel-titlebar-main">
            
            ${backButtonMarkup}
            <div class="panel-heading-copy">
              <div class="panel-title-row">
                <h2 class="panel-title">${title}</h2>
                ${statusMarkup}
              </div>
              ${subtitleMarkup}
            </div>
          </div>
          <div class="panel-titlebar-actions"><slot name="header-actions"></slot></div>
        </header>

        <header class="panel-ttitlebar">
          <div class="panel-toolbar-row">
            <div class="panel-toolbar-main"><slot name="toolbar"></slot></div>
            <div class="panel-toolbar-actions"><slot name="toolbar-actions"></slot></div>
          </div>
        </header>

        <div class="panel-content"><slot></slot></div>

      </section>
    `;
  }
}

if (!customElements.get('open-panel-shell')) {
  customElements.define('open-panel-shell', OpenPanelShellElement);
}

export { OpenPanelShellElement };
