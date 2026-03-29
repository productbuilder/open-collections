import { createLocalProvider } from "../../packages/provider-local/src/index.js";
import { createGithubProvider } from "../../packages/provider-github/src/index.js";
import { createS3Provider } from "../../packages/provider-s3/src/index.js";

function defaultStorage() {
	return typeof globalThis !== "undefined" ? globalThis.localStorage : null;
}

export function serializeLocalDirectoryHandle(handle) {
	if (!handle || handle.kind !== "directory") {
		return null;
	}
	const path = String(handle.path || "").trim();
	if (!path) {
		return null;
	}
	const fallbackName = path.split(/[\\/]/).filter(Boolean).pop() || "";
	return {
		kind: "directory",
		path,
		name: String(handle.name || fallbackName).trim() || fallbackName,
	};
}

export function createDefaultConnectionProviders() {
	return {
		example: createLocalProvider,
		local: createLocalProvider,
		github: createGithubProvider,
		s3: createS3Provider,
	};
}

export function createDefaultConnectionProviderFactories() {
	const providers = createDefaultConnectionProviders();
	return {
		example: providers.example(),
		local: providers.local(),
		github: providers.github(),
		s3: providers.s3(),
	};
}

export function createDefaultConnectionProviderCatalog(
	providerFactories = createDefaultConnectionProviderFactories(),
) {
	return [
		{
			...providerFactories.example.getDescriptor(),
			id: "example",
			category: "example",
			label: "Built-in example collections",
			description:
				"Connect instantly to the built-in example collections from this repository.",
		},
		{
			...providerFactories.local.getDescriptor(),
			category: "local",
			label: "Folder on this device",
			description:
				"Use a folder on this device as a writable local connection (browser support required).",
		},
		{
			...providerFactories.github.getDescriptor(),
			id: "github",
			category: "remote",
			remoteSubtype: "git",
			label: "GitHub",
			description: "Connect a GitHub repository for managed collections.",
		},
		{
			id: "gitlab",
			category: "remote",
			remoteSubtype: "git",
			label: "GitLab",
			enabled: false,
			statusLabel: "Coming soon",
			description:
				"GitLab repository connections are planned but not yet available in this MVP.",
		},
		{
			id: "gitea",
			category: "remote",
			remoteSubtype: "git",
			label: "Gitea",
			enabled: false,
			statusLabel: "Coming soon",
			description:
				"Gitea repository connections are planned but not yet available in this MVP.",
		},
		{
			...providerFactories.s3.getDescriptor(),
			id: "s3",
			category: "remote",
			remoteSubtype: "s3",
			label: "S3-compatible storage",
			statusLabel: "Foundation",
			description:
				"Configure an S3-compatible object storage connection as a publish target in a local-first workflow.",
		},
		{
			id: "custom-domain",
			category: "remote",
			remoteSubtype: "domain",
			label: "Custom domain",
			enabled: false,
			statusLabel: "Planned",
			description: "Connect a custom-hosted manifest endpoint.",
		},
	];
}

export function sourceDisplayLabelFor(providerId, config, fallbackLabel) {
	if (providerId === "github") {
		return (config.repo || "").trim() || "GitHub";
	}
	if (providerId === "example") {
		return "Example collections";
	}
	if (providerId === "s3") {
		return (config.bucket || "").trim() || "S3-compatible storage";
	}
	if (providerId === "local") {
		return (
			(config.localDirectoryName || "").trim() ||
			(config.path || "").trim() ||
			"Folder on this device"
		);
	}
	return fallbackLabel || "Connection";
}

