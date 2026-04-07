import {
	createWebComponentAppAdapter,
	APP_RUNTIME_MODES,
} from "../../../../shared/runtime/app-mount-contract.js";

function mapEmbeddedRuntimeAttributes(_config, context) {
	return {
		"data-workbench-embed":
			context.mode === APP_RUNTIME_MODES.EMBEDDED ? "true" : null,
	};
}

export const SHELL_SECTION_ADAPTERS = {
	browse: {
		appId: "open-collections-browse-shell",
		adapter: createWebComponentAppAdapter({
			appId: "open-collections-browse-shell",
			tagName: "open-collections-browse-shell",
			mapConfigToAttributes: (config, context) => ({
				...mapEmbeddedRuntimeAttributes(config, context),
				"default-browse-mode": "collection",
			}),
		}),
	},
	collect: {
		appId: "collection-manager",
		adapter: createWebComponentAppAdapter({
			appId: "collection-manager",
			tagName: "open-collections-manager",
			mapConfigToAttributes: mapEmbeddedRuntimeAttributes,
		}),
	},
	present: {
		appId: "collection-presenter",
		adapter: createWebComponentAppAdapter({
			appId: "collection-presenter",
			tagName: "open-collections-presenter",
			mapConfigToAttributes: mapEmbeddedRuntimeAttributes,
		}),
	},
	connect: {
		appId: "collection-connector",
		adapter: createWebComponentAppAdapter({
			appId: "collection-connector",
			tagName: "open-collections-connector",
			mapConfigToAttributes: mapEmbeddedRuntimeAttributes,
		}),
	},
	account: {
		appId: "collection-account",
		adapter: createWebComponentAppAdapter({
			appId: "collection-account",
			tagName: "open-collections-account",
			mapConfigToAttributes: mapEmbeddedRuntimeAttributes,
		}),
	},
};
