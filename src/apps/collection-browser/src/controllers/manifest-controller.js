import {
	persistLocalStateStringSoon,
	readLocalStorageString,
	mirrorNativePreferencesToLocalStorage,
} from "../../../../shared/platform/mobile-persistence.js";

const RECENT_MANIFEST_STORAGE_KEY =
	"open-collections-browser:recent-manifest-urls:v1";
const MAX_RECENT_MANIFEST_URLS = 8;
const EMBEDDED_SOURCE_TYPE_COLLECTION = "collection.json";
const EMBEDDED_SOURCE_TYPE_COLLECTIONS = "collections.json";

export function readRecentManifestUrls() {
	try {
		const raw = readLocalStorageString(RECENT_MANIFEST_STORAGE_KEY, "[]");
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed)) {
			return [];
		}
		return parsed
			.map((value) => normalizePersistedManifestUrl(value))
			.filter(Boolean)
			.slice(0, MAX_RECENT_MANIFEST_URLS);
	} catch {
		return [];
	}
}

export function writeRecentManifestUrls(app, urls) {
	app.state.recentManifestUrls = urls;
	try {
		persistLocalStateStringSoon(
			RECENT_MANIFEST_STORAGE_KEY,
			JSON.stringify(urls),
		);
	} catch {
		// Ignore storage failures and keep in-memory state for this session.
	}
}

export function normalizePersistedManifestUrl(manifestUrl) {
	const trimmed = String(manifestUrl || "").trim();
	if (!trimmed) {
		return "";
	}

	try {
		const resolvedUrl = new URL(trimmed, window.location.href);
		const protocol = resolvedUrl.protocol.toLowerCase();
		if (!["http:", "https:"].includes(protocol)) {
			return "";
		}
		if (resolvedUrl.username || resolvedUrl.password) {
			return "";
		}
		const sensitiveParamNames = new Set([
			"access_token",
			"auth",
			"key",
			"secret",
			"sig",
			"signature",
			"token",
			"x-amz-signature",
		]);
		const hasSensitiveParams = Array.from(
			resolvedUrl.searchParams.keys(),
		).some((name) =>
			sensitiveParamNames.has(String(name || "").toLowerCase()),
		);
		if (hasSensitiveParams) {
			return "";
		}
		return resolvedUrl.href;
	} catch {
		return "";
	}
}

export function rememberRecentManifestUrl(app, manifestUrl) {
	const normalizedUrl = normalizePersistedManifestUrl(manifestUrl);
	if (!normalizedUrl) {
		return;
	}
	const nextUrls = [
		normalizedUrl,
		...app.state.recentManifestUrls.filter((url) => url !== normalizedUrl),
	].slice(0, MAX_RECENT_MANIFEST_URLS);
	writeRecentManifestUrls(app, nextUrls);
}

export function clearRecentManifestUrls(app) {
	writeRecentManifestUrls(app, []);
}

export function resolveStartupManifestUrl(app, fallbackUrl) {
	const attrStartupUrl =
		app.getAttribute("startup-manifest-url") ||
		app.dataset.startupManifestUrl ||
		"";
	const queryStartupUrl =
		new URLSearchParams(window.location.search).get("manifest") || "";
	const rememberedRecentUrl = app.state.recentManifestUrls[0] || "";
	return (
		attrStartupUrl.trim() ||
		queryStartupUrl.trim() ||
		rememberedRecentUrl ||
		fallbackUrl
	);
}

export function announceManifestUrl(app, manifestUrl) {
	app.dispatchEvent(
		new CustomEvent("browser-manifest-url-change", {
			detail: { manifestUrl },
			bubbles: true,
			composed: true,
		}),
	);
}

export async function hydrateRecentManifestUrls(app) {
	await mirrorNativePreferencesToLocalStorage([RECENT_MANIFEST_STORAGE_KEY]);
	const hydrated = readRecentManifestUrls();
	if (!Array.isArray(hydrated)) {
		return;
	}
	app.state.recentManifestUrls = hydrated;
}

