import {
	pickHostDirectory,
	supportsHostDirectoryPicker,
} from "../../../shared/platform/host-directory.js";
import { MANAGER_CONFIG } from "../../collection-manager/src/config.js";
import {
	createConnectionsRuntime,
	createCredentialStore,
	makeConnectionId,
	uniqueConnectionsForDisplay,
} from "../../../shared/account/index.js";
import {
	renderArrowIcon,
	renderBackButton,
} from "../../../shared/components/back-button.js";
import {
	renderDriveFolderUploadIcon,
	renderProfileIcon,
} from "../../../shared/components/icons.js";
import "./components/connections-list-panel.js";
import "./components/add-connection-panel.js";
import { APP_RUNTIME_MODES } from "../../../shared/runtime/app-mount-contract.js";
import { accountShellStyles } from "./css/shell.css.js";

const ACCOUNT_SOURCES_STORAGE_KEY = "open_collections_account_sources_v1";

function renderShell(shadowRoot) {
	shadowRoot.innerHTML = `

		<style>
			${accountShellStyles}
		</style>

		<main class="oc-page oc-app-viewport account-shell">

			<section class="account-root-view" id="accountRootView" aria-label="Account areas">

				<button type="button" class="account-entry-button" data-account-entry="connections">
					<span class="account-entry-leading-icon" aria-hidden="true">${renderDriveFolderUploadIcon()}</span>
					<span class="account-entry-content">
						<span class="account-entry-label">Connections</span>
						<span class="account-entry-subtitle">Manage local and remote folders for your collections.</span>
					</span>
					<span class="account-entry-icon" aria-hidden="true">${renderArrowIcon({ className: "icon icon-forward", direction: "right" })}</span>
				</button>

				<button type="button" class="account-entry-button" data-account-entry="settings">
					<span class="account-entry-leading-icon" aria-hidden="true">${renderProfileIcon()}</span>
					<span class="account-entry-content">
						<span class="account-entry-label">Profile</span>
						<span class="account-entry-subtitle">Update personal and account profile preferences.</span>
					</span>
					<span class="account-entry-icon" aria-hidden="true">${renderArrowIcon({ className: "icon icon-forward", direction: "right" })}</span>
				</button>
				
			</section>

			<section class="account-section-content is-hidden" id="connectionsSection" aria-labelledby="connectionsHeading">
				<open-collections-section-panel
					title="Connections"
					heading-level="2"
					id="connectionsHeading"
				>
					${renderBackButton({
						id: "accountBackBtn",
						label: "Back to account",
						className: "back-btn",
						slot: "leading",
					})}
					<div id="connectionsOverviewView">
						<p class="account-description connections-explainer">Open Collections does not store your files. Your collections stay in storage you control, such as a local folder, your own cloud storage, or your own web host.</p>
						<p class="status-note" id="accountStatus" data-tone="neutral">No connections yet.</p>

						<div class="connections-body">
							<button type="button" id="connectionsAddBtn" class="account-entry-button account-entry-button-action-row">
								<span class="account-entry-leading-icon" aria-hidden="true">${renderDriveFolderUploadIcon()}</span>
								<span class="account-entry-content">
									<span class="account-entry-label">Add connection</span>
									<span class="account-entry-subtitle">Connect a local or remote source.</span>
								</span>
								<span class="account-entry-icon" aria-hidden="true">${renderArrowIcon({ className: "icon icon-forward", direction: "right" })}</span>
							</button>
							<open-collections-connections-list id="connectionsListPanel"></open-collections-connections-list>
						</div>
					</div>
					<open-collections-add-connection-panel id="addConnectionPanel" class="is-hidden"></open-collections-add-connection-panel>
				</open-collections-section-panel>
			</section>

			<section class="account-section-content is-hidden" id="settingsSection" aria-labelledby="settingsHeading">
				<open-collections-section-panel
					title="Profile"
					heading-level="2"
					id="settingsHeading"
				>
					${renderBackButton({
						id: "settingsBackBtn",
						label: "Back to account",
						className: "back-btn",
						slot: "leading",
					})}
					<p class="account-description">This area will host profile and account preferences as the account app grows.</p>
					<open-collections-empty-state
						title="Profile coming soon"
						message="Future account preferences and profile-level configuration will be managed here."
					></open-collections-empty-state>
				</open-collections-section-panel>
			</section>
		</main>
	`;
}

class OpenCollectionsAccountElement extends HTMLElement {
	static get observedAttributes() {
		return ["data-oc-app-mode", "data-shell-embed", "data-workbench-embed"];
	}

