export function isShellMapAdapterModeEnabled({
	embeddedRuntime = false,
	shellMapAdapterAttribute = false,
} = {}) {
	return embeddedRuntime === true && shellMapAdapterAttribute === true;
}

export function shouldRunLocalSpatialLoader(options = {}) {
	return !isShellMapAdapterModeEnabled(options);
}
