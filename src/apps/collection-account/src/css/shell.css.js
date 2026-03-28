import { appFoundationLayoutStyles } from "../../../../shared/ui/app-foundation/layout.css.js";

export const accountShellStyles = `
  ${appFoundationLayoutStyles}

  :host {
    display: block;
    min-height: 100vh;
  }

  .account-shell {
    max-width: var(--oc-layout-content-max);
    padding:1rem;
  }

  .account-title {
    margin: 0;
    font-size: clamp(1.4rem, 2.8vw, 1.95rem);
    line-height: 1.2;
  }

  .account-root-view {
    display: grid;
    gap: 0.75rem;
    width: min(100%, var(--oc-layout-content-max));
  }

  .account-entry-button {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    border: 1px solid var(--oc-border-subtle);
    background: var(--oc-bg-surface);
    color: var(--oc-text-primary);
    border-radius: var(--oc-radius-md);
    padding: 0.85rem 1rem;
    text-align: left;
    font: inherit;
    font-weight: 600;
    cursor: pointer;
    transition: border-color 120ms ease, background-color 120ms ease;
  }

  .account-entry-button:hover {
    border-color: var(--oc-border-strong);
    background: var(--oc-bg-surface);
  }

  .account-entry-label {
    text-align: left;
  }

  .account-entry-icon {
    flex-shrink: 0;
    font-size: 1.125rem;
    line-height: 1;
    color: var(--oc-text-muted);
  }

  .account-description,
  .account-note,
  .status-note {
    margin: 0;
    color: var(--oc-text-muted);
  }

  .status-note[data-tone='ok'] {
    color: #166534;
  }

  .status-note[data-tone='warn'] {
    color: #9a3412;
  }

  .connections-heading {
    margin: 0;
    font-size: 1.1rem;
  }

  .account-section-content {
    display: grid;
    gap: 0.75rem;
  }

  .account-subpage-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .account-back-button {
    border: 1px solid var(--oc-border-subtle);
    background: var(--oc-surface-base);
    color: var(--oc-text-primary);
    border-radius: var(--oc-radius-sm);
    width: 2rem;
    height: 2rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font: inherit;
    font-size: 1rem;
    line-height: 1;
    cursor: pointer;
  }

  .account-back-button:hover {
    border-color: var(--oc-border-strong);
    background: var(--oc-surface-elevated);
  }

  .account-back-icon {
    font-size: 1.1rem;
    color: var(--oc-text-muted);
  }

  .connections-body {
    display: grid;
    gap: 0.75rem;
  }

  .settings-placeholder {
    border: 1px dashed var(--oc-border-subtle);
    border-radius: var(--oc-radius-md);
    padding: 1rem;
    background: var(--oc-surface-base);
    display: grid;
    gap: 0.35rem;
  }

  .settings-placeholder-title {
    margin: 0;
    font-weight: 600;
    color: var(--oc-text-primary);
  }

  .settings-placeholder-copy {
    margin: 0;
    color: var(--oc-text-muted);
  }

  .is-hidden {
    display: none !important;
  }
`;
