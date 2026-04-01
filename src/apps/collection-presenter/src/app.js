import {
	normalizeCollection,
} from "../../../shared/library-core/src/index.js";
import { BaseElement } from "../../../shared/ui/app-foundation/base-element.js";
import "../../collection-browser/src/components/browser-viewer-dialog.js";
import { presenterShellStyles } from "./styles/presenter-shell.css.js";

const DEFAULT_PRESENTATIONS_URL = new URL(
	"../../../collections/presentations/collection.json",
	import.meta.url,
).href;

function escapeHtml(value) {
	return String(value ?? "")
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");
}

function derivePreviewUrl(item = {}) {
	return String(item?.previewUrl || item?.media?.thumbnailUrl || item?.media?.url || "").trim();
}

class OpenCollectionsPresenterElement extends BaseElement {
	constructor() {
		super();
		this.state = {
			collection: null,
			items: [],
			presentationItems: [],
			viewerItemId: "",
			statusText: "Loading presentations…",
			statusTone: "neutral",
			loading: true,
		};
	}

	renderStyles() {
		return presenterShellStyles;
	}

	onFirstConnected() {
		void this.loadPresentations();
	}

	async loadPresentations() {
		this.state.loading = true;
		this.state.statusText = "Loading presentations…";
		this.state.statusTone = "neutral";
		this.render();
		try {
			const response = await fetch(DEFAULT_PRESENTATIONS_URL);
			if (!response.ok) {
				throw new Error(`Could not load presentations (${response.status}).`);
			}
			const json = await response.json();
			const collection = normalizeCollection(json);
			const items = Array.isArray(collection.items) ? collection.items : [];
			const presentationItems = items.filter(
				(item) => String(item?.type || "").toLowerCase() === "presentation",
			);
			this.state.collection = collection;
			this.state.items = items;
			this.state.presentationItems = presentationItems;
			this.state.statusText =
				presentationItems.length > 0
					? `${presentationItems.length} presentation app${presentationItems.length === 1 ? "" : "s"} available.`
					: "No presentation apps in this collection yet.";
			this.state.statusTone = presentationItems.length > 0 ? "ok" : "warn";
		} catch (error) {
			this.state.collection = null;
			this.state.items = [];
			this.state.presentationItems = [];
			this.state.statusText = error instanceof Error ? error.message : "Could not load presentations.";
			this.state.statusTone = "warn";
		} finally {
			this.state.loading = false;
			this.render();
		}
	}

	renderCardsMarkup() {
		if (!this.state.presentationItems.length) {
			return `
				<open-collections-empty-state-panel
					class="presenter-empty"
					title="No presentation apps yet"
					description="Use Add app to start creating configured presentation items."
					message="MVP note: Add app is currently a placeholder action."
				></open-collections-empty-state-panel>
			`;
		}
		return this.state.presentationItems
			.map((item) => {
				const title = escapeHtml(item?.title || item?.id || "Presentation");
				const description = escapeHtml(item?.description || "Presentation app item");
				const previewUrl = escapeHtml(derivePreviewUrl(item));
				const id = escapeHtml(item?.id || "");
				const presentationType = escapeHtml(item?.presentationType || "presentation");
				return `
					<div class="presenter-cell" data-item-id="${id}">
						<oc-card-item
							data-item-id="${id}"
							data-presentation-type="${presentationType}"
							title="${title}"
							subtitle="${description}"
							preview-url="${previewUrl}"
							action-label="Open"
							action-value="${id}"
						></oc-card-item>
					</div>
				`;
			})
			.join("");
	}

	renderTemplate() {
		return `
			<main class="oc-app-viewport" aria-labelledby="presenterTitle">
				<section class="oc-page">
					<open-collections-section-header
						id="presenterTitle"
						heading-level="1"
						title="Present"
						description="Grid-based presentation area for saved presentation app items."
					></open-collections-section-header>
				</section>

				<section class="oc-page presenter-panel-wrap">
					<open-collections-panel-chrome
						title="Presentation apps"
						subtitle="Open a saved presentation app item in the viewer dialog."
						status-label="${escapeHtml(this.state.statusText)}"
						status-tone="${escapeHtml(this.state.statusTone)}"
					>
						<div slot="toolbar" class="toolbar-copy">
							<span>Collection: ${escapeHtml(this.state.collection?.title || "Presentations")}</span>
						</div>
						<div slot="toolbar-actions" class="toolbar-actions">
							<button type="button" class="btn" id="presenterAddAppBtn">Add app</button>
						</div>
						<div class="presenter-grid-wrap">
							<oc-grid id="presenterGrid" columns-desktop="4" columns-tablet="2" columns-mobile="1">
								${this.renderCardsMarkup()}
							</oc-grid>
						</div>
					</open-collections-panel-chrome>
				</section>
			</main>
			<open-browser-viewer-dialog id="presenterViewer"></open-browser-viewer-dialog>
		`;
	}

	afterRender() {
		this.shadowRoot
			?.getElementById("presenterAddAppBtn")
			?.addEventListener("click", () => {
				this.state.statusText =
					"Add app is scaffolded for MVP. Next step: template picker + guided configuration flow.";
				this.state.statusTone = "neutral";
				this.render();
			});

		const grid = this.shadowRoot?.getElementById("presenterGrid");
		grid?.addEventListener("click", (event) => {
			const path = typeof event.composedPath === "function" ? event.composedPath() : [];
			for (const node of path) {
				if (!(node instanceof HTMLElement)) {
					continue;
				}
				const itemId = String(node.dataset?.itemId || "").trim();
				if (!itemId) {
					continue;
				}
				this.openPresentation(itemId);
				return;
			}
		});

		this.shadowRoot
			?.getElementById("presenterViewer")
			?.addEventListener("close-viewer", () => {
				this.state.viewerItemId = "";
			});
	}

	openPresentation(itemId = "") {
		const item = this.state.presentationItems.find((entry) => entry.id === itemId);
		if (!item) {
			return;
		}
		const viewer = this.shadowRoot?.getElementById("presenterViewer");
		if (!(viewer instanceof HTMLElement)) {
			return;
		}
		this.state.viewerItemId = item.id;
		const viewerItem = {
			...item,
			__collectionItems: this.state.items,
		};
		if (typeof viewer.setItem === "function") {
			viewer.setItem(viewerItem);
		}
		if (typeof viewer.open === "function") {
			viewer.open();
		}
	}
}

if (!customElements.get("open-collections-presenter")) {
	customElements.define(
		"open-collections-presenter",
		OpenCollectionsPresenterElement,
	);
}

export { OpenCollectionsPresenterElement };
