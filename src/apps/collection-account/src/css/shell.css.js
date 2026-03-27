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

  .connections-body {
    display: grid;
    gap: 0.75rem;
  }

  .is-hidden {
    display: none !important;
  }
`;
