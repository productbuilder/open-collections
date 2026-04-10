function toText(value) {
	return String(value ?? "").trim();
}

export function toAbsoluteUrl(url, baseUrl) {
	const raw = toText(url);
	if (!raw) {
		throw new Error("URL is required.");
	}
	return new URL(raw, baseUrl).href;
}

export function toPriority(value, fallback = 100) {
	const number = Number(value);
	if (!Number.isFinite(number)) {
		return fallback;
	}
	return Math.floor(number);
}

export function normalizeIdToken(value, fallback = "") {
	const token = toText(value)
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
	return token || fallback;
}

export function normalizeText(value) {
	return toText(value);
}
