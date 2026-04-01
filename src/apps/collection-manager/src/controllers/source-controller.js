import { MANAGER_CONFIG } from "../config.js";
import {
	sanitizeConnectionConfig,
	sourceDetailLabelFor as sharedSourceDetailLabelFor,
	sourceDisplayLabelFor as sharedSourceDisplayLabelFor,
} from "../../../../shared/account/index.js";

function localDirectoryPathFromHandle(handle) {
	const path = typeof handle?.path === "string" ? handle.path.trim() : "";
	return path || "";
}

export function setSelectedProvider(app, providerId) {
	const selected = app.providerCatalog.find(
		(entry) => entry.id === providerId,
	);
	if (!selected) {
		return;
	}

	app.state.selectedProviderId = providerId;
	app.dom.addConnectionPanel?.setSelectedProvider(providerId);
	app.renderCapabilities(
		app.providerFactories[providerId]?.getCapabilities?.() ||
			selected.capabilities ||
			{},
	);
}

export function collectCurrentProviderConfig(app, providerId) {
	const config =
		app.dom.addConnectionPanel?.getProviderConfig(providerId) || {};
	if (providerId === "local") {
		config.localDirectoryName = (config.localDirectoryName || "").trim();
		const selectedHandle =
			app.selectedLocalDirectoryHandle &&
			app.selectedLocalDirectoryHandle.kind === "directory"
				? app.selectedLocalDirectoryHandle
				: null;
		if (selectedHandle) {
			config.localDirectoryHandle = selectedHandle;
			const handlePath = localDirectoryPathFromHandle(selectedHandle);
			if (handlePath) {
				config.path = handlePath;
			}
			if (!config.localDirectoryName) {
				config.localDirectoryName = String(
					selectedHandle.name || "",
				).trim();
			}
		}
		config.path =
			(config.path || "").trim() ||
			(config.localDirectoryName
				? config.localDirectoryName
				: MANAGER_CONFIG.defaultLocalManifestPath);
	}

	if (providerId === "s3") {
		return {
			endpoint: (config.endpoint || "").trim(),
			bucket: (config.bucket || "").trim(),
			region: (config.region || "").trim(),
			basePath: (config.basePath || "").trim(),
			accessKey: (config.accessKey || "").trim(),
			secretKey: config.secretKey || "",
		};
	}

	if (providerId === "example") {
		config.path = MANAGER_CONFIG.defaultLocalManifestPath;
	}
	return config;
}

export function sourceDisplayLabelFor(app, providerId, config, fallbackLabel) {
	if (providerId === "local") {
		return (
			(config.localDirectoryName || "").trim() ||
			app.hostNameFromPath(config.path, "Folder on this device")
		);
	}
	return sharedSourceDisplayLabelFor(
		providerId,
		config,
		fallbackLabel || "Source",
	);
}

export function sourceDetailLabelFor(app, providerId, config, fallbackLabel) {
	if (providerId === "local") {
		const folderName = (config.localDirectoryName || "").trim();
		if (folderName) {
			return `${folderName} (folder root)`;
		}
		return (config.path || "").trim() || "Folder on this device";
	}
	return sharedSourceDetailLabelFor(
		providerId,
		config,
		fallbackLabel || "Source",
		MANAGER_CONFIG.defaultLocalManifestPath,
	);
}

export function sanitizeSourceConfig(app, providerId, config = {}) {
	void app;
	const sanitized = sanitizeConnectionConfig(
		providerId,
		config,
		MANAGER_CONFIG.defaultLocalManifestPath,
	);
	if (providerId === "local") {
		const localDirectoryPath = (
			config.localDirectoryPath ||
			sanitized.localDirectoryHandle?.path ||
			""
		).trim();
		return {
			...sanitized,
			...(localDirectoryPath ? { localDirectoryPath } : {}),
		};
	}
	return sanitized;
}

export function toPersistedSource(app, source) {
	return {
		id: source.id,
		providerId: source.providerId,
		providerLabel: source.providerLabel,
		displayLabel: source.displayLabel || source.label,
		detailLabel: source.detailLabel || source.label,
		config: app.sanitizeSourceConfig(source.providerId, source.config),
		capabilities: source.capabilities || {},
		authMode: source.authMode || "public",
		itemCount: source.itemCount || 0,
		status: source.status || "",
		needsReconnect: Boolean(source.needsReconnect),
		needsCredentials: Boolean(source.needsCredentials),
		lastPublishResult: source.lastPublishResult || null,
	};
}

