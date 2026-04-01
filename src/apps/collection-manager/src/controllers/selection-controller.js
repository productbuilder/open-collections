import { resolveItemPreviewUrl } from "../utils/preview-utils.js";

function mergeCollectionEntry(entry, sourceId = "") {
	if (!entry || typeof entry !== "object") {
		return null;
	}
	const id = typeof entry.id === "string" ? entry.id.trim() : "";
	if (!id) {
		return null;
	}
	return {
		...entry,
		id,
		sourceId:
			typeof entry.sourceId === "string" && entry.sourceId.trim()
				? entry.sourceId
				: sourceId || "",
		// Incremental assignment seam:
		// - explicit collection-level connectionId when available
		// - legacy fallback to sourceId for source-derived collections
		// - null for intentionally unassigned local drafts
		connectionId:
			typeof entry.connectionId === "string"
				? entry.connectionId.trim() || null
				: sourceId || null,
	};
}

function collectAllAvailableCollections(app) {
	const byId = new Map();
	for (const source of app.state.sources) {
		for (const collection of source.collections || []) {
			const normalized = mergeCollectionEntry(collection, source.id);
			if (!normalized) {
				continue;
			}
			const existing = byId.get(normalized.id);
			if (!existing) {
				byId.set(normalized.id, normalized);
				continue;
			}
			byId.set(normalized.id, {
				...existing,
				...normalized,
				sourceId: existing.sourceId || normalized.sourceId,
			});
		}
	}
	for (const localDraft of app.state.localDraftCollections || []) {
		const normalized = mergeCollectionEntry(localDraft);
		if (!normalized) {
			continue;
		}
		const existing = byId.get(normalized.id);
		if (existing) {
			byId.set(normalized.id, {
				...existing,
				...normalized,
				sourceId: existing.sourceId || "",
			});
			continue;
		}
		byId.set(normalized.id, normalized);
	}
	return [...byId.values()];
}

function assignedConnectionLabel(app, connectionId = "") {
	const normalizedConnectionId = String(connectionId || "").trim();
	if (!normalizedConnectionId) {
		return "";
	}
	const source = app.getSourceById(normalizedConnectionId);
	if (!source) {
		return normalizedConnectionId;
	}
	return (
		source.displayLabel ||
		source.label ||
		source.providerLabel ||
		normalizedConnectionId
	);
}

function withAssignmentDisplay(app, collection) {
	if (!collection || typeof collection !== "object") {
		return collection;
	}
	const explicitConnectionId = String(collection.connectionId || "").trim();
	const fallbackSourceId = String(collection.sourceId || "").trim();
	const resolvedConnectionId = explicitConnectionId || fallbackSourceId;
	if (resolvedConnectionId) {
		return {
			...collection,
			connectionId: resolvedConnectionId,
			assignmentState: "assigned",
			assignmentLabel: `Assigned to ${assignedConnectionLabel(
				app,
				resolvedConnectionId,
			)}`,
		};
	}
	return {
		...collection,
		connectionId: null,
		assignmentState: "unassigned",
		assignmentLabel: "Unassigned draft",
	};
}

export function getVisibleAssets(app) {
	let visible = app.state.assets;
	if (app.state.activeSourceFilter !== "all") {
		visible = visible.filter(
			(item) => item.sourceId === app.state.activeSourceFilter,
		);
	}
	if (app.state.selectedCollectionId !== "all") {
		visible = visible.filter(
			(item) => item.collectionId === app.state.selectedCollectionId,
		);
	}
	return visible;
}

export function getSelectedItemIds(app) {
	return Array.isArray(app.state.selectedItemIds)
		? app.state.selectedItemIds
		: [];
}

export function getVisibleCollections(app) {
	if (app.state.activeSourceFilter !== "all") {
		const source = app.getSourceById(app.state.activeSourceFilter);
		const collections = Array.isArray(source?.collections)
			? source.collections
			: [];
		return collections.map((collection) => withAssignmentDisplay(app, collection));
	}
	return collectAllAvailableCollections(app).map((collection) =>
		withAssignmentDisplay(app, collection),
	);
}

