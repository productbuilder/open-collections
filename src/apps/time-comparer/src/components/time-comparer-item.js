import "./time-comparer.js";
import { normalizeCollection } from "../../../../shared/library-core/src/index.js";

const DEMO_SETS = {
	heritage: {
		id: "heritage-demo",
		pastSrc: "https://picsum.photos/id/1039/1200/800",
		presentSrc: "https://picsum.photos/id/1040/1200/800",
	},
	genericFallback: {
		id: "generic-fallback-demo",
		pastSrc: "https://picsum.photos/id/1015/1200/800",
		presentSrc: "https://picsum.photos/id/1016/1200/800",
	},
};

function resolveDemoSet() {
	// TODO: Replace the heritage demo URLs with a curated collection-linked
	// heritage pair when available, without changing compare rendering logic.
	const preferredDemo = DEMO_SETS.heritage;
	const technicalFallbackDemo = DEMO_SETS.genericFallback;
	const hasPreferredPair =
		Boolean(preferredDemo?.pastSrc) && Boolean(preferredDemo?.presentSrc);

	if (hasPreferredPair) {
		return preferredDemo;
	}
	return technicalFallbackDemo;
}

function resolveImageUrl(item) {
	return (
		String(item?.media?.url || "").trim() ||
		String(item?.media?.thumbnailUrl || "").trim() ||
		String(item?.previewUrl || "").trim() ||
		""
	);
}

function resolveAbsoluteUrl(pathOrUrl, baseUrl) {
	const raw = String(pathOrUrl || "").trim();
	if (!raw) {
		return "";
	}
	try {
		return new URL(raw, baseUrl || window.location.href).href;
	} catch {
		return raw;
	}
}

function matchesItemRefTarget(entry, itemId) {
	const target = String(itemId || "").trim();
	if (!target) {
		return false;
	}
	const entryId = String(entry?.id || "").trim();
	const entrySource = String(entry?.source || "").trim();
	if (entryId === target || entrySource === target) {
		return true;
	}
	const idTokens = entryId
		.toLowerCase()
		.split(/[^a-z0-9]+/g)
		.filter(Boolean);
	return idTokens.includes(target.toLowerCase());
}

