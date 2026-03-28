import { headerStyles } from "../css/header.css.js";
import { renderChevronDownIcon, renderMoreVertIcon } from "../../../../shared/components/icons.js";

class OpenCollectionsHeaderElement extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this._statusText = "Not connected.";
		this._workspaceText = "Connection: none | Collection: none";
		this._hostLabel = "Select connection";
		this._statusTone = "neutral";
		this._workingStatus = {
			label: "Draft",
			detail: "Connect a source or create a collection draft to get started.",
			tone: "neutral",
		};
		this._connectionEntryLabel = "Connections";
		this._showHeaderActions = false;
		this._showConnectionsAction = false;
		this._showMoreAction = false;
	}

	connectedCallback() {
		this.render();
		this.bindEvents();
		this.setStatus(this._statusText, this._statusTone);
		this.setWorkspaceContext(this._workspaceText);
		this.setHostLabel(this._hostLabel);
		this.setWorkingStatus(this._workingStatus);
	}

	bindEvents() {
		this.shadowRoot
			.getElementById("openHostManagerBtn")
			?.addEventListener("click", () => {
				this.dispatchEvent(
					new CustomEvent("open-host-menu", {
						bubbles: true,
						composed: true,
					}),
				);
			});
		this.shadowRoot
			.getElementById("openHeaderMenuBtn")
			?.addEventListener("click", () => {
				this.dispatchEvent(
					new CustomEvent("open-header-menu", {
						bubbles: true,
						composed: true,
					}),
				);
			});
	}

	setStatus(text, tone = "neutral") {
		this._statusText = text;
		this._statusTone = tone;
		const colors = {
			neutral: "#64748b",
			ok: "#166534",
			warn: "#9a3412",
		};
		const status = this.shadowRoot?.getElementById("statusText");
		if (!status) {
			return;
		}
		status.textContent = text;
		status.style.color = colors[tone] || colors.neutral;
	}

	setWorkingStatus(status = {}) {
		this._workingStatus = {
			...this._workingStatus,
			...status,
		};
	}

	setWorkspaceContext(text) {
		this._workspaceText = text;
		const workspace = this.shadowRoot?.getElementById("workspaceContext");
		if (workspace) {
			workspace.textContent = text;
		}
	}

	setHostLabel(text) {
		this._hostLabel = text;
		const host = this.shadowRoot?.getElementById("activeHostLabel");
		if (host) {
			host.textContent = text;
		}
	}

	setConnectionEntryLabel(text = "Connections") {
		this._connectionEntryLabel = String(text || "").trim() || "Connections";
		const button = this.shadowRoot?.getElementById("openHostManagerBtn");
		if (button) {
			button.setAttribute("aria-label", this._connectionEntryLabel);
			button.title = this._connectionEntryLabel;
		}
	}

	setActionsVisibility(options = {}) {
		this._showHeaderActions = options.showHeaderActions !== false;
		this._showConnectionsAction =
			this._showHeaderActions && options.showConnectionsAction !== false;
		this._showMoreAction =
			this._showHeaderActions && options.showMoreAction !== false;
		const actions = this.shadowRoot?.getElementById("topActions");
		const hostButton =
			this.shadowRoot?.getElementById("openHostManagerBtn");
		const moreButton = this.shadowRoot?.getElementById("openHeaderMenuBtn");
		if (actions) {
			actions.hidden = !this._showHeaderActions;
		}
		if (hostButton) {
			hostButton.hidden = !this._showConnectionsAction;
		}
		if (moreButton) {
			moreButton.hidden = !this._showMoreAction;
		}
	}

	render() {
		this.shadowRoot.innerHTML = `
      <style>${headerStyles}</style>

      <header class="topbar">
        <div class="brand">
          <h1 class="title">Collection Manager</h1>
        </div>
        <div class="top-actions" id="topActions">
          <button class="btn btn-connection" id="openHostManagerBtn" type="button" aria-label="${this._connectionEntryLabel}" title="${this._connectionEntryLabel}">
            <span id="activeHostLabel">Select connection</span>
            ${renderChevronDownIcon()}
          </button>
          <button class="icon-btn" id="openHeaderMenuBtn" type="button" aria-label="More actions">
            ${renderMoreVertIcon()}
          </button>
        </div>
      </header>
    `;
		this.setConnectionEntryLabel(this._connectionEntryLabel);
		this.setActionsVisibility({
			showHeaderActions: this._showHeaderActions,
			showConnectionsAction: this._showConnectionsAction,
			showMoreAction: this._showMoreAction,
		});
	}
}

if (!customElements.get("open-collections-header")) {
	customElements.define(
		"open-collections-header",
		OpenCollectionsHeaderElement,
	);
}

export { OpenCollectionsHeaderElement };
