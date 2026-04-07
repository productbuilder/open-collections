export const HILVERSUM_SPATIAL_FIXTURE_FEATURES = Object.freeze([
	{
		id: "hilv-town-hall",
		type: "Feature",
		geometry: {
			type: "Point",
			coordinates: [5.17396, 52.22366],
		},
		properties: {
			id: "hilv-town-hall",
			title: "Raadhuis Hilversum",
			type: "building",
			category: "civic-architecture",
			description:
				"Town hall designed by Willem Marinus Dudok, often used in local heritage collections.",
			timeLabel: "1931",
			sourceLabel: "Collectie Hilversum (development fixture)",
			imageRef: "placeholder://hilversum/raadhuis",
		},
	},
	{
		id: "hilv-mediapark",
		type: "Feature",
		geometry: {
			type: "Point",
			coordinates: [5.17784, 52.23628],
		},
		properties: {
			id: "hilv-mediapark",
			title: "Media Park",
			type: "district",
			category: "media-history",
			description:
				"Cluster of studios and broadcasters that shaped Hilversum as media city.",
			timeLabel: "20th–21st century",
			sourceLabel: "Collectie Hilversum (development fixture)",
			imageRef: "placeholder://hilversum/media-park",
		},
	},
	{
		id: "hilv-station",
		type: "Feature",
		geometry: {
			type: "Point",
			coordinates: [5.18179, 52.2249],
		},
		properties: {
			id: "hilv-station",
			title: "Station Hilversum",
			type: "station",
			category: "transport",
			description:
				"Rail station area used as a practical anchor for mobility-related collection items.",
			timeLabel: "1884–present",
			sourceLabel: "Collectie Hilversum (development fixture)",
			imageRef: "placeholder://hilversum/station",
		},
	},
	{
		id: "hilv-a27-corridor",
		type: "Feature",
		geometry: {
			type: "LineString",
			coordinates: [
				[5.15473, 52.24158],
				[5.17052, 52.2335],
				[5.18895, 52.22466],
				[5.20386, 52.21542],
			],
		},
		properties: {
			id: "hilv-a27-corridor",
			title: "A27 Corridor (Hilversum stretch)",
			type: "infrastructure-line",
			category: "transport",
			description:
				"Generalized line near Hilversum for testing route-style interactions and card rendering.",
			timeLabel: "post-war expansion",
			sourceLabel: "Collectie Hilversum (development fixture)",
			imageRef: "placeholder://hilversum/a27-corridor",
		},
	},
	{
		id: "hilv-garden-city-axis",
		type: "Feature",
		geometry: {
			type: "LineString",
			coordinates: [
				[5.16492, 52.22492],
				[5.17396, 52.22366],
				[5.18477, 52.22189],
			],
		},
		properties: {
			id: "hilv-garden-city-axis",
			title: "Dudok Civic Axis (generalized)",
			type: "urban-structure",
			category: "urban-planning",
			description:
				"Simple civic axis line to support future timeline and thematic filtering examples.",
			timeLabel: "1920s–1930s",
			sourceLabel: "Collectie Hilversum (development fixture)",
			imageRef: "placeholder://hilversum/civic-axis",
		},
	},
	{
		id: "hilv-town-center-area",
		type: "Feature",
		geometry: {
			type: "Polygon",
			coordinates: [
				[
					[5.16884, 52.22876],
					[5.18202, 52.22876],
					[5.18202, 52.22016],
					[5.16884, 52.22016],
					[5.16884, 52.22876],
				],
			],
		},
		properties: {
			id: "hilv-town-center-area",
			title: "Hilversum Town Center (focus area)",
			type: "area-of-interest",
			category: "urban-area",
			description:
				"Small center polygon for map hit-testing and future area-based filtering experiments.",
			timeLabel: "historic core",
			sourceLabel: "Collectie Hilversum (development fixture)",
			imageRef: "placeholder://hilversum/town-center",
		},
	},
]);