export function sourceDetailLabelFor(
	providerId,
	config,
	fallbackLabel,
	defaultManifestPath,
) {
	if (providerId === "github") {
		const owner = (config.owner || "").trim();
		const repo = (config.repo || "").trim();
		const path = (config.path || "").trim();
		const branch = (config.branch || "main").trim() || "main";
		const base = owner && repo ? `${owner}/${repo}` : fallbackLabel;
		const scope = path || "/";
		return `${base} @ ${branch}:${scope}`;
	}
	if (providerId === "example") {
		return defaultManifestPath;
	}
	if (providerId === "s3") {
		const endpoint = (config.endpoint || "").trim();
		const bucket = (config.bucket || "").trim();
		const basePath = (config.basePath || "").trim();
		const region = (config.region || "").trim();
		const base = endpoint || "S3 endpoint";
		const bucketPart = bucket ? `/${bucket}` : "";
		const prefixPart = basePath ? `/${basePath.replace(/^\/+/, "")}` : "";
		const regionPart = region ? ` (${region})` : "";
		return `${base}${bucketPart}${prefixPart}${regionPart}`;
	}
	if (providerId === "local") {
		return (config.path || "").trim() || "Folder on this device";
	}
	return fallbackLabel || "Connection";
}

export function sanitizeConnectionConfig(
	providerId,
	config = {},
	defaultManifestPath,
) {
	if (providerId === "github") {
		return {
			owner: (config.owner || "").trim(),
			repo: (config.repo || "").trim(),
			branch: (config.branch || "main").trim() || "main",
			path: (config.path || "").trim(),
		};
	}
	if (providerId === "s3") {
		return {
			endpoint: (config.endpoint || "").trim(),
			bucket: (config.bucket || "").trim(),
			region: (config.region || "").trim(),
			basePath: (config.basePath || "").trim(),
		};
	}
	if (providerId === "example") {
		return {
			path: defaultManifestPath,
			localDirectoryName: "",
		};
	}
	if (providerId === "local") {
		const serializedHandle = serializeLocalDirectoryHandle(
			config.localDirectoryHandle,
		);
		return {
			path: (config.path || "").trim() || defaultManifestPath,
			localDirectoryName: (config.localDirectoryName || "").trim(),
			...(serializedHandle
				? { localDirectoryHandle: serializedHandle }
				: {}),
		};
	}
	return {};
}

export function sourceIdentityKey(source, defaultManifestPath) {
	if (!source) {
		return "";
	}
	const providerId = source.providerId || "unknown";
	const sanitized = sanitizeConnectionConfig(
		providerId,
		source.config || {},
		defaultManifestPath,
	);
	return `${providerId}:${JSON.stringify(sanitized)}`;
}

export function uniqueConnectionsForDisplay(sources = [], defaultManifestPath) {
	const result = [];
	const seen = new Set();
	for (const source of sources) {
		const key = sourceIdentityKey(source, defaultManifestPath);
		if (seen.has(key)) {
			continue;
		}
		seen.add(key);
		result.push(source);
	}
	return result;
}

export function toPersistedConnection(source, defaultManifestPath) {
	const isBuiltInExample =
		source.providerId === "example" && source.isBuiltIn !== false;
	const isEnabled =
		typeof source.enabled === "boolean" ? source.enabled : true;
	return {
		id: source.id,
		providerId: source.providerId,
		providerLabel: source.providerLabel,
		displayLabel: source.displayLabel,
		detailLabel: source.detailLabel,
		label: source.label,
		config: sanitizeConnectionConfig(
			source.providerId,
			source.config || {},
			defaultManifestPath,
		),
		capabilities: source.capabilities || {},
		authMode: source.authMode || "public",
		itemCount: source.itemCount || 0,
		status: source.status || "",
		needsReconnect: Boolean(source.needsReconnect),
		needsCredentials: Boolean(source.needsCredentials),
		enabled: isEnabled,
		isBuiltIn: Boolean(source.isBuiltIn),
		isRemovable:
			typeof source.isRemovable === "boolean"
				? source.isRemovable
				: !isBuiltInExample,
	};
}