function normalizeEmbeddedSourceType(value) {
	const sourceType = String(value || "").trim().toLowerCase();
	return sourceType === EMBEDDED_SOURCE_TYPE_COLLECTIONS
		? EMBEDDED_SOURCE_TYPE_COLLECTIONS
		: EMBEDDED_SOURCE_TYPE_COLLECTION;
}

function normalizeEmbeddedSourceUrl(value) {
	return String(value || "").trim();
}

export function normalizeEmbeddedSourceCatalog(entries = []) {
	if (!Array.isArray(entries)) {
		return [];
	}

	const normalized = [];
	for (let index = 0; index < entries.length; index += 1) {
		const entry = entries[index];
		if (!entry || typeof entry !== "object") {
			continue;
		}
		const sourceUrl = normalizeEmbeddedSourceUrl(entry.sourceUrl || entry.url);
		if (!sourceUrl) {
			continue;
		}
		const id = String(entry.id || `source-${index + 1}`).trim();
		const sourceType = normalizeEmbeddedSourceType(entry.sourceType || entry.type);
		const label = String(
			entry.label ||
				entry.title ||
				(sourceType === EMBEDDED_SOURCE_TYPE_COLLECTIONS
					? "Collections source"
					: "Collection source"),
		).trim();
		normalized.push({
			id: id || `source-${index + 1}`,
			label: label || `Source ${index + 1}`,
			sourceType,
			sourceUrl,
		});
	}
	return normalized;
}

function parseCollectionsIndexEntries(payload, baseUrl) {
	const collectionEntries = Array.isArray(payload?.collections)
		? payload.collections
		: [];
	const parsed = [];
	for (let index = 0; index < collectionEntries.length; index += 1) {
		const entry = collectionEntries[index];
		if (!entry || typeof entry !== "object") {
			continue;
		}
		const manifestPath = String(entry.manifest || entry.url || "").trim();
		if (!manifestPath) {
			continue;
		}
		const manifestUrl = new URL(manifestPath, baseUrl).href;
		const id = String(entry.id || `collection-${index + 1}`).trim();
		const label = String(
			entry.title || entry.label || entry.id || `Collection ${index + 1}`,
		).trim();
		const description = String(entry.description || "").trim();
		parsed.push({
			id: id || `collection-${index + 1}`,
			label: label || `Collection ${index + 1}`,
			description,
			manifestUrl,
		});
	}
	return parsed;
}

export async function resolveEmbeddedSourceDescriptor(source) {
	if (!source || typeof source !== "object") {
		throw new Error("Embedded source entry is invalid.");
	}

	const sourceType = normalizeEmbeddedSourceType(source.sourceType);
	const sourceUrl = normalizeEmbeddedSourceUrl(source.sourceUrl);
	if (!sourceUrl) {
		throw new Error("Embedded source entry is missing sourceUrl.");
	}
	const sourceCatalogUrl = new URL(sourceUrl, window.location.href);

	if (sourceType === EMBEDDED_SOURCE_TYPE_COLLECTION) {
		return {
			sourceType,
			sourceUrl: sourceCatalogUrl.href,
			manifestUrl: sourceCatalogUrl.href,
			collections: [],
		};
	}

	const response = await fetch(sourceCatalogUrl.href);
	if (!response.ok) {
		throw new Error(`Could not load source catalog (${response.status}).`);
	}

	const json = await response.json();
	const collections = parseCollectionsIndexEntries(json, sourceCatalogUrl);
	if (!collections.length) {
		throw new Error("Source catalog does not contain a collection manifest.");
	}

	return {
		sourceType,
		sourceUrl: sourceCatalogUrl.href,
		manifestUrl: "",
		collections,
	};
}

export async function resolveCatalogSourceManifestUrl(source) {
	const descriptor = await resolveEmbeddedSourceDescriptor(source);
	if (descriptor.sourceType === EMBEDDED_SOURCE_TYPE_COLLECTION) {
		return descriptor.manifestUrl;
	}
	return descriptor.collections[0]?.manifestUrl || "";
}