	constructor() {
		super();

		this.state = {
			sources: [],
			activeSourceId: "all",
			selectedProviderId: "example",
			view: "list",
			activePage: "root",
		};

		this.pendingSourceRepair = null;
		this.selectedLocalDirectoryHandle = null;
		this.localFolderPickerSupported = supportsHostDirectoryPicker();
		this.credentialStore = createCredentialStore();
		this.connectionsRuntime = createConnectionsRuntime({
			defaultManifestPath: MANAGER_CONFIG.defaultLocalManifestPath,
			storageKey: ACCOUNT_SOURCES_STORAGE_KEY,
			credentialStore: this.credentialStore,
			makeConnectionId,
		});
		this.providerFactories = this.connectionsRuntime.providerFactories;
		this.providers = this.connectionsRuntime.providers;
		this.providerCatalog = this.connectionsRuntime.providerCatalog;

		this.shadow = this.attachShadow({ mode: "open" });

		renderShell(this.shadow);

		this.cacheDom();
		this.applyRuntimePresentation();
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (oldValue === newValue) {
			return;
		}
		if (
			name === "data-oc-app-mode" ||
			name === "data-shell-embed" ||
			name === "data-workbench-embed"
		) {
			this.applyRuntimePresentation();
		}
	}

	connectedCallback() {
		this.applyRuntimePresentation();
		this.bindEvents();
		this.dom.addConnectionPanel?.setLocalFolderSupport(
			this.localFolderPickerSupported,
		);
		this.renderProviderCatalog();
		this.setSelectedProvider("example");
		this.setActivePage("root");
		this.renderConnectionsListPanel();
		this.restoreRememberedSources();
		this.setStatus(
			this.state.sources.length
				? "Select a connection to inspect or refresh."
				: "No connections yet.",
			"neutral",
		);
	}

	isEmbeddedRuntime() {
		const runtimeMode =
			this.dataset?.ocAppMode || this.getAttribute("data-oc-app-mode");
		if (runtimeMode === APP_RUNTIME_MODES.EMBEDDED) {
			return true;
		}
		return (
			this.hasAttribute("data-shell-embed") ||
			this.hasAttribute("data-workbench-embed")
		);
	}

	applyRuntimePresentation() {
		this.toggleAttribute(
			"data-app-presentation-embedded",
			this.isEmbeddedRuntime(),
		);
	}

	cacheDom() {
		this.dom = {
			accountRootView: this.shadow.getElementById("accountRootView"),
			accountStatus: this.shadow.getElementById("accountStatus"),
			entryButtons: Array.from(
				this.shadow.querySelectorAll("[data-account-entry]"),
			),
			backButtons: [
				this.shadow.getElementById("accountBackBtn"),
				this.shadow.getElementById("settingsBackBtn"),
			].filter(Boolean),
			connectionsAddBtn: this.shadow.getElementById("connectionsAddBtn"),
			connectionsSection:
				this.shadow.getElementById("connectionsSection"),
			connectionsOverviewView:
				this.shadow.getElementById("connectionsOverviewView"),
			settingsSection: this.shadow.getElementById("settingsSection"),
			connectionsListPanel: this.shadow.getElementById(
				"connectionsListPanel",
			),
			addConnectionPanel:
				this.shadow.getElementById("addConnectionPanel"),
		};
	}

