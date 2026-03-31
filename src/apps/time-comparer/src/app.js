import "./components/time-comparer-item.js";

class OpenCollectionsTimeComparerAppElement extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: "open" });
	}

	connectedCallback() {
		this.render();
	}

	render() {
		this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; padding: 1rem; font-family: "Segoe UI", Tahoma, sans-serif; }
      </style>
      <oc-time-comparer-item></oc-time-comparer-item>
    `;
	}
}

if (!customElements.get("open-collections-time-comparer")) {
	customElements.define("open-collections-time-comparer", OpenCollectionsTimeComparerAppElement);
}

export { OpenCollectionsTimeComparerAppElement };
