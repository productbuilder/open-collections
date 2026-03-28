import { appFoundationTokenStyles } from "../app-foundation/tokens.css.js";

export const appRuntimeStyles = `
  ${appFoundationTokenStyles}

  .oc-runtime-state {
    display: grid;
    gap: var(--oc-space-2);
    padding: var(--oc-space-4);
    border-radius: var(--oc-radius-md);
    border: var(--oc-border-width-sm) solid var(--oc-border-default);
    background: var(--oc-bg-surface);
  }

  .oc-runtime-state[data-tone="error"] {
    border-color: #ef4444;
    background: #fef2f2;
  }

  .oc-runtime-state[data-tone="success"] {
    border-color: #22c55e;
    background: #f0fdf4;
  }

  .oc-runtime-state[data-tone="loading"] {
    border-color: var(--oc-border-accent);
  }

  .oc-runtime-state-title {
    margin: 0;
    font-size: 1rem;
  }

  .oc-runtime-state-description {
    margin: 0;
    color: var(--oc-text-muted);
  }

  .oc-toast-layer {
    position: fixed;
    right: var(--oc-space-4);
    bottom: calc(var(--oc-space-4) + env(safe-area-inset-bottom));
    z-index: 999;
    display: grid;
    gap: var(--oc-space-2);
    max-width: min(24rem, calc(100vw - 2rem));
  }

  .oc-toast {
    border: var(--oc-border-width-sm) solid var(--oc-border-default);
    border-radius: var(--oc-radius-sm);
    padding: 0.6rem 0.75rem;
    background: var(--oc-bg-surface);
    color: var(--oc-text-primary);
    box-shadow: 0 8px 20px rgba(15, 23, 42, 0.15);
    font-size: 0.85rem;
    font-weight: 600;
  }

  .oc-toast[data-tone="success"] {
    border-color: #22c55e;
    color: #166534;
  }

  .oc-toast[data-tone="error"] {
    border-color: #ef4444;
    color: #991b1b;
  }

  .oc-toast[data-tone="warning"] {
    border-color: #f59e0b;
    color: #92400e;
  }
`;
