import { panelShellStyles } from '../css/panel-shell.css.js';

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
    const statusMarkup = statusLabel
      ? `<span class="panel-status-chip" data-tone="${statusTone}">${statusLabel}</span>`
      : '';
    const subtitleMarkup = subtitle
      ? `<p class="panel-subtext">${subtitle}</p>`
      : '';

    this.shadowRoot.innerHTML = `
      <style>${panelShellStyles}</style>
      <section class="panel-shell">
        <header class="panel-header">
          <div class="panel-heading-left">
            <button class="btn ${showBack ? '' : 'is-hidden'}" id="backBtn" type="button">Back</button>
            <div class="panel-heading-copy">
              <div class="panel-title-row">
                <h2 class="panel-title">${title}</h2>
                ${statusMarkup}
              </div>
              ${subtitleMarkup}
            </div>
          </div>
          <div class="header-actions"><slot name="header-actions"></slot></div>
        </header>
        <div class="toolbar"><slot name="toolbar"></slot></div>
        <div class="body"><slot></slot></div>
      </section>
    `;
  }
}

if (!customElements.get('open-panel-shell')) {
  customElements.define('open-panel-shell', OpenPanelShellElement);
}

export { OpenPanelShellElement };
