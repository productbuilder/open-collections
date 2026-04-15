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
	const timeRange =
		source.timeRange && typeof source.timeRange === "object"
			? source.timeRange
			: {};
	return {
		text: toText(source.text),
		types: toUniqueStringList(source.types),
		mediaTypes: toUniqueStringList(source.mediaTypes),
		timeRange: {
			start: toText(timeRange.start),
			end: toText(timeRange.end),
		},
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
		display: grid;
		grid-template-rows: minmax(0, 1fr) auto;
		min-height: 0;
		inline-size: 100%;
		max-inline-size: 100%;
		min-inline-size: 0;
		box-sizing: border-box;
		overflow-x: hidden;
		color: var(--oc-text-primary, #0f172a);
	}

	*,
	*::before,
	*::after {
		box-sizing: inherit;
	}

	.filter-panel {
		display: grid;
		grid-template-rows: minmax(0, 1fr);
		min-height: 0;
		min-inline-size: 0;
	}

	.panel-body {
		display: grid;
		min-height: 0;
		min-inline-size: 0;
		overflow-y: auto;
		overflow-x: hidden;
	}

	.group {
		display: grid;
		gap: 0.65rem;
		padding: 1rem;
		min-inline-size: 0;
		border-bottom: 1px solid #dbe3ed;
	}

	.group-title {
		margin: 0;
		font-size: 0.82rem;
		font-weight: 700;
		color: #334155;
	}

	.option-list {
		display: grid;
		gap: 0.5rem;
	}

	.option {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		padding: 0.25rem 0;
		font-size: 0.88rem;
		min-inline-size: 0;
	}

	.option input[type="checkbox"] {
		inline-size: 1.1rem;
		block-size: 1.1rem;
		flex: 0 0 auto;
	}

	.option-label {
		min-inline-size: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.option-count {
		margin-inline-start: auto;
		font-size: 0.78rem;
		color: #64748b;
	}

	.option-empty {
		margin: 0;
		font-size: 0.8rem;
		color: #64748b;
	}

	.time-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.65rem;
	}

	.time-field {
		display: grid;
		gap: 0.35rem;
		font-size: 0.8rem;
		color: #475569;
	}

	.time-input {
		inline-size: 100%;
		min-width: 0;
		block-size: 2.35rem;
		border-radius: 0.65rem;
		border: 1px solid #cbd5e1;
		padding: 0 0.65rem;
		background: #fff;
		font: inherit;
		color: inherit;
	}

	.panel-footer {
		position: sticky;
		bottom: 0;
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 0.6rem;
		align-items: center;
		padding: 0.8rem 1rem calc(
			0.8rem + var(--oc-filter-panel-footer-safe-area, env(safe-area-inset-bottom, 0px))
		);
		background: #ffffff;
		border-top: 1px solid #dbe3ed;
		min-inline-size: 0;
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
		border: 1px solid #d0d7e2;
		background: #ffffff;
		color: inherit;
		font: inherit;
		font-size: 0.84rem;
		font-weight: 600;
		border-radius: 999px;
		block-size: 2.25rem;
		padding: 0 0.9rem;
	}

	.primary-button {
		border: none;
		background: #0f172a;
		color: #ffffff;
		font: inherit;
		font-size: 0.94rem;
		font-weight: 700;
		border-radius: 0.78rem;
		block-size: 2.8rem;
		padding: 0 1rem;
		cursor: pointer;
	}

	@media (max-width: 760px) {
		.panel-footer {
			grid-template-columns: minmax(0, 1fr);
		}

		.time-grid {
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
		this._resultCount = null;
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

	set resultCount(value) {
		const parsed = Number(value);
		this._resultCount = Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : null;
		this.render();
	}

	get resultCount() {
		return Number.isFinite(this._resultCount) ? this._resultCount : null;
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
			return;
		}
		if (target.closest('[data-action="apply-filters"]')) {
			this.dispatchEvent(
				new CustomEvent("oc-filter-panel-submit", {
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
			timeRange: {
				start: toText(
					this.shadowRoot.querySelector('[data-bind="time-start"]')?.value,
				),
				end: toText(
					this.shadowRoot.querySelector('[data-bind="time-end"]')?.value,
				),
			},
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
		const filterOptionsStatus = this.filterOptionsStatus;
		const resultsCount = this.resultCount;
		const showResultsLabel = Number.isFinite(resultsCount)
			? `Show ${resultsCount} result${resultsCount === 1 ? "" : "s"}`
			: "Show results";
		return `
			<section class="filter-panel" aria-label="Browse filters">
				<div class="panel-body">
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
					<section class="group" aria-label="Time filters">
						<h3 class="group-title">Time</h3>
						<div class="time-grid">
							<label class="time-field">
								<span>From</span>
								<input
									class="time-input"
									type="date"
									data-bind="time-start"
									value="${escapeHtml(state.timeRange?.start || "")}"
								>
							</label>
							<label class="time-field">
								<span>To</span>
								<input
									class="time-input"
									type="date"
									data-bind="time-end"
									value="${escapeHtml(state.timeRange?.end || "")}"
								>
							</label>
						</div>
					</section>
				</div>
				<footer class="panel-footer">
					<button type="button" class="action-button" data-action="clear-filters">Clear all</button>
					<button type="button" class="primary-button" data-action="apply-filters">${showResultsLabel}</button>
				</footer>
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
