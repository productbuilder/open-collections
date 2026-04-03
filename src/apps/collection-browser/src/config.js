export const BROWSER_CONFIG = {
	defaultManifestUrl: "../../collections/city-photos/collection.json",
	enableBrowseDiagnostics: false,
	embeddedSourceCatalog: [
		{
			id: "example-collections",
			label: "Example collections",
			sourceType: "source.json",
			sourceUrl: "../../collections/source.json",
		},
		{
			id: "collectie-hilversum",
			label: "Collectie Hilversum",
			sourceType: "source.json",
			sourceUrl: "https://raw.githubusercontent.com/productbuilder/hilversum-timemachine-data/main/dev/org/collectie-hilversum/source.json",
		},
		{
			id: "dudok-architectuur-centrum",
			label: "Dudok Architectuur Centrum",
			sourceType: "source.json",
			sourceUrl: "https://raw.githubusercontent.com/productbuilder/hilversum-timemachine-data/main/dev/org/dudok-architectuur-centrum/source.json",
		}
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
