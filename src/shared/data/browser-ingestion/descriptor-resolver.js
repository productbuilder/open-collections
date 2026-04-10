import { normalizeText, toAbsoluteUrl } from "./url-utils.js";

function toCollectionRefId(value, fallback) {
	const text = normalizeText(value);
	return text || fallback;
}

function parseCatalogCollectionRefs(catalogJson, catalogUrl) {
	const collections = Array.isArray(catalogJson?.collections)
		? catalogJson.collections
		: [];
	const refs = [];
	for (let index = 0; index < collections.length; index += 1) {
		const entry = collections[index];
		if (!entry || typeof entry !== "object") {
			continue;
		}
		const manifestPath = normalizeText(entry.manifest || entry.url);
		if (!manifestPath) {
			continue;
		}
		const manifestUrl = toAbsoluteUrl(manifestPath, catalogUrl);
		refs.push({
			collectionRefId: toCollectionRefId(entry.id, `collection-${index + 1}`),
			manifestUrl,
			label: normalizeText(entry.label || entry.title),
			description: normalizeText(entry.description),
			raw: { ...entry },
		});
	}
	return refs;
}

export async function resolveSourceDescriptor(
	registrationEntry,
	{ repository, diagnostics = null } = {},
) {
	const sourceId = registrationEntry.sourceId;
	const sourceType = registrationEntry.sourceType;
	const sourceUrl = registrationEntry.entryUrl;

	if (sourceType === "collection.json") {
		return {
			sourceId,
			sourceType,
			sourceUrl,
			directCollection: {
				collectionRefId: "direct-collection",
				manifestUrl: sourceUrl,
				label: registrationEntry.label,
				description: "",
				raw: {},
			},
		};
	}

	const catalogJson = await repository.fetchJson(sourceUrl);
	const collectionRefs = parseCatalogCollectionRefs(catalogJson, sourceUrl);
	if (!collectionRefs.length) {
		diagnostics?.addWarning({
			code: "empty_source_catalog",
			message: "Source catalog has no collection references.",
			context: { sourceId, sourceUrl },
		});
	}
	return {
		sourceId,
		sourceType,
		sourceUrl,
		catalog: {
			title: normalizeText(catalogJson?.title),
			organizationName: normalizeText(
				catalogJson?.organizationName || registrationEntry.display?.organizationName,
			),
			curatorName: normalizeText(
				catalogJson?.curatorName || registrationEntry.display?.curatorName,
			),
			placeName: normalizeText(
				catalogJson?.placeName || registrationEntry.display?.placeName,
			),
			countryName: normalizeText(
				catalogJson?.countryName || registrationEntry.display?.countryName,
			),
			countryCode: normalizeText(
				catalogJson?.countryCode || registrationEntry.display?.countryCode,
			),
			collections: collectionRefs,
			raw: catalogJson && typeof catalogJson === "object" ? { ...catalogJson } : {},
		},
	};
}

export function listDescriptorCollectionRefs(descriptor) {
	if (!descriptor || typeof descriptor !== "object") {
		return [];
	}
	if (descriptor.sourceType === "collection.json" && descriptor.directCollection) {
		return [descriptor.directCollection];
	}
	if (descriptor.sourceType === "source.json") {
		return Array.isArray(descriptor.catalog?.collections) ? descriptor.catalog.collections : [];
	}
	return [];
}