export async function connectCurrentProvider(app, options = {}) {
	/* delegated from app.js */
	const providerId = options.providerId || app.state.selectedProviderId;
	const selectedProvider = app.providerCatalog.find(
		(entry) => entry.id === providerId,
	);
	const config = app.collectCurrentProviderConfig(providerId);
	const repairingSource = app.pendingSourceRepair?.sourceId
		? app.getSourceById(app.pendingSourceRepair.sourceId)
		: null;

	try {
		const result = await app.connectionsRuntime.connectSource({
			providerId,
			config,
			pendingRepairSource: repairingSource,
			sources: app.state.sources,
		});
		if (!result.ok) {
			app.setConnectionStatus(
				result.message || "Connection failed.",
				false,
			);
			app.setStatus(result.message || "Connection failed.", "warn");
			app.renderAssets();
			app.renderEditor();
			return;
		}

		const loaded = Array.isArray(result.loadedAssets)
			? result.loadedAssets
			: [];
		app.renderCapabilities(
			result.source.provider?.getCapabilities?.() || {},
		);
		const derivedConfig = { ...config };
		if (providerId === "local" && result.source.displayLabel) {
			derivedConfig.localDirectoryName = result.source.displayLabel;
		}
		const displayLabel =
			result.source.displayLabel ||
			app.sourceDisplayLabelFor(
				providerId,
				derivedConfig,
				result.source.providerLabel ||
					selectedProvider?.label ||
					providerId,
			);
		const detailLabel =
			result.source.detailLabel ||
			app.sourceDetailLabelFor(
				providerId,
				derivedConfig,
				result.source.providerLabel ||
					selectedProvider?.label ||
					providerId,
			);
		const draftSource = {
			...result.source,
			label: detailLabel,
			displayLabel,
			detailLabel,
			config: { ...(result.source.config || config) },
			status: result.source.status || "Connected",
			collections: repairingSource?.collections || [],
			selectedCollectionId: repairingSource?.selectedCollectionId || null,
			lastPublishResult: repairingSource?.lastPublishResult || null,
		};

		const existingWithSameIdentity = !repairingSource
			? app.state.sources.find(
					(entry) =>
						app.sourceIdentityKey(entry) ===
						app.sourceIdentityKey(draftSource),
				)
			: null;
		const targetSource = existingWithSameIdentity || repairingSource;
		const source = {
			...draftSource,
			id: targetSource?.id || draftSource.id,
			collections: targetSource?.collections || draftSource.collections,
			selectedCollectionId:
				targetSource?.selectedCollectionId ||
				draftSource.selectedCollectionId,
			lastPublishResult:
				targetSource?.lastPublishResult ||
				draftSource.lastPublishResult,
		};

		const normalized = app.normalizeSourceAssets(source, loaded);
		const providerCollections = Array.isArray(
			result.providerResult?.collections,
		)
			? app.normalizeCollectionsFromProvider(
					result.providerResult.collections,
				)
			: null;
		const collections =
			providerCollections ||
			app.buildCollectionsForSource(source, normalized);
		const assignmentAwareCollections = collections.map((entry) => ({
			...entry,
			connectionId:
				typeof entry.connectionId === "string"
					? entry.connectionId.trim() || source.id
					: source.id,
		}));
		const defaultCollectionId = assignmentAwareCollections[0]?.id || null;
		const normalizedWithCollections = normalized.map((item) => ({
			...item,
			collectionId: item.collectionId || defaultCollectionId,
			collectionLabel:
				item.collectionLabel ||
				assignmentAwareCollections.find(
					(entry) =>
						entry.id === (item.collectionId || defaultCollectionId),
				)?.title ||
				"",
		}));
		source.collections = assignmentAwareCollections;
		const preferredCollectionId =
			targetSource?.selectedCollectionId &&
			assignmentAwareCollections.some(
				(entry) => entry.id === targetSource.selectedCollectionId,
			)
				? targetSource.selectedCollectionId
				: defaultCollectionId;
		source.selectedCollectionId = preferredCollectionId;
		if (providerId === "local" && config.localDirectoryHandle) {
			app.selectedLocalDirectoryHandle = config.localDirectoryHandle;
		}
		if (targetSource) {
			app.state.sources = app.sortSourcesForDisplay(
				app.state.sources.map((entry) =>
					entry.id === targetSource.id ? source : entry,
				),
			);
			app.mergeSourceAssets(targetSource.id, normalizedWithCollections);
		} else {
			app.state.sources = app.sortSourcesForDisplay([
				...app.state.sources,
				source,
			]);
			app.state.assets = [
				...app.state.assets,
				...normalizedWithCollections,
			];
		}
		if (providerId === "local" || providerId === "example") {
			await app.hydrateLocalSourceAssetPreviews(source.id);
		}
		if (options.activateSource !== false) {
			app.state.activeSourceFilter = source.id;
			app.state.selectedCollectionId =
				source.selectedCollectionId || "all";
			app.state.selectedCollectionIds = [];
			app.state.currentLevel = "collections";
			app.state.openedCollectionId = null;
			app.state.selectedItemId = null;
			app.state.selectedItemIds = [];
			app.syncMetadataModeFromState();
			app.closeMobileDetail();
		}
		app.state.manifest = null;
		app.dom.manifestPreview.textContent = "{}";

		app.setConnectionStatus(source.status || "Connected.", true);
		app.setStatus(
			targetSource
				? `Reconnected storage source ${displayLabel} (${loaded.length} items).`
				: `Added storage source ${displayLabel} (${loaded.length} items).`,
			"ok",
		);
		app.setWorkingStateFlags({ publishError: "" });
		app.renderSourcesList();
		app.renderSourceFilter();
		app.renderAssets();
		app.renderEditor();
		app.saveSourcesToStorage();
		app.clearPendingSourceRepair();
		app.renderConnectionsListPanel();
		app.showConnectionsListView();
		if (
			options.openConnectionsDialog !== false &&
			options.openSourcePicker !== false
		) {
			app.openDialog(app.dom.connectionsDialog);
		}
	} catch (error) {
		app.clearPendingSourceRepair();
		app.setConnectionStatus(`Connection error: ${error.message}`, false);
		app.setStatus(`Connection error: ${error.message}`, "warn");
		app.refreshWorkingStatus();
	}
}

