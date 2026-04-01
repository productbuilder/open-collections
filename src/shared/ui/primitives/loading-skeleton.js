import { BaseElement } from "../app-foundation/base-element.js";
import { appFoundationTokenStyles } from "../app-foundation/tokens.css.js";

const loadingSkeletonStyles = `
  ${appFoundationTokenStyles}

  :host {
    display: block;
  }

  .skeleton-grid {
    display: grid;
    gap: var(--oc-space-3);
    grid-template-columns: repeat(auto-fill, minmax(11.5rem, 1fr));
  }

  .skeleton-card {
    border: 1px solid var(--oc-border-muted);
    border-radius: var(--oc-radius-sm);
    padding: var(--oc-space-3);
    background: var(--oc-surface-raised);
    display: grid;
    gap: var(--oc-space-2);
  }

  .skeleton-thumb {
    aspect-ratio: 4 / 3;
    border-radius: var(--oc-radius-xs);
    background: var(--oc-bg-subtle);
  }

  .skeleton-row-list {
    display: grid;
    gap: var(--oc-space-2);
  }

  .skeleton-row {
    border: 1px solid var(--oc-border-muted);
    border-radius: var(--oc-radius-xs);
    padding: var(--oc-space-2);
    display: grid;
    grid-template-columns: 2.2rem 3.5rem minmax(8rem, 1fr) 5.5rem;
    gap: var(--oc-space-2);
    align-items: center;
    background: var(--oc-surface-raised);
  }

  .line {
    height: 0.6rem;
    border-radius: 999px;
    background: var(--oc-bg-subtle);
  }

  .line.short {
    width: 42%;
  }

  .line.mid {
    width: 68%;
  }

  .line.long {
    width: 90%;
  }

  .pulse {
    animation: oc-skeleton-pulse 1.15s ease-in-out infinite;
  }

  @keyframes oc-skeleton-pulse {
    0% { opacity: 0.5; }
    50% { opacity: 1; }
    100% { opacity: 0.5; }
  }
`;

class OpenCollectionsLoadingSkeletonElement extends BaseElement {
  static get observedAttributes() {
    return ["variant", "count"];
  }

  renderStyles() {
    return loadingSkeletonStyles;
  }

  renderTemplate() {
    const variant = this.getStringAttr("variant") === "row-list" ? "row-list" : "card-grid";
    const rawCount = Number.parseInt(this.getStringAttr("count") || "6", 10);
    const count = Number.isFinite(rawCount) ? Math.min(Math.max(rawCount, 1), 24) : 6;
    return variant === "row-list"
      ? `<div class="skeleton-row-list" aria-hidden="true">${Array.from({ length: count }).map(() => this.renderRowSkeleton()).join("")}</div>`
      : `<div class="skeleton-grid" aria-hidden="true">${Array.from({ length: count }).map(() => this.renderCardSkeleton()).join("")}</div>`;
  }

  renderCardSkeleton() {
    return `
      <article class="skeleton-card pulse">
        <div class="skeleton-thumb"></div>
        <div class="line long"></div>
        <div class="line mid"></div>
        <div class="line short"></div>
      </article>
    `;
  }

  renderRowSkeleton() {
    return `
      <div class="skeleton-row pulse">
        <div class="line short"></div>
        <div class="skeleton-thumb"></div>
        <div class="line long"></div>
        <div class="line mid"></div>
      </div>
    `;
  }
}

if (!customElements.get("open-collections-loading-skeleton")) {
  customElements.define(
    "open-collections-loading-skeleton",
    OpenCollectionsLoadingSkeletonElement,
  );
}

export { OpenCollectionsLoadingSkeletonElement };
