import "../../../../shared/ui/primitives/index.js";
import { browserRendererStyles } from "../css/browser-renderers.css.js";

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
      <open-collections-card-layout id="sourceGrid"></open-collections-card-layout>
    `;

		const grid = this.shadowRoot.getElementById("sourceGrid");
		if (!grid) {
			return;
		}
		grid.update({
			mode: "grid",
			columnsDesktop: 6,
			columnsTablet: 4,
			columnsMobile: 2,
			gap: "0.7rem",
		});

		for (const source of sources) {
			const card = document.createElement("oc-card-collections");
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
			card.addEventListener("oc-card-activate", (event) => {
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
