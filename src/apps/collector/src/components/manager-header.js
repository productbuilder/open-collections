class OpenCollectionsHeaderElement extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._statusText = 'Not connected.';
    this._workspaceText = 'Host: none | Collection: none';
    this._hostLabel = 'Select host';
    this._statusTone = 'neutral';
  }

  connectedCallback() {
    this.render();
    this.bindEvents();
    this.setStatus(this._statusText, this._statusTone);
    this.setWorkspaceContext(this._workspaceText);
    this.setHostLabel(this._hostLabel);
  }

  bindEvents() {
    this.shadowRoot.getElementById('openHostManagerBtn')?.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('open-host-manager', { bubbles: true, composed: true }));
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
      <style>
        :host {
          display: block;
        }

        .topbar {
          background: #ffffff;
          border-bottom: 1px solid #e5e7eb;
          padding: 0.85rem 1rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }

        .brand {
          display: grid;
          gap: 0.15rem;
        }

        .title {
          margin: 0;
          font-size: 1rem;
          font-weight: 700;
          color: #111827;
        }

        .status {
          margin: 0;
          font-size: 0.85rem;
          color: #64748b;
        }

        .top-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .btn {
          border: 1px solid #cbd5e1;
          background: #ffffff;
          color: #0f172a;
          border-radius: 8px;
          padding: 0.42rem 0.7rem;
          cursor: pointer;
          font: inherit;
          font-size: 0.88rem;
          font-weight: 600;
        }

        .btn:hover {
          background: #f8fafc;
        }

        @media (max-width: 760px) {
          .topbar {
            padding: 0.55rem 0.7rem;
            gap: 0.55rem;
            align-items: center;
          }

          .title {
            font-size: 0.9rem;
          }

          #statusText,
          #workspaceContext {
            display: none;
          }

          .top-actions {
            flex-wrap: nowrap;
            margin-left: auto;
          }

          .btn {
            padding: 0.3rem 0.52rem;
            font-size: 0.77rem;
            border-radius: 7px;
          }
        }
      </style>

      <header class="topbar">
        <div class="brand">
          <h1 class="title">Open Collections Manager</h1>
          <p id="statusText" class="status">Not connected.</p>
          <p id="workspaceContext" class="status">Host: none | Collection: none</p>
        </div>
        <div class="top-actions">
          <button class="btn" id="openHostManagerBtn" type="button">Host: <span id="activeHostLabel">Select host</span></button>
          <button class="btn" id="openHeaderMenuBtn" type="button">More</button>
        </div>
      </header>
    `;
  }
}

if (!customElements.get('open-collections-header')) {
  customElements.define('open-collections-header', OpenCollectionsHeaderElement);
}

export { OpenCollectionsHeaderElement };

