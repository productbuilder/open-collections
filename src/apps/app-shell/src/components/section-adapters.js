import {
	createWebComponentAppAdapter,
	APP_RUNTIME_MODES,
} from "../../../../shared/runtime/app-mount-contract.js";

export const SHELL_SECTION_ADAPTERS = {
	browse: {
		appId: "collection-browser",
		adapter: createWebComponentAppAdapter({
			appId: "collection-browser",
			tagName: "timemap-browser",
			mapConfigToAttributes: (_config, context) => ({
				"data-workbench-embed":
					context.mode === APP_RUNTIME_MODES.EMBEDDED ? "true" : null,
			}),
		}),
	},
	collect: {
		appId: "collection-manager",
		adapter: createWebComponentAppAdapter({
			appId: "collection-manager",
			tagName: "open-collections-manager",
			mapConfigToAttributes: (_config, context) => ({
				"data-workbench-embed":
					context.mode === APP_RUNTIME_MODES.EMBEDDED ? "true" : null,
			}),
		}),
	},
	present: {
		appId: "collection-presenter",
		adapter: createWebComponentAppAdapter({
			appId: "collection-presenter",
			tagName: "open-collections-presenter",
		}),
	},
	account: {
		appId: "collection-account",
		adapter: createWebComponentAppAdapter({
			appId: "collection-account",
			tagName: "open-collections-account",
		}),
	},
};
