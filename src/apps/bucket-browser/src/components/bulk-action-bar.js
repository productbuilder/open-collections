import { bulkActionStyles } from "../css/bulk-action.css.js";

class PbBulkActionBarElement extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.model = { selectedCount: 0 };
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
		this.shadowRoot.querySelectorAll("[data-action]").forEach((button) => {
			button.addEventListener("click", () => {
				this.dispatchEvent(
					new CustomEvent("bulk-action", {
						detail: { actionId: button.dataset.action },
						bubbles: true,
						composed: true,
					}),
				);
			});
		});
		this.shadowRoot
			.getElementById("clearSelectionBtn")
			?.addEventListener("click", () => {
				this.dispatchEvent(
					new CustomEvent("selection-clear", {
						bubbles: true,
						composed: true,
					}),
				);
			});
	}

	render() {
		const visible = this.model.selectedCount > 0;
		this.shadowRoot.innerHTML = `
      <style>${bulkActionStyles}</style>
      <section class="bulk-action-bar ${visible ? "is-visible" : ""}">
        <div class="bulk-copy">${this.model.selectedCount} asset(s) selected for future shared workspace actions.</div>
        <div class="bulk-actions">
          <button class="btn btn-primary" type="button" data-action="queue-download">Queue download</button>
          <button class="btn" type="button" data-action="stage-working-copy">Stage working copy</button>
          <button class="btn" type="button" id="clearSelectionBtn">Clear</button>
        </div>
      </section>
    `;
	}
}

if (!customElements.get("pb-bulk-action-bar")) {
	customElements.define("pb-bulk-action-bar", PbBulkActionBarElement);
}
