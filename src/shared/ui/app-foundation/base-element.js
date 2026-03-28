export class BaseElement extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this._isConnected = false;
	}

	connectedCallback() {
		const isFirstConnect = !this._isConnected;
		this._isConnected = true;
		this.render();
		if (isFirstConnect) {
			this.onFirstConnected();
		}
		this.onConnected();
	}

	disconnectedCallback() {
		this.onDisconnected();
	}

	attributeChangedCallback() {
		if (!this.shadowRoot) {
			return;
		}
		this.render();
		this.onAttributesChanged();
	}

	render() {
		if (!this.shadowRoot) {
			return;
		}
		this.shadowRoot.innerHTML = `
      <style>${this.renderStyles()}</style>
      ${this.renderTemplate()}
    `;
		this.afterRender();
	}

	renderStyles() {
		return "";
	}

	renderTemplate() {
		return "";
	}

	onFirstConnected() {}

	onConnected() {}

	onDisconnected() {}

	onAttributesChanged() {}

	afterRender() {}
}
