import "./time-comparer.js";

function resolveImageUrl(item) {
	return (
		String(item?.media?.url || "").trim() ||
		String(item?.media?.thumbnailUrl || "").trim() ||
		String(item?.previewUrl || "").trim() ||
		""
	);
}

class OpenCollectionsTimeComparerItemElement extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.model = {
			item: null,
			items: [],
		};
	}

	connectedCallback() {
		this.render();
		this.applyView();
	}

	update(payload = {}) {
		this.model = { ...this.model, ...payload };
		this.applyView();
	}

	resolveCompareTargets() {
		const item = this.model.item || {};
		const items = Array.isArray(this.model.items) ? this.model.items : [];
		const pastId = String(item?.compare?.pastItemId || "").trim();
		const presentId = String(item?.compare?.presentItemId || "").trim();
		const pastItem = items.find((entry) => entry.id === pastId) || null;
		const presentItem = items.find((entry) => entry.id === presentId) || null;
		return { pastItem, presentItem };
	}

	applyView() {
		const title = this.shadowRoot?.getElementById("title");
		const note = this.shadowRoot?.getElementById("note");
		const comparer = this.shadowRoot?.getElementById("comparer");
		if (!title || !note || !comparer) {
			return;
		}

		const item = this.model.item || {};
		const settings = item.settings || {};
		title.textContent = item.title || item.id || "Time comparer";
		const { pastItem, presentItem } = this.resolveCompareTargets();
		const pastSrc = resolveImageUrl(pastItem);
		const presentSrc = resolveImageUrl(presentItem);
		comparer.setAttribute("past-src", pastSrc);
		comparer.setAttribute("present-src", presentSrc);
		comparer.setAttribute("past-label", settings.pastLabel || "Past");
		comparer.setAttribute("present-label", settings.presentLabel || "Present");
		comparer.setAttribute("show-labels", settings.showLabels === false ? "false" : "true");
		const split = Number(settings.initialSplit);
		comparer.split = Number.isFinite(split) ? split : 0.5;

		if (!pastItem || !presentItem || !pastSrc || !presentSrc) {
			note.textContent = "Missing linked past/present image items or media URLs.";
			return;
		}
		note.textContent = `Comparing ${pastItem.title || pastItem.id} and ${presentItem.title || presentItem.id}.`;
	}

	render() {
		this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        .shell { display: grid; gap: 0.65rem; }
        h3 { margin: 0; font-size: 0.98rem; color: #0f172a; }
        p { margin: 0; font-size: 0.82rem; color: #475569; }
      </style>
      <article class="shell">
        <h3 id="title">Time comparer</h3>
        <p id="note"></p>
        <oc-time-comparer id="comparer"></oc-time-comparer>
      </article>
    `;
	}
}

if (!customElements.get("oc-time-comparer-item")) {
	customElements.define("oc-time-comparer-item", OpenCollectionsTimeComparerItemElement);
}

export { OpenCollectionsTimeComparerItemElement };
