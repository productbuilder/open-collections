import { viewToggleStyles } from '../css/view-toggle.css.js';

class OpenViewToggleElement extends HTMLElement {
  static get observedAttributes() {
    return ['mode'];
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
    this.shadowRoot.querySelectorAll('[data-mode]').forEach((button) => {
      button.addEventListener('click', () => {
        const mode = button.getAttribute('data-mode') || 'cards';
        this.dispatchEvent(new CustomEvent('view-mode-change', {
          detail: { mode },
          bubbles: true,
          composed: true,
        }));
      });
    });
  }

  render() {
    const mode = this.getAttribute('mode') || 'cards';
    this.shadowRoot.innerHTML = `
      <style>${viewToggleStyles}</style>
      <div class="toggle" role="group" aria-label="View mode">
        <button type="button" class="option ${mode === 'cards' ? 'is-active' : ''}" data-mode="cards">Cards</button>
        <button type="button" class="option ${mode === 'rows' ? 'is-active' : ''}" data-mode="rows">Rows</button>
      </div>
    `;
  }
}

if (!customElements.get('open-view-toggle')) {
  customElements.define('open-view-toggle', OpenViewToggleElement);
}

export { OpenViewToggleElement };
