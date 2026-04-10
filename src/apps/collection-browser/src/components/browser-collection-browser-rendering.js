function toText(value) {
	return String(value ?? "").trim();
}

export function getEntityRenderKey(entity = {}) {
	const browseKind = toText(entity?.browseKind) || "item";
	const actionValue = toText(entity?.actionValue);
	const manifestUrl = toText(entity?.manifestUrl);
	const entityId = toText(entity?.id);
	return `${browseKind}:${actionValue || manifestUrl || entityId}`;
}

export function normalizeSourceCardPreviewRows(previewRows = []) {
	const rows = Array.isArray(previewRows) ? previewRows.slice(0, 3) : [];
	return rows.map((row) => {
		if (Array.isArray(row)) {
			return row.filter(Boolean).slice(0, 3);
		}
		if (row && typeof row === "object" && Array.isArray(row.images)) {
			return row.images.filter(Boolean).slice(0, 3);
		}
		return [];
	});
}

export function computeAllModePatchPlan({
	previousSessionKey = "",
	nextSessionKey = "",
	previousEntities = [],
	nextEntities = [],
} = {}) {
	const previousKeys = Array.isArray(previousEntities)
		? previousEntities.map((entity) => getEntityRenderKey(entity))
		: [];
	const nextList = Array.isArray(nextEntities) ? nextEntities : [];
	const nextKeys = nextList.map((entity) => getEntityRenderKey(entity));
	const sameSession =
		toText(previousSessionKey) &&
		toText(previousSessionKey) === toText(nextSessionKey);

	if (!sameSession) {
		return {
			mode: "reset",
			appendEntities: [...nextList],
			preserveCount: 0,
		};
	}

	if (nextKeys.length < previousKeys.length) {
		return {
			mode: "reset",
			appendEntities: [...nextList],
			preserveCount: 0,
		};
	}

	for (let index = 0; index < previousKeys.length; index += 1) {
		if (previousKeys[index] !== nextKeys[index]) {
			return {
				mode: "reset",
				appendEntities: [...nextList],
				preserveCount: 0,
			};
		}
	}

	return {
		mode: nextKeys.length === previousKeys.length ? "preserve" : "append",
		appendEntities: nextList.slice(previousKeys.length),
		preserveCount: previousKeys.length,
	};
}
