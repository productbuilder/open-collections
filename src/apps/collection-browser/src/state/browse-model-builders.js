function deriveItemPreviewUrl(item) {
	return String(item?.media?.thumbnailUrl || item?.media?.url || "").trim();
}

function derivePreviewImages(items = [], max = 3) {
	const previews = [];
	const list = Array.isArray(items) ? items : [];
	for (const item of list) {
		const previewUrl = deriveItemPreviewUrl(item);
		if (!previewUrl) {
			continue;
		}
		previews.push(previewUrl);
		if (previews.length >= max) {
			break;
		}
	}
	return previews;
}

export function buildSourceBrowseCardModels(
	sourceEntries = [],
	{ activeSourceId = "" } = {},
) {
	const list = Array.isArray(sourceEntries)
		? sourceEntries.filter((entry) => entry && typeof entry === "object")
		: [];
	return list.map((entry) => ({
		browseKind: "source",
		id: String(entry.id || ""),
		title: entry.label || "Source",
		subtitle: entry.subtitle || "Source",
		countLabel: entry.countLabel || "",
		previewRows: Array.isArray(entry.previewRows)
			? entry.previewRows
			: [],
		previewImages: Array.isArray(entry.previewImages)
			? entry.previewImages
			: [],
		actionLabel: "Browse",
		actionValue: String(entry.id || ""),
		active: String(activeSourceId || "") === String(entry.id || ""),
		sourceType: entry.sourceType || "",
	}));
}

export function buildCollectionBrowseCardModels(
	collections = [],
	{ selectedManifestUrl = "" } = {},
) {
	const list = Array.isArray(collections)
		? collections.filter((entry) => entry && typeof entry === "object")
		: [];
	return list.map((entry, index) => {
		const itemCount = entry.collection?.items?.length || 0;
		const manifestUrl = String(entry.manifestUrl || "").trim();
		return {
			browseKind: "collection",
			id: String(entry.id || `collection-${index + 1}`),
			title: entry.label || "Collection",
			subtitle: entry.description || "Select to browse this collection.",
			countLabel: `${itemCount} item${itemCount === 1 ? "" : "s"}`,
			previewImages: derivePreviewImages(entry.collection?.items || [], 3),
			actionLabel: "Open",
			actionValue: manifestUrl,
			active:
				Boolean(selectedManifestUrl) &&
				String(selectedManifestUrl) === manifestUrl,
			manifestUrl,
			sourceId: entry.sourceId || "",
			sourceLabel: entry.sourceLabel || "",
			collection: entry.collection || null,
		};
	});
}

export function buildItemBrowseCardModels(
	items = [],
	{ selectedItemId = null } = {},
) {
	const list = Array.isArray(items) ? items : [];
	return list.map((item, index) => {
		const resolvedId = String(item?.id || `item-${index + 1}`);
		const previewUrl = deriveItemPreviewUrl(item);
		const mediaType = String(item?.media?.type || "").toLowerCase();
		return {
			browseKind: "item",
			id: resolvedId,
			title: item?.title || resolvedId,
			subtitle: item?.license
				? `License: ${item.license}`
				: "License not set",
			previewUrl,
			mediaType,
			actionValue: resolvedId,
			active: selectedItemId === resolvedId,
			item,
		};
	});
}

export function buildAllBrowseEntities({
	sourceCards = [],
	collectionCards = [],
	itemCards = [],
} = {}) {
	const sources = Array.isArray(sourceCards) ? sourceCards : [];
	const collections = Array.isArray(collectionCards) ? collectionCards : [];
	const items = Array.isArray(itemCards) ? itemCards : [];
	return [...sources, ...collections, ...items];
}
