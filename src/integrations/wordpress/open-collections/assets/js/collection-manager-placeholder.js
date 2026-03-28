class OpenCollectionsPlaceholder extends HTMLElement {
	connectedCallback() {
		this.innerHTML =
			'<div style="padding:12px;border:1px dashed #9ca3af;border-radius:6px;">Set "Collection Manager script URL" in Open Collections settings to load the real component bundle.</div>';
	}
}

if (!customElements.get("open-collections-manager")) {
	customElements.define(
		"open-collections-manager",
		OpenCollectionsPlaceholder,
	);
}
