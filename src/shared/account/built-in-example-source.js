const BUILT_IN_EXAMPLE_PROVIDER_ID = "example";

export function isBuiltInExampleSource(source) {
	return Boolean(
		source &&
			source.providerId === BUILT_IN_EXAMPLE_PROVIDER_ID &&
			source.isBuiltIn !== false,
	);
}

export function buildBuiltInExampleSourceRequest({
	connectionsRuntime,
	selectedLocalDirectoryHandle = null,
	sources = [],
} = {}) {
	if (!connectionsRuntime) {
		throw new Error("connectionsRuntime is required.");
	}
	const providerId = BUILT_IN_EXAMPLE_PROVIDER_ID;
	return {
		providerId,
		config: connectionsRuntime.collectProviderConfig(
			providerId,
			{},
			selectedLocalDirectoryHandle,
		),
		sources: Array.isArray(sources) ? sources : [],
	};
}