export function inspectSource(app, sourceId) {
	const source = app.getSourceById(sourceId);
	if (!source) {
		return;
	}

	app.setSelectedProvider(source.providerId);
	const nextConfigValues = {};
	if (source.providerId === "github") {
		nextConfigValues.githubToken = source.config.token || "";
		nextConfigValues.githubOwner = source.config.owner || "";
		nextConfigValues.githubRepo = source.config.repo || "";
		nextConfigValues.githubBranch = source.config.branch || "main";
		nextConfigValues.githubPath = source.config.path || "";
	}
	if (source.providerId === "s3") {
		nextConfigValues.s3Endpoint = source.config.endpoint || "";
		nextConfigValues.s3Bucket = source.config.bucket || "";
		nextConfigValues.s3Region = source.config.region || "";
		nextConfigValues.s3BasePath = source.config.basePath || "";
		nextConfigValues.s3AccessKey = source.config.accessKey || "";
		nextConfigValues.s3SecretKey = source.config.secretKey || "";
	}
	if (source.providerId === "example") {
		nextConfigValues.localPathInput =
			MANAGER_CONFIG.defaultLocalManifestPath;
		nextConfigValues.localFolderName = "";
	}
	if (source.providerId === "local") {
		nextConfigValues.localPathInput =
			source.config.path || MANAGER_CONFIG.defaultLocalManifestPath;
		nextConfigValues.localFolderName =
			source.config.localDirectoryName || "";
		app.selectedLocalDirectoryHandle =
			source.config?.localDirectoryHandle &&
			source.config.localDirectoryHandle.kind === "directory"
				? source.config.localDirectoryHandle
				: null;
	}
	app.dom.addConnectionPanel?.setConfigValues(nextConfigValues);

	app.setConnectionStatus(`Inspecting storage source: ${source.label}`, true);
}

