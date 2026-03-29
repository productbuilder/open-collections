import { sourceManagerStyles } from "../../../collection-manager/src/css/source-manager.css.js";
import { renderBackButton } from "../../../../shared/components/back-button.js";
import {
	renderCloseIcon,
	renderDriveFolderUploadIcon,
	renderFolderIcon,
	renderInfoIcon,
} from "../../../../shared/components/icons.js";
import "../../../../shared/ui/primitives/action-row.js";

const DESKTOP_APP_URL =
	"https://github.com/productbuilder/open-collections/tree/main/src/desktop/workbench";

class OpenCollectionsAddConnectionPanelElement extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.model = {
			providerCatalog: [],
			selectedProviderId: "local",
			addHostLevel: "root",
			remoteSubtype: "",
			flowMode: "add",
			repairProviderId: "",
			capabilities: {},
			supportsLocalFolderPicker: true,
			connectionStatusText: "Not connected.",
			connectionStatusTone: "neutral",
			localFolderStatusText: "No folder selected.",
			localFolderStatusTone: "neutral",
			configValues: {
				githubToken: "",
				githubOwner: "",
				githubRepo: "",
				githubBranch: "main",
				githubPath: "",
				localPathInput: "",
				localFolderName: "",
				s3Endpoint: "",
				s3Bucket: "",
				s3Region: "",
				s3BasePath: "",
				s3AccessKey: "",
				s3SecretKey: "",
			},
		};
	}

	connectedCallback() {
		this.render();
		this.bindEvents();
		this.applyState();
	}

	dispatch(name, detail = {}) {
		this.dispatchEvent(
			new CustomEvent(name, { detail, bubbles: true, composed: true }),
		);
	}

	isReady() {
		return Boolean(this.shadowRoot?.getElementById("rootActions"));
	}

	bindEvents() {
		
		this.shadowRoot
			.getElementById("backToConnectionsBtn")
			?.addEventListener("click", () => {
				if (this.model.flowMode === "repair") {
					this.resetFlow();
				}
				this.dispatch("back-to-connections");
			});

		this.shadowRoot
			.getElementById("addLocalFolderConnectionBtn")
			?.addEventListener("action", () => {
				if (!this.model.supportsLocalFolderPicker) {
					this.openLocalFolderInfoDialog();
					return;
				}
				this.model.flowMode = "add";
				this.model.repairProviderId = "";
				this.model.addHostLevel = "root";
				this.model.remoteSubtype = "";
				this.model.selectedProviderId = "local";
				this.dispatch("add-local-folder-connection");
			});
		this.shadowRoot
			.getElementById("openLocalFolderInfoBtn")
			?.addEventListener("click", () => {
				this.openLocalFolderInfoDialog();
			});
		this.shadowRoot
			.getElementById("closeLocalFolderInfoBtn")
			?.addEventListener("click", () => {
				this.closeLocalFolderInfoDialog();
			});

		this.shadowRoot
			.getElementById("addRemoteConnectionBtn")
			?.addEventListener("action", () => {
				this.model.flowMode = "add";
				this.model.repairProviderId = "";
				this.model.addHostLevel = "remote-subtypes";
				this.model.remoteSubtype = "";
				this.renderRemoteFlow();
				this.renderProviderVisibility();
			});

		this.shadowRoot
			.getElementById("remoteSubtypeCatalog")
			?.addEventListener("click", (event) => {
				const button = event.target.closest(
					"button[data-remote-subtype]",
				);
				const remoteSubtype = button?.dataset.remoteSubtype || "";
				if (!remoteSubtype) {
					return;
				}
				this.openRemoteSubtype(remoteSubtype);
			});

		this.shadowRoot
			.getElementById("remoteProviderPanel")
			?.addEventListener("click", (event) => {
				const card = event.target.closest(".provider-card");
				if (!card) {
					return;
				}
				const providerId = card.dataset.providerId || "";
				if (!providerId || card.classList.contains("is-disabled")) {
					return;
				}
				this.openProviderConfig(providerId);
			});

		this.shadowRoot
			.getElementById("remoteBackBtn")
			?.addEventListener("click", () => {
				if (this.model.flowMode === "repair") {
					this.resetFlow();
					this.dispatch("back-to-connections");
					return;
				}
				if (
					this.model.addHostLevel === "remote-config" &&
					["git", "s3"].includes(this.model.remoteSubtype)
				) {
					this.model.addHostLevel = "remote-providers";
				} else if (this.model.addHostLevel === "remote-providers") {
					this.model.addHostLevel = "remote-subtypes";
					this.model.remoteSubtype = "";
				} else {
					this.model.addHostLevel = "root";
					this.model.remoteSubtype = "";
				}
				this.renderRemoteFlow();
				this.renderProviderVisibility();
			});

		this.shadowRoot
			.getElementById("openStorageOptionsBtn")
			?.addEventListener("click", () => {
				this.openStorageOptionsDialog();
			});

		this.shadowRoot
			.getElementById("connectBtn")
			?.addEventListener("click", () => {
				this.dispatch("connect-provider");
			});
	}

	applyState() {
		if (!this.isReady()) {
			return;
		}
		this.renderRemoteFlow();
		this.renderProviderVisibility();
		this.applyConfigValues();
		this.setCapabilities(this.model.capabilities);
		this.renderLocalFolderCardState();
		this.setConnectionStatus(
			this.model.connectionStatusText,
			this.model.connectionStatusTone,
		);
		this.setLocalFolderStatus(
			this.model.localFolderStatusText,
			this.model.localFolderStatusTone,
		);
	}

	setProviderCatalog(catalog = []) {
		this.model.providerCatalog = Array.isArray(catalog) ? catalog : [];
		if (this.isReady()) {
			this.renderRemoteFlow();
			this.renderProviderVisibility();
		}
	}

	setSelectedProvider(providerId) {
		this.model.selectedProviderId = providerId || "local";
		if (this.isReady()) {
			this.renderProviderVisibility();
		}
	}

	setConnectionStatus(text, tone = "neutral") {
		this.model.connectionStatusText = text || "Not connected.";
		this.model.connectionStatusTone = tone || "neutral";
		const colors = { neutral: "#64748b", ok: "#166534", warn: "#9a3412" };
		const node = this.shadowRoot?.getElementById("connectionStatus");
		if (!node) {
			return;
		}
		node.textContent = this.model.connectionStatusText;
		node.style.color =
			colors[this.model.connectionStatusTone] || colors.neutral;
	}

	setCapabilities(capabilities) {
		this.model.capabilities = capabilities || {};
	}

	setLocalFolderSupport(supported) {
		this.model.supportsLocalFolderPicker = Boolean(supported);
		if (this.isReady()) {
			this.renderLocalFolderCardState();
		}
	}

	setLocalFolderStatus(text, tone = "neutral") {
		this.model.localFolderStatusText = text || "No folder selected.";
		this.model.localFolderStatusTone = tone || "neutral";
		const colors = { neutral: "#64748b", ok: "#166534", warn: "#9a3412" };
		const node = this.shadowRoot?.getElementById("localFolderStatus");
		if (!node) {
			return;
		}
		node.textContent = this.model.localFolderStatusText;
		node.style.color =
			colors[this.model.localFolderStatusTone] || colors.neutral;
	}

	setConfigValues(nextValues = {}) {
		this.model.configValues = {
			...this.model.configValues,
			...(nextValues || {}),
		};
		this.applyConfigValues();
		if (
			Object.prototype.hasOwnProperty.call(
				nextValues || {},
				"localFolderName",
			)
		) {
			const folderName = String(nextValues.localFolderName || "").trim();
			this.setLocalFolderStatus(
				folderName
					? `Selected folder: ${folderName}`
					: "No folder selected.",
				folderName ? "ok" : "neutral",
			);
		}
	}

	applyConfigValues() {
		if (!this.isReady()) {
			return;
		}
		const values = this.model.configValues || {};
		const mapping = {
			githubToken: "githubToken",
			githubOwner: "githubOwner",
			githubRepo: "githubRepo",
			githubBranch: "githubBranch",
			githubPath: "githubPath",
			localPathInput: "localPathInput",
			localFolderName: "localFolderName",
			s3Endpoint: "s3Endpoint",
			s3Bucket: "s3Bucket",
			s3Region: "s3Region",
			s3BasePath: "s3BasePath",
			s3AccessKey: "s3AccessKey",
			s3SecretKey: "s3SecretKey",
		};
		for (const [key, id] of Object.entries(mapping)) {
			const input = this.shadowRoot.getElementById(id);
			if (!input) {
				continue;
			}
			const raw = values[key];
			if (raw === undefined || raw === null) {
				continue;
			}
			input.value = String(raw);
		}
	}

	getProviderConfig(providerId) {
		const root = this.shadowRoot;
		const config = {};
		if (!root) {
			return config;
		}

		if (providerId === "local") {
			config.path =
				root.getElementById("localPathInput")?.value.trim() || "";
			config.localDirectoryName =
				root.getElementById("localFolderName")?.value.trim() || "";
		}

		if (providerId === "example") {
			config.path =
				root.getElementById("localPathInput")?.value.trim() || "";
		}

		if (providerId === "github") {
			config.token = root.getElementById("githubToken")?.value || "";
			config.owner = root.getElementById("githubOwner")?.value || "";
			config.repo = root.getElementById("githubRepo")?.value || "";
			config.branch = root.getElementById("githubBranch")?.value || "";
			config.path = root.getElementById("githubPath")?.value || "";
		}

		if (providerId === "s3") {
			config.endpoint = root.getElementById("s3Endpoint")?.value || "";
			config.bucket = root.getElementById("s3Bucket")?.value || "";
			config.region = root.getElementById("s3Region")?.value || "";
			config.basePath = root.getElementById("s3BasePath")?.value || "";
			config.accessKey = root.getElementById("s3AccessKey")?.value || "";
			config.secretKey = root.getElementById("s3SecretKey")?.value || "";
		}

		return config;
	}

	providerById(providerId) {
		return (
			this.model.providerCatalog.find(
				(entry) => entry.id === providerId,
			) || null
		);
	}

	providersForCategory(categoryId, predicate = null) {
		return this.model.providerCatalog.filter(
			(entry) =>
				entry.category === categoryId &&
				(!predicate || predicate(entry)),
		);
	}

	openRemoteSubtype(remoteSubtype) {
		this.model.flowMode = "add";
		this.model.repairProviderId = "";
		this.model.remoteSubtype = remoteSubtype;
		if (remoteSubtype === "git" || remoteSubtype === "s3") {
			this.model.addHostLevel = "remote-providers";
		} else {
			this.model.addHostLevel = "remote-config";
			this.dispatch("select-provider", { providerId: "custom-domain" });
		}
		this.renderRemoteFlow();
		this.renderProviderVisibility();
	}

	openProviderConfig(providerId) {
		if (!providerId) {
			return;
		}
		this.model.flowMode = "add";
		this.model.repairProviderId = "";
		this.model.selectedProviderId = providerId;
		this.model.remoteSubtype =
			providerId === "github"
				? "git"
				: providerId === "s3"
					? "s3"
					: this.model.remoteSubtype;
		this.model.addHostLevel = "remote-config";
		this.dispatch("select-provider", { providerId });
		this.renderRemoteFlow();
		this.renderProviderVisibility();
	}

	openRepairCredentials(providerId) {
		if (!providerId || !["github", "s3"].includes(providerId)) {
			return;
		}
		this.model.flowMode = "repair";
		this.model.repairProviderId = providerId;
		this.model.selectedProviderId = providerId;
		this.model.remoteSubtype = providerId === "github" ? "git" : "s3";
		this.model.addHostLevel = "remote-config";
		this.dispatch("select-provider", { providerId });
		this.renderRemoteFlow();
		this.renderProviderVisibility();
	}

	resetFlow() {
		this.model.flowMode = "add";
		this.model.repairProviderId = "";
		this.model.addHostLevel = "root";
		this.model.remoteSubtype = "";
		this.renderRemoteFlow();
		this.renderProviderVisibility();
	}

	renderProviderVisibility() {
		const selected = this.providerById(this.model.selectedProviderId);
		const providerLabel =
			selected?.label ||
			this.model.selectedProviderId ||
			"Remote connection";
		const isRepairFlow =
			this.model.flowMode === "repair" &&
			this.model.repairProviderId === this.model.selectedProviderId;
		const providerConfigTitle = this.shadowRoot?.getElementById(
			"providerConfigTitle",
		);
		if (providerConfigTitle) {
			providerConfigTitle.textContent = isRepairFlow
				? `Update ${providerLabel} credentials`
				: `${providerLabel} configuration`;
		}

		const sections = {
			github: this.shadowRoot?.getElementById("githubConfig"),
			s3: this.shadowRoot?.getElementById("s3Config"),
			placeholder: this.shadowRoot?.getElementById("placeholderConfig"),
		};

		Object.values(sections).forEach((node) => {
			node?.classList.add("is-hidden");
		});

		const connectBtn = this.shadowRoot?.getElementById("connectBtn");
		if (this.model.addHostLevel !== "remote-config") {
			if (connectBtn) {
				connectBtn.disabled = true;
			}
			return;
		}

		if (this.model.selectedProviderId === "github") {
			sections.github?.classList.remove("is-hidden");
		} else if (this.model.selectedProviderId === "s3") {
			sections.s3?.classList.remove("is-hidden");
		} else {
			sections.placeholder?.classList.remove("is-hidden");
		}

		if (connectBtn) {
			connectBtn.textContent = isRepairFlow
				? "Reconnect"
				: "Add connection";
			connectBtn.disabled =
				selected?.enabled === false ||
				!["github", "s3"].includes(this.model.selectedProviderId);
		}
	}

	renderRemoteFlow() {
		const rootHeader = this.shadowRoot?.getElementById("rootHeader");
		const rootActions = this.shadowRoot?.getElementById("rootActions");
		const remoteFlow = this.shadowRoot?.getElementById("remoteFlow");
		const breadcrumb = this.shadowRoot?.getElementById(
			"remoteFlowBreadcrumb",
		);
		const subtypePanel = this.shadowRoot?.getElementById(
			"remoteSubtypeCatalog",
		);
		const providerPanel = this.shadowRoot?.getElementById(
			"remoteProviderPanel",
		);
		const configPanel = this.shadowRoot?.getElementById("providerConfig");
		if (
			!rootHeader ||
			!rootActions ||
			!remoteFlow ||
			!breadcrumb ||
			!subtypePanel ||
			!providerPanel ||
			!configPanel
		) {
			return;
		}

		const inRoot =
			this.model.addHostLevel === "root" &&
			this.model.flowMode !== "repair";
		rootHeader.classList.toggle("is-hidden", !inRoot);
		rootActions.classList.toggle("is-hidden", !inRoot);
		remoteFlow.classList.toggle("is-hidden", inRoot);
		breadcrumb.textContent = "";

		const showingSubtypes = this.model.addHostLevel === "remote-subtypes";
		const showingProviders = this.model.addHostLevel === "remote-providers";
		const showingConfig = this.model.addHostLevel === "remote-config";
		subtypePanel.classList.toggle("is-hidden", !showingSubtypes);
		providerPanel.classList.toggle("is-hidden", !showingProviders);
		configPanel.classList.toggle("is-hidden", !showingConfig);

		if (showingProviders) {
			this.renderRemoteProviderCatalog();
		}
	}

	renderRemoteProviderCatalog() {
		const wrap = this.shadowRoot?.getElementById("remoteProviderPanel");
		if (!wrap) {
			return;
		}
		wrap.innerHTML = "";
		const providers = this.providersForCategory(
			"remote",
			(entry) => entry.remoteSubtype === this.model.remoteSubtype,
		);
		for (const entry of providers) {
			const button = document.createElement("button");
			button.type = "button";
			button.className = "provider-card";
			button.dataset.providerId = entry.id;
			button.disabled = entry.enabled === false;
			if (entry.enabled === false) {
				button.classList.add("is-disabled");
			}
			if (this.model.selectedProviderId === entry.id) {
				button.classList.add("is-selected");
			}
			button.innerHTML = `
        <div class="provider-card-label-row">
          <strong>${entry.label}</strong>
          <span class="pill ${entry.enabled === false ? "is-muted" : ""}">${entry.statusLabel || "Available"}</span>
        </div>
        <span class="panel-subtext">${entry.description || ""}</span>
      `;
			wrap.appendChild(button);
		}
	}

	renderLocalFolderCardState() {
		const addLocalBtn = this.shadowRoot?.getElementById(
			"addLocalFolderConnectionBtn",
		);
		const supportText = this.shadowRoot?.getElementById(
			"localFolderSupportNote",
		);
		if (!addLocalBtn || !supportText) {
			return;
		}
		const supported = this.model.supportsLocalFolderPicker;
		addLocalBtn.disabled = !supported;
		addLocalBtn.classList.toggle("is-disabled", !supported);
		supportText.classList.toggle("is-hidden", supported);
	}

	openLocalFolderInfoDialog() {
		const dialog = this.shadowRoot?.getElementById("localFolderInfoDialog");
		if (!dialog) {
			return;
		}
		if (dialog.open) {
			return;
		}
		if (typeof dialog.showModal === "function") {
			dialog.showModal();
			return;
		}
		dialog.setAttribute("open", "open");
	}

	closeLocalFolderInfoDialog() {
		const dialog = this.shadowRoot?.getElementById("localFolderInfoDialog");
		if (!dialog || !dialog.open) {
			return;
		}
		if (typeof dialog.close === "function") {
			dialog.close();
			return;
		}
		dialog.removeAttribute("open");
	}

	openStorageOptionsDialog() {
		const dialog = this.shadowRoot?.getElementById("storageOptionsDialog");
		if (!dialog) {
			return;
		}
		if (dialog.open) {
			return;
		}
		if (typeof dialog.showModal === "function") {
			dialog.showModal();
			return;
		}
		dialog.setAttribute("open", "open");
	}

	closeStorageOptionsDialog() {
		const dialog = this.shadowRoot?.getElementById("storageOptionsDialog");
		if (!dialog || !dialog.open) {
			return;
		}
		if (typeof dialog.close === "function") {
			dialog.close();
			return;
		}
		dialog.removeAttribute("open");
	}

	render() {
		this.shadowRoot.innerHTML = `
      <style>
        ${sourceManagerStyles}

        .add-connection-header {
          align-items: center;
          flex-wrap: nowrap;
        }

        .remote-flow-header {
          align-items: center;
          flex-wrap: nowrap;
          justify-content: flex-start;
          gap: 0.5rem;
          margin-bottom: 0.35rem;
        }

        .remote-flow-title {
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
        }

        .remote-flow-info {
          margin-left: auto;
          width: 1.8rem;
          min-height: 1.8rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .connection-type-row {
          width: 100%;
        }

        .connection-type-row [slot='secondary'] {
          width: 1.8rem;
          min-height: 1.8rem;
        }

        .connection-type-row .provider-card-info {
          position: static;
        }

        .remote-flow-intro {
          margin: 0 0 0.45rem;
        }
      </style>
      <div class="source-manager">
        <div id="rootHeader" class="dialog-actions add-connection-header">
          ${renderBackButton({ id: "backToConnectionsBtn" })}
          <h3 class="root-actions-title">Add connection</h3>
        </div>
        <div class="provider-layout single-column">
          <div id="rootActions" class="root-actions">
            <div class="root-actions-heading">
              <p class="config-section-title">Choose a connection type</p>
            </div>
            <div class="provider-list">
              <open-collections-action-row
                class="connection-type-row"
                id="addLocalFolderConnectionBtn"
                title="Local folder"
                subtitle="Pick a folder on this device as a writable local connection."
              >
                <span slot="leading">${renderFolderIcon()}</span>
                <button
                  slot="secondary"
                  class="icon-btn provider-card-info"
                  id="openLocalFolderInfoBtn"
                  type="button"
                  aria-label="Local folder support details"
                >
                  ${renderInfoIcon()}
                </button>
              </open-collections-action-row>
              <p id="localFolderSupportNote" class="panel-subtext provider-card-support-note is-hidden">Requires a supported browser or the desktop app.</p>
              <open-collections-action-row
                class="connection-type-row"
                id="addRemoteConnectionBtn"
                title="Remote"
                subtitle="Connect a remote publish target and choose a remote connection type next."
              >
                <span slot="leading">${renderDriveFolderUploadIcon()}</span>
              </open-collections-action-row>
            </div>
          </div>

          <div id="remoteFlow" class="is-hidden">
            <div class="dialog-actions remote-flow-header">
              ${renderBackButton({ id: "remoteBackBtn" })}
              <h3 class="remote-flow-title">Add remote connection</h3>
              <button class="icon-btn remote-flow-info" id="openStorageOptionsBtn" type="button" aria-label="Storage options details">
                ${renderInfoIcon()}
              </button>
            </div>
            <p class="config-section-title remote-flow-intro">Choose a remote connection type</p>
            <p id="remoteFlowBreadcrumb" class="panel-subtext is-hidden"></p>
            <div id="remoteSubtypeCatalog" class="provider-list is-hidden">
              <button class="provider-card" type="button" data-remote-subtype="git">
                <div class="provider-card-label-row"><strong>Git repository</strong></div>
                <span class="panel-subtext">Choose a Git-based remote provider such as GitHub.</span>
              </button>
              <button class="provider-card" type="button" data-remote-subtype="s3">
                <div class="provider-card-label-row"><strong>Object storage</strong></div>
                <span class="panel-subtext">Configure an S3-compatible publish target.</span>
              </button>
              <button class="provider-card" type="button" data-remote-subtype="domain">
                <div class="provider-card-label-row"><strong>Custom domain</strong></div>
                <span class="panel-subtext">Connect a custom-hosted manifest endpoint when available.</span>
              </button>
            </div>
            <div id="remoteProviderPanel" class="provider-list is-hidden"></div>

            <div id="providerConfig" class="provider-config is-hidden">
              <p id="providerConfigTitle" class="config-section-title">Connection configuration</p>
              <p id="localFolderStatus" class="panel-subtext is-hidden">No folder selected.</p>
              <div class="field-row is-hidden"><label for="localPathInput">Collection path</label><input id="localPathInput" type="text" /></div>
              <input id="localFolderName" type="hidden" value="" />

              <div id="githubConfig" class="is-hidden">
                <div class="field-row"><label for="githubToken">GitHub token (PAT)</label><input id="githubToken" type="password" /></div>
                <div class="field-row"><label for="githubOwner">Repository owner</label><input id="githubOwner" type="text" /></div>
                <div class="field-row"><label for="githubRepo">Repository name</label><input id="githubRepo" type="text" /></div>
                <div class="field-row"><label for="githubBranch">Branch</label><input id="githubBranch" type="text" value="main" /></div>
                <div class="field-row"><label for="githubPath">Folder path (optional)</label><input id="githubPath" type="text" placeholder="media/" /></div>
              </div>

              <div id="s3Config" class="is-hidden">
                <p class="panel-subtext">S3-compatible connections are configured now as publish targets. Upload/pull will be added next.</p>
                <div class="field-row"><label for="s3Endpoint">Endpoint URL</label><input id="s3Endpoint" type="text" placeholder="https://s3.example.org" /></div>
                <div class="field-row"><label for="s3Bucket">Bucket</label><input id="s3Bucket" type="text" /></div>
                <div class="field-row"><label for="s3Region">Region</label><input id="s3Region" type="text" placeholder="us-east-1" /></div>
                <div class="field-row"><label for="s3BasePath">Base path / prefix (optional)</label><input id="s3BasePath" type="text" placeholder="collections/" /></div>
                <div class="field-row"><label for="s3AccessKey">Access key</label><input id="s3AccessKey" type="password" /></div>
                <div class="field-row"><label for="s3SecretKey">Secret key</label><input id="s3SecretKey" type="password" /></div>
              </div>

              <div id="placeholderConfig" class="is-hidden">
                <div class="empty">This remote connection type is not available yet in this MVP.</div>
              </div>

              <div class="dialog-actions">
                <button class="btn btn-primary" id="connectBtn" type="button">Add connection</button>
              </div>
            </div>
          </div>
        </div>

      </div>

      <dialog id="localFolderInfoDialog" class="support-dialog" aria-label="Local folder support">
        <div class="dialog-shell">
          <div class="dialog-header">
            <h2 class="dialog-title">Local folder support</h2>
            <button class="icon-btn" id="closeLocalFolderInfoBtn" type="button" aria-label="Close Local folder support dialog">
              ${renderCloseIcon()}
            </button>
          </div>
          <div class="dialog-body">
            <p class="panel-subtext">Local folder lets you edit collections directly from a folder on your device.</p>
            <table class="support-table" aria-label="Local folder browser support">
              <tbody>
                <tr><th scope="row">Chrome / Edge</th><td>Supported</td></tr>
                <tr><th scope="row">Firefox</th><td>Not supported in browser</td></tr>
                <tr><th scope="row">Safari</th><td>Not supported in browser</td></tr>
                <tr><th scope="row">Desktop app</th><td>Supported</td></tr>
              </tbody>
            </table>
            <p class="panel-subtext">For persistent local storage across browsers, use the desktop app or connect to a backend such as GitHub or S3.</p>
            <div class="dialog-actions">
              <a class="btn btn-primary" href="${DESKTOP_APP_URL}" target="_blank" rel="noopener noreferrer">Desktop app</a>
              <button class="btn" id="closeLocalFolderInfoBtnSecondary" type="button">Close</button>
            </div>
          </div>
        </div>
      </dialog>

      <dialog id="storageOptionsDialog" class="support-dialog" aria-label="Storage options guidance">
        <div class="dialog-shell">
          <div class="dialog-header">
            <h2 class="dialog-title">Storage options</h2>
            <button class="icon-btn" id="closeStorageOptionsBtn" type="button" aria-label="Close storage options dialog">
              ${renderCloseIcon()}
            </button>
          </div>
          <div class="dialog-body">
            <p class="panel-subtext">Recommended options for open hosting:</p>
            <ul class="storage-list">
              <li><strong>GitHub</strong> for open manifests and transparent version history.</li>
              <li><strong>Cloudflare Pages / R2</strong> for static/browser delivery of JSON and media.</li>
              <li><strong>S3-compatible storage</strong> for durable institutional publishing workflows.</li>
            </ul>
            <div class="dialog-actions">
              <button class="btn" id="closeStorageOptionsBtnSecondary" type="button">Close</button>
            </div>
          </div>
        </div>
      </dialog>
    `;
		this.shadowRoot
			.getElementById("closeLocalFolderInfoBtnSecondary")
			?.addEventListener("click", () => {
				this.closeLocalFolderInfoDialog();
			});
		this.shadowRoot
			.getElementById("closeStorageOptionsBtn")
			?.addEventListener("click", () => {
				this.closeStorageOptionsDialog();
			});
		this.shadowRoot
			.getElementById("closeStorageOptionsBtnSecondary")
			?.addEventListener("click", () => {
				this.closeStorageOptionsDialog();
			});
		this.renderLocalFolderCardState();
	}
}

if (!customElements.get("open-collections-add-connection-panel")) {
	customElements.define(
		"open-collections-add-connection-panel",
		OpenCollectionsAddConnectionPanelElement,
	);
}

export { OpenCollectionsAddConnectionPanelElement };
