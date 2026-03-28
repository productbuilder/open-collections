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

const emptyStateStyles = `
  ${appFoundationTokenStyles}

  :host {
    display: block;
  }

  .empty-state {
    border: var(--oc-border-width-sm) dashed var(--oc-border-strong);
    border-radius: var(--oc-radius-sm);
    padding: var(--oc-space-4);
    text-align: center;
    color: var(--oc-text-muted);
    background: var(--oc-bg-subtle);
    display: grid;
    gap: var(--oc-space-2);
  }

  :host([compact]) .empty-state {
    padding: var(--oc-space-3);
  }

  .empty-state-title {
    margin: 0;
    color: var(--oc-text-primary);
    font-weight: 600;
    font-size: 0.95rem;
  }

  .empty-state-message {
    margin: 0;
    line-height: 1.45;
  }
`;

class OpenCollectionsEmptyStateElement extends BaseElement {
  static get observedAttributes() {
    return ["title", "message", "compact"];
  }

  renderStyles() {
    return emptyStateStyles;
  }

  renderTemplate() {
    const title = this.getStringAttr("title");
    const message = this.getStringAttr("message") || "No content available.";

    return `
      <section class="empty-state" role="status" aria-live="polite">
        ${title ? `<h3 class="empty-state-title">${escapeHtml(title)}</h3>` : ""}
        <p class="empty-state-message">${escapeHtml(message)}</p>
      </section>
    `;
  }
}

if (!customElements.get("open-collections-empty-state")) {
  customElements.define(
    "open-collections-empty-state",
    OpenCollectionsEmptyStateElement,
  );
}

export { OpenCollectionsEmptyStateElement };
