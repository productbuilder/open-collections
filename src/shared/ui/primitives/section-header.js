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

const sectionHeaderStyles = `
  ${appFoundationTokenStyles}

  :host {
    display: block;
  }

  .section-header {
    display: grid;
    gap: var(--oc-space-2);
  }

  .section-header-main {
    display: flex;
    align-items: center;
    gap: var(--oc-space-2);
  }

  .section-header-title {
    margin: 0;
    font-size: 1.1rem;
    line-height: 1.25;
    color: var(--oc-text-primary);
  }

  :host([heading-level="1"]) .section-header-title {
    font-size: var(
      --oc-section-header-h1-size,
      clamp(1.25rem, 2.3vw, 1.65rem)
    );
  }

  .section-header-description {
    margin: 0;
    color: var(--oc-text-muted);
    line-height: 1.5;
  }
`;

class OpenCollectionsSectionHeaderElement extends BaseElement {
  static get observedAttributes() {
    return ["title", "description", "heading-level"];
  }

  renderStyles() {
    return sectionHeaderStyles;
  }

  renderTemplate() {
    const title = this.getStringAttr("title") || "";
    const description = this.getStringAttr("description");
    const headingLevel = this.getNumberAttr("heading-level") || 2;
    const clampedLevel = Math.min(6, Math.max(1, headingLevel));
    const headingTag = `h${clampedLevel}`;

    return `
      <header class="section-header">
        <div class="section-header-main">
          <slot name="leading"></slot>
          <${headingTag} class="section-header-title">${escapeHtml(title)}</${headingTag}>
          <slot name="actions"></slot>
        </div>
        ${description ? `<p class="section-header-description">${escapeHtml(description)}</p>` : ""}
      </header>
    `;
  }
}

if (!customElements.get("open-collections-section-header")) {
  customElements.define(
    "open-collections-section-header",
    OpenCollectionsSectionHeaderElement,
  );
}

export { OpenCollectionsSectionHeaderElement };
