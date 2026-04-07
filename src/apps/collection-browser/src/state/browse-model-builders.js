function deriveItemPreviewUrl(item) {
	return String(item?.media?.thumbnailUrl || item?.media?.url || "").trim();
}

function derivePreviewImages(items = [], max = Number.POSITIVE_INFINITY) {
	const previews = [];
	const list = Array.isArray(items) ? items : [];
	const maxCount = Number.isFinite(Number(max))
		? Math.max(0, Number(max))
		: Number.POSITIVE_INFINITY;
	for (const item of list) {
		const previewUrl = deriveItemPreviewUrl(item);
		if (!previewUrl) {
			continue;
		}
		previews.push(previewUrl);
		if (previews.length >= maxCount) {
			break;
		}
	}
	return previews;
}

function cleanShortText(value, maxLength = 110) {
	const text = String(value || "").replace(/\s+/g, " ").trim();
	if (!text) {
		return "";
	}
	return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

function deriveItemSubtitle(item) {
	const directSubtitle = cleanShortText(item?.subtitle || item?.subTitle || "");
	if (directSubtitle) {
		return directSubtitle;
	}
	const description = cleanShortText(item?.description || "", 140);
	if (description) {
		return description;
	}
	const date = cleanShortText(item?.date || item?.created || item?.year || "", 60);
	return date || "";
}

export function buildSourceBrowseCardModels(
	sourceEntries = [],
	{ activeSourceId = "", useActiveState = false } = {},
) {
	const list = Array.isArray(sourceEntries)
		? sourceEntries.filter((entry) => entry && typeof entry === "object")
		: [];
	return list.map((entry) => ({
		browseKind: "source",
		id: String(entry.id || ""),
		title: entry.label || "Source",
		organizationName: entry.organizationName || entry.label || "Source",
		curatorName: entry.curatorName || "",
		placeName: entry.placeName || "",
		countryName: entry.countryName || "",
		countryCode: entry.countryCode || "",
		descriptor: "Source",
		subtitle: entry.subtitle || "",
		countLabel: entry.countLabel || "",
		previewRows: Array.isArray(entry.previewRows)
			? entry.previewRows
			: [],
		previewImages: Array.isArray(entry.previewImages)
			? entry.previewImages
			: [],
		actionLabel: "Open source",
		actionValue: String(entry.id || ""),
		active:
			useActiveState &&
			String(activeSourceId || "") === String(entry.id || ""),
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
			previewImages: derivePreviewImages(entry.collection?.items || []),
			actionLabel: "Open collection",
			actionValue: manifestUrl,
			active:
				Boolean(selectedManifestUrl) &&
				String(selectedManifestUrl) === manifestUrl,
			manifestUrl,
			sourceId: entry.sourceId || "",
			sourceLabel: entry.sourceLabel || "",
			sourceTitle: entry.sourceTitle || "",
			sourceDisplayName: entry.sourceDisplayName || "",
			sourceOrganizationName: entry.sourceOrganizationName || "",
			sourceCuratorName: entry.sourceCuratorName || "",
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
		const itemTileVariant = (index + 1) % 9 === 0 ? "1x2" : "";
		return {
			browseKind: "item",
			id: resolvedId,
			title: item?.title || resolvedId,
			subtitle: deriveItemSubtitle(item),
			previewUrl,
			mediaType,
			actionLabel: "View item",
			actionValue: resolvedId,
			itemTileVariant,
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