	bindEvents() {
		if (this._eventsBound) {
			return;
		}
		this._eventsBound = true;

		this.dom.entryButtons?.forEach((button) => {
			button.addEventListener("click", () => {
				const page = button.dataset.accountEntry || "";
				if (page) {
					this.setActivePage(page);
				}
			});
		});
		this.dom.backButtons?.forEach((button) => {
			button.addEventListener("click", () => this.setActivePage("root"));
		});
		this.dom.connectionsAddBtn?.addEventListener("click", () => {
			this.openAddConnectionView();
		});

		this.dom.connectionsListPanel?.addEventListener(
			"select-connection",
			(event) => {
				const source = this.getSourceById(event.detail?.sourceId || "");
				if (!source) {
					return;
				}
				this.state.activeSourceId = source.id;
				this.renderConnectionsListPanel();
				this.setStatus(
					`Selected connection ${source.displayLabel || source.providerLabel || source.id}.`,
					"neutral",
				);
			},
		);
		this.dom.connectionsListPanel?.addEventListener(
			"refresh-connection",
			async (event) => {
				const sourceId = event.detail?.sourceId || "";
				if (sourceId) {
					await this.refreshSource(sourceId);
				}
			},
		);
		this.dom.connectionsListPanel?.addEventListener(
			"repair-connection",
			async (event) => {
				const sourceId = event.detail?.sourceId || "";
				const mode = event.detail?.mode || "";
				if (!sourceId || !mode) {
					return;
				}
				if (mode === "credentials") {
					this.openCredentialRepairView(sourceId);
					return;
				}
				if (mode === "folder") {
					this.prepareSourceRepair(sourceId, "folder");
					const didPick = await this.pickLocalFolder();
					if (didPick) {
						await this.refreshSource(sourceId, {
							configOverrides: {
								localDirectoryHandle:
									this.selectedLocalDirectoryHandle,
							},
						});
					}
					return;
				}
				this.prepareSourceRepair(sourceId, "reconnect");
				await this.refreshSource(sourceId);
			},
		);
		this.dom.connectionsListPanel?.addEventListener(
			"remove-connection",
			(event) => {
				const sourceId = event.detail?.sourceId || "";
				if (sourceId) {
					this.removeSource(sourceId);
				}
			},
		);

		this.dom.addConnectionPanel?.addEventListener(
			"back-to-connections",
			() => {
				this.clearPendingSourceRepair();
				this.dom.addConnectionPanel?.resetFlow?.();
				this.showConnectionsListView();
			},
		);
		this.dom.addConnectionPanel?.addEventListener(
			"select-provider",
			(event) => {
				const providerId = event.detail?.providerId || "";
				if (providerId) {
					this.setSelectedProvider(providerId);
				}
			},
		);
		this.dom.addConnectionPanel?.addEventListener(
			"connect-provider",
			async () => {
				await this.connectCurrentProvider();
			},
		);
		this.dom.addConnectionPanel?.addEventListener(
			"add-example-connection",
			async () => {
				this.clearPendingSourceRepair();
				this.setSelectedProvider("example");
				await this.connectCurrentProvider();
			},
		);
		this.dom.addConnectionPanel?.addEventListener(
			"add-local-folder-connection",
			async () => {
				this.clearPendingSourceRepair();
				this.setSelectedProvider("local");
				const didPick = await this.pickLocalFolder();
				if (didPick) {
					await this.connectCurrentProvider();
				}
			},
		);
	}

	setStatus(text, tone = "neutral") {
		if (!this.dom.accountStatus) {
			return;
		}
		this.dom.accountStatus.textContent = text;
		this.dom.accountStatus.dataset.tone = tone;
	}

	setConnectionStatus(text, tone = "neutral") {
		this.dom.addConnectionPanel?.setConnectionStatus(text, tone);
	}

	setActivePage(pageId) {
		const nextPage = ["connections", "settings"].includes(pageId)
			? pageId
			: "root";
		if (nextPage !== "connections") {
			this.setConnectionsViewState("list");
		}
		this.state.activePage = nextPage;

		this.dom.accountRootView?.classList.toggle(
			"is-hidden",
			nextPage !== "root",
		);
		this.dom.connectionsSection?.classList.toggle(
			"is-hidden",
			nextPage !== "connections",
		);
		this.dom.settingsSection?.classList.toggle(
			"is-hidden",
			nextPage !== "settings",
		);
	}

	showConnectionsListView() {
		this.setActivePage("connections");
		this.setConnectionsViewState("list");
		this.renderConnectionsListPanel();
	}

	openAddConnectionView() {
		this.clearPendingSourceRepair();
		this.dom.addConnectionPanel?.resetFlow?.();
		this.showAddConnectionView();
	}

	showAddConnectionView() {
		this.setActivePage("connections");
		this.setConnectionsViewState("add");
	}

	setConnectionsViewState(view) {
		const nextView = view === "add" ? "add" : "list";
		this.state.view = nextView;
		this.dom.connectionsOverviewView?.classList.toggle(
			"is-hidden",
			nextView !== "list",
		);
		this.dom.addConnectionPanel?.classList.toggle(
			"is-hidden",
			nextView !== "add",
		);
	}

	openCredentialRepairView(sourceId) {
		const source = this.prepareSourceRepair(sourceId, "credentials");
		if (!source || !["github", "s3"].includes(source.providerId)) {
			return;
		}
		this.inspectSource(source.id);
		this.dom.addConnectionPanel?.openRepairCredentials?.(source.providerId);
		this.showAddConnectionView();
	}

	renderProviderCatalog() {
		this.dom.addConnectionPanel?.setProviderCatalog(this.providerCatalog);
	}

	setSelectedProvider(providerId) {
		const selected = this.providerCatalog.find(
			(entry) => entry.id === providerId,
		);
		if (!selected) {
			return;
		}
		this.state.selectedProviderId = providerId;
		this.dom.addConnectionPanel?.setSelectedProvider(providerId);
		this.renderCapabilities(
			this.providerFactories[providerId]?.getCapabilities?.() ||
				selected.capabilities ||
				{},
		);
	}

