export const COLLECTION_METADATA_DEFAULT_FIELDS = [
	"title",
	"description",
	"license",
	"publisher",
	"language",
];
export const ITEM_OVERRIDE_FIELDS = [
	"description",
	"license",
	"attribution",
	"language",
];

function hasOwn(object, key) {
	return Object.prototype.hasOwnProperty.call(object || {}, key);
}

function normalizeText(value) {
	if (value == null) {
		return "";
	}
	return String(value).trim();
}

export function resolveCollectionDefaults(collection = {}) {
	return COLLECTION_METADATA_DEFAULT_FIELDS.reduce((accumulator, field) => {
		accumulator[field] = normalizeText(collection?.[field]);
		return accumulator;
	}, {});
}

export function getItemRawValue(item = {}, field) {
	if (field === "tags") {
		return Array.isArray(item.tags) ? [...item.tags] : [];
	}
	if (field === "include") {
		return item.include !== false;
	}
	if (field === "media.type") {
		return normalizeText(item?.media?.type);
	}
	return normalizeText(item?.[field]);
}

export function getExplicitItemOverride(item = {}, collection = {}, field) {
	const overrides =
		item?.overrides && typeof item.overrides === "object"
			? item.overrides
			: {};
	if (hasOwn(overrides, field)) {
		return {
			active: true,
			value: normalizeText(overrides[field]),
			source: "override",
		};
	}

	const rawValue = getItemRawValue(item, field);
	const collectionValue = normalizeText(collection?.[field]);
	if (rawValue && collectionValue && rawValue !== collectionValue) {
		return {
			active: true,
			value: rawValue,
			source: "legacy-raw",
		};
	}

	return {
		active: false,
		value: "",
		source: "",
	};
}

export function isFieldInherited(item = {}, collection = {}, field) {
	return !getExplicitItemOverride(item, collection, field).active;
}

export function resolveItemMetadata(item = {}, collection = {}) {
	const defaults = resolveCollectionDefaults(collection);
	const resolved = {
		...item,
		overrides:
			item?.overrides && typeof item.overrides === "object"
				? { ...item.overrides }
				: {},
		metadataResolution: {},
	};

	for (const field of ITEM_OVERRIDE_FIELDS) {
		const explicitOverride = getExplicitItemOverride(item, defaults, field);
		const rawValue = getItemRawValue(item, field);
		const inheritedValue = defaults[field];
		const resolvedValue = explicitOverride.active
			? explicitOverride.value
			: inheritedValue || rawValue || "";

		resolved[field] = resolvedValue;
		resolved.metadataResolution[field] = {
			resolvedValue,
			inheritedValue,
			rawValue,
			overrideActive: explicitOverride.active,
			overrideValue: explicitOverride.active
				? explicitOverride.value
				: "",
			isInherited: !explicitOverride.active && Boolean(inheritedValue),
			source: explicitOverride.active
				? explicitOverride.source
				: inheritedValue
					? "collection"
					: rawValue
						? "item"
						: "empty",
		};
	}

	return resolved;
}

export function deriveItemEditorState(item = {}, collection = {}) {
	const resolvedItem = resolveItemMetadata(item, collection);

	return {
		...resolvedItem,
		itemSpecific: {
			title: normalizeText(item?.title),
			creator: normalizeText(item?.creator),
			date: normalizeText(item?.date),
			location: normalizeText(item?.location),
			source: normalizeText(item?.source),
			tags: Array.isArray(item?.tags) ? [...item.tags] : [],
			include: item?.include !== false,
			mediaType: normalizeText(item?.media?.type),
		},
		overrideFields: ITEM_OVERRIDE_FIELDS.reduce((accumulator, field) => {
			const resolution = resolvedItem.metadataResolution[field] || {};
			accumulator[field] = {
				field,
				resolvedValue: resolution.resolvedValue || "",
				inheritedValue: resolution.inheritedValue || "",
				overrideActive: Boolean(resolution.overrideActive),
				overrideValue: resolution.overrideActive
					? resolution.overrideValue || ""
					: "",
				isInherited: Boolean(resolution.isInherited),
				source: resolution.source || "empty",
			};
			return accumulator;
		}, {}),
	};
}

export function clearItemOverride(item = {}, field) {
	const nextOverrides =
		item?.overrides && typeof item.overrides === "object"
			? { ...item.overrides }
			: {};
	delete nextOverrides[field];
	return nextOverrides;
}

export function getItemOverridePatch(
	editorState = {},
	collection = {},
	previousItem = {},
) {
	const nextOverrides =
		previousItem?.overrides && typeof previousItem.overrides === "object"
			? { ...previousItem.overrides }
			: {};

	for (const field of ITEM_OVERRIDE_FIELDS) {
		if (editorState?.overrideStates?.[field]) {
			nextOverrides[field] = normalizeText(
				editorState?.overrides?.[field],
			);
		} else {
			delete nextOverrides[field];
		}
	}

	return {
		title: normalizeText(editorState?.title),
		creator: normalizeText(editorState?.creator),
		date: normalizeText(editorState?.date),
		location: normalizeText(editorState?.location),
		source: normalizeText(editorState?.source),
		tags: Array.isArray(editorState?.tags)
			? editorState.tags.map((tag) => normalizeText(tag)).filter(Boolean)
			: [],
		include: editorState?.include !== false,
		media: {
			type: normalizeText(editorState?.mediaType),
		},
		description: "",
		license: "",
		attribution: "",
		language: "",
		overrides: nextOverrides,
	};
}

export function getResolvedManifestItem(item = {}, collection = {}) {
	const resolvedItem = resolveItemMetadata(item, collection);
	const overrides =
		resolvedItem.overrides && typeof resolvedItem.overrides === "object"
			? resolvedItem.overrides
			: {};
	const { metadataResolution, ...rest } = resolvedItem;

	return {
		...rest,
		description: resolvedItem.description || "",
		license: resolvedItem.license || "",
		attribution: resolvedItem.attribution || "",
		language: resolvedItem.language || "",
		...(Object.keys(overrides).length > 0
			? { overrides: { ...overrides } }
			: {}),
	};
}
