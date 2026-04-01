const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

class OpenCollectionsTimeComparerElement extends HTMLElement {
	static get observedAttributes() {
		return [
			"past-src",
			"present-src",
			"past-label",
			"present-label",
			"show-labels",
			"split",
		];
	}

	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.model = {
			pastSrc: "",
			presentSrc: "",
			pastLabel: "Past",
			presentLabel: "Present",
			showLabels: true,
			split: 0.5,
			dragging: false,
		};
		this.handlePointerMove = this.handlePointerMove.bind(this);
		this.handlePointerUp = this.handlePointerUp.bind(this);
	}

	connectedCallback() {
		this.syncModelFromAttributes();
		this.render();
		this.bindEvents();
		this.applyView();
	}

	attributeChangedCallback() {
		this.syncModelFromAttributes();
		this.applyView();
	}

	set split(value) {
		this.setSplit(value, { emitEvent: false });
	}

	get split() {
		return this.model.split;
	}

	syncModelFromAttributes() {
		if (this.hasAttribute("past-src")) {
			this.model.pastSrc = this.getAttribute("past-src") || "";
		}
		if (this.hasAttribute("present-src")) {
			this.model.presentSrc = this.getAttribute("present-src") || "";
		}
		if (this.hasAttribute("past-label")) {
			this.model.pastLabel = this.getAttribute("past-label") || "Past";
		}
		if (this.hasAttribute("present-label")) {
			this.model.presentLabel =
				this.getAttribute("present-label") || "Present";
		}
		if (this.hasAttribute("show-labels")) {
			this.model.showLabels =
				(this.getAttribute("show-labels") || "").toLowerCase() !==
				"false";
		}
		if (this.hasAttribute("split")) {
			const split = Number.parseFloat(this.getAttribute("split") || "0.5");
			this.model.split = Number.isFinite(split) ? clamp(split, 0, 1) : 0.5;
		}
	}

	bindEvents() {
		this.shadowRoot
			.getElementById("sliderTrack")
			?.addEventListener("pointerdown", (event) => {
				event.preventDefault();
				this.shadowRoot
					.getElementById("sliderHandle")
					?.focus({ preventScroll: true });
				this.model.dragging = true;
				this.updateSplitFromPointer(event);
				window.addEventListener("pointermove", this.handlePointerMove);
				window.addEventListener("pointerup", this.handlePointerUp);
			});

		this.shadowRoot
			.getElementById("sliderHandle")
			?.addEventListener("keydown", (event) => {
				const step = event.shiftKey ? 0.1 : 0.02;
				if (event.key === "ArrowLeft") {
					event.preventDefault();
					this.setSplit(this.model.split - step);
					return;
				}
				if (event.key === "ArrowRight") {
					event.preventDefault();
					this.setSplit(this.model.split + step);
					return;
				}
				if (event.key === "Home") {
					event.preventDefault();
					this.setSplit(0);
					return;
				}
				if (event.key === "End") {
					event.preventDefault();
					this.setSplit(1);
				}
			});
	}

	handlePointerMove(event) {
		if (!this.model.dragging) {
			return;
		}
		this.updateSplitFromPointer(event);
	}

	handlePointerUp() {
		this.model.dragging = false;
		window.removeEventListener("pointermove", this.handlePointerMove);
		window.removeEventListener("pointerup", this.handlePointerUp);
	}

	updateSplitFromPointer(event) {
		const track = this.shadowRoot?.getElementById("sliderTrack");
		if (!track) {
			return;
		}
		const rect = track.getBoundingClientRect();
		if (!rect.width) {
			return;
		}
		const raw = (event.clientX - rect.left) / rect.width;
		this.setSplit(raw);
	}

	setSplit(value, options = {}) {
		const next = clamp(Number(value) || 0, 0, 1);
		if (Math.abs(next - this.model.split) < 0.001) {
			return;
		}
		this.model.split = next;
		this.applyView();
		if (options.emitEvent !== false) {
			this.dispatchEvent(
				new CustomEvent("split-change", {
					detail: { split: this.model.split },
					bubbles: true,
					composed: true,
				}),
			);
		}
	}

	applyView() {
		if (!this.shadowRoot) {
			return;
		}
		const pastImage = this.shadowRoot.getElementById("pastImage");
		const presentImage = this.shadowRoot.getElementById("presentImage");
		const divider = this.shadowRoot.getElementById("divider");
		const handle = this.shadowRoot.getElementById("sliderHandle");
		const labels = this.shadowRoot.getElementById("labels");
		const pastLabel = this.shadowRoot.getElementById("pastLabel");
		const presentLabel = this.shadowRoot.getElementById("presentLabel");
		const overlay = this.shadowRoot.getElementById("presentOverlay");
		const empty = this.shadowRoot.getElementById("emptyState");
		if (
			!pastImage ||
			!presentImage ||
			!divider ||
			!handle ||
			!labels ||
			!pastLabel ||
			!presentLabel ||
			!overlay ||
			!empty
		) {
			return;
		}

		const hasBoth = Boolean(this.model.pastSrc && this.model.presentSrc);
		empty.hidden = hasBoth;
		if (!hasBoth) {
			return;
		}

		pastImage.src = this.model.pastSrc;
		presentImage.src = this.model.presentSrc;
		overlay.style.clipPath = `inset(0 0 0 ${this.model.split * 100}%)`;
		divider.style.left = `${this.model.split * 100}%`;
		handle.style.left = `${this.model.split * 100}%`;
		handle.setAttribute("aria-valuenow", String(Math.round(this.model.split * 100)));
		labels.hidden = !this.model.showLabels;
		pastLabel.textContent = this.model.pastLabel;
		presentLabel.textContent = this.model.presentLabel;
	}

	render() {
		this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
        }
        * { box-sizing: border-box; }
        .frame {
          position: relative;
          width: 100%;
          aspect-ratio: 16 / 9;
          border-radius: 12px;
          border: 1px solid #dbe3ec;
          background: #0f172a;
          overflow: hidden;
          touch-action: none;
        }
        .image-layer {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
        }
        .image-layer img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          user-select: none;
          -webkit-user-drag: none;
          pointer-events: none;
        }
        .divider {
          position: absolute;
          top: 0;
          height: 100%;
          width: 1px;
          background: rgba(255, 255, 255, 0.92);
          transform: translateX(-50%);
          pointer-events: none;
          box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.25);
        }
        .slider-track {
          position: absolute;
          inset: 0;
          cursor: ew-resize;
        }
        .slider-handle {
          position: absolute;
          top: 50%;
          width: 28px;
          height: 28px;
          border-radius: 999px;
          border: 2px solid #ffffff;
          background: #0f172a;
          transform: translate(-50%, -50%);
          cursor: ew-resize;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.35);
        }
        .slider-handle:focus-visible {
          outline: 2px solid #22d3ee;
          outline-offset: 2px;
        }
        .labels {
          position: absolute;
          left: 0;
          right: 0;
          top: 0;
          display: flex;
          justify-content: space-between;
          gap: 0.5rem;
          padding: 0.65rem;
          pointer-events: none;
        }
        .label {
          background: rgba(15, 23, 42, 0.72);
          color: #f8fafc;
          border: 1px solid rgba(226, 232, 240, 0.35);
          padding: 0.2rem 0.5rem;
          border-radius: 999px;
          font-size: 0.72rem;
          font-weight: 600;
        }
        .empty {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          color: #cbd5e1;
          font-size: 0.9rem;
          background: linear-gradient(145deg, #0f172a, #1e293b);
          text-align: center;
          padding: 1rem;
        }
      </style>
      <div class="frame" id="sliderTrack">
        <div id="emptyState" class="empty">Provide both past and present image URLs.</div>
        <div class="image-layer">
          <img id="pastImage" alt="Past image" />
        </div>
        <div id="presentOverlay" class="image-layer">
          <img id="presentImage" alt="Present image" />
        </div>
        <div id="divider" class="divider"></div>
        <div id="labels" class="labels">
          <span id="pastLabel" class="label">Past</span>
          <span id="presentLabel" class="label">Present</span>
        </div>
        <div
          id="sliderHandle"
          class="slider-handle"
          tabindex="0"
          role="slider"
          aria-label="Time comparison split"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow="50"
        ></div>
      </div>
    `;
	}
}

if (!customElements.get("oc-time-comparer")) {
	customElements.define("oc-time-comparer", OpenCollectionsTimeComparerElement);
}

export { OpenCollectionsTimeComparerElement };
