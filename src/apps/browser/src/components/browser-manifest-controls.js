class OpenBrowserManifestControlsElement extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.model = {
      currentManifestUrl: '',
      recentManifestUrls: [],
      statusText: 'Load a collection manifest to browse.',
      statusTone: 'neutral',
      recentOpen: false,
    };
  }

  connectedCallback() {
    this.render();
    this.bindEvents();
    this.applyView();
  }

  bindEvents() {
    this.shadowRoot.getElementById('loadBtn')?.addEventListener('click', () => {
      this.dispatch('manifest-load', { manifestUrl: this.currentInputValue() });
    });
    this.shadowRoot.getElementById('manifestUrlInput')?.addEventListener('input', (event) => {
      this.dispatch('manifest-input-change', { manifestUrl: event.target?.value || '' });
    });
    this.shadowRoot.getElementById('manifestUrlInput')?.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter') {
        return;
      }
      event.preventDefault();
      this.dispatch('manifest-load', { manifestUrl: this.currentInputValue() });
    });
    this.shadowRoot.getElementById('recentToggleBtn')?.addEventListener('click', () => {
      this.setRecentOpen(!this.model.recentOpen);
    });
    this.shadowRoot.getElementById('clearRecentBtn')?.addEventListener('click', () => {
      this.dispatch('clear-recent-manifests');
    });
  }

  dispatch(name, detail = {}) {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }

  currentInputValue() {
    return this.shadowRoot.getElementById('manifestUrlInput')?.value || '';
  }

  setRecentOpen(open) {
    this.model.recentOpen = Boolean(open);
    const recentPanel = this.shadowRoot.getElementById('recentPanel');
    const toggleBtn = this.shadowRoot.getElementById('recentToggleBtn');
    if (recentPanel) {
      recentPanel.hidden = !this.model.recentOpen || this.model.recentManifestUrls.length === 0;
    }
    if (toggleBtn) {
      toggleBtn.setAttribute('aria-expanded', this.model.recentOpen ? 'true' : 'false');
    }
  }

  update(data = {}) {
    this.model = { ...this.model, ...data };
    this.applyView();
    this.setRecentOpen(this.model.recentOpen);
  }

  applyView() {
    const input = this.shadowRoot.getElementById('manifestUrlInput');
    const status = this.shadowRoot.getElementById('statusBadge');
    const recentList = this.shadowRoot.getElementById('recentList');
    const toggleBtn = this.shadowRoot.getElementById('recentToggleBtn');
    const clearBtn = this.shadowRoot.getElementById('clearRecentBtn');
    const recentSummary = this.shadowRoot.getElementById('recentSummary');
    if (!input || !status || !recentList || !toggleBtn || !clearBtn || !recentSummary) {
      return;
    }

    input.value = this.model.currentManifestUrl || '';
    status.textContent = this.model.statusText || '';
    status.dataset.tone = this.model.statusTone || 'neutral';

    recentList.innerHTML = '';
    const recentUrls = Array.isArray(this.model.recentManifestUrls) ? this.model.recentManifestUrls : [];
    recentSummary.textContent = recentUrls.length > 0
      ? `${recentUrls.length} recent URL${recentUrls.length === 1 ? '' : 's'}`
      : 'No recent URLs';
    toggleBtn.disabled = recentUrls.length === 0;
    clearBtn.disabled = recentUrls.length === 0;

    for (const url of recentUrls) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'recent-link';
      button.textContent = url;
      button.addEventListener('click', () => {
        input.value = url;
        this.dispatch('recent-manifest-picked', { manifestUrl: url });
        this.setRecentOpen(false);
      });
      recentList.appendChild(button);
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        * { box-sizing: border-box; }
        .toolbar-stack {
          display: grid;
          gap: 0.55rem;
          width: 100%;
        }
        .field-label {
          font-size: 0.76rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: #475569;
        }
        .manifest-row {
          display: flex;
          align-items: center;
          gap: 0.55rem;
          flex-wrap: wrap;
        }
        .manifest-input-wrap {
          flex: 1 1 26rem;
          min-width: min(100%, 18rem);
        }
        .text-input,
        .btn {
          font: inherit;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          background: #ffffff;
          color: #0f172a;
        }
        .text-input {
          width: 100%;
          padding: 0.5rem 0.65rem;
        }
        .btn {
          padding: 0.48rem 0.75rem;
          cursor: pointer;
          font-size: 0.88rem;
          font-weight: 600;
        }
        .btn:hover { background: #f8fafc; }
        .btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-primary {
          border-color: #0f6cc6;
          background: #0f6cc6;
          color: #ffffff;
        }
        .btn-primary:hover { background: #0b5aa6; }
        .manifest-meta-row {
          display: flex;
          align-items: center;
          gap: 0.55rem;
          justify-content: space-between;
          flex-wrap: wrap;
        }
        .recent-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .recent-summary {
          font-size: 0.8rem;
          color: #64748b;
        }
        .status-badge {
          display: inline-flex;
          align-items: center;
          min-height: 2.25rem;
          padding: 0.2rem 0.7rem;
          border-radius: 999px;
          border: 1px solid #cbd5e1;
          background: #f8fafc;
          font-size: 0.82rem;
          font-weight: 600;
          color: #475569;
        }
        .status-badge[data-tone="ok"] {
          background: #ecfdf3;
          border-color: #86efac;
          color: #166534;
        }
        .status-badge[data-tone="warn"] {
          background: #fff7ed;
          border-color: #fdba74;
          color: #9a3412;
        }
        .recent-panel {
          display: grid;
          gap: 0.45rem;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          background: #ffffff;
          padding: 0.55rem;
        }
        .recent-list {
          display: grid;
          gap: 0.35rem;
        }
        .recent-link {
          width: 100%;
          text-align: left;
          border: 1px solid #dbe3ec;
          border-radius: 8px;
          background: #ffffff;
          color: #0f172a;
          padding: 0.45rem 0.55rem;
          font: inherit;
          cursor: pointer;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .recent-link:hover { background: #f8fafc; }
        @media (max-width: 760px) {
          .manifest-row,
          .manifest-meta-row {
            align-items: stretch;
          }
          .manifest-row .btn,
          .recent-actions,
          .recent-actions .btn,
          .status-badge {
            width: 100%;
          }
        }
      </style>
      <div class="toolbar-stack">
        <span class="field-label">Manifest URL</span>
        <div class="manifest-row">
          <div class="manifest-input-wrap">
            <input id="manifestUrlInput" class="text-input" type="text" placeholder="https://example.org/collection.json" />
          </div>
          <button id="loadBtn" class="btn btn-primary" type="button">Load</button>
        </div>
        <div class="manifest-meta-row">
          <div class="recent-actions">
            <button id="recentToggleBtn" class="btn" type="button" aria-expanded="false">Recent</button>
            <button id="clearRecentBtn" class="btn" type="button">Clear recent</button>
            <span id="recentSummary" class="recent-summary">No recent URLs</span>
          </div>
          <span id="statusBadge" class="status-badge" data-tone="neutral">Load a collection manifest to browse.</span>
        </div>
        <div id="recentPanel" class="recent-panel" hidden>
          <div id="recentList" class="recent-list"></div>
        </div>
      </div>
    `;
  }
}

if (!customElements.get('open-browser-manifest-controls')) {
  customElements.define('open-browser-manifest-controls', OpenBrowserManifestControlsElement);
}

export { OpenBrowserManifestControlsElement };
