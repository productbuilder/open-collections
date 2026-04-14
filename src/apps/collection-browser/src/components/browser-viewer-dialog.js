import "../../../time-comparer/src/components/time-comparer-item.js";
import { renderCloseIcon } from "../../../../shared/components/icons.js";

class OpenBrowserViewerDialogElement extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.model = {
			item: null,
			loading: false,
			mediaReady: false,
			mediaError: false,
			viewerRatio: "4 / 3",
		};
		this._loadToken = 0;
	}

	connectedCallback() {
		this.render();
		this.bindEvents();
		this.applyView();
	}

	bindEvents() {
		const dialog = this.shadowRoot.getElementById("viewerDialog");
		this.shadowRoot
			.getElementById("closeViewerBtn")
			?.addEventListener("click", () => {
				this.close();
			});

		dialog?.addEventListener("click", (event) => {
			// For native <dialog>, backdrop clicks target the dialog element itself.
			if (event.target === dialog) {
				this.close();
			}
		});

		dialog?.addEventListener("close", () => {
			this.dispatchEvent(
				new CustomEvent("close-viewer", {
					bubbles: true,
					composed: true,
				}),
			);
		});
		this.shadowRoot
			.getElementById("collectActionBtn")
			?.addEventListener("click", () => {
				if (!this.model.item) {
					return;
				}
				this.dispatchEvent(
					new CustomEvent("collect-item", {
						bubbles: true,
						composed: true,
						detail: {
							item: this.model.item,
						},
					}),
				);
			});
		this.shadowRoot
			.getElementById("sourceActionBtn")
			?.addEventListener("click", () => {
				const sourceUrl = this.resolveSourceUrl(this.model.item);
				if (!sourceUrl) {
					return;
				}
				window.open(sourceUrl, "_blank", "noopener,noreferrer");
			});
	}

	setItem(item) {
		this.model.item = item || null;
		if (!this.model.item) {
			this.applyView();
			return;
		}
		this.startMediaLoad();
	}

	clear() {
		this.model.item = null;
		this.model.loading = false;
		this.model.mediaReady = false;
		this.model.mediaError = false;
		this.applyView();
	}

	open() {
		const dialog = this.shadowRoot.getElementById("viewerDialog");
		if (!dialog || dialog.open) {
			return;
		}
		if (typeof dialog.showModal === "function") {
			dialog.showModal();
			return;
		}
		dialog.setAttribute("open", "open");
	}

	close() {
		const dialog = this.shadowRoot.getElementById("viewerDialog");
		if (!dialog || !dialog.open) {
			return;
		}
		if (typeof dialog.close === "function") {
			dialog.close();
			return;
		}
		dialog.removeAttribute("open");
	}

	resolveMediaUrl(item) {
		return String(item?.media?.url || item?.media?.thumbnailUrl || "").trim();
	}

	resolveSubtitle(item) {
		return String(item?.summary || "").trim();
	}

	resolveDescription(item) {
		return String(item?.description || "").trim();
	}

	resolveSourceUrl(item) {
		const direct = String(item?.source?.url || item?.sourceUrl || "").trim();
		if (direct) {
			return direct;
		}
		const sourceText = String(item?.source || "").trim();
		return /^https?:\/\//i.test(sourceText) ? sourceText : "";
	}

	appendItemDetails(body, item) {
		const titleText = String(item?.title || item?.id || "").trim();
		const subtitleText = this.resolveSubtitle(item);
		const descriptionText = this.resolveDescription(item);
		const sourceUrl = this.resolveSourceUrl(item);
		const subtitleMatchesDescription =
			subtitleText &&
			descriptionText &&
			subtitleText.toLowerCase() === descriptionText.toLowerCase();
		const effectiveSubtitle = subtitleMatchesDescription ? "" : subtitleText;
		const hasDetails =
			Boolean(titleText) ||
			Boolean(effectiveSubtitle) ||
			Boolean(descriptionText) ||
			Boolean(sourceUrl);
		if (!hasDetails) {
			return;
		}

		const details = document.createElement("section");
		details.className = "viewer-details";

		if (titleText) {
			const heading = document.createElement("h3");
			heading.className = "viewer-item-title";
			heading.textContent = titleText;
			details.appendChild(heading);
		}

		if (effectiveSubtitle) {
			const subtitle = document.createElement("p");
			subtitle.className = "viewer-item-subtitle";
			subtitle.textContent = effectiveSubtitle;
			details.appendChild(subtitle);
		}

		if (descriptionText) {
			const description = document.createElement("p");
			description.className = "viewer-item-description";
			description.textContent = descriptionText;
			details.appendChild(description);
		}

		if (sourceUrl) {
			const sourceAction = document.createElement("a");
			sourceAction.className = "viewer-source-link";
			sourceAction.href = sourceUrl;
			sourceAction.target = "_blank";
			sourceAction.rel = "noopener noreferrer";
			sourceAction.textContent = "Open original source";
			details.appendChild(sourceAction);
		}

		body.appendChild(details);
	}

	parseRatioFromMetadata(item) {
		const width = Number(item?.media?.width || item?.width || 0);
		const height = Number(item?.media?.height || item?.height || 0);
		if (width > 0 && height > 0) {
			return `${width} / ${height}`;
		}
		return "";
	}

	applyShellRatio(ratio) {
		if (!ratio) {
			return;
		}
		const shell = this.shadowRoot?.querySelector(".viewer-media-shell");
		shell?.style.setProperty("--viewer-ratio", ratio);
	}

	async probeImageRatio(url, token) {
		if (!url) {
			return "";
		}
		return new Promise((resolve) => {
			const probe = new Image();
			probe.decoding = "async";
			probe.onload = () => {
				if (token !== this._loadToken) {
					resolve("");
					return;
				}
				const width = Number(probe.naturalWidth || 0);
				const height = Number(probe.naturalHeight || 0);
				resolve(width > 0 && height > 0 ? `${width} / ${height}` : "");
			};
			probe.onerror = () => resolve("");
			probe.src = url;
		});
	}

	startMediaLoad() {
		this._loadToken += 1;
		const token = this._loadToken;
		const item = this.model.item;
		if (!item) {
			return;
		}
		const mediaType = String(item.media?.type || "").toLowerCase();
		const mediaUrl = this.resolveMediaUrl(item);
		this.model.loading = true;
		this.model.mediaReady = false;
		this.model.mediaError = false;
		this.model.viewerRatio =
			this.parseRatioFromMetadata(item) ||
			(mediaType.includes("video") ? "16 / 9" : "4 / 3");
		this.applyView();
		if (!mediaUrl || mediaType.includes("video")) {
			this.model.loading = false;
			this.model.mediaReady = Boolean(mediaUrl);
			this.model.mediaError = !mediaUrl;
			this.applyView();
			return;
		}
		void this.probeImageRatio(mediaUrl, token).then((ratio) => {
			if (token !== this._loadToken) {
				return;
			}
			if (ratio) {
				this.model.viewerRatio = ratio;
				this.applyShellRatio(ratio);
			}
		});
	}

	applyView() {
		const title = this.shadowRoot.getElementById("viewerTitle");
		const body = this.shadowRoot.getElementById("viewerBody");
		const mediaArea = this.shadowRoot.getElementById("viewerMediaArea");
		const collectActionBtn = this.shadowRoot.getElementById("collectActionBtn");
		const sourceActionBtn = this.shadowRoot.getElementById("sourceActionBtn");
		if (!title || !body || !mediaArea || !collectActionBtn || !sourceActionBtn) {
			return;
		}

		body.innerHTML = "";
		mediaArea.innerHTML = "";
		const item = this.model.item;
		if (!item) {
			title.textContent = "Viewer";
			const empty = document.createElement("div");
			empty.className = "empty";
			empty.textContent = "Choose an item to view.";
			mediaArea.appendChild(empty);
			collectActionBtn.disabled = true;
			sourceActionBtn.disabled = true;
			return;
		}

		title.textContent = item.title || item.id || "Viewer";
		collectActionBtn.disabled = false;
		sourceActionBtn.disabled = !this.resolveSourceUrl(item);
		if (
			String(item.appId || "").toLowerCase() ===
			"time-comparer"
		) {
			const comparer = document.createElement("oc-time-comparer-item");
			const compareItems = Array.isArray(item?.__collectionItems)
				? item.__collectionItems
				: [];
			if (typeof comparer.update === "function") {
				comparer.update({
					item,
					items: compareItems,
				});
			}
			mediaArea.appendChild(comparer);
			this.appendItemDetails(body, item);
			return;
		}
		const mediaType = (item.media?.type || "").toLowerCase();
		const mediaUrl = this.resolveMediaUrl(item);
		const shell = document.createElement("div");
		shell.className = "viewer-media-shell";
		shell.style.setProperty("--viewer-ratio", this.model.viewerRatio || "4 / 3");
		const skeleton = document.createElement("div");
		skeleton.className = "viewer-media-skeleton";
		skeleton.hidden = !this.model.loading;
		shell.appendChild(skeleton);
		if (!mediaUrl) {
			const empty = document.createElement("div");
			empty.className = "empty";
			empty.textContent = "No media URL available.";
			shell.appendChild(empty);
			mediaArea.appendChild(shell);
			this.appendItemDetails(body, item);
			return;
		}

		if (mediaType.includes("video")) {
			const video = document.createElement("video");
			video.className = "viewer-media viewer-media-video";
			video.src = mediaUrl;
			video.controls = true;
			video.addEventListener("loadedmetadata", () => {
				const width = Number(video.videoWidth || 0);
				const height = Number(video.videoHeight || 0);
				if (width > 0 && height > 0) {
					shell.style.setProperty("--viewer-ratio", `${width} / ${height}`);
				}
			});
			video.addEventListener("canplay", () => {
				this.model.loading = false;
				this.model.mediaReady = true;
				this.model.mediaError = false;
				video.classList.add("is-ready");
				skeleton.hidden = true;
			});
			video.addEventListener("error", () => {
				this.model.loading = false;
				this.model.mediaReady = false;
				this.model.mediaError = true;
				skeleton.hidden = true;
			});
			shell.appendChild(video);
			mediaArea.appendChild(shell);
			this.appendItemDetails(body, item);
			return;
		}

		const image = document.createElement("img");
		image.className = "viewer-media viewer-media-image";
		image.src = mediaUrl;
		image.alt = item.title || item.id || "";
		image.addEventListener("load", async () => {
			try {
				if (typeof image.decode === "function") {
					await image.decode();
				}
			} catch {
				// decode may reject after load in some browsers.
			}
			if (this.resolveMediaUrl(this.model.item) !== mediaUrl) {
				return;
			}
			const width = Number(image.naturalWidth || 0);
			const height = Number(image.naturalHeight || 0);
			if (width > 0 && height > 0) {
				shell.style.setProperty("--viewer-ratio", `${width} / ${height}`);
			}
			this.model.loading = false;
			this.model.mediaReady = true;
			this.model.mediaError = false;
			image.classList.add("is-ready");
			skeleton.hidden = true;
		});
		image.addEventListener("error", () => {
			if (this.resolveMediaUrl(this.model.item) !== mediaUrl) {
				return;
			}
			this.model.loading = false;
			this.model.mediaReady = false;
			this.model.mediaError = true;
			skeleton.hidden = true;
			const empty = document.createElement("div");
			empty.className = "empty";
			empty.textContent = "Could not load this media preview.";
			shell.appendChild(empty);
		});
		shell.appendChild(image);
		mediaArea.appendChild(shell);
		this.appendItemDetails(body, item);
	}

	render() {
		this.shadowRoot.innerHTML = `
      <style>
        :host { display: contents; }
        :host {
          --viewer-dialog-margin-top: max(12px, calc(env(safe-area-inset-top, 0px) + 12px));
          --viewer-dialog-margin-bottom: max(12px, calc(env(safe-area-inset-bottom, 0px) + 12px));
          --viewer-dialog-margin-inline: max(12px, calc(env(safe-area-inset-left, 0px) + 12px), calc(env(safe-area-inset-right, 0px) + 12px));
          --oc-browser-bg-card: #fffdfa;
          --oc-browser-bg-card-soft: #f7f4f1;
          --oc-browser-border: #d9d5d0;
          --oc-browser-border-strong: #c8c1b8;
          --oc-browser-divider: #e2d8cd;
          --oc-browser-surface-muted: #eeebe7;
          --oc-browser-placeholder-fill: #e8e4de;
          --oc-browser-placeholder-border: #d6d0c7;
          --oc-browser-text: #2e2924;
          --oc-browser-text-muted: #6c6258;
        }
        * { box-sizing: border-box; }
        dialog {
          width: min(920px, calc(100vw - (var(--viewer-dialog-margin-inline) * 2)));
          max-height: min(1100px, calc(100dvh - var(--viewer-dialog-margin-top) - var(--viewer-dialog-margin-bottom)));
          border: 1px solid var(--oc-browser-border, #d9d5d0);
          border-radius: 12px;
          padding: 0;
          background: var(--oc-browser-bg-card, #fffdfa);
          margin-block: var(--viewer-dialog-margin-top) var(--viewer-dialog-margin-bottom);
          margin-inline: auto;
        }
        dialog::backdrop { background: rgba(15, 23, 42, 0.45); }
        .dialog-shell {
          display: grid;
          grid-template-rows: auto auto minmax(0, 1fr) auto;
          min-height: 0;
          height: min(100%, calc(100dvh - var(--viewer-dialog-margin-top) - var(--viewer-dialog-margin-bottom)));
          max-height: inherit;
        }
        .dialog-media {
          padding: 0.6rem 0.85rem 0.4rem;
        }
        .dialog-footer {
          padding: 0.7rem 0.85rem;
          border-top: 1px solid var(--oc-browser-divider, #e2d8cd);
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.55rem;
          background: var(--oc-browser-bg-card, #fffdfa);
          min-height: 0;
        }
        .dialog-header {
          padding: 0.75rem 0.9rem;
          border-bottom: 1px solid var(--oc-browser-divider, #e2d8cd);
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.65rem;
        }
        .dialog-title { margin: 0; font-size: 0.95rem; color: var(--oc-browser-text, #2e2924); }
        .dialog-header-actions {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
        }
        .dialog-body {
          padding: 0.15rem 0.85rem 0.85rem;
          overflow: auto;
          min-height: 0;
        }
        .viewer-media-shell {
          width: 100%;
          height: min(42dvh, 420px);
          min-height: 180px;
          border-radius: 8px;
          border: 1px solid var(--oc-browser-border, #d9d5d0);
          background: var(--oc-browser-bg-card-soft, #f8f3ed);
          display: flex;
          align-items: center;
  			justify-content: center;
          overflow: hidden;
          position: relative;
        }
        .viewer-details {
          margin-top: 0.85rem;
          border-top: 1px solid var(--oc-browser-divider, #e2d8cd);
          padding-top: 0.8rem;
          display: grid;
          gap: 0.5rem;
        }
        .viewer-item-title {
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
          line-height: 1.25;
          color: var(--oc-browser-text, #2e2924);
        }
        .viewer-item-subtitle {
          margin: 0;
          font-size: 0.84rem;
          line-height: 1.35;
          color: var(--oc-browser-text-muted, #6c6258);
        }
        .viewer-item-description {
          margin: 0;
          font-size: 0.88rem;
          line-height: 1.45;
          color: var(--oc-browser-text, #2e2924);
          white-space: pre-wrap;
        }
        .viewer-source-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: fit-content;
          min-height: 2rem;
          border: 1px solid var(--oc-browser-border, #d9d5d0);
          border-radius: 8px;
          background: var(--oc-browser-bg-card, #fffdfa);
          color: var(--oc-browser-text, #2e2924);
          font-size: 0.82rem;
          font-weight: 600;
          text-decoration: none;
          padding: 0.34rem 0.62rem;
        }
        .viewer-source-link:hover {
          background: var(--oc-browser-bg-card-soft, #f7f4f1);
        }
        .viewer-media-skeleton {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(
              110deg,
              rgba(226, 232, 240, 0.45) 8%,
              rgba(241, 245, 249, 0.9) 18%,
              rgba(226, 232, 240, 0.45) 33%
            );
          background-size: 220% 100%;
          animation: viewer-shimmer 1.1s linear infinite;
        }
        .viewer-media {
          display: block;
          opacity: 0;
          transition: opacity 180ms ease;
        }
        .viewer-media-image {
          width: auto;
          height: auto;
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          object-position: center;
        }
        .viewer-media-video {
          width: auto;
          height: auto;
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          object-position: center;
        }
        .viewer-media.is-ready {
          opacity: 1;
        }
        @keyframes viewer-shimmer {
          to { background-position-x: -220%; }
        }
        .btn {
          border: 1px solid #cbd5e1;
          background: #ffffff;
          color: #0f172a;
          border-radius: 8px;
          padding: 0.42rem 0.7rem;
          cursor: pointer;
          font: inherit;
          font-size: 0.88rem;
          font-weight: 600;
        }
        .btn[disabled] {
          opacity: 0.55;
          cursor: default;
        }
        .btn-secondary {
          background: var(--oc-browser-bg-card, #fffdfa);
          color: var(--oc-browser-text, #2e2924);
          border-color: var(--oc-browser-border, #d9d5d0);
        }
        .btn-primary {
          background: #0f6cc6;
          border-color: #0f6cc6;
          color: #ffffff;
        }
        .empty {
          border: 1px solid var(--oc-browser-border, #d9d5d0);
          border-radius: 8px;
          padding: 1rem;
          text-align: center;
          color: var(--oc-browser-text-muted, #6c6258);
          background: var(--oc-browser-surface-muted, #eee5dc);
          font-size: 0.9rem;
        }
        .icon-btn {
          width: 2rem;
          height: 2rem;
          display: inline-grid;
          place-items: center;
          border: 1px solid var(--oc-browser-border, #d9d5d0);
          background: var(--oc-browser-bg-card, #fffdfa);
          border-radius: 8px;
          color: var(--oc-browser-text-muted, #6c6258);
          cursor: pointer;
          padding: 0;
        }
        .icon-btn .icon-close {
          width: 1rem;
          height: 1rem;
          fill: currentColor;
        }
        @media (max-width: 760px) {
          dialog {
            width: calc(100vw - (var(--viewer-dialog-margin-inline) * 2));
            max-height: calc(100dvh - var(--viewer-dialog-margin-top) - var(--viewer-dialog-margin-bottom));
          }
          .viewer-media-shell {
            height: min(33dvh, 280px);
            min-height: 160px;
          }
          .dialog-header {
            padding: 0.65rem 0.75rem;
          }
          .dialog-media {
            padding: 0.55rem 0.75rem 0.35rem;
          }
          .dialog-body {
            padding: 0.1rem 0.75rem 0.75rem;
          }
          .dialog-footer {
            padding: 0.65rem 0.75rem calc(env(safe-area-inset-bottom, 0px) + 0.65rem);
          }
        }
      </style>
      <dialog id="viewerDialog" aria-label="Media viewer">
        <div class="dialog-shell">
          <div class="dialog-header">
            <h2 id="viewerTitle" class="dialog-title">Viewer</h2>
            <div class="dialog-header-actions">
              <button id="closeViewerBtn" class="icon-btn" type="button" aria-label="Close viewer">${renderCloseIcon("icon icon-close")}</button>
            </div>
          </div>
          <div id="viewerMediaArea" class="dialog-media"></div>
          <div id="viewerBody" class="dialog-body"></div>
          <footer class="dialog-footer">
            <button id="collectActionBtn" class="btn btn-primary" type="button">Collect</button>
            <button id="sourceActionBtn" class="btn btn-secondary" type="button">Source</button>
          </footer>
        </div>
      </dialog>
    `;
	}
}

if (!customElements.get("open-browser-viewer-dialog")) {
	customElements.define(
		"open-browser-viewer-dialog",
		OpenBrowserViewerDialogElement,
	);
}

export { OpenBrowserViewerDialogElement };
