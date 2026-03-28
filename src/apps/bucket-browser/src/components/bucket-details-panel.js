import { detailsStyles } from "../css/details.css.js";

class PbBucketDetailsPanelElement extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.model = { asset: null, selectionCount: 0, mobileOpen: false };
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
			.getElementById("openPreviewBtn")
			?.addEventListener("click", () => {
				if (this.model.asset) {
					this.dispatchEvent(
						new CustomEvent("asset-preview", {
							detail: { assetId: this.model.asset.id },
							bubbles: true,
							composed: true,
						}),
					);
				}
			});
	}

	render() {
		const asset = this.model.asset;
		this.shadowRoot.innerHTML = `
      <style>${detailsStyles}</style>
      <section class="details-panel ${this.model.mobileOpen ? "is-mobile-open" : ""}">
        <div class="panel-header">
          <h2>Details</h2>
          <p>Focused asset remains separate from multi-select state (${this.model.selectionCount} selected).</p>
        </div>
        ${
			asset
				? `
          <article class="details-card">
            <h3>${asset.name}</h3>
            <p>${asset.summary}</p>
            <dl>
              <div><dt>Path</dt><dd>${asset.path}</dd></div>
              <div><dt>Type</dt><dd>${asset.kind}</dd></div>
              <div><dt>Availability</dt><dd>${asset.syncState}</dd></div>
              <div><dt>Updated</dt><dd>${asset.updatedAt}</dd></div>
              <div><dt>Size</dt><dd>${asset.sizeLabel}</dd></div>
            </dl>
            <button id="openPreviewBtn" class="btn btn-primary" type="button">Open preview</button>
          </article>
        `
				: '<div class="empty">Focus an asset to inspect details here.</div>'
		}
      </section>
    `;
	}
}

if (!customElements.get("pb-bucket-details-panel")) {
	customElements.define(
		"pb-bucket-details-panel",
		PbBucketDetailsPanelElement,
	);
}