class OpenCollectionsTimeComparerItemElement extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.model = {
			item: null,
			items: [],
		};
		this._resolveToken = 0;
	}

	connectedCallback() {
		this.render();
		void this.applyView();
	}

	update(payload = {}) {
		this.model = { ...this.model, ...payload };
		void this.applyView();
	}

	resolveContextManifestUrl() {
		const item = this.model.item || {};
		return String(
			item?.__manifestUrl || item?.source || window.location.href,
		).trim();
	}

	resolveLocalItemByRef(itemRef) {
		const items = Array.isArray(this.model.items) ? this.model.items : [];
		if (!itemRef || typeof itemRef !== "object") {
			return null;
		}
		const itemId = String(itemRef.itemId || "").trim();
		if (!itemId) {
			return null;
		}
		const collectionUrl = String(itemRef.collectionUrl || "").trim();
		if (!collectionUrl) {
			return (
				items.find((entry) => matchesItemRefTarget(entry, itemId)) ||
				null
			);
		}
		const contextManifestUrl = this.resolveContextManifestUrl();
		const absoluteCollectionUrl = resolveAbsoluteUrl(
			collectionUrl,
			contextManifestUrl,
		);
		const absoluteContextManifestUrl = resolveAbsoluteUrl(
			contextManifestUrl,
			window.location.href,
		);
		if (absoluteCollectionUrl !== absoluteContextManifestUrl) {
			return null;
		}
		return (
			items.find((entry) => matchesItemRefTarget(entry, itemId)) ||
			null
		);
	}

	async resolveItemByRef(itemRef) {
		if (!itemRef || typeof itemRef !== "object") {
			return null;
		}
		const resolver = String(itemRef.resolver || "").trim().toLowerCase();
		if (resolver !== "manifest") {
			return null;
		}
		const itemId = String(itemRef.itemId || "").trim();
		if (!itemId) {
			return null;
		}
		const contextManifestUrl = this.resolveContextManifestUrl();
		const sourceUrl = resolveAbsoluteUrl(itemRef.sourceUrl, contextManifestUrl);
		if (!sourceUrl) {
			return null;
		}

		const localMatch = this.resolveLocalItemByRef(itemRef);
		if (localMatch) {
			return localMatch;
		}

		let sourceCollectionUrls = [];
		try {
			const sourceResponse = await fetch(sourceUrl);
			if (!sourceResponse.ok) {
				return null;
			}
			const sourceJson = await sourceResponse.json();
			const sourceCollections = Array.isArray(sourceJson?.collections)
				? sourceJson.collections
				: [];
			sourceCollectionUrls = sourceCollections
				.map((entry) =>
					resolveAbsoluteUrl(
						entry?.manifest || entry?.url || "",
						sourceUrl,
					),
				)
				.filter(Boolean);
		} catch {
			return null;
		}

		const collectionUrl = resolveAbsoluteUrl(
			itemRef.collectionUrl,
			contextManifestUrl,
		);
		if (!collectionUrl) {
			return null;
		}
		if (
			sourceCollectionUrls.length > 0 &&
			!sourceCollectionUrls.includes(collectionUrl)
		) {
			return null;
		}
		try {
			const response = await fetch(collectionUrl);
			if (!response.ok) {
				return null;
			}
			const json = await response.json();
			const normalizedCollection = normalizeCollection(json, {
				manifestUrl: collectionUrl,
			});
			const collectionItems = Array.isArray(normalizedCollection?.items)
				? normalizedCollection.items
				: [];
			return (
				collectionItems.find((entry) => matchesItemRefTarget(entry, itemId)) ||
				null
			);
		} catch {
			return null;
		}
	}

	async resolveCompareSources() {
		const item = this.model.item || {};
		const settings = item?.settings || {};
		const imageLeft = settings?.imageLeft || {};
		const imageRight = settings?.imageRight || {};
		const leftRef = imageLeft?.itemRef || null;
		const rightRef = imageRight?.itemRef || null;

		const [leftItem, rightItem] = await Promise.all([
			this.resolveItemByRef(leftRef),
			this.resolveItemByRef(rightRef),
		]);
		const resolvedPastUrl = resolveImageUrl(leftItem);
		const resolvedPresentUrl = resolveImageUrl(rightItem);

		let pastSrc = resolvedPastUrl;
		let presentSrc = resolvedPresentUrl;
		let demoMode = false;

		if (!pastSrc || !presentSrc) {
			demoMode = true;
			const demoSet = resolveDemoSet();
			pastSrc = demoSet.pastSrc;
			presentSrc = demoSet.presentSrc;
		}

		return {
			pastItem: leftItem,
			presentItem: rightItem,
			pastSrc,
			presentSrc,
			demoMode,
		};
	}

	async applyView() {
		const token = ++this._resolveToken;
		const title = this.shadowRoot?.getElementById("title");
		const note = this.shadowRoot?.getElementById("note");
		const comparer = this.shadowRoot?.getElementById("comparer");
		if (!title || !note || !comparer) {
			return;
		}

		const item = this.model.item || {};
		const settings = item.settings || {};
		title.textContent = item.title || item.id || "Time comparer";
		const { pastItem, presentItem, pastSrc, presentSrc, demoMode } =
			await this.resolveCompareSources();
		if (token !== this._resolveToken) {
			return;
		}
		comparer.pastSrc = pastSrc;
		comparer.presentSrc = presentSrc;
		comparer.setAttribute(
			"past-label",
			settings?.imageLeft?.label || "Past",
		);
		comparer.setAttribute(
			"present-label",
			settings?.imageRight?.label || "Present",
		);
		comparer.setAttribute(
			"show-labels",
			settings.showLabels === false ? "false" : "true",
		);
		const split = Number(settings.initialSplit);
		comparer.split = Number.isFinite(split) ? split : 0.5;

		if (demoMode) {
			note.textContent =
				"Using demo images for testing. These are temporary sample images.";
			return;
		}
		note.textContent = `Comparing ${pastItem.title || pastItem.id} and ${presentItem.title || presentItem.id}.`;
	}

	render() {
		this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          padding: 16px;
        }
        .shell {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          gap: 0.65rem;
        }
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
	customElements.define(
		"oc-time-comparer-item",
		OpenCollectionsTimeComparerItemElement,
	);
}

export { OpenCollectionsTimeComparerItemElement };
