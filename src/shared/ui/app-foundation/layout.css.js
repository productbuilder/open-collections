import { appFoundationTokenStyles } from "./tokens.css.js";

export const appFoundationLayoutStyles = `
  ${appFoundationTokenStyles}

  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  .oc-app-frame {
    min-height: 100dvh;
    padding: var(--oc-layout-safe-top) var(--oc-layout-safe-right) 0 var(--oc-layout-safe-left);
    display: grid;
    grid-template-rows: auto auto minmax(0, 1fr);
    background: var(--oc-bg-canvas);
    color: var(--oc-text-primary);
    font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
  }

  .oc-app-bar {
    display:flex;
    align-items:center;
    padding: var(--oc-space-4) var(--oc-space-4) var(--oc-space-3);
    background: var(--oc-bg-surface);
  }

  .oc-app-nav {
    display: flex;
    gap: var(--oc-space-2);
    padding: var(--oc-space-3) var(--oc-space-4);
    background: var(--oc-bg-surface);
  }

  .oc-app-viewport {
    min-height: 0;
    overflow: auto;
    <!-- padding: var(--oc-space-4); -->
  }

  .oc-page {
    max-width: var(--oc-layout-content-max);
    margin: 0 auto;
    display: grid;
    gap: var(--oc-space-4);
    align-content: start;
  }

  .oc-page-intro {
    display: grid;
    gap: var(--oc-space-2);
  }

  .oc-surface {
    background: var(--oc-bg-surface);
    border: var(--oc-border-width-sm) solid var(--oc-border-default);
    border-radius: var(--oc-radius-lg);
    padding: var(--oc-space-4);
  }


  .oc-placeholder-title {
    margin: 0;
    font-size: 1.1rem;
  }

  .oc-placeholder p {
    margin: 0;
    line-height: 1.5;
  }

  .oc-empty-state {
    border: var(--oc-border-width-sm) dashed var(--oc-border-strong);
    border-radius: var(--oc-radius-sm);
    padding: var(--oc-space-4);
    text-align: center;
    color: var(--oc-text-muted);
    background: var(--oc-bg-subtle);
  }

  .oc-muted {
    color: var(--oc-text-muted);
  }

  .oc-stack-sm {
    display: grid;
    gap: var(--oc-space-2);
  }

  .oc-stack-md {
    display: grid;
    gap: var(--oc-space-3);
  }

  @media (max-width: 760px) {
    .oc-app-viewport {
      <!-- padding: var(--oc-space-3) var(--oc-space-3) calc(var(--oc-space-3) + var(--oc-layout-safe-bottom)); -->
    }

  .oc-app-nav {
    display: grid;

  }

    .oc-page {
      gap: var(--oc-space-3);
    }

    .oc-surface {
      padding: var(--oc-space-3);
    }
  }
`;
