class OcSkeletonCardElement extends HTMLElement {
	static get observedAttributes() {
		return ["variant"];
	}

	constructor() {
		super();
		this.attachShadow({ mode: "open" });
	}

	connectedCallback() {
		this.render();
	}

	attributeChangedCallback() {
		this.render();
	}

	get variant() {
		const value = String(this.getAttribute("variant") || "").trim();
		return ["collections", "collection", "item"].includes(value)
			? value
			: "item";
	}

	set variant(value) {
		const normalized = String(value || "").trim();
		this.setAttribute("variant", normalized);
	}

	renderCollectionsTemplate() {
		return `
			<div class="line line-title"></div>
			<div class="collections-rows">
				${Array.from({ length: 3 })
					.map(
						() => `
						<div class="collection-row">
							<div class="line line-row-label"></div>
							<div class="row-track">
								${Array.from({ length: 4 })
									.map(() => '<span class="row-cell"></span>')
									.join("")}
							</div>
						</div>
					`,
					)
					.join("")}
			</div>
			<div class="line line-footer"></div>
		`;
	}

	renderCollectionTemplate() {
		return `
			<div class="line line-title"></div>
			<div class="preview-strip">
				${Array.from({ length: 3 })
					.map(() => '<span class="strip-cell"></span>')
					.join("")}
			</div>
			<div class="line line-footer"></div>
		`;
	}

	renderItemTemplate() {
		return `
			<div class="image-block"></div>
			<div class="line line-title"></div>
			<div class="line line-meta"></div>
		`;
	}

	renderTemplate() {
		if (this.variant === "collections") {
			return this.renderCollectionsTemplate();
		}
		if (this.variant === "collection") {
			return this.renderCollectionTemplate();
		}
		return this.renderItemTemplate();
	}

	render() {
		this.shadowRoot.innerHTML = `
			<style>
				:host {
					display: block;
					min-height: 0;
				}

				* {
					box-sizing: border-box;
				}

				.card {
					width: 100%;
					border: 1px solid #dbe3ec;
					border-radius: 16px;
					padding: 0.9rem;
					background: linear-gradient(180deg, #f8fafd 0%, #ffffff 100%);
					display: grid;
					gap: 0.65rem;
					animation: oc-skeleton-pulse 1.2s ease-in-out infinite;
				}

				.line {
					height: 0.62rem;
					border-radius: 999px;
					background: #e9eef4;
				}

				.line-title {
					width: 72%;
					height: 0.72rem;
				}

				.line-footer {
					width: 48%;
				}

				.collections-rows {
					display: grid;
					gap: 0.45rem;
				}

				.collection-row {
					border: 1px solid #e2e8f0;
					border-radius: 10px;
					padding: 0.35rem;
					display: grid;
					gap: 0.35rem;
					background: #ffffff;
				}

				.line-row-label {
					width: 38%;
					height: 0.5rem;
				}

				.row-track {
					display: grid;
					grid-auto-flow: column;
					grid-auto-columns: minmax(40px, 1fr);
					gap: 0.28rem;
					min-height: 40px;
				}

				.row-cell,
				.strip-cell {
					display: block;
					border-radius: 7px;
					background: #e9eef4;
				}

				.preview-strip {
					display: grid;
					grid-auto-flow: column;
					grid-auto-columns: minmax(54px, 1fr);
					gap: 0.35rem;
					min-height: 52px;
				}

				.strip-cell {
					min-height: 52px;
				}

				.image-block {
					aspect-ratio: 4 / 3;
					border-radius: 10px;
					background: #e9eef4;
				}

				.line-meta {
					width: 52%;
				}

				@keyframes oc-skeleton-pulse {
					0% {
						opacity: 0.52;
					}
					50% {
						opacity: 1;
					}
					100% {
						opacity: 0.52;
					}
				}
			</style>
			<article class="card" aria-hidden="true">
				${this.renderTemplate()}
			</article>
		`;
	}
}

if (!customElements.get("oc-skeleton-card")) {
	customElements.define("oc-skeleton-card", OcSkeletonCardElement);
}

export { OcSkeletonCardElement };
