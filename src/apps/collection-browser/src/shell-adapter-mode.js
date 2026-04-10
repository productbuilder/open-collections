export function isShellListAdapterModeEnabled({
	embeddedRuntime = false,
	shellListAdapterAttribute = false,
} = {}) {
	return embeddedRuntime === true && shellListAdapterAttribute === true;
}

export function shouldRunEmbeddedLegacyCollectionLoading(options = {}) {
	return (
		options?.embeddedRuntime === true &&
		!isShellListAdapterModeEnabled(options)
	);
}
