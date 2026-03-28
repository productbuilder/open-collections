export const APP_RUNTIME_MODES = Object.freeze({
	STANDALONE: "standalone",
	EMBEDDED: "embedded",
});

export const APP_LIFECYCLE_EVENTS = Object.freeze({
	MOUNTED: "app:mounted",
	UPDATED: "app:updated",
	UNMOUNTED: "app:unmounted",
	NAVIGATE: "app:navigate",
	STATUS: "app:status",
	REQUEST_NOTIFICATION: "app:request-notification",
});

function normalizeMode(mode) {
	return mode === APP_RUNTIME_MODES.EMBEDDED
		? APP_RUNTIME_MODES.EMBEDDED
		: APP_RUNTIME_MODES.STANDALONE;
}

function asRecord(value) {
	return value && typeof value === "object" ? value : {};
}

export function createAppRuntimeContext({
	appId,
	mode = APP_RUNTIME_MODES.STANDALONE,
	target,
	config = {},
	hostCapabilities = null,
	onEvent = null,
} = {}) {
	if (!appId) {
		throw new Error("createAppRuntimeContext requires appId.");
	}
	if (!(target instanceof Element)) {
		throw new Error(
			"createAppRuntimeContext requires a mount target element.",
		);
	}

	const normalizedMode = normalizeMode(mode);
	const normalizedConfig = asRecord(config);

	const emit = (type, detail = {}) => {
		const eventDetail = {
			appId,
			mode: normalizedMode,
			...asRecord(detail),
		};

		target.dispatchEvent(
			new CustomEvent(type, {
				detail: eventDetail,
				bubbles: true,
				composed: true,
			}),
		);

		if (typeof onEvent === "function") {
			onEvent(type, eventDetail);
		}
	};

	return {
		appId,
		mode: normalizedMode,
		target,
		config: normalizedConfig,
		hostCapabilities,
		emit,
	};
}

export function createWebComponentAppAdapter({
	appId,
	tagName,
	mapConfigToAttributes = null,
}) {
	if (!appId || !tagName) {
		throw new Error(
			"createWebComponentAppAdapter requires appId and tagName.",
		);
	}

	let element = null;

	function applyRuntimeAttributes(targetElement, context, config = {}) {
		if (!targetElement) {
			return;
		}

		targetElement.dataset.ocAppId = context.appId;
		targetElement.dataset.ocAppMode = context.mode;
		if (context.mode === APP_RUNTIME_MODES.EMBEDDED) {
			targetElement.setAttribute("data-shell-embed", "true");
		} else {
			targetElement.removeAttribute("data-shell-embed");
		}

		const mapped =
			typeof mapConfigToAttributes === "function"
				? asRecord(mapConfigToAttributes(config, context))
				: {};

		for (const [key, value] of Object.entries(mapped)) {
			if (value == null || value === false) {
				targetElement.removeAttribute(key);
				continue;
			}
			targetElement.setAttribute(
				key,
				value === true ? "" : String(value),
			);
		}
	}

	return {
		mount(context) {
			element = document.createElement(tagName);
			applyRuntimeAttributes(element, context, context.config);
			context.target.replaceChildren(element);
			context.emit(APP_LIFECYCLE_EVENTS.MOUNTED, {
				config: context.config,
			});
			return {
				update(nextConfig = {}) {
					const mergedConfig = {
						...context.config,
						...asRecord(nextConfig),
					};
					applyRuntimeAttributes(element, context, mergedConfig);
					context.emit(APP_LIFECYCLE_EVENTS.UPDATED, {
						config: mergedConfig,
					});
				},
				unmount() {
					if (!element) {
						return;
					}
					element.remove();
					element = null;
					context.emit(APP_LIFECYCLE_EVENTS.UNMOUNTED, {});
				},
			};
		},
	};
}
