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
      <style>
        :host {
          display: block;
          min-height: 0;
          pointer-events: none;
        }

        .mixed-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          grid-auto-rows: minmax(120px, auto);
          align-items: stretch;
          align-content: start;
          gap: 0.7rem;
          min-height: 0;
          pointer-events: none;
        }

        .mixed-cell {
          min-width: 0;
          min-height: 0;
          display: block;
          border-radius: 14px;
          pointer-events: none;
        }

        .mixed-cell.kind-source {
          grid-column: span 2;
          grid-row: span 2;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.5rem;
          border: 1px solid #dbe8f8;
          background: linear-gradient(180deg, #f4f9ff 0%, #ffffff 100%);
        }

        .mixed-cell.kind-collection {
          grid-column: span 2;
          grid-row: span 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.45rem;
          border: 1px solid #e2e8f0;
          background: linear-gradient(180deg, #f8fbff 0%, #ffffff 100%);
        }

        .mixed-cell.kind-item {
          grid-column: span 1;
          grid-row: span 1;
        }

        .mixed-cell > open-collections-preview-summary-card {
          display: block;
          height: 100%;
          pointer-events: auto;
        }

        .mixed-cell.kind-source > open-collections-preview-summary-card {
          width: min(100%, 34rem);
          height: auto;
        }

        .mixed-cell.kind-collection > open-collections-preview-summary-card {
          width: min(100%, 30rem);
          height: auto;
        }

        .mixed-cell.kind-item > open-collections-preview-summary-card {
          width: 100%;
          height: 100%;
        }

        @media (max-width: 1040px) {
          .mixed-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          .mixed-cell.kind-source {
            grid-column: span 2;
            grid-row: span 2;
          }

          .mixed-cell.kind-collection {
            grid-column: span 2;
            grid-row: span 1;
          }

          .mixed-cell.kind-source > open-collections-preview-summary-card {
            width: min(100%, 30rem);
          }

          .mixed-cell.kind-collection > open-collections-preview-summary-card {
            width: min(100%, 27rem);
          }
        }

        @media (max-width: 760px) {
          .mixed-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            grid-auto-rows: auto;
            gap: 0.55rem;
          }

          .mixed-cell.kind-source,
          .mixed-cell.kind-collection,
          .mixed-cell.kind-item {
            grid-column: span 1;
            grid-row: span 1;
            padding: 0;
            border: 0;
            background: transparent;
          }

          .mixed-cell.kind-source > open-collections-preview-summary-card,
          .mixed-cell.kind-collection > open-collections-preview-summary-card,
          .mixed-cell.kind-item > open-collections-preview-summary-card {
            width: 100%;
            height: auto;
          }
        }
      </style>
      <div class="asset-grid mixed-grid" id="allGrid"></div>
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
			const wrapper = document.createElement("div");
			const kind = String(entity?.browseKind || "item").trim() || "item";
			wrapper.className = `mixed-cell kind-${kind}`;
			wrapper.dataset.browseKind = kind;
			wrapper.appendChild(card);
			grid.appendChild(wrapper);
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
