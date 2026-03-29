import {
	renderDriveFolderUploadIcon,
	renderFolderIcon,
} from "../../../../shared/components/icons.js";
import { themeTokenStyles } from "../../../collection-manager/src/css/theme.css.js";
import { primitiveStyles } from "../../../collection-manager/src/css/primitives.css.js";

const styles = `
  ${themeTokenStyles}
  ${primitiveStyles}

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

  .starter-helper {
    margin: 0;
    border: 1px dashed #cbd5e1;
    border-radius: 12px;
    background: #f8fafc;
    color: #334155;
    padding: 0.75rem;
    font-size: 0.85rem;
  }

  .source-card {
    border: 1px solid #dbe3ec;
    border-radius: 12px;
    background: #ffffff;
    padding: 0.75rem;
    display: grid;
    gap: 0.55rem;
    cursor: pointer;
    transition: border-color 160ms ease, box-shadow 160ms ease, background 160ms ease;
  }

  .source-card:hover {
    border-color: #bfdbfe;
  }

  .source-card:focus-visible {
    outline: 2px solid #60a5fa;
    outline-offset: 2px;
  }

  .source-card-header {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 0.35rem;
  }

  .source-card-heading {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.35rem;
    min-width: 0;
    flex: 1;
  }

  .source-card-leading {
    width: 2.1rem;
    height: 2.1rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    color: #64748b;
  }

  .source-card-leading .icon {
    width: 1.95rem;
    height: 1.95rem;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .source-card-content {
    min-width: 0;
    display: grid;
    gap: 0.2rem;
  }

  .source-card-title {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 700;
    color: #0f172a;
    overflow-wrap: anywhere;
  }

  .source-card-location {
    margin: 0;
    font-size: 0.8rem;
    color: #64748b;
    overflow-wrap: anywhere;
  }

  .pill {
    padding: 0.1rem 0.4rem;
    font-size: 0.72rem;
  }

  .pill.is-active {
    color: #166534;
    border-color: #86efac;
    background: #f0fdf4;
  }

  .pill.is-inactive {
    color: #64748b;
    border-color: #cbd5e1;
    background: #f8fafc;
  }

  @media (max-width: 760px) {
    .source-card {
      padding: 0.65rem;
    }
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
      <article
        class="source-card"
        data-action="select"
        data-source-id="${source.id}"
        tabindex="0"
        role="button"
        aria-label="Inspect connection ${escapeHtml(label)}">
        <div class="source-card-header">
          <span class="source-card-leading" aria-hidden="true">${this.connectionIcon(source)}</span>
          <div class="source-card-content">
            <div class="source-card-heading">
              <p class="source-card-title">${escapeHtml(label)}</p>
              <span class="pill${isEnabled ? " is-active" : " is-inactive"}">${escapeHtml(availabilityLabel)}</span>
            </div>
            <p class="source-card-location">${escapeHtml(this.locationLabel(source))}</p>
          </div>
        </div>
      </article>
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
		root.querySelectorAll('[data-action="select"]').forEach((card) => {
			const sourceId = card.getAttribute("data-source-id") || "";
			const activate = () => {
				if (sourceId) {
					this.dispatch("select-connection", { sourceId });
				}
			};
			card.addEventListener("click", () => {
				activate();
			});
			card.addEventListener("keydown", (event) => {
				if (event.key === "Enter" || event.key === " ") {
					event.preventDefault();
					activate();
				}
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