export function createConnectionsRuntime(options = {}) {
	const {
		defaultManifestPath,
		storageKey,
		providers = createDefaultConnectionProviders(),
		providerFactories = createDefaultConnectionProviderFactories(),
		providerCatalog = createDefaultConnectionProviderCatalog(
			providerFactories,
		),
		credentialStore,
		makeConnectionId,
		storage = defaultStorage(),
	} = options;

	function readRemembered() {
		if (!storageKey || !storage) {
			return [];
		}
		try {
			const parsed = JSON.parse(storage.getItem(storageKey) || "[]");
			return Array.isArray(parsed) ? parsed : [];
		} catch (_error) {
			return [];
		}
	}

	return {
		providers,
		providerFactories,
		providerCatalog,
		collectProviderConfig(
			providerId,
			rawConfig = {},
			selectedLocalDirectoryHandle = null,
		) {
			const config = { ...rawConfig };
			if (providerId === "local") {
				config.localDirectoryName = (
					config.localDirectoryName || ""
				).trim();
				const selectedHandle =
					selectedLocalDirectoryHandle &&
					selectedLocalDirectoryHandle.kind === "directory"
						? selectedLocalDirectoryHandle
						: null;
				if (selectedHandle) {
					config.localDirectoryHandle = selectedHandle;
					const path = String(selectedHandle.path || "").trim();
					if (path) {
						config.path = path;
					}
					if (!config.localDirectoryName) {
						config.localDirectoryName = String(
							selectedHandle.name || "",
						).trim();
					}
				}
				config.path = (config.path || "").trim() || defaultManifestPath;
			}
			if (providerId === "example") {
				config.path = defaultManifestPath;
			}
			if (providerId === "github") {
				return {
					token: String(config.token || ""),
					owner: String(config.owner || "").trim(),
					repo: String(config.repo || "").trim(),
					branch: String(config.branch || "main").trim() || "main",
					path: String(config.path || "").trim(),
				};
			}
			if (providerId === "s3") {
				return {
					endpoint: String(config.endpoint || "").trim(),
					bucket: String(config.bucket || "").trim(),
					region: String(config.region || "").trim(),
					basePath: String(config.basePath || "").trim(),
					accessKey: String(config.accessKey || "").trim(),
					secretKey: String(config.secretKey || ""),
				};
			}
			return config;
		},
		async connectSource({
			providerId,
			config,
			pendingRepairSource = null,
			sources = [],
		}) {
			const providerFactory = providers[providerId];
			const providerMeta = providerCatalog.find(
				(entry) => entry.id === providerId,
			);
			if (!providerFactory || providerMeta?.enabled === false) {
				return {
					ok: false,
					message: "Selected connection type is not available yet.",
				};
			}
			if (providerId === "local" && !config.localDirectoryHandle) {
				return { ok: false, message: "Select a local folder first." };
			}
			const provider = providerFactory();
			const result = await provider.connect(config);
			if (!result.ok) {
				return {
					ok: false,
					message: result.message || "Connection failed.",
				};
			}
			const loaded = await provider.listAssets();
			const displayLabel =
				result.sourceDisplayLabel ||
				sourceDisplayLabelFor(
					providerId,
					config,
					providerMeta?.label || providerId,
				);
			const detailLabel =
				result.sourceDetailLabel ||
				sourceDetailLabelFor(
					providerId,
					config,
					providerMeta?.label || providerId,
					defaultManifestPath,
				);

			const draftSource = {
				id: pendingRepairSource?.id || makeConnectionId(providerId),
				providerId,
				providerLabel: providerMeta?.label || providerId,
				label: detailLabel,
				displayLabel,
				detailLabel,
				config: { ...config },
				capabilities: provider.getCapabilities(),
				status: result.message || "Connected",
				authMode:
					providerId === "github"
						? (config.token || "").trim()
							? "token"
							: "public"
						: providerId === "local"
							? "local-folder"
							: providerId === "s3"
								? "access-key"
								: providerId,
				itemCount: Array.isArray(loaded) ? loaded.length : 0,
				provider,
				needsReconnect: false,
				needsCredentials: false,
				enabled: true,
				isBuiltIn: providerId === "example",
				isRemovable: providerId !== "example",
			};

			const duplicate = !pendingRepairSource
				? sources.find(
						(entry) =>
							sourceIdentityKey(entry, defaultManifestPath) ===
							sourceIdentityKey(draftSource, defaultManifestPath),
					)
				: null;
			const target = duplicate || pendingRepairSource;
			const source = { ...draftSource, id: target?.id || draftSource.id };

			if (
				(providerId === "github" || providerId === "s3") &&
				credentialStore
			) {
				await credentialStore.storeSourceSecret(source, config);
			}

			const nextSources = target
				? sources.map((entry) =>
						entry.id === target.id ? source : entry,
					)
				: [...sources, source];

			return {
				ok: true,
				source,
				sources: nextSources,
				target,
				loadedAssets: Array.isArray(loaded) ? loaded : [],
				providerResult: result,
			};
		},
		async refreshSource({
			source,
			sources = [],
			configOverrides = {},
			pendingSourceRepair = null,
			selectedLocalDirectoryHandle = null,
		}) {
			const providerFactory = providers[source.providerId];
			if (!providerFactory) {
				return {
					ok: false,
					message: `Connection type for ${source.displayLabel || source.id} is unavailable.`,
				};
			}
			const provider = providerFactory();
			let refreshConfig = {
				...(source.config || {}),
				...(configOverrides || {}),
			};

			if (
				source.providerId === "github" &&
				!(refreshConfig.token || "").trim() &&
				credentialStore
			) {
				refreshConfig = await credentialStore.loadSourceSecret(
					source,
					refreshConfig,
				);
			}
			if (
				source.providerId === "s3" &&
				(!(refreshConfig.accessKey || "").trim() ||
					!(refreshConfig.secretKey || "").trim()) &&
				credentialStore
			) {
				refreshConfig = await credentialStore.loadSourceSecret(
					source,
					refreshConfig,
				);
			}
			if (source.providerId === "local") {
				const explicitHandle = configOverrides?.localDirectoryHandle;
				const repairHandle =
					pendingSourceRepair?.sourceId === source.id
						? selectedLocalDirectoryHandle
						: null;
				const handle =
					explicitHandle ||
					refreshConfig.localDirectoryHandle ||
					repairHandle;
				if (handle) {
					refreshConfig.localDirectoryHandle = handle;
					if (!refreshConfig.localDirectoryName) {
						refreshConfig.localDirectoryName =
							handle.name ||
							refreshConfig.localDirectoryName ||
							"";
					}
				}
			}

			const result = await provider.connect(refreshConfig);
			if (!result.ok) {
				const failed = {
					...source,
					status: result.message,
					needsReconnect: true,
					needsCredentials:
						Boolean(result.capabilities?.requiresCredentials) &&
						!Boolean(result.capabilities?.hasCredentials),
				};
				return {
					ok: false,
					message: result.message || "Refresh failed.",
					sources: sources.map((entry) =>
						entry.id === source.id ? failed : entry,
					),
				};
			}

			const loaded = await provider.listAssets();
			const updated = {
				...source,
				provider,
				config: refreshConfig,
				itemCount: Array.isArray(loaded) ? loaded.length : 0,
				status: result.message || "Connected",
				displayLabel:
					result.sourceDisplayLabel ||
					sourceDisplayLabelFor(
						source.providerId,
						refreshConfig,
						source.providerLabel,
					),
				detailLabel:
					result.sourceDetailLabel ||
					sourceDetailLabelFor(
						source.providerId,
						refreshConfig,
						source.providerLabel,
						defaultManifestPath,
					),
				needsReconnect: false,
				needsCredentials: false,
				capabilities: provider.getCapabilities(),
			};

			return {
				ok: true,
				source: updated,
				sources: sources.map((entry) =>
					entry.id === source.id ? updated : entry,
				),
				loadedAssets: Array.isArray(loaded) ? loaded : [],
				providerResult: result,
			};
		},
		async removeSource({
			sourceId,
			sources = [],
			activeSourceId = "all",
			selectedSourceFilterId,
		}) {
			const source = sources.find((entry) => entry.id === sourceId);
			if (!source) {
				return { ok: false, message: "" };
			}
			if (source.isBuiltIn || source.isRemovable === false) {
				return {
					ok: false,
					message: "Built-in connections cannot be removed.",
				};
			}
			await credentialStore?.deleteSourceSecret(source).catch(() => {});
			const nextSources = sources.filter(
				(entry) => entry.id !== sourceId,
			);
			const currentFilterId = selectedSourceFilterId || activeSourceId;
			const nextFilterId =
				currentFilterId === sourceId
					? nextSources[0]?.id || "all"
					: currentFilterId;
			return {
				ok: true,
				removedSource: source,
				sources: nextSources,
				// Keep legacy and clearer filter naming side by side during migration.
				activeSourceId: nextFilterId,
				selectedSourceFilterId: nextFilterId,
			};
		},
		setSourceEnabled({
			sourceId,
			enabled,
			sources = [],
			activeSourceId = "all",
			selectedSourceFilterId,
		}) {
			const source = sources.find((entry) => entry.id === sourceId);
			if (!source) {
				return { ok: false, message: "Connection not found." };
			}
			const nextEnabled = Boolean(enabled);
			const updatedSource = {
				...source,
				enabled: nextEnabled,
				status: nextEnabled
					? source.status || "Connected"
					: "Disabled by user.",
			};
			const nextSources = sources.map((entry) =>
				entry.id === sourceId ? updatedSource : entry,
			);
			const currentFilterId = selectedSourceFilterId || activeSourceId;
			const nextFilterId =
				currentFilterId === sourceId && !nextEnabled
					? nextSources.find((entry) => entry.id !== sourceId)?.id || "all"
					: currentFilterId;
			return {
				ok: true,
				source: updatedSource,
				sources: nextSources,
				activeSourceId: nextFilterId,
				selectedSourceFilterId: nextFilterId,
			};
		},
		persistSources(sources = []) {
			if (!storageKey || !storage) {
				return;
			}
			const payload = sources.map((source) =>
				toPersistedConnection(source, defaultManifestPath),
			);
			try {
				storage.setItem(storageKey, JSON.stringify(payload));
			} catch (_error) {
				// Ignore localStorage failures in private/restricted runtime modes.
			}
		},
		restoreRememberedSources() {
			const remembered = readRemembered();
			return remembered
				.filter(
					(entry) =>
						entry && typeof entry === "object" && entry.providerId,
				)
				.map((entry) => ({
					id:
						entry.id ||
						makeConnectionId(entry.providerId || "source"),
					providerId: entry.providerId,
					providerLabel:
						entry.providerLabel ||
						providerCatalog.find(
							(provider) => provider.id === entry.providerId,
						)?.label ||
						"Connection",
					displayLabel:
						entry.displayLabel || entry.label || "Connection",
					detailLabel:
						entry.detailLabel || entry.label || "Connection",
					label:
						entry.label ||
						entry.detailLabel ||
						entry.displayLabel ||
						"Connection",
					config: sanitizeConnectionConfig(
						entry.providerId,
						entry.config || {},
						defaultManifestPath,
					),
					capabilities:
						entry.capabilities ||
						providerFactories[
							entry.providerId
						]?.getCapabilities?.() ||
						{},
					authMode: entry.authMode || "public",
					itemCount: Number(entry.itemCount) || 0,
					status: "Remembered connection. Refresh to reconnect.",
					needsReconnect: true,
					needsCredentials: Boolean(entry.needsCredentials),
					provider: null,
						enabled:
							typeof entry.enabled === "boolean"
								? entry.enabled
								: true,
					isBuiltIn:
						typeof entry.isBuiltIn === "boolean"
							? entry.isBuiltIn
							: entry.providerId === "example",
					isRemovable:
						typeof entry.isRemovable === "boolean"
							? entry.isRemovable
							: entry.providerId !== "example",
				}));
		},
	};
}
