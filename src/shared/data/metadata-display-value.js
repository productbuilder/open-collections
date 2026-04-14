function normalizeText(value) {
	return String(value ?? "").trim();
}

export function toMetadataDisplayValue(value) {
	if (typeof value === "string" || typeof value === "number") {
		return normalizeText(value);
	}
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		return "";
	}
	if (Object.hasOwn(value, "label")) {
		return toMetadataDisplayValue(value.label);
	}
	if (Object.hasOwn(value, "value")) {
		return toMetadataDisplayValue(value.value);
	}
	return "";
}
