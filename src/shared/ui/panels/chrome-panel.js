import { backButtonStyles, renderBackButton } from "../../components/back-button.js";
import { BaseElement } from "../app-foundation/base-element.js";
import { appFoundationTokenStyles } from "../app-foundation/tokens.css.js";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

const panelChromeStyles = `
  ${appFoundationTokenStyles}

  :host {
    display: block;
    height: 100%;
    min-height: 0;
  }

  * {
    box-sizing: border-box;
  }

  .panel-shell {
    display: grid;
    grid-template-rows: auto auto minmax(0, 1fr);
    height: 100%;
    min-height: 0;
    overflow: hidden;
    background: transparent;
  }

  .panel-titlebar,
  .panel-subheader-row,
  .panel-toolbar-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--oc-space-2);
    min-width: 0;
  }

  .panel-titlebar {
    padding: var(--oc-space-3) 0 var(--oc-space-2);
  }

  .panel-titlebar-main {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--oc-space-2);
    min-width: 0;
    flex: 1 1 auto;
    width: 100%;
  }

  .panel-heading-copy {
    display: grid;
    gap: 0.2rem;
    min-width: 0;
    flex: 1 1 auto;
    justify-items: start;
    text-align: center;
  }

  .panel-title-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--oc-space-2);
    min-width: 0;
    flex-wrap: wrap;
  }

  .panel-title {
    margin: 0;
    font-size: 0.95rem;
    color: var(--oc-text-primary);
    min-width: 0;
    overflow-wrap: anywhere;
    text-align: center;
    line-height: 1.2;
  }

  .panel-status-chip {
    display: inline-flex;
    align-items: center;
    border-radius: var(--oc-radius-pill);
    border: var(--oc-border-width-sm) solid var(--oc-border-control);
    padding: 0.1rem 0.5rem;
    font-size: 0.72rem;
    line-height: 1.2;
    font-weight: 700;
    color: var(--oc-text-secondary);
    background: var(--oc-bg-subtle);
    white-space: nowrap;
  }

  .panel-status-chip[data-tone="ok"] {
    color: #166534;
    border-color: #86efac;
    background: #f0fdf4;
  }

  .panel-status-chip[data-tone="warn"] {
    color: #9a3412;
    border-color: #fdba74;
    background: #fff7ed;
  }

  .panel-subtext {
    margin: 0;
    font-size: 0.83rem;
    color: var(--oc-text-muted);
    min-width: 0;
    text-align: center;
  }

  .panel-titlebar-actions,
  .panel-toolbar-main,
  .panel-toolbar-actions {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    flex-wrap: wrap;
    min-width: 0;
  }

  .panel-titlebar-actions,
  .panel-toolbar-actions {
    justify-content: flex-end;
  }

  .panel-titlebar-actions {
    width: 100%;
  }

  .panel-toolbar-row {
    padding: var(--oc-space-2) 0;
  }

  .panel-subheader-row {
    padding: 0 0 var(--oc-space-1);
  }

  .panel-toolbar-main {
    flex: 1 1 auto;
  }

  .panel-content {
    display: flex;
    min-height: 0;
    height: 100%;
    overflow: hidden;
  }

  .panel-content > slot {
    display: block;
    width: 100%;
    height: 100%;
    min-height: 0;
  }

  ::slotted(*) {
    display: block;
    width: 100%;
    min-height: 0;
  }

  ${backButtonStyles}

  @media (max-width: 760px) {
    .panel-titlebar,
    .panel-toolbar-row {
      gap: 0.55rem;
    }

    .panel-titlebar {
      padding: var(--oc-space-2) 0;
    }

    .panel-toolbar-row {
      flex-wrap: wrap;
    }

    .panel-toolbar-main,
    .panel-titlebar-actions {
      align-items: center;
    }

    .panel-toolbar-actions,
    .panel-titlebar-actions {
      width: auto;
      max-width: 100%;
    }

    .panel-toolbar-actions {
      margin-left: auto;
      justify-content: flex-end;
    }
  }
`;

class OpenCollectionsPanelChromeElement extends BaseElement {
  static get observedAttributes() {
    return ["title", "subtitle", "show-back", "status-label", "status-tone"];
  }

  renderStyles() {
    return panelChromeStyles;
  }

  renderTemplate() {
    const title = this.getStringAttr("title") || "";
    const subtitle = this.getStringAttr("subtitle") || "";
    const showBack = this.getStringAttr("show-back") === "true";
    const statusLabel = this.getStringAttr("status-label") || "";
    const statusTone = this.getStringAttr("status-tone") || "neutral";

    return `
      <section class="panel-shell">
        <header class="panel-titlebar">
          <div class="panel-titlebar-main">
            ${showBack ? renderBackButton() : ""}
            <div class="panel-heading-copy">
              <div class="panel-title-row">
                <h2 class="panel-title">${escapeHtml(title)}</h2>
                ${statusLabel ? `<span class="panel-status-chip" data-tone="${escapeHtml(statusTone)}">${escapeHtml(statusLabel)}</span>` : ""}
              </div>
              ${subtitle ? `<p class="panel-subtext">${escapeHtml(subtitle)}</p>` : ""}
            </div>
          </div>
          <div class="panel-titlebar-actions"><slot name="header-actions"></slot></div>
        </header>

        <div class="panel-subheader-row"><slot name="subheader"></slot></div>

        <header>
          <div class="panel-toolbar-row">
            <div class="panel-toolbar-main"><slot name="toolbar"></slot></div>
            <div class="panel-toolbar-actions"><slot name="toolbar-actions"></slot></div>
          </div>
        </header>

        <div class="panel-content"><slot></slot></div>
      </section>
    `;
  }

  afterRender() {
    this.shadowRoot
      ?.getElementById("backBtn")
      ?.addEventListener("click", () => {
        this.dispatchEvent(
          new CustomEvent("panel-back", {
            bubbles: true,
            composed: true,
          }),
        );
      });
  }
}

if (!customElements.get("open-collections-panel-chrome")) {
  customElements.define(
    "open-collections-panel-chrome",
    OpenCollectionsPanelChromeElement,
  );
}

export { OpenCollectionsPanelChromeElement };
