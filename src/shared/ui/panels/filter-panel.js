import { BaseElement } from "../app-foundation/base-element.js";
import { appFoundationTokenStyles } from "../app-foundation/tokens.css.js";

function toText(value) {
	return String(value ?? "").trim();
}

function toUniqueStringList(value) {
	if (!Array.isArray(value)) {
		return [];
	}
	const unique = new Set();
	for (const entry of value) {
		const text = toText(entry);
		if (text) {
			unique.add(text);
		}
	}
	return [...unique];
}

function normalizeFilterState(value = {}) {
	const source = value && typeof value === "object" ? value : {};
	return {
		text: toText(source.text),
		types: toUniqueStringList(source.types),
		mediaTypes: toUniqueStringList(source.mediaTypes),
	};
}

function normalizeFilterOptions(value = {}) {
	const source = value && typeof value === "object" ? value : {};
	const normalizeEntryList = (entries) =>
		(Array.isArray(entries) ? entries : [])
			.map((entry) => {
				if (!entry || typeof entry !== "object") {
					return null;
				}
				const valueText = toText(entry.value);
				if (!valueText) {
					return null;
				}
				return {
					value: valueText,
					label: toText(entry.label) || valueText,
					count: Number.isFinite(Number(entry.count))
						? Number(entry.count)
						: null,
					children: normalizeEntryList(entry.children),
				};
			})
			.filter(Boolean);
	return {
		types: normalizeEntryList(source.types),
		mediaTypes: normalizeEntryList(source.mediaTypes),
	};
}

function flattenOptionEntries(entries = []) {
	if (!Array.isArray(entries) || entries.length === 0) {
		return [];
	}
	const flattened = [];
	const walk = (nodes = []) => {
		for (const node of nodes) {
			if (!node || typeof node !== "object") {
				continue;
			}
			const value = toText(node.value);
			if (value) {
				flattened.push({
					value,
					label: toText(node.label) || value,
					count: Number.isFinite(Number(node.count)) ? Number(node.count) : null,
				});
			}
			if (Array.isArray(node.children) && node.children.length > 0) {
				walk(node.children);
			}
		}
	};
	walk(entries);
	return flattened;
}

function normalizeFilterOptionsStatus(value) {
	const status = toText(value).toLowerCase();
	if (status === "loading" || status === "ready" || status === "empty") {
		return status;
	}
	return "empty";
}

function escapeHtml(value) {
	return String(value ?? "")
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");
}

const filterPanelStyles = `
	${appFoundationTokenStyles}

	:host {
		display: block;
		color: var(--oc-text-primary, #0f172a);
	}

	.filter-panel {
		display: grid;
		gap: 0.9rem;
	}

	.header {
		display: grid;
		gap: 0.25rem;
	}

	.title {
		margin: 0;
		font-size: 0.95rem;
		font-weight: 700;
	}

	.subtitle {
		margin: 0;
		font-size: 0.8rem;
		color: var(--oc-text-muted, #475569);
	}

	.search-input {
		inline-size: 100%;
		block-size: 2.25rem;
		border-radius: 0.68rem;
		border: 1px solid #cbd5e1;
		padding: 0 0.68rem;
		font: inherit;
		font-size: 0.86rem;
		background: #ffffff;
		color: inherit;
	}

	.group {
		display: grid;
		gap: 0.5rem;
	}

	.group-title {
		margin: 0;
		font-size: 0.78rem;
		font-weight: 700;
		color: #334155;
		letter-spacing: 0.02em;
		text-transform: uppercase;
	}

	.option-list {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.45rem;
	}

	.option {
		display: flex;
		align-items: center;
		gap: 0.45rem;
		border: 1px solid #dbe3ed;
		border-radius: 0.64rem;
		padding: 0.4rem 0.48rem;
		background: #f8fafc;
		font-size: 0.8rem;
		min-inline-size: 0;
	}

	.option-label {
		min-inline-size: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.option-count {
		margin-inline-start: auto;
		font-size: 0.72rem;
		color: #64748b;
	}

	.option-empty {
		margin: 0;
		font-size: 0.8rem;
		color: #64748b;
	}

	.actions {
		display: flex;
		gap: 0.5rem;
		justify-content: flex-end;
	}

	.sr-only {
		position: absolute;
		inline-size: 1px;
		block-size: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	.action-button {
		border: 1px solid #cbd5e1;
		background: #ffffff;
		color: inherit;
		font: inherit;
		font-size: 0.82rem;
		font-weight: 600;
		border-radius: 999px;
		block-size: 2rem;
		padding: 0 0.72rem;
	}

	@media (max-width: 760px) {
		.option-list {
			grid-template-columns: minmax(0, 1fr);
		}
	}
`;

class OpenCollectionsFilterPanelElement extends BaseElement {
	static get observedAttributes() {
		return ["show-text-search", "show-panel-header"];
	}

	constructor() {
		super();
		this._filterState = normalizeFilterState();
		this._filterOptions = normalizeFilterOptions();
		this._filterOptionsStatus = "empty";
		this._onInput = this.onInput.bind(this);
		this._onClick = this.onClick.bind(this);
	}

	renderStyles() {
		return filterPanelStyles;
	}

