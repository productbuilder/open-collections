function asArray(value) {
	return Array.isArray(value) ? value : [];
}

function resolveManifestRelativeUrl(value, manifestUrl) {
	const raw = String(value || "").trim();
	if (!raw) {
		return "";
	}
	const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(raw);
	if (hasScheme || !manifestUrl) {
		return raw;
	}
	try {
		return new URL(raw, manifestUrl).href;
	} catch {
		return raw;
	}
}

export function cloneValue(value) {
	return JSON.parse(JSON.stringify(value));
}

export function normalizeCollection(collection, options = {}) {
	if (!collection || typeof collection !== "object") {
		throw new Error("Collection payload must be an object.");
	}
	const manifestUrl = String(options?.manifestUrl || "").trim();

	const items = asArray(collection.items).map((item, index) => {
		const media = item && typeof item.media === "object" ? item.media : {};
		const mediaUrl = resolveManifestRelativeUrl(media.url || "", manifestUrl);
		const thumbnailUrl = resolveManifestRelativeUrl(
			media.thumbnailUrl || media.url || "",
			manifestUrl,
		);
		const extraFields =
			item && typeof item === "object"
				? Object.fromEntries(
						Object.entries(item).filter(
							([key]) =>
								![
									"id",
									"title",
									"description",
									"creator",
									"date",
									"location",
									"license",
									"attribution",
									"source",
									"tags",
									"include",
									"media",
								].includes(key),
						),
					)
				: {};
		return {
			...extraFields,
			id: item?.id || `item_${index + 1}`,
			title: item?.title || `Item ${index + 1}`,
			description: item?.description || "",
			creator: item?.creator || "",
			date: item?.date || "",
			location: item?.location || "",
			license: item?.license || "",
			attribution: item?.attribution || "",
			source: item?.source || "",
			tags: Array.isArray(item?.tags) ? item.tags : [],
			include: item?.include !== false,
			media: {
				type: media.type || "image",
				url: mediaUrl,
				thumbnailUrl: thumbnailUrl,
			},
		};
	});

	return {
		id: collection.id || "collection",
		title: collection.title || "Collection",
		description: collection.description || "",
		items,
	};
}
