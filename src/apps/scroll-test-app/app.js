import "./components/scroll-test-view.js";

class OcScrollTestAppElement extends HTMLElement {
	constructor() {
		super();
		this.shadow = this.attachShadow({ mode: "open" });
	}

	connectedCallback() {
		this.render();
	}

	render() {
		this.shadow.innerHTML = `<scroll-test-view></scroll-test-view>`;
	}
}

if (!customElements.get("oc-scroll-test-app")) {
	customElements.define("oc-scroll-test-app", OcScrollTestAppElement);
}

export { OcScrollTestAppElement };
