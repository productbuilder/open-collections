import { rowListStyles } from "../css/row-list.css.js";

class PbBucketRowListElement extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.model = { assets: [], focusedAssetId: null, selectedAssetIds: [] };
	}

	connectedCallback() {
		this.render();
		this.bindEvents();
	}

	update(model = {}) {
		this.model = { ...this.model, ...model };
		if (this.isConnected) {
			this.render();
			this.bindEvents();
		}
	}

	bindEvents() {
		this.shadowRoot
			.querySelectorAll("tbody tr[data-focus-id]")
			.forEach((row) => {
				row.addEventListener("click", (event) => {
					if (
						event.target.closest('input[type="checkbox"], button')
					) {
						return;
					}
					this.dispatch("asset-focus", {
						assetId: row.dataset.focusId,
					});
				});
			});
		this.shadowRoot
			.querySelectorAll("[data-select-id]")
			.forEach((checkbox) => {
				checkbox.addEventListener("change", () => {
					this.dispatch("asset-selection-toggle", {
						assetId: checkbox.dataset.selectId,
					});
				});
			});
		this.shadowRoot
			.querySelectorAll("[data-preview-id]")
			.forEach((button) => {
				button.addEventListener("click", () => {
					this.dispatch("asset-preview", {
						assetId: button.dataset.previewId,
					});
				});
			});
	}

	dispatch(name, detail = {}) {
		this.dispatchEvent(
			new CustomEvent(name, { detail, bubbles: true, composed: true }),
		);
	}

	render() {
		const rows = this.model.assets
			.map((asset) => {
				const isFocused = asset.id === this.model.focusedAssetId;
				const isSelected = this.model.selectedAssetIds.includes(
					asset.id,
				);
				return `
        <tr data-focus-id="${asset.id}" class="${isFocused ? "is-focused" : ""}">
          <td><input type="checkbox" data-select-id="${asset.id}" ${isSelected ? "checked" : ""} aria-label="Select ${asset.name}" /></td>
          <td>${asset.name}</td>
          <td>${asset.kind}</td>
          <td>${asset.syncState}</td>
          <td>${asset.sizeLabel}</td>
          <td><button class="btn" type="button" data-preview-id="${asset.id}">Preview</button></td>
        </tr>
      `;
			})
			.join("");

		this.shadowRoot.innerHTML = `
      <style>${rowListStyles}</style>
      <section class="row-list-wrap">
        <table>
          <thead>
            <tr><th></th><th>Name</th><th>Type</th><th>State</th><th>Size</th><th>Preview</th></tr>
          </thead>
          <tbody>${rows || '<tr><td colspan="6" class="empty">No assets match this path and filter set.</td></tr>'}</tbody>
        </table>
      </section>
    `;
	}
}

if (!customElements.get("pb-bucket-row-list")) {
	customElements.define("pb-bucket-row-list", PbBucketRowListElement);
}