	set filterState(value) {
		this._filterState = normalizeFilterState(value);
		this.render();
	}

	get filterState() {
		return normalizeFilterState(this._filterState);
	}

	set filterOptions(value) {
		this._filterOptions = normalizeFilterOptions(value);
		this.render();
	}

	get filterOptions() {
		return normalizeFilterOptions(this._filterOptions);
	}

	set filterOptionsStatus(value) {
		this._filterOptionsStatus = normalizeFilterOptionsStatus(value);
		this.render();
	}

	get filterOptionsStatus() {
		return normalizeFilterOptionsStatus(this._filterOptionsStatus);
	}

	get showTextSearch() {
		if (!this.hasAttribute("show-text-search")) {
			return true;
		}
		const rawValue = this.getAttribute("show-text-search");
		return rawValue !== "false";
	}

	get showPanelHeader() {
		if (!this.hasAttribute("show-panel-header")) {
			return true;
		}
		const rawValue = this.getAttribute("show-panel-header");
		return rawValue !== "false";
	}

	onConnected() {
		this.shadowRoot.addEventListener("input", this._onInput);
		this.shadowRoot.addEventListener("change", this._onInput);
		this.shadowRoot.addEventListener("click", this._onClick);
	}

	onDisconnected() {
		this.shadowRoot.removeEventListener("input", this._onInput);
		this.shadowRoot.removeEventListener("change", this._onInput);
		this.shadowRoot.removeEventListener("click", this._onClick);
	}

	onInput() {
		this.dispatchFilterChange();
	}

	onClick(event) {
		const target = event?.target;
		if (!(target instanceof Element)) {
			return;
		}
		if (target.closest('[data-action="clear-filters"]')) {
			this.dispatchEvent(
				new CustomEvent("oc-filter-panel-clear", {
					bubbles: true,
					composed: true,
				}),
			);
		}
	}

	dispatchFilterChange() {
		const textInput = this.shadowRoot.querySelector('[data-bind="text-input"]');
		const typeInputs = this.shadowRoot.querySelectorAll(
			'input[name="type-filter"]:checked',
		);
		const detail = {
			types: [...typeInputs]
				.map((entry) => toText(entry.value))
				.filter(Boolean),
			mediaTypes: [
				...this.shadowRoot.querySelectorAll(
					'input[name="media-type-filter"]:checked',
				),
			]
				.map((entry) => toText(entry.value))
				.filter(Boolean),
		};
		if (this.showTextSearch) {
			detail.text = toText(textInput?.value);
		}
		this.dispatchEvent(
			new CustomEvent("oc-filter-panel-change", {
				detail,
				bubbles: true,
				composed: true,
			}),
		);
	}

	renderOptions(entries = [], inputName = "", selected = [], status = "empty") {
		if (status === "loading") {
			return `<p class="option-empty">Loading options…</p>`;
		}
		if (!entries.length) {
			return `<p class="option-empty">No options available.</p>`;
		}
		const selectedSet = new Set(toUniqueStringList(selected));
		return `<div class="option-list">${entries
			.map((entry) => {
				const checked = selectedSet.has(entry.value) ? "checked" : "";
				return `
					<label class="option">
						<input type="checkbox" name="${inputName}" value="${escapeHtml(entry.value)}" ${checked}>
						<span class="option-label">${escapeHtml(entry.label)}</span>
						${entry.count !== null ? `<span class="option-count">${entry.count}</span>` : ""}
					</label>
				`;
			})
			.join("")}</div>`;
	}

	renderTemplate() {
		const state = this._filterState;
		const options = this._filterOptions;
		const showTextSearch = this.showTextSearch;
		const showPanelHeader = this.showPanelHeader;
		const filterOptionsStatus = this.filterOptionsStatus;
		const subtitle = showTextSearch
			? "Search and narrow items by type and media type."
			: "Narrow items by type and media type.";
		return `
			<section class="filter-panel" aria-label="Browse filters">
				${
					showPanelHeader
						? `<header class="header">
					<h2 class="title">Filters</h2>
					<p class="subtitle">${subtitle}</p>
				</header>`
						: ""
				}
				${
					showTextSearch
						? `<label>
					<span class="sr-only">Search text</span>
					<input
						data-bind="text-input"
						class="search-input"
						type="search"
						placeholder="Search titles, tags, and places"
						value="${escapeHtml(state.text)}"
					>
				</label>`
						: ""
				}
				<section class="group" aria-label="Type filters">
					<h3 class="group-title">Type</h3>
					${this.renderOptions(
						flattenOptionEntries(options.types),
						"type-filter",
						state.types,
						filterOptionsStatus,
					)}
				</section>
				<section class="group" aria-label="Media type filters">
					<h3 class="group-title">Media type</h3>
					${this.renderOptions(
						options.mediaTypes,
						"media-type-filter",
						state.mediaTypes,
						filterOptionsStatus,
					)}
				</section>
				<div class="actions">
					<button type="button" class="action-button" data-action="clear-filters">Clear all</button>
				</div>
			</section>
		`;
	}
}

if (!customElements.get("open-collections-filter-panel")) {
	customElements.define(
		"open-collections-filter-panel",
		OpenCollectionsFilterPanelElement,
	);
}

export { OpenCollectionsFilterPanelElement };
