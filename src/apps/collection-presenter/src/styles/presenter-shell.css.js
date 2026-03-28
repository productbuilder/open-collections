import { appFoundationLayoutStyles } from "../../../../shared/ui/app-foundation/layout.css.js";

export const presenterShellStyles = `
  ${appFoundationLayoutStyles}

  :host {
    display: block;
    min-height: 100vh;
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