	renderCapabilities(capabilities) {
		this.dom.addConnectionPanel?.setCapabilities(capabilities || {});
	}

	getSourceById(sourceId) {
		return (
			this.state.sources.find((source) => source.id === sourceId) || null
		);
	}

	clearPendingSourceRepair() {
		this.pendingSourceRepair = null;
	}

	prepareSourceRepair(sourceId, mode = "reconnect") {
		const source = this.getSourceById(sourceId);
		if (!source) {
			return null;
		}
		this.pendingSourceRepair = { sourceId, mode };
		return source;
	}

	renderConnectionsListPanel() {
		const unique = uniqueConnectionsForDisplay(
			this.state.sources,
			MANAGER_CONFIG.defaultLocalManifestPath,
		);
		this.dom.connectionsListPanel?.setSources(unique);
		this.dom.connectionsListPanel?.setActiveSourceId(
			this.state.activeSourceId || "all",
		);
	}

	collectCurrentProviderConfig(providerId) {
		const config =
			this.dom.addConnectionPanel?.getProviderConfig(providerId) || {};
		return this.connectionsRuntime.collectProviderConfig(
			providerId,
			config,
			this.selectedLocalDirectoryHandle,
		);
	}

	async pickLocalFolder() {
		if (!this.localFolderPickerSupported) {
			this.dom.addConnectionPanel?.setLocalFolderStatus(
				"Local folder requires a supported browser or the desktop app.",
				"warn",
			);
			this.setStatus(
				"Local folder is unavailable in this browser. Use the desktop app, GitHub, or S3.",
				"warn",
			);
			return false;
		}

		try {
			const handle = await pickHostDirectory();
			const folderName = (handle?.name || "").trim() || "Selected folder";
			const folderPath = String(handle?.path || "").trim();
			this.selectedLocalDirectoryHandle = handle || null;
			this.dom.addConnectionPanel?.setConfigValues({
				localFolderName: folderName,
				localPathInput: folderPath || folderName,
			});
			this.dom.addConnectionPanel?.setLocalFolderStatus(
				`Selected folder: ${folderPath || folderName}`,
				"ok",
			);
			this.setStatus(
				`Selected local folder: ${folderPath || folderName}`,
				"ok",
			);
			return true;
		} catch (error) {
			if (error?.name === "AbortError") {
				this.dom.addConnectionPanel?.setLocalFolderStatus(
					"Folder selection cancelled.",
					"neutral",
				);
				return false;
			}
			this.dom.addConnectionPanel?.setLocalFolderStatus(
				`Folder selection failed: ${error.message}`,
				"warn",
			);
			this.setStatus(`Folder selection failed: ${error.message}`, "warn");
			return false;
		}
	}

	async connectCurrentProvider() {
		const providerId = this.state.selectedProviderId;
		const config = this.collectCurrentProviderConfig(providerId);
		const repairingSource = this.pendingSourceRepair?.sourceId
			? this.getSourceById(this.pendingSourceRepair.sourceId)
			: null;

		try {
			const result = await this.connectionsRuntime.connectSource({
				providerId,
				config,
				pendingRepairSource: repairingSource,
				sources: this.state.sources,
			});
			if (!result.ok) {
				this.setConnectionStatus(
					result.message || "Connection failed.",
					"warn",
				);
				this.setStatus(result.message || "Connection failed.", "warn");
				return;
			}
			this.renderCapabilities(
				result.source.provider?.getCapabilities?.() || {},
			);

			if (providerId === "local" && config.localDirectoryHandle) {
				this.selectedLocalDirectoryHandle = config.localDirectoryHandle;
			}

			this.state.sources = result.sources;
			this.state.activeSourceId = result.source.id;
			this.clearPendingSourceRepair();
			this.showConnectionsListView();
			this.persistSources();
			this.renderConnectionsListPanel();
			this.setConnectionStatus(
				result.source.status || "Connected.",
				"ok",
			);
			this.setStatus(
				result.target
					? `Reconnected ${result.source.displayLabel} (${result.source.itemCount} assets found).`
					: `Added ${result.source.displayLabel} (${result.source.itemCount} assets found).`,
				"ok",
			);
		} catch (error) {
			this.clearPendingSourceRepair();
			this.setConnectionStatus(
				`Connection error: ${error.message}`,
				"warn",
			);
			this.setStatus(`Connection error: ${error.message}`, "warn");
		}
	}