export function getSelectedCollectionIds(app) {
	return Array.isArray(app.state.selectedCollectionIds)
		? app.state.selectedCollectionIds
		: [];
}

export function repairCollectionSelectionState(app) {
	const visibleCollectionIds = new Set(
		getVisibleCollections(app)
			.map((collection) => collection?.id)
			.filter((id) => typeof id === "string" && id.length > 0),
	);
	app.state.selectedCollectionIds = getSelectedCollectionIds(app).filter(
		(collectionId) => visibleCollectionIds.has(collectionId),
	);
	return app.state.selectedCollectionIds;
}

export function repairSelectionState(app) {
	const existingIds = new Set(
		app.state.assets.map((item) => item.workspaceId),
	);
	let allowedIds = existingIds;
	if (app.state.currentLevel === "items" && app.state.openedCollectionId) {
		allowedIds = new Set(
			app.state.assets
				.filter(
					(item) =>
						item.collectionId === app.state.openedCollectionId,
				)
				.map((item) => item.workspaceId),
		);
	}

	app.state.selectedItemIds = getSelectedItemIds(app).filter(
		(workspaceId) =>
			existingIds.has(workspaceId) && allowedIds.has(workspaceId),
	);
	return app.state.selectedItemIds;
}

export function isItemSelected(app, itemId) {
	return getSelectedItemIds(app).includes(itemId);
}

export function toggleItemSelection(app, itemId, selected = null) {
	if (!itemId) {
		return getSelectedItemIds(app);
	}
	const current = new Set(repairSelectionState(app));
	const shouldSelect =
		selected == null ? !current.has(itemId) : Boolean(selected);
	if (shouldSelect) {
		current.add(itemId);
	} else {
		current.delete(itemId);
	}
	app.state.selectedItemIds = [...current];
	app.renderAssets();
	app.renderEditor();
	if (app.state.opfsAvailable) {
		app.persistWorkspaceToOpfs().catch(() => {});
	}
	return app.state.selectedItemIds;
}

export function clearItemSelection(app) {
	app.state.selectedItemIds = [];
	app.renderAssets();
	app.renderEditor();
	if (app.state.opfsAvailable) {
		app.persistWorkspaceToOpfs().catch(() => {});
	}
}

export function toggleCollectionSelection(app, collectionId, selected = null) {
	if (!collectionId || collectionId === "all") {
		return getSelectedCollectionIds(app);
	}
	const current = new Set(repairCollectionSelectionState(app));
	const shouldSelect =
		selected == null ? !current.has(collectionId) : Boolean(selected);
	if (shouldSelect) {
		current.add(collectionId);
	} else {
		current.delete(collectionId);
	}
	app.state.selectedCollectionIds = [...current];
	app.renderAssets();
	app.renderEditor();
	if (app.state.opfsAvailable) {
		app.persistWorkspaceToOpfs().catch(() => {});
	}
	return app.state.selectedCollectionIds;
}

export function clearCollectionSelection(app) {
	app.state.selectedCollectionIds = [];
	app.renderAssets();
	app.renderEditor();
	if (app.state.opfsAvailable) {
		app.persistWorkspaceToOpfs().catch(() => {});
	}
}

export function openViewer(app, itemId) {
	const item = app.state.assets.find((entry) => entry.workspaceId === itemId);
	if (!item) {
		return;
	}

	app.state.viewerItemId = itemId;
	if (app.state.selectedItemId !== itemId) {
		app.state.selectedItemId = itemId;
		app.syncMetadataModeFromState();
		app.renderAssets();
		app.renderEditor();
		if (app.isMobileViewport()) {
			app.openMobileDetail();
		}
	}

	app.renderViewer();
	app.dom.assetViewer?.open();
}

export function closeViewer(app) {
	app.state.viewerItemId = null;
	app.dom.assetViewer?.clear();
	app.dom.assetViewer?.close();
}

export function renderViewer(app) {
	const item = app.state.assets.find(
		(entry) => entry.workspaceId === app.state.viewerItemId,
	);
	if (!item) {
		app.closeViewer();
		return;
	}
	app.dom.assetViewer?.setItem(app.resolveItemForDisplay(item), (entry) =>
		app.formatSourceBadge(entry),
	);
}

