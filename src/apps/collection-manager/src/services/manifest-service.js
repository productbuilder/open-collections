import {
	normalizeMediaRef,
	validateCollectionShape,
} from "../../../../packages/collector-schema/src/schema.js";
import { resolveItemMetadata } from "../utils/metadata-inheritance.js";

export function toManifestItem(manager, item) {
	const collection =
		manager.findCollectionMetaById(item?.collectionId, item?.sourceId) ||
		{};
	const resolvedItem = resolveItemMetadata(item, collection);
	const {
		workspaceId,
		sourceId,
		sourceLabel,
		sourceDisplayLabel,
		providerId,
		sourceAssetId,
		collectionId,
		collectionLabel,
		previewUrl,
		thumbnailPreviewUrl,
		fileName,
		thumbnailFileName,
		thumbnailRepoPath,
		isLocalDraftAsset,
		draftUploadStatus,
		uploadError,
		localFileRef,
		localThumbnailRef,
		metadataResolution,
		overrides,
		...manifestItem
	} = resolvedItem;
	return {
		...manifestItem,
		media: normalizeMediaRef(manifestItem.media),
	};
}

export function isItemPublishable(manager, item, context = {}) {
	if (!item || item.include === false) {
		return false;
	}
	if (!String(item.media?.url || "").trim()) {
		return false;
	}

	const candidate = toManifestItem(manager, item);
	const collectionMeta =
		context.collectionMeta || manager.currentCollectionMeta();
	const probeManifest = {
		id: collectionMeta.id || "draft-collection",
		title: collectionMeta.title || "Draft collection",
		description: collectionMeta.description || "",
		items: [candidate],
	};
	const validationErrors = validateCollectionShape(probeManifest);
	return validationErrors.length === 0;
}

export function buildManifestFromState(manager) {
	const baseFromCurrent =
		manager.state.manifest && typeof manager.state.manifest === "object"
			? JSON.parse(JSON.stringify(manager.state.manifest))
			: {};
	const collectionMeta = manager.currentCollectionMeta();
	const selectedSourceId = manager.state.activeSourceFilter || "all";
	const selectedCollectionId = manager.state.selectedCollectionId || "all";
	const excludedByPublishRules = { count: 0 };
	const includedItems = manager.state.assets
		.filter((item) =>
			selectedSourceId === "all"
				? true
				: item.sourceId === selectedSourceId,
		)
		.filter((item) =>
			selectedCollectionId === "all"
				? true
				: item.collectionId === selectedCollectionId,
		)
		.filter((item) => {
			const publishable = isItemPublishable(manager, item, {
				collectionMeta,
			});
			if (!publishable) {
				excludedByPublishRules.count += 1;
			}
			return publishable;
		})
		.map((item) => toManifestItem(manager, item));
	if (excludedByPublishRules.count > 0) {
		manager.setStatus(
			`${excludedByPublishRules.count} item(s) excluded from publish due to missing media or required fields.`,
			"warn",
		);
	}
	return {
		...baseFromCurrent,
		...collectionMeta,
		items: includedItems,
	};
}

export async function generateManifest(manager, options = {}) {
	const collectionMeta = manager.currentCollectionMeta();
	if (!collectionMeta.id || !collectionMeta.title) {
		manager.setStatus(
			"Create or complete collection metadata before generating a manifest.",
			"warn",
		);
		return null;
	}
	if ((manager.state.selectedCollectionId || "all") === "all") {
		manager.setStatus(
			"Select one collection before generating a manifest.",
			"warn",
		);
		return null;
	}

	try {
		const manifest = buildManifestFromState(manager);
		const errors = validateCollectionShape(manifest);
		if (errors.length > 0) {
			manager.setStatus(
				`Manifest validation failed: ${errors.join(" ")}`,
				"warn",
			);
			return null;
		}

		manager.state.manifest = manifest;
		manager.dom.manifestPreview.textContent = JSON.stringify(
			manifest,
			null,
			2,
		);
		if (!options.silent) {
			manager.setStatus("Manifest generated and validated.", "ok");
		}
		if (manager.state.opfsAvailable) {
			manager.persistWorkspaceToOpfs().catch(() => {});
		}
		return manifest;
	} catch (error) {
		manager.setStatus(
			`Manifest generation failed: ${error.message}`,
			"warn",
		);
		return null;
	}
}

export async function copyManifestToClipboard(manager) {
	if (!manager.state.manifest) {
		manager.setStatus("Generate manifest before copying.", "warn");
		return;
	}

	try {
		await navigator.clipboard.writeText(
			JSON.stringify(manager.state.manifest, null, 2),
		);
		manager.setStatus("Manifest copied to clipboard.", "ok");
	} catch (error) {
		manager.setStatus(`Clipboard copy failed: ${error.message}`, "warn");
	}
}

export function downloadManifest(manager) {
	if (!manager.state.manifest) {
		manager.setStatus("Generate manifest before download.", "warn");
		return;
	}

	const blob = new Blob([JSON.stringify(manager.state.manifest, null, 2)], {
		type: "application/json",
	});

	const url = URL.createObjectURL(blob);
	const anchor = document.createElement("a");
	anchor.href = url;
	anchor.download = "collection.json";
	anchor.click();
	URL.revokeObjectURL(url);

	manager.setStatus("Downloaded collection.json.", "ok");
}
