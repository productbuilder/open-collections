import {
	normalizeCollection,
} from "../../../shared/library-core/src/index.js";
import { BaseElement } from "../../../shared/ui/app-foundation/base-element.js";
import { ENTRY_VIEW_HEADERS } from "../../../shared/ui/app-foundation/entry-view-header-copy.js";
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

function toLabelCase(value = "") {
	const normalized = String(value || "").trim();
	if (!normalized) {
		return "Presentation";
	}
	return normalized
		.split("-")
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(" ");
}

function isImageItem(item = {}) {
	return String(item?.type || "").toLowerCase() === "image" && String(item?.media?.url || "").trim();
}

function clampSplit(value) {
	const parsed = Number(value);
	if (!Number.isFinite(parsed)) {
		return 0.5;
	}
	return Math.min(0.95, Math.max(0.05, parsed));
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
			createFlow: {
				open: false,
				stage: "picker",
				step: 1,
				mode: "create",
				editingItemId: "",
				templateType: "",
				pastItemId: "",
				presentItemId: "",
				pastLabel: "Past",
				presentLabel: "Present",
				initialSplit: 0.5,
				showLabels: true,
				errorText: "",
			},
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
				const title = escapeHtml(this.derivePresentationTitle(item));
				const summary = escapeHtml(item?.summary || item?.description || "");
				const previewUrl = escapeHtml(this.derivePresentationPreviewUrl(item));
				const id = escapeHtml(item?.id || "");
				const presentationType = escapeHtml(item?.presentationType || "presentation");
				const presentationTypeLabel = escapeHtml(
					toLabelCase(item?.presentationType || "presentation"),
				);
				const summaryMarkup = summary
					? `<p class="presenter-card-summary">${summary}</p>`
					: "";
				return `
					<div class="presenter-cell" data-item-id="${id}">
						<article class="presenter-card" data-item-id="${id}">
							<button type="button" class="presenter-card-open" data-item-id="${id}" aria-label="Open ${title}">
								<span class="presenter-card-preview">
									${
										previewUrl
											? `<img src="${previewUrl}" alt="" loading="lazy" decoding="async" />`
											: `<span class="presenter-card-placeholder" aria-hidden="true"></span>`
									}
								</span>
								<span class="presenter-card-meta">
									<span class="presenter-card-title">${title}</span>
									<span class="presenter-card-badge">${presentationTypeLabel}</span>
									${summaryMarkup}
								</span>
							</button>
							<div class="presenter-card-actions">
								<button
									type="button"
									class="btn btn-quiet presenter-edit-btn"
									data-edit-item-id="${id}"
									data-presentation-type="${presentationType}"
								>
									Edit
								</button>
							</div>
						</article>
					</div>
				`;
			})
			.join("");
	}

	derivePresentationTitle(item = {}) {
		const explicitTitle = String(item?.title || "").trim();
		if (explicitTitle) {
			return explicitTitle;
		}
		if (String(item?.presentationType || "").trim() === "time-comparer") {
			const pastItem = this.state.items.find(
				(entry) => entry.id === item?.compare?.pastItemId,
			);
			const presentItem = this.state.items.find(
				(entry) => entry.id === item?.compare?.presentItemId,
			);
			const pastTitle = String(pastItem?.title || item?.settings?.pastLabel || "Past").trim();
			const presentTitle = String(
				presentItem?.title || item?.settings?.presentLabel || "Present",
			).trim();
			return `${pastTitle} vs ${presentTitle}`;
		}
		return String(item?.id || "Presentation");
	}

	derivePresentationPreviewUrl(item = {}) {
		if (String(item?.presentationType || "").trim() === "time-comparer") {
			const presentItem = this.state.items.find(
				(entry) => entry.id === item?.compare?.presentItemId,
			);
			const pastItem = this.state.items.find(
				(entry) => entry.id === item?.compare?.pastItemId,
			);
			return derivePreviewUrl(presentItem) || derivePreviewUrl(pastItem) || derivePreviewUrl(item);
		}
		return derivePreviewUrl(item);
	}

	getImageCandidates() {
		return this.state.items.filter((item) => isImageItem(item));
	}

	resetCreateFlow() {
		this.state.createFlow = {
			open: false,
			stage: "picker",
			step: 1,
			mode: "create",
			editingItemId: "",
			templateType: "",
			pastItemId: "",
			presentItemId: "",
			pastLabel: "Past",
			presentLabel: "Present",
			initialSplit: 0.5,
			showLabels: true,
			errorText: "",
		};
	}

	openCreateFlow() {
		this.resetCreateFlow();
		this.state.createFlow.open = true;
		this.render();
	}

	openEditFlow(itemId = "") {
		const item = this.state.presentationItems.find((entry) => entry.id === itemId);
		if (!item || String(item.presentationType || "") !== "time-comparer") {
			return;
		}
		this.state.createFlow = {
			open: true,
			stage: "wizard",
			step: 1,
			mode: "edit",
			editingItemId: itemId,
			templateType: "time-comparer",
			pastItemId: String(item?.compare?.pastItemId || ""),
			presentItemId: String(item?.compare?.presentItemId || ""),
			pastLabel: String(item?.settings?.pastLabel || "Past"),
			presentLabel: String(item?.settings?.presentLabel || "Present"),
			initialSplit: clampSplit(item?.settings?.initialSplit),
			showLabels: Boolean(item?.settings?.showLabels ?? true),
			errorText: "",
		};
		this.render();
	}

	closeCreateFlow() {
		this.resetCreateFlow();
		this.render();
	}

	selectTemplate(templateType = "") {
		this.state.createFlow.templateType = templateType;
		this.state.createFlow.stage = "wizard";
		this.state.createFlow.step = 1;
		this.state.createFlow.errorText = "";
		this.render();
	}

	renderImageOptions(selectedItemId = "") {
		const selected = String(selectedItemId || "");
		const options = this.getImageCandidates()
			.map((item) => {
				const id = String(item.id || "");
				const selectedAttr = id === selected ? "selected" : "";
				const label = escapeHtml(item.title || id || "Untitled image");
				return `<option value="${escapeHtml(id)}" ${selectedAttr}>${label}</option>`;
			})
			.join("");
		return `
			<option value="">Select image…</option>
			${options}
		`;
	}

	renderCreateFlowMarkup() {
		const flow = this.state.createFlow;
		if (!flow.open) {
			return "";
		}
		const imageCount = this.getImageCandidates().length;
		const errorMarkup = flow.errorText
			? `<p class="flow-error" role="alert">${escapeHtml(flow.errorText)}</p>`
			: "";
		const pickerMarkup = `
			<div class="flow-template-card">
				<h3>Time comparer</h3>
				<p>Create a before-and-after image slider presentation from two image items.</p>
				<button type="button" class="btn" id="flowSelectTimeComparerBtn">Continue</button>
			</div>
		`;
		const reviewPast = this.state.items.find((item) => item.id === flow.pastItemId);
		const reviewPresent = this.state.items.find(
			(item) => item.id === flow.presentItemId,
		);
		const reviewMarkup = `
			<ul class="flow-review-list">
				<li><strong>Past image:</strong> ${escapeHtml(reviewPast?.title || flow.pastItemId || "Not selected")}</li>
				<li><strong>Present image:</strong> ${escapeHtml(reviewPresent?.title || flow.presentItemId || "Not selected")}</li>
				<li><strong>Labels:</strong> ${escapeHtml(flow.pastLabel || "Past")} / ${escapeHtml(flow.presentLabel || "Present")}</li>
				<li><strong>Initial split:</strong> ${Math.round(clampSplit(flow.initialSplit) * 100)}%</li>
				<li><strong>Show labels:</strong> ${flow.showLabels ? "Yes" : "No"}</li>
			</ul>
		`;
		let stepMarkup = "";
		if (flow.stage === "picker") {
			stepMarkup = `
				<p class="flow-step-label">Template picker</p>
				${pickerMarkup}
			`;
		} else if (flow.step === 1) {
			stepMarkup = `
				<p class="flow-step-label">Step 1 of 4</p>
				<label class="flow-field">
					<span>Choose the past image item</span>
					<select id="flowPastItemSelect">${this.renderImageOptions(flow.pastItemId)}</select>
				</label>
				<p class="flow-help">Available image items: ${imageCount}</p>
			`;
		} else if (flow.step === 2) {
			stepMarkup = `
				<p class="flow-step-label">Step 2 of 4</p>
				<label class="flow-field">
					<span>Choose the present image item</span>
					<select id="flowPresentItemSelect">${this.renderImageOptions(flow.presentItemId)}</select>
				</label>
				<p class="flow-help">Choose a different image than the past item.</p>
			`;
		} else if (flow.step === 3) {
			stepMarkup = `
				<p class="flow-step-label">Step 3 of 4</p>
				<label class="flow-field">
					<span>Past label</span>
					<input id="flowPastLabelInput" type="text" maxlength="60" value="${escapeHtml(flow.pastLabel)}" />
				</label>
				<label class="flow-field">
					<span>Present label</span>
					<input id="flowPresentLabelInput" type="text" maxlength="60" value="${escapeHtml(flow.presentLabel)}" />
				</label>
				<label class="flow-field">
					<span>Initial split (5% to 95%)</span>
					<input id="flowSplitInput" type="number" min="5" max="95" step="1" value="${Math.round(clampSplit(flow.initialSplit) * 100)}" />
				</label>
				<label class="flow-check">
					<input id="flowShowLabelsInput" type="checkbox" ${flow.showLabels ? "checked" : ""} />
					<span>Show labels on comparer</span>
				</label>
			`;
		} else {
			stepMarkup = `
				<p class="flow-step-label">Step 4 of 4</p>
				<p class="flow-help">Review your settings before saving this presentation app item.</p>
				${reviewMarkup}
			`;
		}
		const showBack = flow.stage === "wizard";
		const nextLabel = flow.step >= 4 ? "Save app" : "Next";
		const dialogTitle = flow.mode === "edit" ? "Edit app" : "Add app";
		return `
			<dialog id="presenterCreateDialog" class="presenter-dialog" open>
				<div class="flow-head">
					<h2>${dialogTitle}</h2>
					<button type="button" class="btn btn-quiet" id="flowCancelBtn">Close</button>
				</div>
				${stepMarkup}
				${errorMarkup}
				<div class="flow-actions">
					${showBack ? '<button type="button" class="btn btn-quiet" id="flowBackBtn">Back</button>' : ""}
					${flow.stage === "wizard" ? `<button type="button" class="btn" id="flowNextBtn">${nextLabel}</button>` : ""}
				</div>
			</dialog>
		`;
	}

	validateStep() {
		const flow = this.state.createFlow;
		flow.errorText = "";
		if (flow.step === 1 && !flow.pastItemId) {
			flow.errorText = "Select a past image item before continuing.";
			return false;
		}
		if (flow.step === 2 && !flow.presentItemId) {
			flow.errorText = "Select a present image item before continuing.";
			return false;
		}
		if (
			flow.step === 2 &&
			flow.pastItemId &&
			flow.presentItemId &&
			flow.pastItemId === flow.presentItemId
		) {
			flow.errorText = "Past and present images must be different items.";
			return false;
		}
		if (flow.step === 4) {
			if (!flow.pastItemId || !flow.presentItemId) {
				flow.errorText = "Both image selections are required before saving.";
				return false;
			}
			if (flow.pastItemId === flow.presentItemId) {
				flow.errorText = "Past and present images must be different items.";
				return false;
			}
		}
		return true;
	}

	saveTimeComparerItem() {
		const flow = this.state.createFlow;
		const presentItem = this.state.items.find((item) => item.id === flow.presentItemId);
		const pastLabel = String(flow.pastLabel || "Past").trim() || "Past";
		const presentLabel = String(flow.presentLabel || "Present").trim() || "Present";
		const isEditing = flow.mode === "edit";
		const idSuffix = Date.now().toString(36);
		const itemId = isEditing
			? String(flow.editingItemId || "")
			: `presentation-time-comparer-${idSuffix}`;
		const existingItem = this.state.presentationItems.find((item) => item.id === itemId) || {};
		const savedItem = {
			...existingItem,
			id: itemId,
			type: "presentation",
			presentationType: "time-comparer",
			title:
				String(existingItem?.title || "").trim() ||
				`${pastLabel} and ${presentLabel} comparison`,
			description:
				String(existingItem?.description || "").trim() ||
				"Time comparer presentation created in Present.",
			tags: Array.isArray(existingItem?.tags)
				? existingItem.tags
				: ["presentation", "time-comparer"],
			compare: {
				pastItemId: flow.pastItemId,
				presentItemId: flow.presentItemId,
			},
			settings: {
				pastLabel,
				presentLabel,
				initialSplit: clampSplit(flow.initialSplit),
				showLabels: Boolean(flow.showLabels),
			},
			media: {
				type: "image",
				url: String(presentItem?.media?.url || "").trim(),
				thumbnailUrl:
					String(presentItem?.media?.thumbnailUrl || "").trim() ||
					String(presentItem?.media?.url || "").trim(),
			},
		};
		if (isEditing) {
			this.state.items = this.state.items.map((item) =>
				item.id === itemId ? savedItem : item,
			);
			this.state.presentationItems = this.state.presentationItems.map((item) =>
				item.id === itemId ? savedItem : item,
			);
		} else {
			this.state.items = [...this.state.items, savedItem];
			this.state.presentationItems = [...this.state.presentationItems, savedItem];
		}
		if (this.state.collection && Array.isArray(this.state.collection.items)) {
			this.state.collection.items = [...this.state.items];
		}
		this.state.statusText = isEditing
			? `Updated presentation app: ${savedItem.title}`
			: `Saved presentation app: ${savedItem.title}`;
		this.state.statusTone = "ok";
		this.closeCreateFlow();
	}

	renderTemplate() {
		const header = ENTRY_VIEW_HEADERS.present;
		return `
			<main class="oc-app-viewport" aria-labelledby="presenterTitle">
				<section class="oc-page">
					<open-collections-section-header
						id="presenterTitle"
						heading-level="1"
						title="${escapeHtml(header.title)}"
						description="${escapeHtml(header.subtitle)}"
					></open-collections-section-header>
				</section>

				<section class="oc-page presenter-panel-wrap">
					<open-collections-panel-chrome
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
			${this.renderCreateFlowMarkup()}
		`;
	}

	afterRender() {
		this.shadowRoot
			?.getElementById("presenterAddAppBtn")
			?.addEventListener("click", () => this.openCreateFlow());

		this.shadowRoot?.getElementById("flowCancelBtn")?.addEventListener("click", () => {
			this.closeCreateFlow();
		});
		this.shadowRoot
			?.getElementById("flowSelectTimeComparerBtn")
			?.addEventListener("click", () => {
				if (this.getImageCandidates().length < 2) {
					this.state.createFlow.errorText =
						"Need at least two image items in the presentations collection to create a time comparer.";
					this.render();
					return;
				}
				this.selectTemplate("time-comparer");
			});
		this.shadowRoot?.getElementById("flowBackBtn")?.addEventListener("click", () => {
			const flow = this.state.createFlow;
			flow.errorText = "";
			if (flow.step <= 1) {
				flow.stage = "picker";
			} else {
				flow.step -= 1;
			}
			this.render();
		});
		this.shadowRoot?.getElementById("flowNextBtn")?.addEventListener("click", () => {
			const flow = this.state.createFlow;
			if (!this.validateStep()) {
				this.render();
				return;
			}
			if (flow.step >= 4) {
				this.saveTimeComparerItem();
				return;
			}
			flow.step += 1;
			this.render();
		});

		this.shadowRoot
			?.getElementById("flowPastItemSelect")
			?.addEventListener("change", (event) => {
				const target = event.currentTarget;
				if (!(target instanceof HTMLSelectElement)) {
					return;
				}
				this.state.createFlow.pastItemId = target.value;
				this.state.createFlow.errorText = "";
			});
		this.shadowRoot
			?.getElementById("flowPresentItemSelect")
			?.addEventListener("change", (event) => {
				const target = event.currentTarget;
				if (!(target instanceof HTMLSelectElement)) {
					return;
				}
				this.state.createFlow.presentItemId = target.value;
				this.state.createFlow.errorText = "";
			});
		this.shadowRoot
			?.getElementById("flowPastLabelInput")
			?.addEventListener("input", (event) => {
				const target = event.currentTarget;
				if (!(target instanceof HTMLInputElement)) {
					return;
				}
				this.state.createFlow.pastLabel = target.value;
			});
		this.shadowRoot
			?.getElementById("flowPresentLabelInput")
			?.addEventListener("input", (event) => {
				const target = event.currentTarget;
				if (!(target instanceof HTMLInputElement)) {
					return;
				}
				this.state.createFlow.presentLabel = target.value;
			});
		this.shadowRoot
			?.getElementById("flowSplitInput")
			?.addEventListener("input", (event) => {
				const target = event.currentTarget;
				if (!(target instanceof HTMLInputElement)) {
					return;
				}
				this.state.createFlow.initialSplit = clampSplit(Number(target.value) / 100);
			});
		this.shadowRoot
			?.getElementById("flowShowLabelsInput")
			?.addEventListener("change", (event) => {
				const target = event.currentTarget;
				if (!(target instanceof HTMLInputElement)) {
					return;
				}
				this.state.createFlow.showLabels = target.checked;
			});

		const grid = this.shadowRoot?.getElementById("presenterGrid");
		grid?.addEventListener("click", (event) => {
			const path = typeof event.composedPath === "function" ? event.composedPath() : [];
			for (const node of path) {
				if (!(node instanceof HTMLElement)) {
					continue;
				}
				const editItemId = String(node.dataset?.editItemId || "").trim();
				if (!editItemId) {
					continue;
				}
				this.openEditFlow(editItemId);
				return;
			}
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
