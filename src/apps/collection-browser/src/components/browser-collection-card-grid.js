import "../../../../shared/ui/primitives/index.js";
import { browserRendererStyles } from "../css/browser-renderers.css.js";

class OpenBrowserCollectionCardGridElement extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.model = {
			collections: [],
			collectionCards: [],
			selectedManifestUrl: "",
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
		const collectionCards = Array.isArray(this.model.collectionCards)
			? this.model.collectionCards
			: [];
		const collections = collectionCards.length
			? collectionCards
			: (Array.isArray(this.model.collections)
					? this.model.collections
					: []).map((entry) => {
					const itemCount = entry.collection?.items?.length || 0;
					const previewImages = Array.isArray(entry.collection?.items)
						? entry.collection.items
								.map((item) =>
									String(
										item?.media?.thumbnailUrl || item?.media?.url || "",
									).trim(),
								)
								.filter(Boolean)
								.slice(0, 3)
						: [];
					return {
						browseKind: "collection",
						id: entry.id || entry.manifestUrl || "",
						title: entry.label || "Collection",
						subtitle:
							entry.description || "Select to browse this collection.",
						countLabel: `${itemCount} item${itemCount === 1 ? "" : "s"}`,
						previewImages,
						actionLabel: "Open",
						actionValue: entry.manifestUrl || "",
						active:
							Boolean(this.model.selectedManifestUrl) &&
							this.model.selectedManifestUrl === entry.manifestUrl,
					};
				});

		if (collections.length === 0) {
			this.shadowRoot.innerHTML = `
        <style>${browserRendererStyles}</style>
        <open-collections-empty-state
          title="No collections available"
          message="Choose a different source to browse collections."
        ></open-collections-empty-state>
      `;
			return;
		}

		this.shadowRoot.innerHTML = `
      <style>${browserRendererStyles}</style>
      <oc-grid id="collectionGrid"></oc-grid>
    `;

		const grid = this.shadowRoot.getElementById("collectionGrid");
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

		for (const entry of collections) {
			const card = document.createElement("oc-card-collection");
			card.update({
				title: entry.title || "Collection",
				subtitle: entry.subtitle || "Select to browse this collection.",
				countLabel: entry.countLabel || "",
				previewImages: Array.isArray(entry.previewImages)
					? entry.previewImages
					: [],
				placeholderLabel: "Collection",
				actionLabel: entry.actionLabel || "Open",
				actionValue: entry.actionValue || entry.manifestUrl || "",
				active:
					entry.active === true ||
					(Boolean(this.model.selectedManifestUrl) &&
						this.model.selectedManifestUrl === entry.manifestUrl),
			});
			card.addEventListener("oc-card-activate", (event) => {
				const manifestUrl = String(event.detail?.value || "").trim();
				if (!manifestUrl) {
					return;
				}
				this.dispatch("collection-open", { manifestUrl });
			});
			grid.appendChild(card);
		}
	}
}

if (!customElements.get("open-browser-collection-card-grid")) {
	customElements.define(
		"open-browser-collection-card-grid",
		OpenBrowserCollectionCardGridElement,
	);
}

export { OpenBrowserCollectionCardGridElement };