	inspectSource(sourceId) {
		const source = this.getSourceById(sourceId);
		if (!source) {
			return;
		}

		this.setSelectedProvider(source.providerId);
		const values = {};
		if (source.providerId === "github") {
			values.githubToken = source.config?.token || "";
			values.githubOwner = source.config?.owner || "";
			values.githubRepo = source.config?.repo || "";
			values.githubBranch = source.config?.branch || "main";
			values.githubPath = source.config?.path || "";
		}
		if (source.providerId === "s3") {
			values.s3Endpoint = source.config?.endpoint || "";
			values.s3Bucket = source.config?.bucket || "";
			values.s3Region = source.config?.region || "";
			values.s3BasePath = source.config?.basePath || "";
			values.s3AccessKey = source.config?.accessKey || "";
			values.s3SecretKey = source.config?.secretKey || "";
		}
		if (source.providerId === "local") {
			values.localPathInput =
				source.config?.path || MANAGER_CONFIG.defaultLocalManifestPath;
			values.localFolderName = source.config?.localDirectoryName || "";
			this.selectedLocalDirectoryHandle =
				source.config?.localDirectoryHandle || null;
		}
		if (source.providerId === "example") {
			values.localPathInput = MANAGER_CONFIG.defaultLocalManifestPath;
			values.localFolderName = "";
		}
		this.dom.addConnectionPanel?.setConfigValues(values);
		this.setConnectionStatus(
			`Inspecting connection: ${source.displayLabel || source.label}`,
			"ok",
		);
	}

	async refreshSource(sourceId, options = {}) {
		const source = this.getSourceById(sourceId);
		if (!source) {
			return;
		}

		try {
			const result = await this.connectionsRuntime.refreshSource({
				source,
				sources: this.state.sources,
				configOverrides: options.configOverrides || {},
				pendingSourceRepair: this.pendingSourceRepair,
				selectedLocalDirectoryHandle: this.selectedLocalDirectoryHandle,
			});
			if (!result.ok) {
				this.state.sources = result.sources || this.state.sources;
				this.renderConnectionsListPanel();
				this.persistSources();
				this.setConnectionStatus(
					result.message || "Refresh failed.",
					"warn",
				);
				this.setStatus(
					`Refresh failed: ${result.message || "Connection failed."}`,
					"warn",
				);
				return;
			}
			this.state.sources = result.sources;
			this.state.activeSourceId = result.source.id;
			this.clearPendingSourceRepair();
			this.persistSources();
			this.renderConnectionsListPanel();
			this.setConnectionStatus(
				`Refreshed ${result.source.displayLabel}.`,
				"ok",
			);
			this.setStatus(
				`Refreshed ${result.source.displayLabel} (${result.source.itemCount} assets found).`,
				"ok",
			);
		} catch (error) {
			this.clearPendingSourceRepair();
			this.setConnectionStatus(`Refresh error: ${error.message}`, "warn");
			this.setStatus(`Refresh error: ${error.message}`, "warn");
		}
	}

	async removeSource(sourceId) {
		const result = await this.connectionsRuntime.removeSource({
			sourceId,
			sources: this.state.sources,
			activeSourceId: this.state.activeSourceId,
		});
		if (!result.ok) {
			return;
		}
		this.state.sources = result.sources;
		this.state.activeSourceId = result.activeSourceId;
		if (this.pendingSourceRepair?.sourceId === sourceId) {
			this.clearPendingSourceRepair();
		}

		this.persistSources();
		this.renderConnectionsListPanel();
		if (this.state.sources.length === 0) {
			this.setConnectionStatus("No connections yet.", "neutral");
			this.setStatus("No connections yet.", "neutral");
		} else {
			this.setStatus(
				`Removed ${result.removedSource.displayLabel || result.removedSource.id}.`,
				"ok",
			);
		}
	}

	persistSources() {
		this.connectionsRuntime.persistSources(this.state.sources);
	}

	restoreRememberedSources() {
		const remembered = this.connectionsRuntime.restoreRememberedSources();
		if (!remembered.length) {
			return;
		}
		this.state.sources = remembered;
		this.state.activeSourceId = this.state.sources[0]?.id || "all";
		this.renderConnectionsListPanel();
		this.setStatus(
			`Loaded ${this.state.sources.length} remembered connection${this.state.sources.length === 1 ? "" : "s"}.`,
			"neutral",
		);
	}
}

if (!customElements.get("open-collections-account")) {
	customElements.define(
		"open-collections-account",
		OpenCollectionsAccountElement,
	);
}

export { OpenCollectionsAccountElement };
