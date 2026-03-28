import { BaseElement } from "../../../shared/ui/app-foundation/base-element.js";
import { renderPresenterHomeView } from "./views/presenter-home-view.js";
import { presenterShellStyles } from "./styles/presenter-shell.css.js";

class OpenCollectionsPresenterElement extends BaseElement {
	renderStyles() {
		return presenterShellStyles;
	}

	renderTemplate() {
		return renderPresenterHomeView();
	}
}

if (!customElements.get("open-collections-presenter")) {
	customElements.define(
		"open-collections-presenter",
		OpenCollectionsPresenterElement,
	);
}

export { OpenCollectionsPresenterElement };
