class OcTimeRangeSliderElement extends HTMLElement {
	static get observedAttributes() {
		return ["min", "max", "start", "end", "disabled"];
	}

	constructor() {
		super();
		this.attachShadow({ mode: "open" });
	}

	connectedCallback() {
		this.render();
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (oldValue === newValue) {
			return;
		}
		this.render();
		if (["start", "end", "min", "max"].includes(name)) {
			this.emitRangeChange();
		}
	}

	get min() {
		return this.getNumericAttribute("min", 0);
	}

	set min(value) {
		this.setAttribute("min", String(value));
	}

	get max() {
		return this.getNumericAttribute("max", 100);
	}

	set max(value) {
		this.setAttribute("max", String(value));
	}

	get start() {
		const fallback = this.min;
		return this.getNumericAttribute("start", fallback);
	}

	set start(value) {
		this.setAttribute("start", String(value));
	}

	get end() {
		const fallback = this.max;
		return this.getNumericAttribute("end", fallback);
	}

	set end(value) {
		this.setAttribute("end", String(value));
	}

	get disabled() {
		return this.hasAttribute("disabled");
	}

	set disabled(value) {
		if (value) {
			this.setAttribute("disabled", "");
			return;
		}
		this.removeAttribute("disabled");
	}

	getNumericAttribute(name, fallback) {
		const raw = this.getAttribute(name);
		if (raw === null || raw.trim() === "") {
			return fallback;
		}
		const parsed = Number(raw);
		return Number.isFinite(parsed) ? parsed : fallback;
	}

	normalizedRange() {
		const rawMin = this.min;
		const rawMax = this.max;
		const min = Math.min(rawMin, rawMax);
		const max = Math.max(rawMin, rawMax);
		const start = Math.min(max, Math.max(min, this.start));
		const end = Math.min(max, Math.max(min, this.end));
		const normalizedStart = Math.min(start, end);
		const normalizedEnd = Math.max(start, end);

		return {
			min,
			max,
			start: normalizedStart,
			end: normalizedEnd,
		};
	}

	handleStartInput = (event) => {
		const value = Number(event.target?.value);
		const range = this.normalizedRange();
		const nextStart = Number.isFinite(value) ? Math.max(range.min, Math.min(value, range.end)) : range.start;
		this.setAttribute("start", String(nextStart));
	};

	handleEndInput = (event) => {
		const value = Number(event.target?.value);
		const range = this.normalizedRange();
		const nextEnd = Number.isFinite(value) ? Math.min(range.max, Math.max(value, range.start)) : range.end;
		this.setAttribute("end", String(nextEnd));
	};

	emitRangeChange() {
		const range = this.normalizedRange();
		this.dispatchEvent(
			new CustomEvent("oc-time-range-change", {
				detail: range,
				bubbles: true,
				composed: true,
			}),
		);
	}

	render() {
		if (!this.shadowRoot) {
			return;
		}

		const range = this.normalizedRange();
		const isDisabled = this.disabled;

		this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: inherit;
          color: inherit;
        }

        :host([hidden]) {
          display: none !important;
        }

        .control {
          display: grid;
          gap: 0.5rem;
        }

        .row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 0.5rem;
          align-items: center;
        }

        .label {
          display: block;
          font-size: 0.825rem;
          font-weight: 600;
        }

        .value {
          font-variant-numeric: tabular-nums;
          font-size: 0.8rem;
          opacity: 0.88;
          min-width: 5ch;
          text-align: right;
        }

        input[type="range"] {
          width: 100%;
          margin: 0;
          accent-color: var(--oc-time-range-slider-accent, #0e7a5f);
        }

        .summary {
          margin-top: 0.125rem;
          font-size: 0.78rem;
          opacity: 0.82;
        }
      </style>
      <fieldset class="control" ${isDisabled ? "disabled" : ""}>
        <legend class="label">Time range</legend>
        <div class="row">
          <label class="label" for="start-input">Start</label>
          <span class="value" id="start-value">${range.start}</span>
        </div>
        <input
          id="start-input"
          type="range"
          min="${range.min}"
          max="${range.max}"
          step="1"
          value="${range.start}"
          aria-describedby="start-value summary"
          ${isDisabled ? "disabled" : ""}
        />

        <div class="row">
          <label class="label" for="end-input">End</label>
          <span class="value" id="end-value">${range.end}</span>
        </div>
        <input
          id="end-input"
          type="range"
          min="${range.min}"
          max="${range.max}"
          step="1"
          value="${range.end}"
          aria-describedby="end-value summary"
          ${isDisabled ? "disabled" : ""}
        />

        <p class="summary" id="summary">${range.start} to ${range.end}</p>
      </fieldset>
    `;

		this.shadowRoot.getElementById("start-input")?.addEventListener("input", this.handleStartInput);
		this.shadowRoot.getElementById("end-input")?.addEventListener("input", this.handleEndInput);
	}
}

if (!customElements.get("oc-time-range-slider")) {
	customElements.define("oc-time-range-slider", OcTimeRangeSliderElement);
}

export { OcTimeRangeSliderElement };
