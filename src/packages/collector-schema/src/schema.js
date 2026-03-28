// Runtime schema helpers for TimeMap Collector MVP.

const REQUIRED_COLLECTION_FIELDS = ["id", "title", "description", "items"];
const REQUIRED_ITEM_FIELDS = ["id", "title", "media", "license"];
export const MEDIA_MODES = {
	managed: "managed",
	referenced: "referenced",
};

export { REQUIRED_COLLECTION_FIELDS, REQUIRED_ITEM_FIELDS };

export function isObject(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function validateCollectionShape(collection) {
	const errors = [];

	if (!isObject(collection)) {
		errors.push("Collection must be an object.");
		return errors;
	}

	for (const field of REQUIRED_COLLECTION_FIELDS) {
		if (!(field in collection)) {
			errors.push(`Missing collection field: ${field}`);
		}
	}

	if (!Array.isArray(collection.items)) {
		errors.push("Collection.items must be an array.");
		return errors;
	}

	collection.items.forEach((item, index) => {
		if (!isObject(item)) {
			errors.push(`Item at index ${index} must be an object.`);
			return;
		}

		for (const field of REQUIRED_ITEM_FIELDS) {
			if (!(field in item)) {
				errors.push(`Item ${index} missing field: ${field}`);
			}
		}

		if (item.media && !isObject(item.media)) {
			errors.push(`Item ${index} field media must be an object.`);
		}

		if (
			isObject(item.media) &&
			item.media.mode &&
			!Object.values(MEDIA_MODES).includes(item.media.mode)
		) {
			errors.push(
				`Item ${index} field media.mode must be one of: ${Object.values(MEDIA_MODES).join(", ")}.`,
			);
		}

		if (item.tags && !Array.isArray(item.tags)) {
			errors.push(`Item ${index} field tags must be an array.`);
		}
	});

	return errors;
}

export function isAbsoluteUrl(value) {
	const raw = String(value || "").trim();
	return /^[a-z][a-z0-9+.-]*:/i.test(raw) || raw.startsWith("//");
}

export function inferMediaMode(media = {}) {
	const explicitMode = String(media?.mode || "")
		.trim()
		.toLowerCase();
	if (
		explicitMode === MEDIA_MODES.managed ||
		explicitMode === MEDIA_MODES.referenced
	) {
		return explicitMode;
	}

	// Backward-compatible default:
	// - absolute URLs are treated as externally referenced
	// - relative/workspace paths stay collection-managed
	const mediaUrl = String(media?.url || "").trim();
	const thumbnailUrl = String(media?.thumbnailUrl || "").trim();
	if (isAbsoluteUrl(mediaUrl) || isAbsoluteUrl(thumbnailUrl)) {
		return MEDIA_MODES.referenced;
	}

	return MEDIA_MODES.managed;
}

export function normalizeMediaRef(media = {}) {
	const next = isObject(media) ? { ...media } : {};
	next.mode = inferMediaMode(next);
	return next;
}

export function createManifest(collection, items) {
	return {
		id: collection.id,
		title: collection.title,
		description: collection.description,
		items: Array.isArray(items)
			? items.map((item) => ({
					...item,
					media: normalizeMediaRef(item?.media),
				}))
			: [],
	};
}
