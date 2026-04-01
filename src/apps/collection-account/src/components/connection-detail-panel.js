import { renderTrashIcon } from "../../../../shared/components/icons.js";
import { themeTokenStyles } from "../../../collection-manager/src/css/theme.css.js";
import { primitiveStyles } from "../../../collection-manager/src/css/primitives.css.js";

const styles = `
  ${themeTokenStyles}
  ${primitiveStyles}

  :host {
    display: block;
  }

  .detail {
    display: grid;
    gap: 1rem;
  }

  .meta {
    display: grid;
    gap: 0.75rem;
  }

  .field-group {
    display: grid;
    gap: 0.35rem;
  }

  .field-label {
    margin: 0;
    font-size: 0.76rem;
    color: #94a3b8;
    letter-spacing: 0.01em;
  }

  .title-row,
  .location-row {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    flex-wrap: wrap;
  }

  .title {
    margin: 0;
    font-size: 1rem;
    color: #0f172a;
  }

  .location {
    margin: 0;
    font-size: 0.92rem;
    color: #334155;
    overflow-wrap: anywhere;
  }

  .title-input {
    width: 100%;
    max-width: 36rem;
    border: 1px solid #cbd5e1;
    border-radius: 0.5rem;
    background: #ffffff;
    color: #0f172a;
    font-size: 0.94rem;
    padding: 0.55rem 0.65rem;
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

  .actions {
    display: flex;
    gap: 0.45rem;
    flex-wrap: wrap;
  }

  .source-card-remove {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
  }

  .example-toggle {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    font-size: 0.82rem;
    color: #334155;
    padding-inline: 0.2rem;
  }

  .example-toggle input {
    margin: 0;
  }

  .empty {
    margin: 0;
    color: #64748b;
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

class OpenCollectionsConnectionDetailElement extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.model = { source: null, titleDraft: "" };
	}

	connectedCallback() {
		this.render();
	}

	setSource(source = null, options = {}) {
		this.model.source = source || null;
		const label = source
			? source.displayLabel || source.label || source.providerLabel || "Connection"
			: "";
		this.model.titleDraft =
			typeof options.titleDraft === "string" ? options.titleDraft : label;
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

	isExampleReadOnly(source) {
		return (
			source.providerId === "example" &&
			!source.capabilities?.canPublish &&
			!source.capabilities?.canSaveMetadata
		);
	}

	shouldShowExampleToggle(source) {
		return source.providerId === "example" && source.isBuiltIn !== false;
	}

	canRemoveSource(source) {
		if (source.isBuiltIn || source.isRemovable === false) {
			return false;
		}
		return true;
	}

	render() {
		const source = this.model.source;
		if (!source) {
			this.shadowRoot.innerHTML = `
        <style>${styles}</style>
        <p class="empty">Connection details are unavailable.</p>
      `;
			return;
		}

		const label =
			source.displayLabel ||
			source.label ||
			source.providerLabel ||
			"Connection";
		const titleDraft = this.model.titleDraft || label;
		const isEnabled = source.enabled !== false;
		const availabilityLabel = isEnabled ? "Active" : "Inactive";

		const primaryAction =
			!isEnabled
				? ""
				: source.providerId === "local" && source.needsReconnect
					? `<button class="btn btn-primary" type="button" data-action="repair-folder" data-source-id="${source.id}">Reconnect</button>`
					: (source.providerId === "github" || source.providerId === "s3") &&
					    source.needsCredentials
						? `<button class="btn btn-primary" type="button" data-action="repair-credentials" data-source-id="${source.id}">Update credentials</button>`
						: source.needsReconnect
							? `<button class="btn btn-primary" type="button" data-action="repair-reconnect" data-source-id="${source.id}">Reconnect</button>`
							: !this.isExampleReadOnly(source)
								? `<button class="btn" type="button" data-action="refresh" data-source-id="${source.id}">Refresh</button>`
								: "";

		const showRemove = this.canRemoveSource(source);
		const showExampleToggle = this.shouldShowExampleToggle(source);
		const removeButton = showRemove
			? `<button class="btn source-card-remove" type="button" data-action="remove" data-source-id="${source.id}">${renderTrashIcon()}<span>Remove</span></button>`
			: "";
		const exampleToggle = showExampleToggle
			? `<label class="example-toggle"><input type="checkbox" data-action="toggle-example-enabled" data-source-id="${source.id}" ${isEnabled ? "checked" : ""} /><span>Show example</span></label>`
			: "";

		this.shadowRoot.innerHTML = `
      <style>${styles}</style>
      <div class="detail">
        <div class="meta">
						<div class="field-group">
							<p class="field-label">Connection title</p>
							<div class="title-row">
								<input class="title-input" type="text" data-field="connection-title" data-source-id="${source.id}" value="${escapeHtml(titleDraft)}" />
							</div>
						</div>
          <div class="field-group">
            <p class="field-label">Location</p>
            <div class="location-row">
              <p class="location">${escapeHtml(this.locationLabel(source))}</p>
              <span class="pill${isEnabled ? " is-active" : " is-inactive"}">${escapeHtml(availabilityLabel)}</span>
            </div>
          </div>
        </div>
        <div class="actions">
          ${exampleToggle}
          ${primaryAction}
          ${removeButton}
        </div>
      </div>
    `;

		this.bindEvents();
	}

	bindEvents() {
		const titleInput = this.shadowRoot.querySelector(
			'[data-field="connection-title"]',
		);
		titleInput?.addEventListener("input", () => {
			const sourceId = titleInput.getAttribute("data-source-id") || "";
			if (!sourceId) {
				return;
			}
			this.dispatch("connection-title-draft-changed", {
				sourceId,
				title: String(titleInput.value || ""),
			});
		});

		this.shadowRoot.querySelectorAll("[data-action]").forEach((control) => {
			control.addEventListener("click", () => {
				const action = control.getAttribute("data-action");
				const sourceId = control.getAttribute("data-source-id") || "";
				if (!sourceId) {
					return;
				}
				if (action === "refresh") {
					this.dispatch("refresh-connection", { sourceId });
				}
				if (action === "repair-folder") {
					this.dispatch("repair-connection", { sourceId, mode: "folder" });
				}
				if (action === "repair-credentials") {
					this.dispatch("repair-connection", { sourceId, mode: "credentials" });
				}
				if (action === "repair-reconnect") {
					this.dispatch("repair-connection", { sourceId, mode: "reconnect" });
				}
				if (action === "remove") {
					this.dispatch("remove-connection", { sourceId });
				}
				if (action === "toggle-example-enabled") {
					const enabled = Boolean(control.checked);
					this.dispatch("toggle-example-connection", {
						sourceId,
						enabled,
					});
				}
			});
		});
	}
}

if (!customElements.get("open-collections-connection-detail-panel")) {
	customElements.define(
		"open-collections-connection-detail-panel",
		OpenCollectionsConnectionDetailElement,
	);
}

export { OpenCollectionsConnectionDetailElement };
