import {
	pickHostDirectory,
	supportsHostDirectoryPicker,
} from "../../../shared/platform/host-directory.js";
import { MANAGER_CONFIG } from "../../collection-manager/src/config.js";
import {
	CANONICAL_AVAILABLE_CONNECTIONS_STORAGE_KEY,
	createConnectionsRuntime,
	createCredentialStore,
	getSessionConnectionSources,
	makeConnectionId,
	subscribeSessionConnectionSources,
	setSessionConnectionSources,
	uniqueConnectionsForDisplay,
	buildBuiltInExampleSourceRequest,
	isBuiltInExampleSource,
} from "../../../shared/account/index.js";
import { renderBackButton } from "../../../shared/components/back-button.js";
import {
	renderCreateNewFolderIcon,
	renderDriveFolderUploadIcon,
	renderProfileIcon,
} from "../../../shared/components/icons.js";
import "../../../shared/ui/primitives/action-row.js";
import "./components/connections-list-panel.js";
import "./components/add-connection-panel.js";
import "./components/connection-detail-panel.js";
import {
	APP_LIFECYCLE_EVENTS,
	APP_RUNTIME_MODES,
} from "../../../shared/runtime/app-mount-contract.js";
import { accountShellStyles } from "./css/shell.css.js";

function renderShell(shadowRoot) {
	shadowRoot.innerHTML = `

		<style>
			${accountShellStyles}
		</style>

		<main class="oc-page oc-app-viewport account-shell">

			<section class="account-root-view" id="accountRootView" aria-label="Account areas">

				<open-collections-action-row
					data-account-entry="connections"
					title="Connections"
					subtitle="Connection management has moved to Connect."
				>
					<span slot="leading">${renderDriveFolderUploadIcon()}</span>
				</open-collections-action-row>

				<open-collections-action-row
					data-account-entry="settings"
					title="Profile"
					subtitle="Update personal and account profile preferences."
				>
					<span slot="leading">${renderProfileIcon()}</span>
				</open-collections-action-row>
				
			</section>

			<section class="account-section-content is-hidden" id="connectionsSection" aria-labelledby="connectionsHeading">
				<div id="connectionsOverviewView">
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
						<p class="account-description connections-explainer">Open Collections does not store your files. Your collections stay in storage you control, such as a local folder, your own cloud storage, or your own web host.</p>

						<div class="connections-body">
							<open-collections-action-row
								id="connectionsAddBtn"
								variant="placeholder"
								title="Add new connection"
								subtitle="Connect a local or remote source."
							>
								<span slot="leading">${renderCreateNewFolderIcon()}</span>
							</open-collections-action-row>
							<open-collections-connections-list id="connectionsListPanel"></open-collections-connections-list>
						</div>
					</open-collections-section-panel>
				</div>
				<div id="connectionsAddView" class="is-hidden">
					<open-collections-add-connection-panel id="addConnectionPanel"></open-collections-add-connection-panel>
				</div>
				<div id="connectionsDetailView" class="is-hidden">
					<open-collections-section-panel
						title="Connection settings"
						heading-level="2"
						id="connectionDetailHeading"
					>
						${renderBackButton({
							id: "connectionDetailBackBtn",
							label: "Back to connections",
							className: "back-btn",
							slot: "leading",
						})}
						<button
							class="btn btn-primary connection-detail-save-btn"
							slot="actions"
							type="button"
							id="connectionDetailSaveBtn"
							disabled
						>
							Save
						</button>
						<p class="status-note detail-save-status" id="connectionDetailSaveStatus">No pending changes.</p>
						<open-collections-connection-detail-panel id="connectionDetailPanel"></open-collections-connection-detail-panel>
					</open-collections-section-panel>
				</div>
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
			selectedProviderId: "local",
			view: "list",
			activePage: "root",
			connectionDetailDraftTitle: "",
			connectionDetailSavedTitle: "",
			connectionDetailSaveState: "idle",
			connectionDetailSaveError: "",
			connectionDetailStateSourceId: "",
		};

		this.pendingSourceRepair = null;
		this.selectedLocalDirectoryHandle = null;
		this.localFolderPickerSupported = supportsHostDirectoryPicker();
		this.credentialStore = createCredentialStore();
		this.connectionsRuntime = createConnectionsRuntime({
			defaultManifestPath: MANAGER_CONFIG.defaultLocalManifestPath,
			storageKey: CANONICAL_AVAILABLE_CONNECTIONS_STORAGE_KEY,
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
		this.setSelectedProvider("local");
		this.setActivePage("root");
		this.renderConnectionsListPanel();
		this.restoreRememberedSources();
		if (!this.isEmbeddedRuntime()) {
			void this.ensureStarterExampleConnection();
		}
		this._unsubscribeSessionConnectionSources =
			subscribeSessionConnectionSources((sources) => {
				this.handleSessionConnectionSourcesChanged(sources);
			});
	}

	disconnectedCallback() {
		if (typeof this._unsubscribeSessionConnectionSources === "function") {
			this._unsubscribeSessionConnectionSources();
		}
		this._unsubscribeSessionConnectionSources = null;
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
			connectionsAddView:
				this.shadow.getElementById("connectionsAddView"),
			connectionsDetailView:
				this.shadow.getElementById("connectionsDetailView"),
			settingsSection: this.shadow.getElementById("settingsSection"),
			connectionsListPanel: this.shadow.getElementById(
				"connectionsListPanel",
			),
			connectionDetailPanel: this.shadow.getElementById(
				"connectionDetailPanel",
			),
			connectionDetailSaveBtn: this.shadow.getElementById(
				"connectionDetailSaveBtn",
			),
			connectionDetailSaveStatus: this.shadow.getElementById(
				"connectionDetailSaveStatus",
			),
			connectionDetailBackBtn: this.shadow.getElementById(
				"connectionDetailBackBtn",
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
				if (page === "connections" && this.isEmbeddedRuntime()) {
					if (!this.requestConnectNavigation()) {
						this.setActivePage("connections");
					}
					return;
				}
				if (page) {
					this.setActivePage(page);
				}
			});
		});
		this.dom.backButtons?.forEach((button) => {
			button.addEventListener("click", () => this.setActivePage("root"));
		});
		this.dom.connectionDetailBackBtn?.addEventListener("click", () => {
			this.showConnectionsListView();
		});
		this.dom.connectionDetailSaveBtn?.addEventListener("click", async () => {
			await this.saveConnectionDetailTitle();
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
				this.setConnectionsViewState("detail");
				this.renderConnectionDetailPanel();
				this.renderConnectionsListPanel();
				this.setStatus(
					`Selected connection ${source.displayLabel || source.providerLabel || source.id}.`,
					"neutral",
				);
			},
		);
		this.dom.connectionDetailPanel?.addEventListener(
			"connection-title-draft-changed",
			(event) => {
				const sourceId = event.detail?.sourceId || "";
				if (!sourceId || sourceId !== this.state.activeSourceId) {
					return;
				}
				this.state.connectionDetailDraftTitle = String(
					event.detail?.title || "",
				);
				this.state.connectionDetailSaveState = this.isConnectionDetailDirty()
					? "dirty"
					: "idle";
				this.state.connectionDetailSaveError = "";
				this.renderConnectionDetailSaveState();
			},
		);
		this.dom.connectionDetailPanel?.addEventListener(
			"refresh-connection",
			async (event) => {
				const sourceId = event.detail?.sourceId || "";
				if (sourceId) {
					await this.refreshSource(sourceId);
				}
			},
		);
		this.dom.connectionDetailPanel?.addEventListener(
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
		this.dom.connectionDetailPanel?.addEventListener(
			"remove-connection",
			(event) => {
				const sourceId = event.detail?.sourceId || "";
				if (sourceId) {
					this.removeSource(sourceId);
				}
			},
		);
		this.dom.connectionDetailPanel?.addEventListener(
			"toggle-example-connection",
			(event) => {
				const sourceId = event.detail?.sourceId || "";
				const enabled = Boolean(event.detail?.enabled);
				if (sourceId) {
					this.toggleExampleConnection(sourceId, enabled);
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
		if (nextPage === "connections" && this.isEmbeddedRuntime()) {
			if (this.requestConnectNavigation()) {
				return;
			}
		}
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

	requestConnectNavigation() {
		const navigateEvent = new CustomEvent(APP_LIFECYCLE_EVENTS.NAVIGATE, {
			detail: {
				targetAppId: "collection-connector",
				reason: "account-connections-entry",
			},
			bubbles: true,
			composed: true,
			cancelable: true,
		});
		return this.dispatchEvent(navigateEvent) === false;
	}

	showConnectionsListView() {
		this.setActivePage("connections");
		this.setConnectionsViewState("list");
		this.renderConnectionsListPanel();
		this.renderConnectionDetailPanel();
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
		const nextView =
			view === "add" ? "add" : view === "detail" ? "detail" : "list";
		this.state.view = nextView;
		this.dom.connectionsOverviewView?.classList.toggle(
			"is-hidden",
			nextView !== "list",
		);
		this.dom.connectionsAddView?.classList.toggle(
			"is-hidden",
			nextView !== "add",
		);
		this.dom.connectionsDetailView?.classList.toggle(
			"is-hidden",
			nextView !== "detail",
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

	handleSessionConnectionSourcesChanged(sources = []) {
		if (!Array.isArray(sources) || sources.length === 0) {
			return;
		}
		const incomingById = new Map();
		for (const source of sources) {
			const sourceId = String(source?.id || "").trim();
			if (!sourceId) {
				continue;
			}
			incomingById.set(sourceId, source);
		}
		if (incomingById.size === 0) {
			return;
		}
		const existingById = new Map(
			this.state.sources.map((entry) => [entry.id, entry]),
		);
		const nextSources = Array.from(incomingById.values()).map((source) => ({
			...(existingById.get(source.id) || {}),
			...source,
		}));
		this.state.sources = nextSources;
		if (
			!this.state.sources.some(
				(source) => source.id === this.state.activeSourceId,
			)
		) {
			this.state.activeSourceId = this.state.sources[0]?.id || "all";
		}
		this.renderConnectionsListPanel();
	}

	getSourceTitle(source) {
		if (!source) {
			return "";
		}
		return (
			source.displayLabel || source.label || source.providerLabel || "Connection"
		);
	}

	isConnectionDetailDirty() {
		return (
			String(this.state.connectionDetailDraftTitle || "").trim() !==
			String(this.state.connectionDetailSavedTitle || "").trim()
		);
	}

	syncConnectionDetailState(source) {
		if (!source) {
			this.state.connectionDetailStateSourceId = "";
			this.state.connectionDetailDraftTitle = "";
			this.state.connectionDetailSavedTitle = "";
			this.state.connectionDetailSaveState = "idle";
			this.state.connectionDetailSaveError = "";
			return;
		}
		if (this.state.connectionDetailStateSourceId === source.id) {
			return;
		}
		const nextTitle = this.getSourceTitle(source);
		this.state.connectionDetailStateSourceId = source.id;
		this.state.connectionDetailDraftTitle = nextTitle;
		this.state.connectionDetailSavedTitle = nextTitle;
		this.state.connectionDetailSaveState = "idle";
		this.state.connectionDetailSaveError = "";
	}

	renderConnectionDetailSaveState() {
		const saveBtn = this.dom.connectionDetailSaveBtn;
		const saveStatus = this.dom.connectionDetailSaveStatus;
		if (!saveBtn || !saveStatus) {
			return;
		}
		const hasSource = Boolean(this.getSourceById(this.state.activeSourceId));
		const isDirty = this.isConnectionDetailDirty();
		const state = hasSource
			? this.state.connectionDetailSaveState
			: "idle";
		saveBtn.disabled = !hasSource || !isDirty || state === "saving";
		saveBtn.textContent = state === "saving" ? "Saving…" : "Save";

		if (!hasSource) {
			saveStatus.textContent = "";
			saveStatus.dataset.tone = "neutral";
			return;
		}
		if (state === "saving") {
			saveStatus.textContent = "Saving changes…";
			saveStatus.dataset.tone = "neutral";
			return;
		}
		if (state === "saved") {
			saveStatus.textContent = "Saved.";
			saveStatus.dataset.tone = "ok";
			return;
		}
		if (state === "error") {
			saveStatus.textContent =
				this.state.connectionDetailSaveError ||
				"Unable to save connection settings.";
			saveStatus.dataset.tone = "warn";
			return;
		}
		if (isDirty || state === "dirty") {
			saveStatus.textContent = "Unsaved changes.";
			saveStatus.dataset.tone = "neutral";
			return;
		}
		saveStatus.textContent = "No pending changes.";
		saveStatus.dataset.tone = "neutral";
	}

	async saveConnectionDetailTitle() {
		const sourceId = this.state.activeSourceId || "";
		const source = this.getSourceById(sourceId);
		if (!source || !this.isConnectionDetailDirty()) {
			this.renderConnectionDetailSaveState();
			return;
		}
		const title = String(this.state.connectionDetailDraftTitle || "").trim();
		this.state.connectionDetailSaveState = "saving";
		this.state.connectionDetailSaveError = "";
		this.renderConnectionDetailSaveState();
		const result = await this.connectionsRuntime.updateSourceSettings({
			sourceId,
			sources: this.state.sources,
			patch: { title },
		});
		if (!result.ok) {
			this.state.connectionDetailSaveState = "error";
			this.state.connectionDetailSaveError =
				result.message || "Unable to save connection settings.";
			this.renderConnectionDetailSaveState();
			this.setStatus(this.state.connectionDetailSaveError, "warn");
			return;
		}
		this.state.sources = result.sources;
		this.state.activeSourceId = result.source.id;
		const savedTitle = this.getSourceTitle(result.source);
		this.state.connectionDetailSavedTitle = savedTitle;
		this.state.connectionDetailDraftTitle = savedTitle;
		this.state.connectionDetailSaveState = "saved";
		this.state.connectionDetailSaveError = "";
		this.persistSources();
		this.renderConnectionsListPanel();
		this.setStatus(
			`Saved connection settings for ${result.source.displayLabel || result.source.id}.`,
			"ok",
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
		this.renderConnectionDetailPanel();
	}

	renderConnectionDetailPanel() {
		const source = this.getSourceById(this.state.activeSourceId);
		this.syncConnectionDetailState(source);
		this.dom.connectionDetailPanel?.setSource(source, {
			titleDraft: this.state.connectionDetailDraftTitle,
		});
		this.renderConnectionDetailSaveState();
	}

	async ensureStarterExampleConnection() {
		const starterExampleSource = this.state.sources.find((source) =>
			isBuiltInExampleSource(source),
		);
		if (starterExampleSource) {
			if (this.state.sources.length === 1) {
				if (starterExampleSource.enabled === false) {
					this.setStatus(
						"Starter example connection is currently hidden. Re-enable it from this card any time.",
						"neutral",
					);
				} else {
					this.setStatus(
						"Starter example connection is ready. Add a local folder or remote connection to use your own storage.",
						"neutral",
					);
				}
			}
			return;
		}

		const result = await this.connectionsRuntime.connectSource(
			buildBuiltInExampleSourceRequest({
				connectionsRuntime: this.connectionsRuntime,
				selectedLocalDirectoryHandle: this.selectedLocalDirectoryHandle,
				sources: this.state.sources,
			}),
		);
		if (!result.ok) {
			this.setStatus(result.message || "Starter connection failed.", "warn");
			return;
		}

		this.state.sources = result.sources;
		if (this.state.activeSourceId === "all") {
			this.state.activeSourceId = result.source.id;
		}
		this.persistSources();
		this.renderConnectionsListPanel();
		this.setStatus(
			"Starter example connection is ready. Add a local folder or remote connection to use your own storage.",
			"neutral",
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
		const removedWhileInspecting =
			this.state.view === "detail" && this.state.activeSourceId === sourceId;
		const result = await this.connectionsRuntime.removeSource({
			sourceId,
			sources: this.state.sources,
			activeSourceId: this.state.activeSourceId,
		});
		if (!result.ok) {
			if (result.message) {
				this.setStatus(result.message, "warn");
			}
			return;
		}
		this.state.sources = result.sources;
		this.state.activeSourceId = result.activeSourceId;
		if (this.pendingSourceRepair?.sourceId === sourceId) {
			this.clearPendingSourceRepair();
		}

		this.persistSources();
		this.renderConnectionsListPanel();
		if (removedWhileInspecting) {
			this.showConnectionsListView();
		}
		if (this.state.sources.length === 0) {
			await this.ensureStarterExampleConnection();
		} else {
			this.setStatus(
				`Removed ${result.removedSource.displayLabel || result.removedSource.id}.`,
				"ok",
			);
		}
	}

	toggleExampleConnection(sourceId, enabled) {
		const source = this.getSourceById(sourceId);
		if (!source || source.providerId !== "example") {
			return;
		}
		const result = this.connectionsRuntime.setSourceEnabled({
			sourceId,
			enabled,
			sources: this.state.sources,
			activeSourceId: this.state.activeSourceId,
		});
		if (!result.ok) {
			this.setStatus(result.message || "Unable to update connection.", "warn");
			return;
		}
		this.state.sources = result.sources;
		this.state.activeSourceId = result.activeSourceId;
		this.persistSources();
		this.renderConnectionsListPanel();
		this.setStatus(
			enabled
				? "Starter example connection is enabled."
				: "Starter example connection is hidden. You can enable it again at any time.",
			"neutral",
		);
	}

	persistSources() {
		this.connectionsRuntime.persistSources(this.state.sources);
		setSessionConnectionSources(this.state.sources);
	}

	restoreRememberedSources() {
		const sessionSources = getSessionConnectionSources();
		const usingSessionSources =
			Array.isArray(sessionSources) && sessionSources.length > 0;
		const remembered = usingSessionSources
			? sessionSources
			: this.isEmbeddedRuntime()
				? []
				: this.connectionsRuntime.restoreRememberedSources();
		if (!remembered.length) {
			return;
		}
		this.state.sources = remembered;
		setSessionConnectionSources(this.state.sources);
		this.state.activeSourceId = this.state.sources[0]?.id || "all";
		this.renderConnectionsListPanel();
		this.setStatus(
			usingSessionSources
				? `Loaded ${this.state.sources.length} in-session connection${this.state.sources.length === 1 ? "" : "s"}.`
				: `Loaded ${this.state.sources.length} remembered connection${this.state.sources.length === 1 ? "" : "s"}.`,
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
