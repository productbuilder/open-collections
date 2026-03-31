export function isMobileViewport() {
	return (
		typeof window !== "undefined" &&
		window.matchMedia("(max-width: 760px)").matches
	);
}

function currentItems(app) {
	return Array.isArray(app.getCurrentItems?.())
		? app.getCurrentItems()
		: app.state.collection?.items || [];
}

function resolveItemById(app, itemId) {
	const id = String(itemId || "").trim();
	if (!id) {
		return null;
	}
	const scopedItems = currentItems(app);
	const scopedMatch = scopedItems.find((item) => item?.id === id) || null;
	if (scopedMatch) {
		return scopedMatch;
	}
	if (app.isEmbeddedRuntime?.()) {
		const sourceItems = Array.isArray(app.state.sourceItems)
			? app.state.sourceItems
			: [];
		return sourceItems.find((item) => item?.id === id) || null;
	}
	return null;
}

export function findSelectedItem(app) {
	return resolveItemById(app, app.state.selectedItemId);
}

export function findViewerItem(app) {
	return resolveItemById(app, app.state.viewerItemId);
}

export function selectItem(app, itemId) {
	if (!itemId) {
		return;
	}
	app.state.selectedItemId = itemId;
	app.renderViewport();
	app.renderMetadata();
	if (isMobileViewport()) {
		app.openMobileMetadataPanel();
	} else {
		app.syncMetadataPanelVisibility();
	}
}

export function openViewer(app, itemId) {
	const item = resolveItemById(app, itemId);
	if (!item) {
		return;
	}
	app.state.viewerItemId = itemId;
	app.renderViewer();
	app.dom.viewerDialog?.open();
}

export function closeViewer(app) {
	app.state.viewerItemId = null;
	app.dom.viewerDialog?.clear();
	app.dom.viewerDialog?.close();
}
