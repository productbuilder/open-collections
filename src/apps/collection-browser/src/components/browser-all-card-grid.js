import "../../../../shared/ui/primitives/index.js";
import { browserRendererStyles } from "../css/browser-renderers.css.js";

class OpenBrowserAllCardGridElement extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.model = {
			entities: [],
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

	dispatchByKind(entity) {
		const kind = String(entity?.browseKind || "").trim();
		if (kind === "source") {
			const sourceId = String(entity.actionValue || entity.id || "").trim();
			if (sourceId) {
				this.dispatch("source-open", { sourceId });
			}
			return;
		}
		if (kind === "collection") {
			const manifestUrl = String(
				entity.manifestUrl || entity.actionValue || "",
			).trim();
			if (manifestUrl) {
				this.dispatch("collection-open", { manifestUrl });
			}
			return;
		}
		const itemId = String(entity.actionValue || entity.id || "").trim();
		if (itemId) {
			this.dispatch("item-open", { itemId });
		}
	}

	render() {
		const entities = Array.isArray(this.model.entities)
			? this.model.entities
			: [];
		if (entities.length === 0) {
			this.shadowRoot.innerHTML = `
        <style>${browserRendererStyles}</style>
        <open-collections-empty-state
          title="No browse entities"
          message="No sources, collections, or items are available yet."
        ></open-collections-empty-state>
      `;
			return;
		}

		this.shadowRoot.innerHTML = `
      <style>${browserRendererStyles}</style>
      <div class="asset-grid" id="allGrid"></div>
    `;
		const grid = this.shadowRoot.getElementById("allGrid");
		if (!grid) {
			return;
		}

		for (const entity of entities) {
			const previewImages =
				entity.browseKind === "item"
					? [entity.previewUrl].filter(Boolean)
					: Array.isArray(entity.previewImages)
						? entity.previewImages
						: [];
			const actionLabel =
				entity.browseKind === "source"
					? "Browse source"
					: entity.browseKind === "collection"
						? "Open collection"
						: "Open item";
			const card = document.createElement(
				"open-collections-preview-summary-card",
			);
			card.update({
				title: entity.title || "Browse entity",
				subtitle: entity.subtitle || "",
				countLabel:
					entity.countLabel ||
					(entity.browseKind ? entity.browseKind : ""),
				previewImages,
				placeholderLabel: entity.browseKind || "Card",
				actionLabel,
				actionValue: entity.actionValue || entity.id || "",
				active: entity.active === true,
			});
			card.addEventListener("preview-card-activate", () => {
				this.dispatchByKind(entity);
			});
			grid.appendChild(card);
		}
	}
}

if (!customElements.get("open-browser-all-card-grid")) {
	customElements.define(
		"open-browser-all-card-grid",
		OpenBrowserAllCardGridElement,
	);
}

export { OpenBrowserAllCardGridElement };

