class OpenBrowserViewerDialogElement extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.model = { item: null };
	}

	connectedCallback() {
		this.render();
		this.bindEvents();
		this.applyView();
	}

	bindEvents() {
		this.shadowRoot
			.getElementById("closeViewerBtn")
			?.addEventListener("click", () => {
				this.close();
				this.dispatchEvent(
					new CustomEvent("close-viewer", {
						bubbles: true,
						composed: true,
					}),
				);
			});

		this.shadowRoot
			.getElementById("viewerDialog")
			?.addEventListener("close", () => {
				this.dispatchEvent(
					new CustomEvent("close-viewer", {
						bubbles: true,
						composed: true,
					}),
				);
			});
	}

	setItem(item) {
		this.model.item = item || null;
		this.applyView();
	}

	clear() {
		this.model.item = null;
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

	applyView() {
		const title = this.shadowRoot.getElementById("viewerTitle");
		const body = this.shadowRoot.getElementById("viewerBody");
		if (!title || !body) {
			return;
		}

		body.innerHTML = "";
		const item = this.model.item;
		if (!item) {
			title.textContent = "Viewer";
			const empty = document.createElement("div");
			empty.className = "empty";
			empty.textContent = "Choose an item to view.";
			body.appendChild(empty);
			return;
		}

		title.textContent = item.title || item.id || "Viewer";
		const mediaType = (item.media?.type || "").toLowerCase();
		if (mediaType.includes("video")) {
			const video = document.createElement("video");
			video.className = "viewer-media";
			video.src = item.media?.url || "";
			video.controls = true;
			body.appendChild(video);
			return;
		}

		const image = document.createElement("img");
		image.className = "viewer-media";
		image.src = item.media?.url || item.media?.thumbnailUrl || "";
		image.alt = item.title || item.id || "";
		body.appendChild(image);
	}

	render() {
		this.shadowRoot.innerHTML = `
      <style>
        :host { display: contents; }
        * { box-sizing: border-box; }
        dialog {
          width: min(980px, 96vw);
          border: 1px solid #dbe3ec;
          border-radius: 12px;
          padding: 0;
        }
        dialog::backdrop { background: rgba(15, 23, 42, 0.45); }
        .dialog-shell {
          display: grid;
          grid-template-rows: auto 1fr;
          max-height: min(85vh, 760px);
        }
        .dialog-header {
          padding: 0.75rem 0.9rem;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.65rem;
        }
        .dialog-title { margin: 0; font-size: 0.95rem; color: #111827; }
        .dialog-body { padding: 0.85rem; overflow: auto; }
        .viewer-media {
          width: 100%;
          max-height: 64vh;
          border-radius: 8px;
          border: 1px solid #dbe3ec;
          background: #f8fafc;
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
        .empty {
          border: 1px dashed #cbd5e1;
          border-radius: 8px;
          padding: 1rem;
          text-align: center;
          color: #64748b;
          background: #f8fafc;
          font-size: 0.9rem;
        }
      </style>
      <dialog id="viewerDialog" aria-label="Media viewer">
        <div class="dialog-shell">
          <div class="dialog-header">
            <h2 id="viewerTitle" class="dialog-title">Viewer</h2>
            <button id="closeViewerBtn" class="btn" type="button">Close</button>
          </div>
          <div id="viewerBody" class="dialog-body"></div>
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
