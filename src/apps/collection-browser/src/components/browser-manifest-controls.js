class OpenBrowserManifestControlsElement extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.model = {
			currentManifestUrl: "",
			recentManifestUrls: [],
			statusText: "Load a collection manifest to browse.",
			statusTone: "neutral",
			recentOpen: false,
			isLoading: false,
		};
		this.closeRecentTimer = null;
	}

	connectedCallback() {
		this.render();
		this.bindEvents();
		this.applyView();
	}

	disconnectedCallback() {
		if (this.closeRecentTimer) {
			window.clearTimeout(this.closeRecentTimer);
			this.closeRecentTimer = null;
		}
	}

	bindEvents() {
		const loadBtn = this.shadowRoot.getElementById("loadBtn");
		const input = this.shadowRoot.getElementById("manifestUrlInput");
		const recentToggleBtn =
			this.shadowRoot.getElementById("recentToggleBtn");
		const clearRecentBtn = this.shadowRoot.getElementById("clearRecentBtn");
		const recentList = this.shadowRoot.getElementById("recentList");

		loadBtn?.addEventListener("click", () => {
			if (this.model.isLoading) {
				return;
			}
			this.dispatch("manifest-load", {
				manifestUrl: this.currentInputValue(),
			});
		});

		input?.addEventListener("input", (event) => {
			this.dispatch("manifest-input-change", {
				manifestUrl: event.target?.value || "",
			});
			if (this.model.recentManifestUrls.length > 0) {
				this.setRecentOpen(true);
			}
		});

		input?.addEventListener("focus", () => {
			if (this.model.recentManifestUrls.length > 0) {
				this.setRecentOpen(true);
			}
		});

		input?.addEventListener("click", () => {
			if (this.model.recentManifestUrls.length > 0) {
				this.setRecentOpen(true);
			}
		});

		input?.addEventListener("keydown", (event) => {
			if (event.key === "Enter") {
				event.preventDefault();
				if (this.model.isLoading) {
					return;
				}
				this.dispatch("manifest-load", {
					manifestUrl: this.currentInputValue(),
				});
				this.setRecentOpen(false);
				return;
			}

			if (event.key === "Escape") {
				this.setRecentOpen(false);
				return;
			}

			if (
				event.key === "ArrowDown" &&
				this.model.recentManifestUrls.length > 0
			) {
				event.preventDefault();
				this.setRecentOpen(true);
				this.focusFirstRecentItem();
			}
		});

		recentToggleBtn?.addEventListener("click", () => {
			this.setRecentOpen(!this.model.recentOpen);
			if (this.model.recentOpen) {
				this.focusFirstRecentItem();
			}
		});

		clearRecentBtn?.addEventListener("click", () => {
			this.dispatch("clear-recent-manifests");
			this.setRecentOpen(false);
		});

		recentList?.addEventListener("click", (event) => {
			const button = event.target?.closest(".recent-link");
			const manifestUrl = button?.dataset?.manifestUrl || "";
			if (!manifestUrl) {
				return;
			}
			this.pickRecentManifestUrl(manifestUrl);
		});

		this.shadowRoot.addEventListener("focusout", () => {
			this.queueCloseRecentPanel();
		});
	}

	dispatch(name, detail = {}) {
		this.dispatchEvent(
			new CustomEvent(name, { detail, bubbles: true, composed: true }),
		);
	}

	currentInputValue() {
		return this.shadowRoot.getElementById("manifestUrlInput")?.value || "";
	}

	focusFirstRecentItem() {
		const firstRecentButton = this.shadowRoot.querySelector(".recent-link");
		firstRecentButton?.focus();
	}

	queueCloseRecentPanel() {
		if (this.closeRecentTimer) {
			window.clearTimeout(this.closeRecentTimer);
		}

		this.closeRecentTimer = window.setTimeout(() => {
			const root = this.shadowRoot;
			const controlsRoot = root?.getElementById("controlsRoot");
			const activeElement = root?.activeElement;
			if (
				controlsRoot &&
				activeElement &&
				controlsRoot.contains(activeElement)
			) {
				return;
			}
			this.setRecentOpen(false);
		}, 0);
	}

	pickRecentManifestUrl(manifestUrl) {
		const input = this.shadowRoot.getElementById("manifestUrlInput");
		if (!input) {
			return;
		}

		input.value = manifestUrl;
		this.dispatch("manifest-input-change", { manifestUrl });
		this.dispatch("recent-manifest-picked", { manifestUrl });
		this.dispatch("manifest-load", { manifestUrl });
		this.setRecentOpen(false);
	}

	setRecentOpen(open) {
		const hasRecent = this.model.recentManifestUrls.length > 0;
		this.model.recentOpen = Boolean(open) && hasRecent;

		const recentPanel = this.shadowRoot.getElementById("recentPanel");
		const toggleBtn = this.shadowRoot.getElementById("recentToggleBtn");
		if (recentPanel) {
			recentPanel.hidden = !this.model.recentOpen;
		}
		if (toggleBtn) {
			toggleBtn.setAttribute(
				"aria-expanded",
				this.model.recentOpen ? "true" : "false",
			);
		}
	}

	update(data = {}) {
		this.model = { ...this.model, ...data };
		this.applyView();
		this.setRecentOpen(this.model.recentOpen);
	}

	applyView() {
		const input = this.shadowRoot.getElementById("manifestUrlInput");
		const recentList = this.shadowRoot.getElementById("recentList");
		const toggleBtn = this.shadowRoot.getElementById("recentToggleBtn");
		const clearBtn = this.shadowRoot.getElementById("clearRecentBtn");
		const loadBtn = this.shadowRoot.getElementById("loadBtn");
		if (!input || !recentList || !toggleBtn || !clearBtn) {
			return;
		}

		input.value = this.model.currentManifestUrl || "";
		input.disabled = this.model.isLoading;

		const recentUrls = Array.isArray(this.model.recentManifestUrls)
			? this.model.recentManifestUrls
			: [];
		toggleBtn.disabled = recentUrls.length === 0;
		toggleBtn.textContent =
			recentUrls.length > 0 ? `Recent (${recentUrls.length})` : "Recent";
		clearBtn.disabled = recentUrls.length === 0;
		if (loadBtn) {
			loadBtn.disabled = this.model.isLoading;
			loadBtn.textContent = this.model.isLoading ? "Loading..." : "Load";
		}

		recentList.innerHTML = "";
		for (const url of recentUrls) {
			const button = document.createElement("button");
			button.type = "button";
			button.className = "recent-link";
			button.dataset.manifestUrl = url;
			button.textContent = url;
			button.title = url;
			recentList.appendChild(button);
		}

		if (recentUrls.length === 0) {
			this.setRecentOpen(false);
		}
	}

	render() {
		this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
        }

        * {
          box-sizing: border-box;
        }

        .controls-root {
          display: grid;
          gap: 0.55rem;
          width: 100%;
          position: relative;
        }

        .manifest-row {
          display: flex;
          align-items: center;
          gap: 0.55rem;
          width: 100%;
        }

        .manifest-input-wrap {
          flex: 1 1 26rem;
          min-width: min(100%, 18rem);
          display: flex;
          align-items: center;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          background: #ffffff;
          overflow: hidden;
        }

        .text-input {
          flex: 1;
          width: 100%;
          min-width: 0;
          border: 0;
          background: transparent;
          color: #0f172a;
          padding: 0.5rem 0.65rem;
          font: inherit;
        }

        .text-input:focus {
          outline: none;
        }

        .manifest-input-wrap:focus-within {
          border-color: #0f6cc6;
          box-shadow: 0 0 0 2px rgba(15, 108, 198, 0.16);
        }

        .btn {
          border: 1px solid #cbd5e1;
          background: #ffffff;
          color: #0f172a;
          border-radius: 8px;
          padding: 0.45rem 0.7rem;
          cursor: pointer;
          font: inherit;
          font-size: 0.86rem;
          font-weight: 600;
          white-space: nowrap;
        }

        .btn:hover {
          background: #f8fafc;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-inline {
          border: 0;
          border-left: 1px solid #e2e8f0;
          border-radius: 0;
          height: 100%;
          min-height: 2.2rem;
          padding-inline: 0.65rem;
          background: #ffffff;
        }

        .btn-primary {
          border-color: #0f6cc6;
          background: #0f6cc6;
          color: #ffffff;
        }

        .btn-primary:hover {
          background: #0b5aa6;
        }

        .recent-panel {
          display: grid;
          gap: 0.45rem;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          background: #ffffff;
          padding: 0.55rem;
        }

        .recent-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.45rem;
          flex-wrap: wrap;
        }

        .recent-title {
          margin: 0;
          font-size: 0.8rem;
          font-weight: 700;
          color: #334155;
        }

        .recent-list {
          display: grid;
          gap: 0.35rem;
          max-height: 12.5rem;
          overflow: auto;
          padding-right: 0.1rem;
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
          font-size: 0.84rem;
          cursor: pointer;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .recent-link:hover {
          background: #f8fafc;
          border-color: #bfdbfe;
        }

        @media (max-width: 760px) {
          .manifest-row {
            align-items: stretch;
            flex-wrap: wrap;
          }

          .manifest-input-wrap,
          .manifest-row .btn,
          .recent-panel,
          .recent-link {
            width: 100%;
          }

          .btn,
          .text-input {
            font-size: 0.82rem;
          }
        }
      </style>
      <div id="controlsRoot" class="controls-root">
        <div class="manifest-row">
          <div class="manifest-input-wrap">
            <input id="manifestUrlInput" class="text-input" type="text" placeholder="https://example.org/collection.json" autocomplete="off" spellcheck="false" />
            <button id="recentToggleBtn" class="btn btn-inline" type="button" aria-expanded="false" aria-label="Show recent manifest URLs">Recent</button>
          </div>
          <button id="loadBtn" class="btn btn-primary" type="button">Load</button>
        </div>

        <div id="recentPanel" class="recent-panel" hidden>
          <div class="recent-header">
            <span class="recent-title">Recent manifest URLs</span>
            <button id="clearRecentBtn" class="btn" type="button">Clear recent</button>
          </div>
          <div id="recentList" class="recent-list"></div>
        </div>
      </div>
    `;
	}
}

if (!customElements.get("open-browser-manifest-controls")) {
	customElements.define(
		"open-browser-manifest-controls",
		OpenBrowserManifestControlsElement,
	);
}

export { OpenBrowserManifestControlsElement };
