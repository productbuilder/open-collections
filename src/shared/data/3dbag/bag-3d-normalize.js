function toFeatureCollection(payload) {
	if (payload?.type === "FeatureCollection" && Array.isArray(payload.features)) {
		return payload;
	}
	if (Array.isArray(payload?.features)) {
		return { type: "FeatureCollection", features: payload.features };
	}
	if (Array.isArray(payload?.items)) {
		return { type: "FeatureCollection", features: payload.items };
	}
	return { type: "FeatureCollection", features: [] };
}

function normalizeBagPandId(feature = {}) {
	const props = feature.properties || {};
	return (
		props.bag_pand_id ||
		props.identificatie ||
		props.identification ||
		feature.id ||
		null
	);
}

export function normalizeBagPandFeatures(payload) {
	const collection = toFeatureCollection(payload);
	const features = collection.features
		.filter((feature) => {
			const geometryType = feature?.geometry?.type;
			return geometryType === "Polygon" || geometryType === "MultiPolygon";
		})
		.map((feature) => {
			const bagPandId = normalizeBagPandId(feature);
			const properties = {
				...(feature.properties || {}),
				bagPandId,
			};
			return {
				...feature,
				id: bagPandId || feature.id,
				properties,
			};
		});

	return {
		type: "FeatureCollection",
		features,
	};
}
