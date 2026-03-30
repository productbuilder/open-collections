import "../../../shared/ui/primitives/index.js";
import "../../../shared/ui/primitives/oc-grid.js";

class ScrollTestViewElement extends HTMLElement {
	constructor() {
		super();
		this.state = {
			blockingEnabled: false,
			gridMode: "div",
		};
		this.shadow = this.attachShadow({ mode: "open" });
	}

	connectedCallback() {
		this.render();
		this.bindEvents();
		this.updateModeState();
	}

	bindEvents() {
		const toggleButton = this.shadow.querySelector('[data-action="toggle-blocking"]');
		const modeButton = this.shadow.querySelector('[data-action="toggle-mode"]');
		const scrollContainer = this.shadow.querySelector(".scroll-container");
		const grid =
			this.state.gridMode === "oc-grid"
				? this.shadow.querySelector("oc-grid.grid-test")
				: this.shadow.querySelector(".grid");

		toggleButton?.addEventListener("click", () => {
			this.state.blockingEnabled = !this.state.blockingEnabled;
			this.updateBlockingState();
		});

		modeButton?.addEventListener("click", () => {
			this.state.gridMode = this.state.gridMode === "div" ? "oc-grid" : "div";
			this.render();
			this.bindEvents();
			this.updateBlockingState();
			this.updateModeState();
		});

		scrollContainer?.addEventListener("scroll", () => {
			console.log("scrolling");
		});

		grid?.addEventListener("click", (event) => {
			const target = event.target;
			const tag = target && target.tagName ? target.tagName.toLowerCase() : "unknown";
			console.log("grid click", { mode: this.state.gridMode, target: tag });
		});
	}

	updateBlockingState() {
		const root = this.shadow.querySelector(".root");
		const toggleButton = this.shadow.querySelector('[data-action="toggle-blocking"]');
		if (!root || !toggleButton) {
			return;
		}

		root.classList.toggle("toggle-blocking", this.state.blockingEnabled);
		toggleButton.textContent = this.state.blockingEnabled
			? "Disable pointer-event test"
			: "Enable pointer-event test";
	}

	updateModeState() {
		const root = this.shadow.querySelector(".root");
		const modeButton = this.shadow.querySelector('[data-action="toggle-mode"]');
		if (!root || !modeButton) {
			return;
		}

		root.dataset.gridMode = this.state.gridMode;
		modeButton.textContent =
			this.state.gridMode === "div"
				? "Switch to oc-grid"
				: "Switch to div.grid";
	}

	render() {
		const cardsMarkup = Array.from(
			{ length: 40 },
			(_, index) => `<oc-card-item data-id="test-${index + 1}" data-kind="item"></oc-card-item>`,
		).join("");
		const gridMarkup =
			this.state.gridMode === "oc-grid"
				? `<oc-grid class="grid-test">${cardsMarkup}</oc-grid>`
				: `<div class="grid">${cardsMarkup}</div>`;

		this.shadow.innerHTML = `
			<style>
				:host {
					display: block;
					height: 100%;
					min-height: 0;
				}

				.root {
					height: 100%;
					display: flex;
					flex-direction: column;
					min-height: 0;
				}

				.header {
					padding: 16px;
					background: #eee;
					display: flex;
					align-items: center;
					justify-content: space-between;
					gap: 12px;
				}

				.scroll-container {
					flex: 1;
					overflow-y: auto;
					overflow-x: hidden;
					min-height: 0;
				}

				.grid {
					display: grid;
					grid-template-columns: repeat(2, 1fr);
					gap: 12px;
					padding: 12px;
				}

				oc-grid {
					outline: 2px solid red;
				}

				.grid > oc-card-item {
					display: block;
					height: 140px;
				}

				oc-grid.grid-test {
					padding: 12px;
					gap: 12px;
					--oc-layout-columns-desktop: 2;
					--oc-layout-columns-tablet: 2;
					--oc-layout-columns-mobile: 2;
					--oc-layout-gap: 12px;
				}

				oc-grid.grid-test > oc-card-item {
					display: block;
					height: 140px;
				}

				.toggle-blocking .grid {
					pointer-events: none;
				}

				.toggle-blocking .grid > * {
					pointer-events: auto;
				}

				.toggle-blocking oc-grid.grid-test {
					pointer-events: none;
				}

				.toggle-blocking oc-grid.grid-test > * {
					pointer-events: auto;
				}
			</style>
			<div class="root" data-grid-mode="${this.state.gridMode}">
				<div class="header">
					<strong>Scroll Test</strong>
					<div>
						<button type="button" data-action="toggle-mode"></button>
						<button type="button" data-action="toggle-blocking">Enable pointer-event test</button>
					</div>
				</div>
				<div class="scroll-container">
					${gridMarkup}
				</div>
			</div>
		`;
	}
}

if (!customElements.get("scroll-test-view")) {
	customElements.define("scroll-test-view", ScrollTestViewElement);
}

export { ScrollTestViewElement };
