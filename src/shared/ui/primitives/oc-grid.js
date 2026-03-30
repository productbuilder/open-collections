class OcGridElement extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.model = {
			mode: "grid",
			columnsDesktop: 6,
			columnsTablet: 4,
			columnsMobile: 2,
			gap: "0.7rem",
			listGap: "0.65rem",
		};
		this._slot = null;
	}

	connectedCallback() {
		this.render();
		this.applyLayoutConfig();
		this.applyChildSpanVars();
	}

	update(data = {}) {
		this.model = { ...this.model, ...data };
		if (!this.shadowRoot?.getElementById("layout")) {
			this.render();
		}
		this.applyLayoutConfig();
		this.applyChildSpanVars();
	}

	normalizedMode() {
		return this.model.mode === "list" ? "list" : "grid";
	}

	applyLayoutConfig() {
		const layout = this.shadowRoot?.getElementById("layout");
		if (!layout) {
			return;
		}
		const mode = this.normalizedMode();
		layout.classList.toggle("is-grid", mode === "grid");
		layout.classList.toggle("is-list", mode === "list");
		layout.style.setProperty(
			"--oc-layout-columns-desktop",
			String(Number(this.model.columnsDesktop) > 0 ? Number(this.model.columnsDesktop) : 6),
		);
		layout.style.setProperty(
			"--oc-layout-columns-tablet",
			String(Number(this.model.columnsTablet) > 0 ? Number(this.model.columnsTablet) : 4),
		);
		layout.style.setProperty(
			"--oc-layout-columns-mobile",
			String(Number(this.model.columnsMobile) > 0 ? Number(this.model.columnsMobile) : 2),
		);
		layout.style.setProperty("--oc-layout-gap", this.model.gap || "0.7rem");
		layout.style.setProperty(
			"--oc-layout-list-gap",
			this.model.listGap || "0.65rem",
		);
	}

	applyChildSpanVars() {
		const children = Array.from(this.children);
		for (const child of children) {
			if (!(child instanceof HTMLElement)) {
				continue;
			}
			const spanCols = Number(child.getAttribute("data-span-cols")) || 1;
			const spanRows = Number(child.getAttribute("data-span-rows")) || 1;
			child.style.setProperty("--oc-span-cols", String(Math.max(1, spanCols)));
			child.style.setProperty("--oc-span-rows", String(Math.max(1, spanRows)));
		}
	}

	render() {
		this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          min-height: 0;
        }

        * {
          box-sizing: border-box;
        }

        .layout {
          width: 100%;
          min-height: 0;
        }

        .layout.is-grid {
          display: grid;
          grid-template-columns: repeat(var(--oc-layout-columns-desktop, 6), minmax(0, 1fr));
          gap: var(--oc-layout-gap, 0.7rem);
          align-items: stretch;
          align-content: start;
        }

        .layout.is-grid ::slotted(*) {
          min-width: 0;
          min-height: 0;
          grid-column: span var(--oc-span-cols, 1);
          grid-row: span var(--oc-span-rows, 1);
        }

        .layout.is-list {
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: var(--oc-layout-list-gap, 0.65rem);
          align-items: stretch;
          align-content: start;
        }

        .layout.is-list ::slotted(*) {
          min-width: 0;
          min-height: 0;
          width: 100%;
        }

        @media (max-width: 1040px) {
          .layout.is-grid {
            grid-template-columns: repeat(var(--oc-layout-columns-tablet, 4), minmax(0, 1fr));
          }
        }

        @media (max-width: 760px) {
          .layout.is-grid {
            grid-template-columns: repeat(var(--oc-layout-columns-mobile, 2), minmax(0, 1fr));
          }

          .layout.is-grid ::slotted(*) {
            grid-column: span 1;
            grid-row: span 1;
          }
        }
      </style>
      <div id="layout" class="layout is-grid">
        <slot id="slot"></slot>
      </div>
    `;
		this._slot = this.shadowRoot.getElementById("slot");
		this._slot?.addEventListener("slotchange", () => {
			this.applyChildSpanVars();
		});
	}
}

if (!customElements.get("oc-grid")) {
	customElements.define("oc-grid", OcGridElement);
}

const OpenCollectionsCardLayoutElement = OcGridElement;

export { OcGridElement, OpenCollectionsCardLayoutElement };
