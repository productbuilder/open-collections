export const BROWSER_CONFIG = {
	defaultManifestUrl: "../../collections/city-photos/collection.json",
	embeddedSourceCatalog: [
		{
			id: "example-collections",
			label: "Example collections",
			sourceType: "collections.json",
			sourceUrl: "../../collections/collections.json",
		},
		{
			id: "collectie-hilversum-prenten",
			label: "Collectie Hilversum",
			sourceType: "collections.json",
			sourceUrl: "https://raw.githubusercontent.com/productbuilder/hilversum-timemachine-data/main/dev/org/collectie-hilversum/collections.json",
		},
		// {
		// 	id: "city-photos",
		// 	label: "City photos",
		// 	sourceType: "collection.json",
		// 	sourceUrl: "../../collections/city-photos/collection.json",
		// },
		// {
		// 	id: "single-collection",
		// 	label: "Single collection",
		// 	sourceType: "collection.json",
		// 	sourceUrl: "../../collections/single-collection/collection.json",
		// },
	],
};
