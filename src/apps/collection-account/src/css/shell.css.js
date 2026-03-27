import { appFoundationLayoutStyles } from '../../../../shared/ui/app-foundation/layout.css.js';

export const accountShellStyles = `
  ${appFoundationLayoutStyles}

  :host {
    display: block;
    min-height: 100vh;
  }

  .account-shell {
    max-width: var(--oc-layout-content-max);
  }

  .account-title {
    margin: 0;
    font-size: clamp(1.4rem, 2.8vw, 1.95rem);
    line-height: 1.2;
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

  .account-sections {
    display: inline-flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .account-section-button {
    border: 1px solid var(--oc-border-subtle);
    background: var(--oc-surface-base);
    color: var(--oc-text-muted);
    border-radius: var(--oc-radius-pill, 999px);
    padding: 0.45rem 0.85rem;
    font: inherit;
    font-weight: 600;
    cursor: pointer;
    transition: color 120ms ease, border-color 120ms ease, background-color 120ms ease;
  }

  .account-section-button:hover {
    border-color: var(--oc-border-strong);
    color: var(--oc-text-primary);
  }

  .account-section-button.is-active {
    background: var(--oc-surface-elevated);
    color: var(--oc-text-primary);
    border-color: var(--oc-border-strong);
  }

  .account-section-content {
    display: grid;
    gap: 0.75rem;
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
