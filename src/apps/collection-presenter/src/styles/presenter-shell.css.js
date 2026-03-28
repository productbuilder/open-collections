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

  .presenter-placeholder-grid {
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  }

  .presenter-placeholder-card {
    display: grid;
    gap: var(--oc-space-3);
    align-content: start;
  }

`;
