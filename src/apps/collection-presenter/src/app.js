import { renderPresenterHomeView } from "./views/presenter-home-view.js";
import { presenterShellStyles } from "./styles/presenter-shell.css.js";

class OpenCollectionsPresenterElement extends HTMLElement {
	constructor() {
		super();
		this.shadow = this.attachShadow({ mode: "open" });
		this.render();
	}

	render() {
		this.shadow.innerHTML = `
      <style>${presenterShellStyles}</style>
      ${renderPresenterHomeView()}
    `;
	}
}

if (!customElements.get("open-collections-presenter")) {
	customElements.define(
		"open-collections-presenter",
		OpenCollectionsPresenterElement,
	);
}

export { OpenCollectionsPresenterElement };