export function renderAssets(app) {
	repairCollectionSelectionState(app);
	repairSelectionState(app);
	app.renderSourceContext();

	const activeLevel =
		app.state.currentLevel === "items" ? "items" : "collections";
	const activeViewMode = app.state.browserViewModes?.[activeLevel] || "cards";
	app.applyInspectorModeForViewMode(activeViewMode);

	if (app.state.currentLevel === "collections") {
		const collections = app.getVisibleCollections();
		const collectionsWithPreview = collections.map((collection) => {
			const collectionAssets = (app.state.assets || []).filter(
				(item) => item?.collectionId === collection.id,
			);
			const previewImages = collectionAssets
				.map((item) => resolveItemPreviewUrl(app.resolveItemForDisplay(item)))
				.filter(Boolean)
				.slice(0, 6);
			return {
				...collection,
				countLabel: `${collectionAssets.length} item${collectionAssets.length === 1 ? "" : "s"}`,
				previewImages,
			};
		});
		const sourceCards = (app.state.sources || []).map((source) => {
			const sourceCollections = Array.isArray(source?.collections)
				? source.collections
				: [];
			const sourceAssets = (app.state.assets || []).filter(
				(item) => item?.sourceId === source.id,
			);
			const previewImages = sourceAssets
				.map((item) => resolveItemPreviewUrl(app.resolveItemForDisplay(item)))
				.filter(Boolean)
				.slice(0, 12);
			return {
				id: source.id,
				title:
					source.displayLabel ||
					source.label ||
					source.providerLabel ||
					source.id,
				subtitle: source.kindLabel || source.providerLabel || "Source",
				countLabel: `${sourceCollections.length} collection${sourceCollections.length === 1 ? "" : "s"} · ${sourceAssets.length} item${sourceAssets.length === 1 ? "" : "s"}`,
				previewImages,
				active:
					source.id === app.state.activeSourceFilter &&
					app.state.activeSourceFilter !== "all",
			};
		});
		const availableConnections = (app.state.sources || [])
			.filter((source) => source && source.enabled !== false)
			.map((source) => ({
				id: source.id,
				label:
					source.displayLabel ||
					source.label ||
					source.providerLabel ||
					source.id,
			}));

		const browserState = {
			currentLevel: "collections",
			viewportTitle: "Collections",
			assetCountText: `${collections.length} collections`,
			collections: collectionsWithPreview,
			items: [],
			selectedCollectionId: app.state.selectedCollectionId,
			selectedCollectionIds: app.state.selectedCollectionIds,
			deletableSelectedCollectionCount:
				app.getDeletableSelectedCollectionIds().length,
			focusedItemId: null,
			selectedItemIds: [],
			openedCollectionId: app.state.openedCollectionId,
			viewModes: app.state.browserViewModes,
			managerMode: app.state.managerBrowseMode || "sources",
			onboarding: {
				visible:
					app.state.sources.length === 0 && collectionsWithPreview.length === 0,
			},
			sourceCards,
			availableConnections,
			connectionActionLabel: app.browserConnectionActionLabel(),
			isLoading: app.state.assetSurfaceLoading === true,
		};
		app.dom.collectionBrowser.update(browserState);
		app.dom.mobileFlow?.setBrowserState(browserState);
		return;
	}

	const visibleAssets = app
		.getVisibleAssets()
		.filter((item) => item.collectionId === app.state.openedCollectionId)
		.map((item) => app.resolveItemForDisplay(item));
	const collection = app.findSelectedCollectionMeta();
	const browserState = {
		currentLevel: "items",
		viewportTitle:
			collection?.title || app.state.openedCollectionId || "Collection",
		assetCountText: `${visibleAssets.length} items`,
		collections: [],
		items: visibleAssets,
		selectedCollectionId: app.state.selectedCollectionId,
		focusedItemId: app.state.selectedItemId,
		selectedItemIds: app.state.selectedItemIds,
		viewModes: app.state.browserViewModes,
		managerMode: "items",
		sourceCards: [],
		openedCollectionId: app.state.openedCollectionId,
		connectionActionLabel: app.browserConnectionActionLabel(),
		isLoading: app.state.assetSurfaceLoading === true,
	};
	app.dom.collectionBrowser.update(browserState);
	app.dom.mobileFlow?.setBrowserState(browserState);
}

