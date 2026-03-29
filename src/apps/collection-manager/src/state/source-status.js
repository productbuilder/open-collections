function isExampleSource(source) {
	return Boolean(source && source.providerId === "example");
}

function sourceHasAccessibleContent(source) {
	if (!source) {
		return false;
	}

	const hasCollections =
		Array.isArray(source.collections) && source.collections.length > 0;
	const hasItems = Number(source.itemCount) > 0;
	return hasCollections || hasItems;
}

export function getSourceStatus(source) {
	if (!source) {
		return {
			label: "Disconnected",
			detail: "No connection selected.",
			tone: "neutral",
		};
	}

	if (source.enabled === false) {
		return {
			label: "Disabled",
			detail: "This connection is turned off. Enable it to use it again.",
			tone: "warn",
		};
	}

	if (isExampleSource(source)) {
		return {
			label: "Example",
			detail: "Browse example collections. Connect your own source to refresh or publish.",
			tone: "neutral",
		};
	}

	if (source.needsCredentials) {
		return {
			label: "Disconnected",
			detail: "This connection needs updated credentials before it can refresh or publish.",
			tone: "warn",
		};
	}

	if (source.needsReconnect) {
		return {
			label: "Disconnected",
			detail: sourceHasAccessibleContent(source)
				? "Previously loaded content remains available locally. Reconnect to refresh or publish."
				: "Reconnect this connection to load content or publish changes.",
			tone: "warn",
		};
	}

	if (!source.capabilities?.canPublish) {
		return {
			label: "Read-only",
			detail: "Connected for browsing, but publishing is unavailable for this connection.",
			tone: "neutral",
		};
	}

	return {
		label: "Connected",
		detail: "Connected and ready to refresh or publish.",
		tone: "ok",
	};
}

export { isExampleSource, sourceHasAccessibleContent };
