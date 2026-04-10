import { createListProjection } from "../../../../shared/data/browser-adapters/index.js";

export function buildListSurfaceBridgePayload({
	runtimeStore,
	browseQueryState,
	viewMode = "all",
} = {}) {
	const resolvedRuntimeStore = runtimeStore || null;
	const projection = createListProjection({
		store: resolvedRuntimeStore,
		browseQueryState,
		viewMode,
	});
	return {
		projection,
		compatibility: {
			bridgeMode: "shell-list-adapter-v1",
			preservesLegacyChildMount: true,
			diagnostics: {
				store:
					typeof resolvedRuntimeStore?.getDiagnostics === "function"
						? resolvedRuntimeStore.getDiagnostics()
						: null,
				projection: projection?.diagnostics?.structured || null,
			},
		},
	};
}