export function selectItem(app, itemId) {
	if (app.state.selectedItemId === itemId) {
		if (app.isMobileViewport()) {
			app.openMobileDetail();
		}
		return;
	}

	app.state.selectedItemId = itemId;
	app.syncMetadataModeFromState();
	app.renderAssets();
	app.renderEditor();
	if (app.isMobileViewport()) {
		app.openMobileDetail();
	}
	if (app.state.opfsAvailable) {
		app.persistWorkspaceToOpfs().catch(() => {});
	}
}

export function findSelectedItem(app) {
	return (
		app.state.assets.find(
			(item) => item.workspaceId === app.state.selectedItemId,
		) || null
	);
}

export function resolveMetadataMode(app) {
	repairSelectionState(app);
	if (app.state.currentLevel === "collections") {
		app.state.selectedItemId = null;
		const selectedCollection = app.findSelectedCollectionMeta();
		return selectedCollection ? "collection" : "none";
	}

	if (app.state.currentLevel === "items") {
		if (!app.state.openedCollectionId) {
			app.state.selectedItemId = null;
			return "none";
		}
		const visibleItems = app
			.getVisibleAssets()
			.filter(
				(item) => item.collectionId === app.state.openedCollectionId,
			);
		const hasSelectedItem = visibleItems.some(
			(item) => item.workspaceId === app.state.selectedItemId,
		);
		if (!hasSelectedItem) {
			app.state.selectedItemId = null;
		}
		return hasSelectedItem ? "item" : "none";
	}

	app.state.selectedItemId = null;
	return "none";
}

export function syncMetadataModeFromState(app) {
	const mode = app.resolveMetadataMode();
	app.state.metadataMode = mode;
	return mode;
}

export function renderMetadataMode(app, mode) {
	app.state.metadataMode = mode;
	app.renderEditor();
}

export function setBrowserViewMode(app, level, mode) {
	const normalizedLevel = level === "items" ? "items" : "collections";
	const normalizedMode = mode === "rows" ? "rows" : "cards";
	app.state.browserViewModes = {
		...app.state.browserViewModes,
		[normalizedLevel]: normalizedMode,
	};
	const activeLevel =
		app.state.currentLevel === "items" ? "items" : "collections";
	if (normalizedLevel === activeLevel) {
		app.applyInspectorModeForViewMode(normalizedMode);
	}
}

export function renderEditor(app) {
	const metadataMode = app.syncMetadataModeFromState();
	if (metadataMode === "collection") {
		const collection = app.findSelectedCollectionMeta();
		app.dom.metadataEditor.setView({
			mode: "collection",
			collection,
		});
		app.dom.mobileFlow?.setDetailState({
			mode: "none",
			item: null,
			canSaveItem: false,
			canDeleteItem: false,
		});
		app.syncResponsivePanels();
		return;
	}

	if (metadataMode === "item") {
		const selected = app.findSelectedItem();
		const selectedSource = selected
			? app.getSourceById(selected.sourceId)
			: null;
		const canSave = Boolean(selectedSource?.capabilities?.canSaveMetadata);
		const detailItem = selected
			? app.deriveItemEditorState(selected)
			: null;
		app.dom.metadataEditor.setView({
			mode: "item",
			item: detailItem,
			canSaveItem: canSave,
			canDeleteItem: Boolean(selected),
		});
		app.dom.mobileFlow?.setDetailState({
			mode: "item",
			item: detailItem,
			canSaveItem: canSave,
			canDeleteItem: Boolean(selected),
		});
		app.syncResponsivePanels();
		return;
	}

	app.dom.metadataEditor.setView({ mode: "none" });
	app.dom.mobileFlow?.setDetailState({
		mode: "none",
		item: null,
		canSaveItem: false,
		canDeleteItem: false,
	});
	app.syncResponsivePanels();
}
