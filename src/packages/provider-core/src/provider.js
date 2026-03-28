export const PROVIDER_AVAILABILITY = {
	available: "available",
	planned: "planned",
	experimental: "experimental",
};

export const READ_ONLY_CAPABILITIES = {
	canListAssets: true,
	canGetAsset: true,
	canSaveMetadata: false,
	canExportCollection: true,
	canRead: true,
	canWrite: false,
	canPublish: false,
	canStoreAssets: false,
	canStoreManifest: false,
	requiresCredentials: false,
	supportsReconnect: true,
	supportsPull: true,
	supportsPush: false,
};

export const READ_WRITE_CAPABILITIES = {
	canListAssets: true,
	canGetAsset: true,
	canSaveMetadata: true,
	canExportCollection: true,
	canRead: true,
	canWrite: true,
	canPublish: false,
	canStoreAssets: false,
	canStoreManifest: true,
	requiresCredentials: false,
	supportsReconnect: true,
	supportsPull: true,
	supportsPush: true,
};

export function createProviderDescriptor(definition) {
	return {
		id: definition.id,
		label: definition.label,
		category: definition.category || "external",
		availability:
			definition.availability || PROVIDER_AVAILABILITY.available,
		statusLabel: definition.statusLabel || "Available",
		description: definition.description || "",
		capabilities: definition.capabilities || READ_ONLY_CAPABILITIES,
		enabled: definition.enabled !== false,
		isPlaceholder: definition.isPlaceholder === true,
	};
}

export function cloneItem(item) {
	return JSON.parse(JSON.stringify(item));
}

export function mergeItem(item, patch) {
	return {
		...item,
		...patch,
		tags: Array.isArray(patch.tags) ? patch.tags : item.tags,
		media: {
			...(item.media || {}),
			...(patch.media || {}),
		},
	};
}

export function providerNotConnectedError(id) {
	return new Error(`Provider ${id} is not connected.`);
}
