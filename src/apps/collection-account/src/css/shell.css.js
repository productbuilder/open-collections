import { themeTokenStyles } from '../../collection-manager/src/css/theme.css.js';
import { primitiveStyles } from '../../collection-manager/src/css/primitives.css.js';

export const accountShellStyles = `
  ${themeTokenStyles}
  ${primitiveStyles}

  :host {
    display: block;
    min-height: 100vh;
    background: #f8fafc;
    color: var(--oc-text-primary);
  }

  * {
    box-sizing: border-box;
  }

  .account-shell {
    max-width: 1100px;
    margin: 0 auto;
    padding: 1.5rem 1rem 2rem;
    display: grid;
    gap: 1rem;
    align-content: start;
  }

  .account-hero {
    display: grid;
    gap: 0.5rem;
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

  .connections-surface {
    background: var(--oc-bg-panel);
    border: var(--oc-border-width-sm) solid var(--oc-border-subtle);
    border-radius: var(--oc-radius-panel);
    padding: 1rem;
    display: grid;
    gap: 0.9rem;
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

  @media (max-width: 760px) {
    .account-shell {
      padding: 1rem 0.75rem 1.25rem;
    }

    .connections-surface {
      padding: 0.75rem;
    }
  }
`;