export async function refreshSource(app, sourceId, options = {}) {
	const source = app.getSourceById(sourceId);
	if (!source) {
		return;
	}
	const isBackgroundRestore = options.backgroundRestore === true;

	try {
		const result = await app.connectionsRuntime.refreshSource({
			source,
			sources: app.state.sources,
			configOverrides: options.configOverrides || {},
			pendingSourceRepair: app.pendingSourceRepair,
			selectedLocalDirectoryHandle: app.selectedLocalDirectoryHandle,
		});
		if (!result.ok) {
			app.state.sources = app.sortSourcesForDisplay(
				result.sources || app.state.sources,
			);
			app.renderSourcesList();
			app.saveSourcesToStorage();
			app.setConnectionStatus(
				isBackgroundRestore
					? result.message ||
							"Background reconnect failed. Connection remains remembered."
					: result.message || "Refresh failed.",
				false,
			);
			if (!isBackgroundRestore) {
				app.setStatus(
					`Refresh failed: ${result.message || "Connection failed."}`,
					"warn",
				);
			}
			app.refreshWorkingStatus();
			return;
		}

		const loaded = Array.isArray(result.loadedAssets)
			? result.loadedAssets
			: [];
		const refreshedConfig = {
			...(result.source.config || source.config || {}),
		};
		if (source.providerId === "local" && result.source.displayLabel) {
			refreshedConfig.localDirectoryName = result.source.displayLabel;
		}
		const displayLabel =
			result.source.displayLabel ||
			app.sourceDisplayLabelFor(
				source.providerId,
				refreshedConfig,
				source.providerLabel,
			);
		const detailLabel =
			result.source.detailLabel ||
			app.sourceDetailLabelFor(
				source.providerId,
				refreshedConfig,
				source.providerLabel,
			);
		const updatedSource = {
			...source,
			...result.source,
			itemCount: result.source.itemCount ?? loaded.length,
			status: result.source.status || "Connected",
			authMode:
				source.providerId === "s3" ? "access-key" : source.authMode,
			displayLabel,
			detailLabel,
			label: detailLabel,
			config: refreshedConfig,
			collections: source.collections || [],
			selectedCollectionId: source.selectedCollectionId || null,
			lastPublishResult: source.lastPublishResult || null,
		};
		const normalized = app.normalizeSourceAssets(updatedSource, loaded);
		const providerCollections = Array.isArray(
			result.providerResult?.collections,
		)
			? app.normalizeCollectionsFromProvider(
					result.providerResult.collections,
				)
			: null;
		const collections =
			providerCollections ||
			app.buildCollectionsForSource(updatedSource, normalized);
		const assignmentAwareCollections = collections.map((entry) => ({
			...entry,
			connectionId:
				typeof entry.connectionId === "string"
					? entry.connectionId.trim() || updatedSource.id
					: updatedSource.id,
		}));
		const defaultCollectionId = assignmentAwareCollections[0]?.id || null;
		const normalizedWithCollections = normalized.map((item) => ({
			...item,
			collectionId: item.collectionId || defaultCollectionId,
			collectionLabel:
				item.collectionLabel ||
				assignmentAwareCollections.find(
					(entry) =>
						entry.id === (item.collectionId || defaultCollectionId),
				)?.title ||
				"",
		}));
		updatedSource.collections = assignmentAwareCollections;
		updatedSource.selectedCollectionId =
			updatedSource.selectedCollectionId &&
			assignmentAwareCollections.some(
				(entry) => entry.id === updatedSource.selectedCollectionId,
			)
				? updatedSource.selectedCollectionId
				: defaultCollectionId;

		app.state.sources = app.sortSourcesForDisplay(
			app.state.sources.map((entry) =>
				entry.id === sourceId ? updatedSource : entry,
			),
		);
		if (
			source.providerId === "local" &&
			refreshedConfig.localDirectoryHandle?.kind === "directory"
		) {
			app.selectedLocalDirectoryHandle =
				refreshedConfig.localDirectoryHandle;
		}
		app.mergeSourceAssets(sourceId, normalizedWithCollections);
		if (source.providerId === "local") {
			await app.hydrateLocalSourceAssetPreviews(sourceId);
		}

		if (
			app.state.selectedItemId &&
			!app.state.assets.some(
				(item) => item.workspaceId === app.state.selectedItemId,
			)
		) {
			app.state.selectedItemId =
				app.getVisibleAssets()[0]?.workspaceId ||
				app.state.assets[0]?.workspaceId ||
				null;
		}
		if (
			app.state.viewerItemId &&
			!app.state.assets.some(
				(item) => item.workspaceId === app.state.viewerItemId,
			)
		) {
			app.closeViewer();
		} else if (app.state.viewerItemId) {
			app.renderViewer();
		}

		app.setConnectionStatus(
			isBackgroundRestore
				? `Reconnected remembered source ${updatedSource.label}.`
				: `Refreshed storage source ${updatedSource.label}.`,
			true,
		);
		if (!isBackgroundRestore) {
			app.setStatus(
				`Refreshed storage source ${updatedSource.label}.`,
				"ok",
			);
		}
		app.refreshWorkingStatus();
		app.renderSourcesList();
		app.renderSourceFilter();
		app.renderAssets();
		app.renderEditor();
		app.saveSourcesToStorage();
		if (!isBackgroundRestore) {
			app.clearPendingSourceRepair();
		}
	} catch (error) {
		const next = {
			...source,
			status: `Refresh error: ${error.message}`,
			needsReconnect: true,
			needsCredentials:
				Boolean(source.capabilities?.requiresCredentials) &&
				!Boolean(source.capabilities?.hasCredentials),
		};
		app.state.sources = app.sortSourcesForDisplay(
			app.state.sources.map((entry) =>
				entry.id === sourceId ? next : entry,
			),
		);
		app.renderSourcesList();
		app.saveSourcesToStorage();
		app.setConnectionStatus(
			isBackgroundRestore
				? `Background reconnect error: ${error.message}`
				: `Refresh error: ${error.message}`,
			false,
		);
		if (!isBackgroundRestore) {
			app.setStatus(`Refresh error: ${error.message}`, "warn");
		}
		app.refreshWorkingStatus();
		if (!isBackgroundRestore) {
			app.clearPendingSourceRepair();
		}
	}
}

