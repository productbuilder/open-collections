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

const sectionPanelStyles = `
  ${appFoundationTokenStyles}

  :host {
    display: block;
  }

  .section-panel {
    display: grid;
    gap: var(--oc-space-3);
    align-content: start;
  }

  :host([surface]) .section-panel {
    border: var(--oc-border-width-sm) solid var(--oc-border-subtle);
    border-radius: var(--oc-radius-md);
    background: var(--oc-bg-surface);
    padding: var(--oc-space-4);
  }

  .section-panel-body {
    display: grid;
    gap: var(--oc-space-3);
    min-width: 0;
  }
`;

class OpenCollectionsSectionPanelElement extends BaseElement {
  static get observedAttributes() {
    return ["title", "description", "heading-level", "surface"];
  }

  renderStyles() {
    return sectionPanelStyles;
  }

  renderTemplate() {
    const title = this.getStringAttr("title") || "";
    const description = this.getStringAttr("description") || "";
    const headingLevel = this.getNumberAttr("heading-level") || 2;

    return `
      <section class="section-panel" aria-label="${escapeHtml(title)}">
        <open-collections-section-header
          title="${escapeHtml(title)}"
          description="${escapeHtml(description)}"
          heading-level="${headingLevel}"
        >
          <slot name="leading" slot="leading"></slot>
          <slot name="actions" slot="actions"></slot>
        </open-collections-section-header>
        <div class="section-panel-body">
          <slot></slot>
        </div>
      </section>
    `;
  }
}

if (!customElements.get("open-collections-section-panel")) {
  customElements.define(
    "open-collections-section-panel",
    OpenCollectionsSectionPanelElement,
  );
}

export { OpenCollectionsSectionPanelElement };
