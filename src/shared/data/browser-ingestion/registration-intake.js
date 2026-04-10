import { normalizeText, toAbsoluteUrl, toPriority } from "./url-utils.js";

export function intakeRegistrations(
	registrationEntries = [],
	{ baseUrl = "http://localhost/", diagnostics = null } = {},
) {
	const entries = Array.isArray(registrationEntries) ? registrationEntries : [];
	const normalizedEntries = [];
	for (let index = 0; index < entries.length; index += 1) {
		const entry = entries[index];
		if (!entry || typeof entry !== "object") {
			diagnostics?.addWarning({
				code: "invalid_registration_entry",
				message: "Registration entry is not an object.",
				context: { index },
			});
			continue;
		}
		const sourceId = normalizeText(entry.sourceId);
		const label = normalizeText(entry.label);
		const sourceType = normalizeText(entry.sourceType);
		const enabled = entry.enabled !== false;
		const priority = toPriority(entry.priority, 100);
		if (!enabled) {
			diagnostics?.increment("skippedDisabledEntries", 1);
			continue;
		}
		if (!sourceId || !label || !sourceType || !entry.entryUrl) {
			diagnostics?.addFailure({
				code: "invalid_registration_fields",
				message: "Required registration fields are missing.",
				context: { sourceId, index },
			});
			continue;
		}
		if (sourceType !== "source.json" && sourceType !== "collection.json") {
			diagnostics?.addFailure({
				code: "invalid_source_type",
				message: `Unsupported sourceType: ${sourceType}`,
				context: { sourceId, sourceType, index },
			});
			continue;
		}
		let entryUrl = "";
		try {
			entryUrl = toAbsoluteUrl(entry.entryUrl, baseUrl);
		} catch (error) {
			diagnostics?.addFailure({
				code: "invalid_entry_url",
				message: error?.message || "Invalid entry URL.",
				context: { sourceId, entryUrl: entry.entryUrl, index },
			});
			continue;
		}
		normalizedEntries.push({
			sourceId,
			label,
			sourceType,
			entryUrl,
			priority,
			options:
				entry.options && typeof entry.options === "object" ? { ...entry.options } : {},
			meta: entry.meta && typeof entry.meta === "object" ? { ...entry.meta } : {},
			display: {
				organizationName: normalizeText(entry.organizationName),
				curatorName: normalizeText(entry.curatorName),
				placeName: normalizeText(entry.placeName),
				countryName: normalizeText(entry.countryName),
				countryCode: normalizeText(entry.countryCode),
			},
		});
	}

	normalizedEntries.sort((left, right) => {
		if (left.priority !== right.priority) {
			return left.priority - right.priority;
		}
		return left.sourceId.localeCompare(right.sourceId);
	});

	const seenSourceIds = new Set();
	const accepted = [];
	for (const entry of normalizedEntries) {
		if (seenSourceIds.has(entry.sourceId)) {
			diagnostics?.addFailure({
				code: "duplicate_source_id",
				message: `Duplicate sourceId: ${entry.sourceId}`,
				context: { sourceId: entry.sourceId },
			});
			continue;
		}
		seenSourceIds.add(entry.sourceId);
		accepted.push(entry);
	}

	return accepted;
}

