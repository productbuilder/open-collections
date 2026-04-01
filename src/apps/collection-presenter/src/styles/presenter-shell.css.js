import { appFoundationLayoutStyles } from "../../../../shared/ui/app-foundation/layout.css.js";

export const presenterShellStyles = `
  ${appFoundationLayoutStyles}

  :host {
    display: block;
    height: 100%;
    min-height: 100vh;
  }

  :host([data-workbench-embed]),
  :host([data-shell-embed]),
  :host([data-oc-app-mode="embedded"]) {
    min-height: 100%;
  }

  .oc-app-viewport {
    min-height: 100%;
  }

  .presenter-panel-wrap {
    min-height: 0;
    flex: 1 1 auto;
  }

  .toolbar-copy {
    color: var(--oc-text-muted);
    font-size: 0.82rem;
  }

  .toolbar-actions {
    display: flex;
    gap: var(--oc-space-2);
  }

  .presenter-grid-wrap {
    display: block;
    height: 100%;
    overflow: auto;
    padding: 0 0 var(--oc-space-1);
  }

  #presenterGrid {
    display: block;
  }

  .presenter-cell {
    display: block;
    min-width: 0;
  }

  .btn {
    appearance: none;
    border: 1px solid var(--oc-border-control);
    background: var(--oc-bg-surface);
    color: var(--oc-text-primary);
    border-radius: var(--oc-radius-md);
    padding: 0.45rem 0.7rem;
    font: inherit;
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
  }

  .btn:hover {
    background: var(--oc-bg-subtle);
  }

  .presenter-empty {
    display: block;
  }
`;
