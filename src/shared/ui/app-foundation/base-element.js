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

	attributeChangedCallback(name, oldValue, newValue) {
		if (oldValue === newValue) {
			return;
		}
		if (this.shadowRoot) {
			this.render();
		}
		this.onAttributeChanged(name, oldValue, newValue);
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

	getBoolAttr(name) {
		return this.hasAttribute(name);
	}

	getStringAttr(name) {
		if (!this.hasAttribute(name)) {
			return null;
		}
		return this.getAttribute(name);
	}

	getNumberAttr(name) {
		const value = this.getStringAttr(name);
		if (value === null || value.trim() === "") {
			return null;
		}
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : null;
	}

	setBoolAttr(name, value) {
		if (value) {
			this.setAttribute(name, "");
			return;
		}
		this.removeAttribute(name);
	}

	setStringAttr(name, value) {
		if (value === null || value === undefined || value === "") {
			this.removeAttribute(name);
			return;
		}
		this.setAttribute(name, String(value));
	}

	onFirstConnected() {}

	onConnected() {}

	onDisconnected() {}

	onAttributeChanged(_name, _oldValue, _newValue) {}

	afterRender() {}
}