export async function removeSource(app, sourceId) {
	const source = app.getSourceById(sourceId);
	if (!source) {
		return;
	}

	const result = await app.connectionsRuntime.removeSource({
		sourceId,
		sources: app.state.sources,
		activeSourceId: app.state.activeSourceFilter || "all",
	});
	if (!result?.ok) {
		return;
	}
	if (app.pendingSourceRepair?.sourceId === sourceId) {
		app.clearPendingSourceRepair();
	}
	app.state.sources = app.sortSourcesForDisplay(result.sources);
	const wasFilteringRemovedSource =
		(app.state.activeSourceFilter || "all") === sourceId;
	app.state.activeSourceFilter = wasFilteringRemovedSource
		? "all"
		: result.activeSourceId;
	app.state.assets = app.state.assets.filter(
		(entry) => entry.sourceId !== sourceId,
	);
	if (app.state.sources.length === 0) {
		app.closeMobileDetail();
	}

	if (
		app.state.selectedItemId &&
		!app.state.assets.some(
			(item) => item.workspaceId === app.state.selectedItemId,
		)
	) {
		app.state.selectedItemId = null;
	}
	app.state.selectedItemIds = app
		.getSelectedItemIds()
		.filter((workspaceId) =>
			app.state.assets.some((item) => item.workspaceId === workspaceId),
		);
	if (
		app.state.viewerItemId &&
		!app.state.assets.some(
			(item) => item.workspaceId === app.state.viewerItemId,
		)
	) {
		app.closeViewer();
	}
	app.syncMetadataModeFromState();

	if (app.state.sources.length === 0) {
		app.setConnectionStatus("No connections yet.", "neutral");
		app.setStatus("No connections yet.", "neutral");
		app.setWorkingStateFlags({
			hasUnsavedChanges: false,
			lastSaveTarget: "",
			publishError: "",
		});
	} else {
		app.setStatus(`Removed storage source ${source.label}.`, "ok");
		app.refreshWorkingStatus();
	}

	app.state.manifest = null;
	app.dom.manifestPreview.textContent = "{}";
	app.renderSourcesList();
	app.renderSourceFilter();
	app.renderAssets();
	app.renderEditor();
	app.saveSourcesToStorage();
}
