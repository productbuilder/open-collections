import "./preview-summary-card.js";

class OcCardCollectionElement extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.model = {
			title: "",
			subtitle: "",
			countLabel: "",
			previewImages: [],
			actionLabel: "Open",
			actionValue: "",
			active: false,
			disabled: false,
		};
	}

	connectedCallback() {
		this.render();
		this.bindEvents();
		this.applyModel();
	}

	update(data = {}) {
		this.model = { ...this.model, ...data };
		this.applyModel();
	}

	bindEvents() {
		const card = this.shadowRoot.getElementById("card");
		if (!card || this._boundCard === card) {
			return;
		}
		card.addEventListener("preview-card-activate", (event) => {
			this.dispatchEvent(
				new CustomEvent("oc-card-activate", {
					detail: { value: event.detail?.value || this.model.actionValue || "" },
					bubbles: true,
					composed: true,
				}),
			);
		});
		this._boundCard = card;
	}

	applyModel() {
		const card = this.shadowRoot?.getElementById("card");
		if (!card) {
			return;
		}
		card.update({
			title: this.model.title || "Collection",
			subtitle: this.model.subtitle || "Select to browse this collection.",
			countLabel: this.model.countLabel || "",
			previewImages: Array.isArray(this.model.previewImages)
				? this.model.previewImages
				: [],
			placeholderLabel: "Collection",
			actionLabel: this.model.actionLabel || "Open",
			actionValue: this.model.actionValue || "",
			active: this.model.active === true,
			disabled: this.model.disabled === true,
		});
	}

	render() {
		this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          min-height: 0;
        }

        open-collections-preview-summary-card {
          display: block;
          pointer-events: auto;
        }
      </style>
      <open-collections-preview-summary-card id="card"></open-collections-preview-summary-card>
    `;
	}
}

if (!customElements.get("oc-card-collection")) {
	customElements.define("oc-card-collection", OcCardCollectionElement);
}

export { OcCardCollectionElement };

