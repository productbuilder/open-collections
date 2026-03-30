import "../../../../shared/ui/primitives/index.js";
import { browserRendererStyles } from "../css/browser-renderers.css.js";
import "./browser-source-summary-card.js";

class OpenBrowserSourceCardGridElement extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.model = {
			sources: [],
			sourceCards: [],
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
		const sourceCards = Array.isArray(this.model.sourceCards)
			? this.model.sourceCards
			: [];
		const sources = sourceCards.length
			? sourceCards
			: (Array.isArray(this.model.sources) ? this.model.sources : []).map(
					(source) => ({
						browseKind: "source",
						id: source.id || "",
						title: source.label || "Source",
						subtitle:
							source.subtitle ||
							(source.sourceType === "collections.json"
								? "Multi-collection source"
								: "Single collection source"),
						countLabel: source.countLabel || "",
						previewRows: Array.isArray(source.previewRows)
							? source.previewRows
							: [],
						previewImages: Array.isArray(source.previewImages)
							? source.previewImages
							: [],
						actionLabel: "Browse",
						actionValue: source.id || "",
						active: this.model.activeSourceId === source.id,
					}),
				);

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
			const card = document.createElement("open-browser-source-summary-card");
			card.update({
				title: source.title || "Source",
				subtitle: source.subtitle || "Source",
				countLabel: source.countLabel || "",
				previewRows: Array.isArray(source.previewRows) ? source.previewRows : [],
				previewImages: Array.isArray(source.previewImages)
					? source.previewImages
					: [],
				actionLabel: source.actionLabel || "Browse",
				actionValue: source.actionValue || source.id || "",
				active:
					source.active === true ||
					this.model.activeSourceId === source.id,
			});
			card.addEventListener("source-card-activate", (event) => {
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
