import { renderShellHeader } from "./components/shell-header.js";
import { appShellStyles } from "./styles/shell.css.js";
import { SHELL_SECTION_ADAPTERS } from "./components/section-adapters.js";
import {
	APP_RUNTIME_MODES,
	APP_LIFECYCLE_EVENTS,
	createAppRuntimeContext,
} from "../../../shared/runtime/app-mount-contract.js";
import { createHostCapabilities } from "../../../shared/runtime/host-capabilities.js";
import { createToastLayer } from "../../../shared/ui/app-runtime/primitives.js";

const DEFAULT_SECTION_KEY = "browse";

class OpenAppShellElement extends HTMLElement {
	constructor() {
		super();

		this.state = {
			activeSectionKey: DEFAULT_SECTION_KEY,
		};

		this.shadow = this.attachShadow({ mode: "open" });
		this.sectionSessions = new Map();
		this.toastLayer = null;

		this.render();
	}

	connectedCallback() {
		this.bindEvents();
		this.ensureSectionMounted(this.state.activeSectionKey);
		this.syncSectionVisibility();
		this.syncNavCurrentState();
	}

	disconnectedCallback() {
		this.unmountAllSections();
		this.destroyToastLayer();
	}

	bindEvents() {
		if (this._isBound) {
			return;
		}

		this._isBound = true;
		this.shadow.addEventListener("click", (event) => {
			const button =
				event.target instanceof HTMLElement
					? event.target.closest("button[data-section-key]")
					: null;
			const sectionKey = button?.dataset.sectionKey;
			if (!sectionKey || sectionKey === this.state.activeSectionKey) {
				return;
			}
			this.setActiveSection(sectionKey);
		});

		this.addEventListener(APP_LIFECYCLE_EVENTS.NAVIGATE, (event) => {
			const detail = event.detail || {};
			if (detail.targetAppId !== "collection-account") {
				return;
			}
			event.preventDefault();
			this.setActiveSection("account");
		});
	}

	ensureToastLayer() {
		if (this.toastLayer) {
			return this.toastLayer;
		}
		this.toastLayer = createToastLayer(this.shadow);
		return this.toastLayer;
	}

	destroyToastLayer() {
		this.toastLayer?.destroy();
		this.toastLayer = null;
	}

	createHostCapabilities() {
		return createHostCapabilities({
			mode: APP_RUNTIME_MODES.EMBEDDED,
			notify: (message, options = {}) => {
				this.ensureToastLayer().show(message, {
					tone: options.tone || "neutral",
					timeout: options.timeout ?? 2600,
				});
			},
		});
	}

	setActiveSection(sectionKey) {
		if (!SHELL_SECTION_ADAPTERS[sectionKey]) {
			return;
		}

		this.state.activeSectionKey = sectionKey;
		this.ensureSectionMounted(sectionKey);
		this.syncSectionVisibility();
		this.syncNavCurrentState();
	}

	getSectionMountTarget(sectionKey) {
		return this.shadow.querySelector(
			`[data-shell-section-mount="${sectionKey}"]`,
		);
	}

	ensureSectionMounted(sectionKey) {
		if (this.sectionSessions.has(sectionKey)) {
			return this.sectionSessions.get(sectionKey);
		}

		const mountTarget = this.getSectionMountTarget(sectionKey);
		const section =
			SHELL_SECTION_ADAPTERS[sectionKey] ||
			SHELL_SECTION_ADAPTERS[DEFAULT_SECTION_KEY];

		if (!mountTarget || !section) {
			return null;
		}

		const runtimeContext = createAppRuntimeContext({
			appId: section.appId,
			mode: APP_RUNTIME_MODES.EMBEDDED,
			target: mountTarget,
			config: {
				sectionKey,
			},
			hostCapabilities: this.createHostCapabilities(),
			onEvent: (type, detail) => {
				if (type === "app:request-notification" && detail.message) {
					this.ensureToastLayer().show(detail.message, {
						tone: detail.tone || "neutral",
					});
				}
			},
		});

		const session = section.adapter.mount(runtimeContext);
		this.sectionSessions.set(sectionKey, session);
		return session;
	}

	syncSectionVisibility() {
		const activeSectionKey = this.state.activeSectionKey;
		for (const sectionKey of Object.keys(SHELL_SECTION_ADAPTERS)) {
			const mountTarget = this.getSectionMountTarget(sectionKey);
			if (!mountTarget) {
				continue;
			}
			const isActive = sectionKey === activeSectionKey;
			mountTarget.hidden = !isActive;
			if (isActive) {
				mountTarget.removeAttribute("inert");
			} else {
				mountTarget.setAttribute("inert", "");
			}
		}
	}

	syncNavCurrentState() {
		const activeSectionKey = this.state.activeSectionKey;
		const navButtons = this.shadow.querySelectorAll("button[data-section-key]");
		for (const button of navButtons) {
			if (!(button instanceof HTMLElement)) {
				continue;
			}
			if (button.dataset.sectionKey === activeSectionKey) {
				button.setAttribute("aria-current", "page");
			} else {
				button.removeAttribute("aria-current");
			}
		}
	}

	unmountAllSections() {
		for (const session of this.sectionSessions.values()) {
			session?.unmount?.();
		}
		this.sectionSessions.clear();
	}

	render() {
		const activeSectionKey = this.state.activeSectionKey;
		const sectionMounts = Object.keys(SHELL_SECTION_ADAPTERS)
			.map(
				(sectionKey) => `
					<div
						data-shell-section-mount="${sectionKey}"
						class="shell-section-mount"
						${sectionKey === activeSectionKey ? "" : "hidden inert"}
					></div>
				`,
			)
			.join("");

		this.shadow.innerHTML = `
      	<style>${appShellStyles}</style>

		<div class="oc-app-frame">

			${renderShellHeader(activeSectionKey)}
			
			<main class="oc-app-viewport" id="shellViewport" tabindex="-1">
				${sectionMounts}
			</main>
		</div>

    `;
	}
}

if (!customElements.get("open-app-shell")) {
	customElements.define("open-app-shell", OpenAppShellElement);
}

export { OpenAppShellElement };
