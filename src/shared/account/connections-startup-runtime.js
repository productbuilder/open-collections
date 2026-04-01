import { buildBuiltInExampleSourceRequest } from "./built-in-example-source.js";
import {
	getSessionConnectionSources,
	setSessionConnectionSources,
} from "./connections-session-store.js";

export function createConnectionsStartupRuntime({
	connectionsRuntime,
	getSessionSources = getSessionConnectionSources,
	setSessionSources = setSessionConnectionSources,
} = {}) {
	if (!connectionsRuntime) {
		throw new Error("connectionsRuntime is required.");
	}

	let bootstrapPromise = null;

	return {
		async bootstrap({
			selectedLocalDirectoryHandle = null,
			force = false,
		} = {}) {
			if (bootstrapPromise && !force) {
				return bootstrapPromise;
			}

			bootstrapPromise = (async () => {
				const sessionSources = getSessionSources();
				const existingSessionSources = Array.isArray(sessionSources)
					? [...sessionSources]
					: [];
				if (existingSessionSources.length > 0 && !force) {
					return {
						ok: true,
						sources: existingSessionSources,
						initialization: "session",
					};
				}

				const rememberedSources =
					connectionsRuntime.restoreRememberedSources();
				if (Array.isArray(rememberedSources) && rememberedSources.length > 0) {
					setSessionSources(rememberedSources);
					return {
						ok: true,
						sources: rememberedSources,
						initialization: "remembered",
					};
				}

				const starterResult = await connectionsRuntime.connectSource(
					buildBuiltInExampleSourceRequest({
						connectionsRuntime,
						selectedLocalDirectoryHandle,
						sources: [],
					}),
				);
				if (!starterResult.ok || !starterResult.source) {
					return {
						ok: false,
						sources: [],
						initialization: "failed",
						message:
							starterResult.message ||
							"Built-in example connection failed during startup.",
					};
				}

				const fallbackSources = [starterResult.source];
				connectionsRuntime.persistSources(fallbackSources);
				setSessionSources(fallbackSources);
				return {
					ok: true,
					sources: fallbackSources,
					initialization: "example",
				};
			})();

			return bootstrapPromise;
		},
	};
}
