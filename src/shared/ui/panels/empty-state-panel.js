import { BaseElement } from "../app-foundation/base-element.js";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

class OpenCollectionsEmptyStatePanelElement extends BaseElement {
  static get observedAttributes() {
    return [
      "title",
      "description",
      "heading-level",
      "empty-title",
      "message",
      "compact",
      "surface",
    ];
  }

  renderTemplate() {
    const title = this.getStringAttr("title") || "";
    const description = this.getStringAttr("description") || "";
    const headingLevel = this.getNumberAttr("heading-level") || 2;
    const emptyTitle = this.getStringAttr("empty-title") || "";
    const message =
      this.getStringAttr("message") || "No content available yet for this section.";
    const compact = this.getBoolAttr("compact");
    const surface = this.getBoolAttr("surface");

    return `
      <open-collections-section-panel
        title="${escapeHtml(title)}"
        description="${escapeHtml(description)}"
        heading-level="${headingLevel}"
        ${surface ? "surface" : ""}
      >
        <slot name="leading" slot="leading"></slot>
        <slot name="actions" slot="actions"></slot>
        <open-collections-empty-state
          ${compact ? "compact" : ""}
          title="${escapeHtml(emptyTitle)}"
          message="${escapeHtml(message)}"
        ></open-collections-empty-state>
      </open-collections-section-panel>
    `;
  }
}

if (!customElements.get("open-collections-empty-state-panel")) {
  customElements.define(
    "open-collections-empty-state-panel",
    OpenCollectionsEmptyStatePanelElement,
  );
}

export { OpenCollectionsEmptyStatePanelElement };
