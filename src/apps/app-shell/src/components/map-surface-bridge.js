import { createMapProjection } from "../../../../shared/data/browser-adapters/index.js";

export function buildMapSurfaceBridgePayload({
	runtimeStore,
	browseQueryState,
	viewport = null,
} = {}) {
	const projection = createMapProjection({
		store: runtimeStore,
		browseQueryState,
		viewport,
	});
	return {
		projection,
		compatibility: {
			bridgeMode: "shell-map-adapter-v1",
			preservesLegacyChildMount: true,
			diagnostics: {
				store:
					typeof runtimeStore?.getDiagnostics === "function"
						? runtimeStore.getDiagnostics()
						: null,
				projection: projection?.diagnostics?.structured || null,
			},
		},
	};
}
