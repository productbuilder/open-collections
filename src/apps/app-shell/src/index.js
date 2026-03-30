import "../../../shared/ui/primitives/index.js";
import "../../../shared/ui/panels/index.js";
import "./app.js?v=20260327-app-shell-runtime-contract";
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
const DEBUG_STAGE_PARAM = "shellDebugStage";
const DEBUG_SECTION_PARAM = "shellDebugSection";

const SECTION_BOOT_LOADERS = {
	browse: () => import("../../collection-browser/src/index.js"),
	collect: () => import("../../collection-manager/src/index.js"),
	present: () => import("../../collection-presenter/src/index.js"),
	account: () => import("../../collection-account/src/index.js"),
};

function readDebugStage() {
	if (typeof window === "undefined") {
		return 4;
	}
	const raw = Number(window.location.searchParams?.get?.(DEBUG_STAGE_PARAM));
	if (Number.isFinite(raw)) {
		return Math.min(4, Math.max(1, Math.trunc(raw)));
	}
	const params = new URLSearchParams(window.location.search);
	const value = Number(params.get(DEBUG_STAGE_PARAM));
	if (!Number.isFinite(value)) {
		return 4;
	}
	return Math.min(4, Math.max(1, Math.trunc(value)));
}

function readDebugSection() {
	if (typeof window === "undefined") {
		return "";
	}
	const params = new URLSearchParams(window.location.search);
	return (params.get(DEBUG_SECTION_PARAM) || "").trim();
}

class OpenAppShellElement extends HTMLElement {
	constructor() {
		super();

		this.state = {
			activeSectionKey: DEFAULT_SECTION_KEY,
		};

		this.shadow = this.attachShadow({ mode: "open" });
		this.sectionSessions = new Map();
		this.sectionLoadState = new Map();
		this.toastLayer = null;
		this.debugStage = readDebugStage();
		this.debugSection = readDebugSection();

		this.render();
	}

	connectedCallback() {
		this.bindEvents();
		if (this.debugStage >= 3) {
			void this.ensureSectionMounted(this.state.activeSectionKey);
		}
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
		if (this.debugStage >= 3) {
			void this.ensureSectionMounted(sectionKey);
		}
		this.syncSectionVisibility();
		this.syncNavCurrentState();
	}

	getSectionMountTarget(sectionKey) {
		return this.shadow.querySelector(
			`[data-shell-section-mount="${sectionKey}"]`,
		);
	}

	setSectionPlaceholder(sectionKey, text, tone = "neutral") {
		const mountTarget = this.getSectionMountTarget(sectionKey);
		if (!mountTarget) {
			return;
		}
		mountTarget.innerHTML = `<div class="shell-debug-placeholder shell-debug-placeholder--${tone}">${text}</div>`;
	}

	async ensureSectionMounted(sectionKey) {
		if (this.sectionSessions.has(sectionKey)) {
			return this.sectionSessions.get(sectionKey);
		}
		if (this.sectionLoadState.get(sectionKey) === "loading") {
			return null;
		}

		if (this.debugSection && this.debugSection !== sectionKey) {
			this.setSectionPlaceholder(
				sectionKey,
				`Debug mode: section \"${sectionKey}\" disabled by ?${DEBUG_SECTION_PARAM}=${this.debugSection}`,
			);
			return null;
		}

		const mountTarget = this.getSectionMountTarget(sectionKey);
		const section =
			SHELL_SECTION_ADAPTERS[sectionKey] ||
			SHELL_SECTION_ADAPTERS[DEFAULT_SECTION_KEY];

		if (!mountTarget || !section) {
			return null;
		}

		try {
			this.sectionLoadState.set(sectionKey, "loading");
			await SECTION_BOOT_LOADERS[sectionKey]?.();
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
			this.sectionLoadState.set(sectionKey, "mounted");
			return session;
		} catch (error) {
			console.error(
				`[open-app-shell] Failed to mount section \"${sectionKey}\"`,
				error,
			);
			this.sectionLoadState.set(sectionKey, "failed");
			this.setSectionPlaceholder(
				sectionKey,
				`Failed to mount \"${sectionKey}\". Check console for details.`,
				"error",
			);
			return null;
		}
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
		const navButtons = this.shadow.querySelectorAll(
			"button[data-section-key]",
		);
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

		const debugBanner =
			this.debugStage < 4 || this.debugSection
				? `<div class="shell-debug-banner">Debug stage ${this.debugStage}${this.debugSection ? ` · section ${this.debugSection}` : ""}</div>`
				: "";

		this.shadow.innerHTML = `
      	<style>${appShellStyles}
			.shell-debug-banner { padding: 0.5rem 0.75rem; background: #fffbeb; color: #92400e; font: 600 0.8rem/1.2 system-ui; border-bottom: 1px solid #fde68a; }
			.shell-debug-placeholder { margin: 1rem; padding: 0.75rem; border-radius: 8px; border: 1px solid #cbd5e1; color: #334155; background: #f8fafc; }
			.shell-debug-placeholder--error { border-color: #fecaca; background: #fef2f2; color: #991b1b; }
			</style>

		<div class="oc-app-frame">
			${debugBanner}
			${renderShellHeader(activeSectionKey)}
			<main class="oc-app-viewport" id="shellViewport" tabindex="-1">
				${sectionMounts}
			</main>
		</div>
    `;

		if (this.debugStage === 1) {
			this.setSectionPlaceholder(
				activeSectionKey,
				"Stage 1 placeholder: shell booted without app mounts.",
			);
		}
		if (this.debugStage === 2) {
			for (const key of Object.keys(SHELL_SECTION_ADAPTERS)) {
				this.setSectionPlaceholder(
					key,
					"Stage 2: app-shell component render confirmed; embedded apps not mounted.",
				);
			}
		}
	}
}

if (!customElements.get("open-app-shell")) {
	customElements.define("open-app-shell", OpenAppShellElement);
}

export { OpenAppShellElement };
