import {
	renderDriveFolderUploadIcon,
	renderFolderIcon,
} from "../../../../shared/components/icons.js";
import "../../../../shared/ui/primitives/action-row.js";

const styles = `
  :host {
    display: block;
  }

  * {
    box-sizing: border-box;
  }

  .panel {
    display: grid;
    gap: 0.55rem;
    align-content: start;
  }

  .panel-empty {
    margin: 0;
    color: #64748b;
  }

  .source-list {
    display: grid;
    gap: 0.55rem;
  }

  .empty {
    border-radius: 8px;
  }

  .source-row [slot='secondary'] {
    margin-left: auto;
  }

  .source-status {
    padding: 0.1rem 0.4rem;
    border-radius: 999px;
    border: 1px solid #cbd5e1;
    font-size: 0.72rem;
    line-height: 1.2;
    font-weight: 600;
    white-space: nowrap;
  }

  .source-status.is-active {
    color: #166534;
    border-color: #86efac;
    background: #f0fdf4;
  }

  .source-status.is-inactive {
    color: #64748b;
    border-color: #cbd5e1;
    background: #f8fafc;
  }

  .starter-helper {
    margin: 0;
    border: 1px dashed #cbd5e1;
    border-radius: 12px;
    background: #f8fafc;
    color: #334155;
    padding: 0.75rem;
    font-size: 0.85rem;
  }
`;

function escapeHtml(value) {
	return String(value ?? "")
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");
}

class OpenCollectionsConnectionsListElement extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.model = {
			sources: [],
			activeSourceId: "all",
		};
	}

	connectedCallback() {
		this.render();
	}

	setSources(sources = []) {
		this.model.sources = Array.isArray(sources) ? sources : [];
		this.render();
	}

	setActiveSourceId(sourceId = "all") {
		this.model.activeSourceId = sourceId || "all";
		this.render();
	}

	dispatch(name, detail = {}) {
		this.dispatchEvent(
			new CustomEvent(name, { detail, bubbles: true, composed: true }),
		);
	}

	locationLabel(source) {
		return (
			source.detailLabel ||
			(source.providerId === "local" || source.providerId === "example"
				? source.config?.path
				: null) ||
			(source.providerId === "github"
				? `${source.config?.owner || "owner"}/${source.config?.repo || "repo"}`
				: source.providerId === "s3"
					? source.config?.endpoint ||
						source.config?.bucket ||
						"Remote connection"
					: source.config?.path || "Local connection")
		);
	}

	connectionIcon(source) {
		return source.providerId === "local" || source.providerId === "example"
			? renderFolderIcon()
			: renderDriveFolderUploadIcon();
	}

	renderSourceCard(source) {
		const label =
			source.displayLabel ||
			source.label ||
			source.providerLabel ||
			"Connection";
		const isEnabled = source.enabled !== false;
		const availabilityLabel = isEnabled ? "Active" : "Inactive";
		return `
      <open-collections-action-row
        class="source-row"
        data-action="select"
        data-source-id="${source.id}"
        title="${escapeHtml(label)}"
        subtitle="${escapeHtml(this.locationLabel(source))}"
        aria-label="Inspect connection ${escapeHtml(label)}">
        <span slot="leading" aria-hidden="true">${this.connectionIcon(source)}</span>
        <span slot="secondary" class="source-status${isEnabled ? " is-active" : " is-inactive"}">${escapeHtml(availabilityLabel)}</span>
      </open-collections-action-row>
    `;
	}

	hasUserOwnedStorageConnection(source) {
		return source.providerId !== "example";
	}

	render() {
		const hasStarterExample = this.model.sources.some(
			(source) => source.providerId === "example",
		);
		const hasUserOwnedConnections = this.model.sources.some((source) =>
			this.hasUserOwnedStorageConnection(source),
		);
		const sourceCards = this.model.sources
			.map((source) => this.renderSourceCard(source))
			.join("");
		const emptyState = this.model.sources.length
			? ""
			: '<p class="panel-empty empty">No connections added yet.</p>';
		const starterHelper =
			hasStarterExample && !hasUserOwnedConnections
				? '<p class="starter-helper">Add a local folder or remote connection to use your own storage.</p>'
				: "";

		this.shadowRoot.innerHTML = `
      <style>${styles}</style>
      <div class="panel">
        ${emptyState}
        <div class="source-list">
          ${sourceCards}
        </div>
        ${starterHelper}
      </div>
    `;

		this.bindEvents();
	}

	bindEvents() {
		const root = this.shadowRoot;
		root.querySelectorAll('[data-action="select"]').forEach((row) => {
			const sourceId = row.getAttribute("data-source-id") || "";
			if (!sourceId) {
				return;
			}
			row.addEventListener("action", () => {
				this.dispatch("select-connection", { sourceId });
			});
		});
	}
}

if (!customElements.get("open-collections-connections-list")) {
	customElements.define(
		"open-collections-connections-list",
		OpenCollectionsConnectionsListElement,
	);
}

export { OpenCollectionsConnectionsListElement };
