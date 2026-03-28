import {
	getSourceStatus,
	isExampleSource,
	sourceHasAccessibleContent,
} from "./source-status.js";

function hasPublishableSelection(state) {
	if (
		!state ||
		state.activeSourceFilter === "all" ||
		!state.selectedCollectionId ||
		state.selectedCollectionId === "all"
	) {
		return false;
	}

	const source = state.sources.find(
		(entry) => entry.id === state.activeSourceFilter,
	);
	if (
		!source ||
		!source.provider ||
		typeof source.provider.publishCollection !== "function"
	) {
		return false;
	}

	return Boolean(source.capabilities?.canPublish);
}

function activeSource(state) {
	if (!state || state.activeSourceFilter === "all") {
		return null;
	}
	return (
		state.sources.find((entry) => entry.id === state.activeSourceFilter) ||
		null
	);
}

function sourceHasWorkspaceContent(state, source) {
	if (!state || !source) {
		return false;
	}

	const hasAssets =
		Array.isArray(state.assets) &&
		state.assets.some((item) => item.sourceId === source.id);
	return sourceHasAccessibleContent(source) || hasAssets;
}

function hasPendingPublishAssets(state) {
	if (
		!state ||
		state.activeSourceFilter === "all" ||
		!state.selectedCollectionId ||
		state.selectedCollectionId === "all"
	) {
		return false;
	}

	return state.assets.some(
		(item) =>
			item.sourceId === state.activeSourceFilter &&
			item.collectionId === state.selectedCollectionId &&
			item.include !== false &&
			(item.isLocalDraftAsset ||
				item.draftUploadStatus === "pending-upload" ||
				item.draftUploadStatus === "failed"),
	);
}

export function computeWorkingStatus(state) {
	const source = activeSource(state);
	const canPublish = Boolean(source?.capabilities?.canPublish);
	const hasSelection = hasPublishableSelection(state);
	const hasPendingAssets = hasPendingPublishAssets(state);
	const hasUnpublishedChanges =
		Boolean(state.hasUnsavedChanges) || hasPendingAssets;

	if (state.publishInProgress) {
		return {
			id: "publishing",
			label: "Publishing",
			detail: "Publishing draft changes to the active connection.",
			tone: "neutral",
		};
	}

	if (state.publishError) {
		return {
			id: "publish-failed",
			label: "Publish failed",
			detail:
				state.lastPublishResult?.detail ||
				"Last publish attempt failed. Fix the issue and publish again.",
			tone: "warn",
		};
	}

	if (source?.needsCredentials) {
		const sourceStatus = getSourceStatus(source);
		return {
			id: "credentials-missing",
			label: sourceStatus.label,
			detail: "The active connection needs updated credentials before you can refresh or publish.",
			tone: sourceStatus.tone,
		};
	}

	if (isExampleSource(source)) {
		const sourceStatus = getSourceStatus(source);
		return {
			id: "example-content",
			label: sourceStatus.label,
			detail: "Example collections are available for browsing. Connect your own source to refresh or publish.",
			tone: sourceStatus.tone,
		};
	}

	if (source?.needsReconnect) {
		const hasAccessibleContent = sourceHasWorkspaceContent(state, source);
		const sourceStatus = getSourceStatus(source);
		return {
			id: "host-needs-reconnect",
			label: sourceStatus.label,
			detail: hasAccessibleContent
				? "Previously loaded collections remain available locally. Reconnect to refresh from the connection or publish."
				: "The active connection is remembered but disconnected. Reconnect to load content or publish.",
			tone: sourceStatus.tone,
		};
	}

	if (source && !canPublish) {
		const sourceStatus = getSourceStatus(source);
		return {
			id: "read-only-host",
			label: sourceStatus.label,
			detail: "This connection stays available for browsing, but publishing is disabled.",
			tone: sourceStatus.tone,
		};
	}

	if (hasUnpublishedChanges && canPublish && hasSelection) {
		return {
			id: "ready-to-publish",
			label: "Ready to publish",
			detail: "Unpublished draft changes detected. Publish will update the remote connection.",
			tone: "ok",
		};
	}

	if (hasUnpublishedChanges) {
		return {
			id: "unpublished-changes",
			label: "Unpublished changes",
			detail: "You have draft-only changes that are not published yet.",
			tone: "warn",
		};
	}

	if (state.lastPublishResult?.ok) {
		return {
			id: "published",
			label: "Published",
			detail:
				state.lastPublishResult.detail ||
				"Last publish completed successfully.",
			tone: "ok",
		};
	}

	if (state.lastSaveTarget === "source") {
		return {
			id: "published",
			label: "Published",
			detail: "Latest changes are saved to the active connection.",
			tone: "ok",
		};
	}

	if (state.hasLocalDraft || state.lastSaveTarget === "draft") {
		return {
			id: "draft",
			label: "Draft",
			detail: "Working in local draft mode. Connect a publishable connection when ready.",
			tone: "neutral",
		};
	}

	return {
		id: "draft",
		label: "Draft",
		detail: "Connect a source or create a collection draft to get started.",
		tone: "neutral",
	};
}
