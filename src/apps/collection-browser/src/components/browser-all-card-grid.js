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
			? this.model.entities.filter(
					(entity) => entity && typeof entity === "object",
				)
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

        oc-grid {
          display: block;
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
          display: flex;
          align-items: flex-start;
        }

        .mixed-cell > oc-card-collections,
        .mixed-cell > oc-card-collection,
        .mixed-cell > oc-card-item {
          display: block;
          height: auto;
          max-width: 100%;
          align-self: flex-start;
        }

        .mixed-cell.kind-source > oc-card-collections {
          width: min(100%, 34rem);
          height: auto;
        }

        .mixed-cell.kind-collection > oc-card-collection {
          width: min(100%, 30rem);
          height: auto;
        }

        .mixed-cell.kind-item > oc-card-item {
          width: 100%;
          height: auto;
          max-width: 100%;
        }

        @media (max-width: 1040px) {
          .mixed-cell.kind-source > oc-card-collections {
            width: min(100%, 30rem);
          }

          .mixed-cell.kind-collection > oc-card-collection {
            width: min(100%, 27rem);
          }
        }

        @media (max-width: 760px) {
          .mixed-cell.kind-source,
          .mixed-cell.kind-collection,
          .mixed-cell.kind-item {
            padding: 0;
            border: 0;
            background: transparent;
          }

          .mixed-cell.kind-source > oc-card-collections,
          .mixed-cell.kind-collection > oc-card-collection,
          .mixed-cell.kind-item > oc-card-item {
            width: 100%;
            height: auto;
          }
        }
      </style>
      <oc-grid id="allGrid"></oc-grid>
    `;
		const grid = this.shadowRoot.getElementById("allGrid");
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

		for (const entity of entities) {
			const browseKind = String(entity.browseKind || "").trim();
			const previewImages =
				browseKind === "item"
					? [entity.previewUrl].filter(Boolean)
					: Array.isArray(entity.previewImages)
						? entity.previewImages
						: [];
			const actionLabel =
				browseKind === "source"
					? "Browse source"
					: browseKind === "collection"
						? "Open collection"
						: "Open item";
			const isSource = browseKind === "source";
			const tagName = isSource
				? "oc-card-collections"
				: browseKind === "collection"
				? "oc-card-collection"
				: "oc-card-item";
			const card = document.createElement(tagName);
			card.update({
				title: entity.title || "Browse entity",
				subtitle: entity.subtitle || "",
				countLabel:
					entity.countLabel ||
					(browseKind || ""),
				previewRows: Array.isArray(entity.previewRows) ? entity.previewRows : [],
				previewImages,
				actionLabel,
				actionValue: entity.actionValue || entity.id || "",
				active: entity.active === true,
				previewUrl: entity.previewUrl || "",
			});
			card.addEventListener("oc-card-activate", () => {
				this.dispatchByKind(entity);
			});
			const wrapper = document.createElement("div");
			const kind = String(entity?.browseKind || "item").trim() || "item";
			wrapper.className = `mixed-cell kind-${kind}`;
			wrapper.dataset.browseKind = kind;
			if (kind === "source") {
				wrapper.setAttribute("data-span-cols", "2");
				wrapper.setAttribute("data-span-rows", "2");
			} else if (kind === "collection") {
				wrapper.setAttribute("data-span-cols", "2");
				wrapper.setAttribute("data-span-rows", "1");
			} else {
				wrapper.setAttribute("data-span-cols", "1");
				wrapper.setAttribute("data-span-rows", "1");
			}
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
