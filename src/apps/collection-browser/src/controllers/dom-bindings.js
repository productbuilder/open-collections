export function cacheDomElements(root) {
	return {
		browserManifest: root.getElementById("browserManifest"),
		browserHeaderStatus: root.getElementById("browserHeaderStatus"),
		browserViewport: root.getElementById("browserViewport"),
		manifestControls: root.getElementById("manifestControls"),
		embeddedViewAllBtn: root.getElementById("embeddedViewAllBtn"),
		embeddedViewSourcesBtn: root.getElementById("embeddedViewSourcesBtn"),
		embeddedViewCollectionsBtn: root.getElementById(
			"embeddedViewCollectionsBtn",
		),
		embeddedViewItemsBtn: root.getElementById("embeddedViewItemsBtn"),
		metadataPanel: root.getElementById("metadataPanel"),
		viewerDialog: root.getElementById("viewerDialog"),
	};
}

export function bindDomEvents(app) {
	if (app._eventsBound) {
		return;
	}

	app._eventsBound = true;
	app._handleWindowResize = () => app.syncMetadataPanelVisibility();
	window.addEventListener("resize", app._handleWindowResize);

	app.dom.manifestControls?.addEventListener(
		"manifest-load",
		async (event) => {
			await app.loadCollection({
				manifestUrl: event.detail?.manifestUrl || "",
			});
		},
	);
	app.dom.manifestControls?.addEventListener(
		"manifest-input-change",
		(event) => {
			app.setManifestInput(event.detail?.manifestUrl || "");
		},
	);
	app.dom.manifestControls?.addEventListener(
		"recent-manifest-picked",
		(event) => {
			app.setManifestInput(event.detail?.manifestUrl || "");
		},
	);
	app.dom.manifestControls?.addEventListener("clear-recent-manifests", () => {
		app.clearRecentManifestUrls();
		app.setStatus(
			"Cleared recent manifest URLs for this browser.",
			"neutral",
		);
		app.renderManifestControls();
	});
	app.dom.embeddedViewSourcesBtn?.addEventListener("click", () => {
		app.setEmbeddedViewMode("sources");
	});
	app.dom.embeddedViewAllBtn?.addEventListener("click", () => {
		app.setEmbeddedViewMode("all");
	});
	app.dom.embeddedViewCollectionsBtn?.addEventListener("click", () => {
		app.setEmbeddedViewMode("collections");
	});
	app.dom.embeddedViewItemsBtn?.addEventListener("click", () => {
		app.setEmbeddedViewMode("items");
	});
	app.dom.browserViewport?.addEventListener("panel-back", () => {
		app.goBackInEmbeddedNav();
	});

	app.dom.browserViewport?.addEventListener("item-open", (event) => {
		app.openItemFromCard(event.detail?.itemId || "");
	});
	app.dom.browserViewport?.addEventListener("collection-open", async (event) => {
		const manifestUrl = String(event.detail?.manifestUrl || "").trim();
		if (!manifestUrl) {
			return;
		}
		await app.openCollectionFromBrowse(manifestUrl);
	});
	app.dom.browserViewport?.addEventListener("source-open", async (event) => {
		const sourceId = String(event.detail?.sourceId || "").trim();
		if (!sourceId) {
			return;
		}
		await app.openSourceFromBrowse(sourceId);
	});

	app.dom.metadataPanel?.addEventListener("close-metadata", () => {
		app.closeMobileMetadataPanel();
	});
	app.dom.viewerDialog?.addEventListener("close-viewer", () => {
		app.state.viewerItemId = null;
	});
	// Details action intentionally hidden in viewer header for now.
}
