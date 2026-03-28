import { getSourceStatus } from "../../../collection-manager/src/state/source-status.js";
import { renderTrashIcon } from "../../../../shared/components/icons.js";
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

  .source-card.is-active-source {
    border-color: #0f6cc6;
    box-shadow: 0 0 0 1px #66a6e8 inset;
    background: #f5faff;
  }

  .source-card-add {
    border-style: dashed;
    background: linear-gradient(180deg, #f8fbff 0%, #ffffff 100%);
  }

  .source-card-add:hover {
    border-color: #60a5fa;
    background: #f8fbff;
  }

  .source-card-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.6rem;
  }

  .source-card-heading {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.35rem;
    min-width: 0;
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

  .source-card-actions {
    display: flex;
    gap: 0.45rem;
    flex-wrap: wrap;
  }

  .source-card-actions .btn {
    min-width: 0;
  }

  .btn {
    min-height: 2rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .btn-primary {
    background: #0f6cc6;
    color: #ffffff;
    border-color: #0f6cc6;
  }

  .btn-primary:hover {
    background: #0d5eae;
  }

  .pill {
    padding: 0.1rem 0.4rem;
    font-size: 0.72rem;
  }

  .pill.is-ok {
    color: #166534;
    border-color: #86efac;
    background: #f0fdf4;
  }

  .pill.is-warn {
    color: #9a3412;
    border-color: #fdba74;
    background: #fff7ed;
  }

  .source-card-active-pill {
    align-self: flex-start;
  }

  .source-card-remove {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
  }

  .icon {
    width: 0.95rem;
    height: 0.95rem;
    display: inline-flex;
    flex: 0 0 auto;
  }

  .icon-trash {
    fill: none;
    stroke: currentColor;
    stroke-width: 1.35;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  @media (max-width: 760px) {
    .source-card {
      padding: 0.65rem;
    }

    .source-card-header {
      flex-direction: column;
      align-items: stretch;
    }

    .source-card-active-pill {
      align-self: flex-start;
    }

    .btn {
      padding: 0.3rem 0.52rem;
      font-size: 0.77rem;
      border-radius: 7px;
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

	hostState(source) {
		return getSourceStatus(source);
	}

	connectionTypeLabel(source) {
		if (source.providerId === "example") {
			return "Example";
		}
		if (source.providerId === "local") {
			return "Local";
		}
		return "Remote";
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

	renderSourceCard(source) {
		const isActive = this.model.activeSourceId === source.id;
		const label =
			source.displayLabel ||
			source.label ||
			source.providerLabel ||
			"Connection";
		const collectionCount = source.collections?.length || 0;
		const status = this.hostState(source);
		const primaryAction =
			source.providerId === "local" && source.needsReconnect
				? `<button class="btn btn-primary" type="button" data-action="repair-folder" data-source-id="${source.id}">Re-select folder</button>`
				: (source.providerId === "github" ||
							source.providerId === "s3") &&
					  source.needsCredentials
					? `<button class="btn btn-primary" type="button" data-action="repair-credentials" data-source-id="${source.id}">Update credentials</button>`
					: source.needsReconnect
						? `<button class="btn btn-primary" type="button" data-action="repair-reconnect" data-source-id="${source.id}">Reconnect</button>`
						: !this.isExampleReadOnly(source)
							? `<button class="btn" type="button" data-action="refresh" data-source-id="${source.id}">Refresh</button>`
							: "";

		return `
      <article
        class="source-card${isActive ? " is-active-source" : ""}"
        data-action="select"
        data-source-id="${source.id}"
        tabindex="0"
        role="button"
        aria-pressed="${String(isActive)}"
        aria-label="${isActive ? "Active" : "Select"} connection ${escapeHtml(label)}">
        <div class="source-card-header">
          <div class="source-card-heading">
            <p class="source-card-title">${escapeHtml(label)}</p>
            <span class="pill">${escapeHtml(this.connectionTypeLabel(source))}</span>
            <span class="pill${status.tone === "ok" ? " is-ok" : status.tone === "warn" ? " is-warn" : ""}">${escapeHtml(status.label)}</span>
            <span class="pill">${escapeHtml(`${collectionCount} coll.`)}</span>
          </div>
          <span class="pill source-card-active-pill${isActive ? " is-ok" : ""}">${escapeHtml(isActive ? "Active" : "Available")}</span>
        </div>
        <p class="source-card-location">${escapeHtml(this.locationLabel(source))}</p>
        <div class="source-card-actions">
          ${primaryAction}
          <button class="btn source-card-remove" type="button" data-action="remove" data-source-id="${source.id}">${renderTrashIcon()}<span>Remove</span></button>
        </div>
      </article>
    `;
	}

	isExampleReadOnly(source) {
		return (
			source.providerId === "example" &&
			!source.capabilities?.canPublish &&
			!source.capabilities?.canSaveMetadata
		);
	}

	render() {
		const sourceCards = this.model.sources
			.map((source) => this.renderSourceCard(source))
			.join("");
		const emptyState = this.model.sources.length
			? '<p class="panel-empty">Select a connection card to inspect details.</p>'
			: '<p class="panel-empty empty">No connections added yet.</p>';

		this.shadowRoot.innerHTML = `
      <style>${styles}</style>
      <div class="panel">
        ${emptyState}
        <div class="source-list">
          ${sourceCards}
        </div>
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
			card.addEventListener("click", (event) => {
				if (event.target.closest("button")) {
					return;
				}
				activate();
			});
			card.addEventListener("keydown", (event) => {
				if (event.key === "Enter" || event.key === " ") {
					event.preventDefault();
					activate();
				}
			});
		});

		root.querySelectorAll("button[data-action]").forEach((button) => {
			button.addEventListener("click", () => {
				const action = button.getAttribute("data-action");
				const sourceId = button.getAttribute("data-source-id") || "";
				if (!sourceId) {
					return;
				}
				if (action === "refresh") {
					this.dispatch("refresh-connection", { sourceId });
				}
				if (action === "repair-folder") {
					this.dispatch("repair-connection", {
						sourceId,
						mode: "folder",
					});
				}
				if (action === "repair-credentials") {
					this.dispatch("repair-connection", {
						sourceId,
						mode: "credentials",
					});
				}
				if (action === "repair-reconnect") {
					this.dispatch("repair-connection", {
						sourceId,
						mode: "reconnect",
					});
				}
				if (action === "remove") {
					this.dispatch("remove-connection", { sourceId });
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
