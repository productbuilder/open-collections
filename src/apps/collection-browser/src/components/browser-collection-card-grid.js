import "../../../../shared/ui/primitives/index.js";
import { browserRendererStyles } from "../css/browser-renderers.css.js";

function deriveItemPreviewUrl(item) {
	return String(item?.media?.thumbnailUrl || item?.media?.url || "").trim();
}

function deriveCollectionPreviewImages(collection) {
	const items = Array.isArray(collection?.items) ? collection.items : [];
	const previewImages = [];
	for (const item of items) {
		const previewUrl = deriveItemPreviewUrl(item);
		if (!previewUrl) {
			continue;
		}
		previewImages.push(previewUrl);
		if (previewImages.length >= 3) {
			break;
		}
	}
	return previewImages;
}

class OpenBrowserCollectionCardGridElement extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.model = {
			collections: [],
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
		const collections = Array.isArray(this.model.collections)
			? this.model.collections
			: [];

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
      <div class="asset-grid" id="collectionGrid"></div>
    `;

		const grid = this.shadowRoot.getElementById("collectionGrid");
		if (!grid) {
			return;
		}

		for (const entry of collections) {
			const itemCount = entry.collection?.items?.length || 0;
			const card = document.createElement(
				"open-collections-preview-summary-card",
			);
			card.update({
				title: entry.label || "Collection",
				subtitle:
					entry.description || "Select to browse this collection.",
				countLabel: `${itemCount} item${itemCount === 1 ? "" : "s"}`,
				previewImages: deriveCollectionPreviewImages(entry.collection),
				placeholderLabel: "Collection",
				actionLabel: "Open",
				actionValue: entry.manifestUrl || "",
				active:
					Boolean(this.model.selectedManifestUrl) &&
					this.model.selectedManifestUrl === entry.manifestUrl,
			});
			card.addEventListener("preview-card-activate", (event) => {
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
