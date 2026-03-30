import "./preview-summary-card.js";

class OcCardItemElement extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.model = {
			title: "",
			subtitle: "",
			countLabel: "",
			previewImages: [],
			previewUrl: "",
			actionLabel: "Open item",
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

	resolvePreviewImages() {
		const explicit = Array.isArray(this.model.previewImages)
			? this.model.previewImages.filter(Boolean)
			: [];
		if (explicit.length) {
			return explicit.slice(0, 3);
		}
		const previewUrl = String(this.model.previewUrl || "").trim();
		return previewUrl ? [previewUrl] : [];
	}

	applyModel() {
		const card = this.shadowRoot?.getElementById("card");
		if (!card) {
			return;
		}
		card.update({
			title: this.model.title || "Item",
			subtitle: this.model.subtitle || "",
			countLabel: this.model.countLabel || "",
			previewImages: this.resolvePreviewImages(),
			placeholderLabel: "Item",
			actionLabel: this.model.actionLabel || "Open item",
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
          pointer-events: none;
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

if (!customElements.get("oc-card-item")) {
	customElements.define("oc-card-item", OcCardItemElement);
}

export { OcCardItemElement };

