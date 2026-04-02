function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

class Grid5SourceCardElement extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.model = {
      organizationName: "",
      curatorName: "",
      placeName: "",
      countryName: "",
      countryCode: "",
      descriptor: "Source",
      countLabel: "",
      actionLabel: "Open source",
      actionValue: "",
      logoLabel: "",
      previewRows: [],
      disabled: false,
    };
  }

  connectedCallback() {
    this.render();
    this.bindEvents();
  }

  update(data = {}) {
    this.model = { ...this.model, ...data };
    this.render();
    this.bindEvents();
  }

  bindEvents() {
    const card = this.shadowRoot?.querySelector(".card");
    if (!card || this._boundCard === card) return;
    card.addEventListener("click", () => this.dispatchActivate());
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        this.dispatchActivate();
      }
    });
    this._boundCard = card;
  }

  dispatchActivate() {
    if (this.model.disabled) return;
    this.dispatchEvent(
      new CustomEvent("oc-card-activate", {
        detail: { value: this.model.actionValue || "" },
        bubbles: true,
        composed: true,
      }),
    );
  }

  renderRows() {
    const rows = Array.isArray(this.model.previewRows) ? this.model.previewRows.slice(0, 3) : [];
    const filledRows = rows.length ? rows : [[], [], []];
    while (filledRows.length < 3) filledRows.push([]);

    return filledRows
      .map((row) => {
        const images = Array.isArray(row) ? row.slice(0, 3) : [];
        return `<div class="image-grid-row">
          ${Array.from({ length: 3 })
            .map((_, index) => {
              const url = images[index];
              return url
                ? `<span class="thumb"><img src="${escapeHtml(url)}" alt="" loading="lazy" decoding="async"/></span>`
                : `<span class="thumb placeholder" aria-hidden="true"></span>`;
            })
            .join("")}
        </div>`;
      })
      .join("");
  }

  render() {
    const sourceTitleRaw = this.model.organizationName || this.model.curatorName || "Source";
    const locationPlace = this.model.placeName || "";
    const locationCountry = this.model.countryName || this.model.countryCode || "";
    const locationLine = [locationPlace, locationCountry].filter(Boolean).join(" \u00B7 ") || locationPlace || locationCountry;
    const title = escapeHtml(sourceTitleRaw);
    const subtitle = escapeHtml(locationLine);
    const descriptor = escapeHtml(this.model.descriptor || "Source");
    const countLabel = escapeHtml(this.model.countLabel || "");
    const actionLabel = escapeHtml(this.model.actionLabel || "Open source");
    const logoSource = String(this.model.logoLabel || sourceTitleRaw || "");
    const logoLabel = escapeHtml(logoSource.slice(0, 2).toUpperCase());
    const isDisabled = Boolean(this.model.disabled);

    this.shadowRoot.innerHTML = `
      <style>
        :host { display:block; min-height:0; }
        * { box-sizing:border-box; }
        .card {
          height: 100%;
          border: 1px solid #c6d2e2;
          border-radius: 14px;
          background: linear-gradient(180deg, #f3f7fd, #ffffff);
          display: grid;
          grid-template-rows: auto 1fr auto;
          cursor: pointer;
          box-shadow: 0 1px 1px rgba(55, 75, 99, 0.06);
          overflow: hidden;
        }
        .card__header {
          padding: 9px 12px;
          border-bottom: 1px solid rgba(40, 60, 90, 0.14);
          background: #e6e2de;
        }
        .sourceHeader {
          display:grid;
          grid-template-columns:52px 1fr;
          gap:10px;
          align-items:start;
        }
        .sourceHeader__logo {
          width:52px;
          height:52px;
          border-radius:10px;
          display:grid;
          place-items:center;
          border:1px solid #c9c0a6;
          color:#2f4f78;
          background:linear-gradient(180deg, #f5f4ee, #f3f2ee);
          box-shadow: inset 0 1px 0 #f4f9ff;
          font-size:0.78rem;
          font-weight:700;
        }
        .sourceHeader__textBlock {
          min-width:0;
          display:grid;
          gap:2px;
          align-content:start;
          padding-top:1px;
        }
        .sourceHeader__titleRow {
          display:flex;
          align-items:center;
          min-width:0;
          margin:0;
        }
        .sourceHeader__title {
          margin:0;
          font-size:0.9rem;
          color:#1f2937;
          line-height:1.25;
          font-weight:620;
          overflow:hidden;
          text-overflow:ellipsis;
          white-space:nowrap;
        }
        .sourceHeader__subtitle {
          color:#46596f;
          font-size:0.72rem;
          font-weight:590;
          line-height:1.22;
          overflow:hidden;
          text-overflow:ellipsis;
          white-space:nowrap;
        }
        .sourceHeader__meta {
          font-size:0.69rem;
          line-height:1.22;
          color:#55667a;
          display:grid;
          gap:1px;
          margin-top:1px;
        }
        .card__body {
          margin-top: -1px;
          padding: 10px 12px 0;
          min-height: 0;
          overflow: hidden;
        }
        .image-grid-viewport {
          overflow:hidden;
          height:100%;
        }
        .image-grid { display:grid; gap:6px; }
        .image-grid-row { display:grid; grid-template-columns:repeat(3, 1fr); gap:6px; }
        .thumb { border:1px solid #cfdae8; border-radius:7px; overflow:hidden; height:42px; background:#e6e2de; }
        .image-grid-row:last-child .thumb {
          border-bottom-left-radius: 0;
          border-bottom-right-radius: 0;
        }
        .thumb img { width:100%; height:100%; object-fit:cover; display:block; }
        .placeholder { background:#e6e2de; }
        .card__footer {
          display:flex;
          justify-content:space-between;
          align-items:center;
          gap: 8px;
          padding: 8px 12px 10px;
          border-top: 1px solid #dde6f2;
          min-height: 26px;
        }
        .count {
          font-size:0.7rem;
          color:#4e627b;
          font-weight:600;
        }
        .action { font-size:0.71rem; color:#44556a; font-weight:500; }
        .actionWrap {
          display:inline-flex;
          align-items:center;
          gap:4px;
        }
        .actionIcon {
          width:13px;
          height:13px;
          color:#55667f;
          opacity:0.78;
          flex:none;
        }
      </style>
      <article class="card card--source" tabindex="${isDisabled ? "-1" : "0"}" role="button" aria-disabled="${isDisabled ? "true" : "false"}" aria-label="${actionLabel} ${title}">
        <div class="card__header card__header--source">
          <div class="sourceHeader">
            <div class="sourceHeader__logo">${logoLabel}</div>
            <div class="sourceHeader__textBlock">
              <div class="sourceHeader__titleRow">
                <h3 class="sourceHeader__title">${title}</h3>
              </div>
              <div class="sourceHeader__subtitle">${subtitle}</div>
              <div class="sourceHeader__meta">
                <div>${descriptor}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="card__body">
          <div class="image-grid-viewport">
            <div class="image-grid">${this.renderRows()}</div>
          </div>
        </div>
        <div class="card__footer">
          <span class="count">${countLabel}</span>
          <span class="actionWrap">
            <svg class="actionIcon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M3.75 20.25h16.5v-9.5L12 4.25l-8.25 6.5v9.5Z" stroke="currentColor" stroke-width="1.5"/>
              <path d="M8 20.25v-6h8v6" stroke="currentColor" stroke-width="1.5"/>
            </svg>
            <span class="action">${actionLabel}</span>
          </span>
        </div>
      </article>
    `;
  }
}

if (!customElements.get("grid5-card-source")) {
  customElements.define("grid5-card-source", Grid5SourceCardElement);
}

export { Grid5SourceCardElement };

