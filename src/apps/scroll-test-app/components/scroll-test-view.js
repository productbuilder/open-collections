import "../../../shared/ui/primitives/index.js";

class ScrollTestViewElement extends HTMLElement {
	constructor() {
		super();
		this.state = {
			blockingEnabled: false,
			cardMode: "simple",
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
		const grid = this.shadow.querySelector(".grid");

		toggleButton?.addEventListener("click", () => {
			this.state.blockingEnabled = !this.state.blockingEnabled;
			this.updateBlockingState();
		});

		modeButton?.addEventListener("click", () => {
			this.state.cardMode = this.state.cardMode === "simple" ? "oc-card-item" : "simple";
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
			console.log("grid click", { mode: this.state.cardMode, target: tag });
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

		root.dataset.cardMode = this.state.cardMode;
		modeButton.textContent =
			this.state.cardMode === "simple"
				? "Use oc-card-item cards"
				: "Use simple div cards";
	}

	render() {
		const cardsMarkup = Array.from({ length: 40 }, (_, index) => {
			if (this.state.cardMode === "oc-card-item") {
				return `<oc-card-item data-id="test-${index + 1}" data-kind="item"></oc-card-item>`;
			}
			return `<div class="card">Card ${index + 1}</div>`;
		}).join("");

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

				.card {
					height: 140px;
					background: white;
					border: 1px solid #ccc;
					display: flex;
					align-items: center;
					justify-content: center;
				}

				.grid > oc-card-item {
					display: block;
					height: 140px;
				}

				.toggle-blocking .grid {
					pointer-events: none;
				}

				.toggle-blocking .grid > * {
					pointer-events: auto;
				}
			</style>
			<div class="root" data-card-mode="${this.state.cardMode}">
				<div class="header">
					<strong>Scroll Test</strong>
					<div>
						<button type="button" data-action="toggle-mode"></button>
						<button type="button" data-action="toggle-blocking">Enable pointer-event test</button>
					</div>
				</div>
				<div class="scroll-container">
					<div class="grid">${cardsMarkup}</div>
				</div>
			</div>
		`;
	}
}

if (!customElements.get("scroll-test-view")) {
	customElements.define("scroll-test-view", ScrollTestViewElement);
}

export { ScrollTestViewElement };
