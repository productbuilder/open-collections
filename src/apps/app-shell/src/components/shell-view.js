import { renderFoundationPlaceholder } from "../../../../shared/ui/app-foundation/placeholders.js";

// Mount seam: each function is an explicit replacement point for a future sub-app embed.
export function renderBrowseView() {
	return renderFoundationPlaceholder({
		title: "Browse",
		description:
			"Read and browse collections from connected manifest sources.",
		replacementLabel: "collection-browser",
	});
}

export function renderCollectView() {
	return renderFoundationPlaceholder({
		title: "Collect",
		description: "Create, edit, and publish collections and assets.",
		replacementLabel: "collection-manager",
	});
}

export function renderPresentView() {
	return renderFoundationPlaceholder({
		title: "Present",
		description:
			"Present curated views and experiences built from collections.",
		replacementLabel: "collection-presenter",
	});
}

export function renderAccountView() {
	return renderFoundationPlaceholder({
		title: "Account",
		description:
			"Manage profile, workspace settings, and account-level preferences.",
		replacementLabel: "account",
	});
}

export const SHELL_VIEW_RENDERERS = {
	browse: renderBrowseView,
	collect: renderCollectView,
	present: renderPresentView,
	account: renderAccountView,
};
