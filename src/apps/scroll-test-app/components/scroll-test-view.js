class ScrollTestViewElement extends HTMLElement {
	constructor() {
		super();
		this.state = {
			blockingEnabled: false,
		};
		this.shadow = this.attachShadow({ mode: "open" });
	}

	connectedCallback() {
		this.render();
		this.bindEvents();
	}

	bindEvents() {
		const toggleButton = this.shadow.querySelector('[data-action="toggle-blocking"]');
		const scrollContainer = this.shadow.querySelector(".scroll-container");
		const cards = this.shadow.querySelectorAll(".card");

		toggleButton?.addEventListener("click", () => {
			this.state.blockingEnabled = !this.state.blockingEnabled;
			this.updateBlockingState();
		});

		scrollContainer?.addEventListener("scroll", () => {
			console.log("scrolling");
		});

		cards.forEach((card, index) => {
			card.addEventListener("click", () => {
				console.log("card clicked", index);
			});
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

	render() {
		const cardsMarkup = Array.from({ length: 40 }, (_, index) => {
			return `<div class="card" tabindex="0">Card ${index + 1}</div>`;
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
					cursor: pointer;
				}

				.toggle-blocking .grid {
					pointer-events: none;
				}

				.toggle-blocking .grid > * {
					pointer-events: auto;
				}
			</style>
			<div class="root">
				<div class="header">
					<strong>Scroll Test</strong>
					<button type="button" data-action="toggle-blocking">Enable pointer-event test</button>
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
