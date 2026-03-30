import "../../../../shared/ui/primitives/index.js";
import { browserRendererStyles } from "../css/browser-renderers.css.js";

class OpenBrowserSourceCardGridElement extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.model = {
			sources: [],
			activeSourceId: "",
		};
	}

	connectedCallback() {
		this.render();
	}

	update(data = {}) {
		this.model = { ...this.model, ...data };
		this.render();
	}

	dispatch(name, detail = {}) {
		this.dispatchEvent(
			new CustomEvent(name, { detail, bubbles: true, composed: true }),
		);
	}

	render() {
		const sources = Array.isArray(this.model.sources)
			? this.model.sources
			: [];

		if (sources.length === 0) {
			this.shadowRoot.innerHTML = `
        <style>${browserRendererStyles}</style>
        <open-collections-empty-state
          title="No sources available"
          message="Configure source entries to start browsing."
        ></open-collections-empty-state>
      `;
			return;
		}

		this.shadowRoot.innerHTML = `
      <style>${browserRendererStyles}</style>
      <div class="asset-grid" id="sourceGrid"></div>
    `;

		const grid = this.shadowRoot.getElementById("sourceGrid");
		if (!grid) {
			return;
		}

		for (const source of sources) {
			const card = document.createElement(
				"open-collections-preview-summary-card",
			);
			card.update({
				title: source.label || "Source",
				subtitle:
					source.subtitle ||
					(source.sourceType === "collections.json"
						? "Multi-collection source"
						: "Single collection source"),
				countLabel: source.countLabel || "",
				previewImages: Array.isArray(source.previewImages)
					? source.previewImages
					: [],
				placeholderLabel: "Source",
				actionLabel: "Browse",
				actionValue: source.id || "",
				active: this.model.activeSourceId === source.id,
			});
			card.addEventListener("preview-card-activate", (event) => {
				const sourceId = String(event.detail?.value || "").trim();
				if (!sourceId) {
					return;
				}
				this.dispatch("source-open", { sourceId });
			});
			grid.appendChild(card);
		}
	}
}

if (!customElements.get("open-browser-source-card-grid")) {
	customElements.define(
		"open-browser-source-card-grid",
		OpenBrowserSourceCardGridElement,
	);
}

export { OpenBrowserSourceCardGridElement };
