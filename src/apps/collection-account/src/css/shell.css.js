import { appFoundationLayoutStyles } from "../../../../shared/ui/app-foundation/layout.css.js";
import { backButtonStyles } from "../../../../shared/components/back-button.js";

export const accountShellStyles = `
  ${appFoundationLayoutStyles}

  :host {
    display: block;
    height: 100%;
    min-height: 100vh;
  }

  :host([data-app-presentation-embedded]) {
    min-height: 100%;
  }

  .account-shell {
    min-height: 100%;
    max-width: var(--oc-layout-content-max);
    padding: var(--oc-space-4);
  }

  :host([data-app-presentation-embedded]) .account-shell {
    max-width: none;
    padding: var(--oc-space-3);
  }

  .account-title {
    margin: 0;
    font-size: clamp(1.4rem, 2.8vw, 1.95rem);
    line-height: 1.2;
  }

  .account-root-view {
    display: grid;
    gap: var(--oc-space-3);
    width: min(100%, var(--oc-layout-panel-max));
    margin-inline: auto;
  }

  .account-entry-button {
    width: 100%;
    min-height: 4.1rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--oc-space-3);
    border: 1px solid var(--oc-border-subtle);
    background: var(--oc-bg-surface);
    color: var(--oc-text-primary);
    border-radius: var(--oc-radius-md);
    padding: 0.9rem var(--oc-space-4);
    text-align: left;
    font: inherit;
    cursor: pointer;
    transition: border-color 120ms ease, background-color 120ms ease;
  }

  .account-entry-button:hover {
    border-color: var(--oc-border-strong);
    background: var(--oc-bg-surface);
  }

  .account-entry-leading-icon {
    width: 1.75rem;
    height: 1.75rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    color: var(--oc-text-muted);
  }

  .account-entry-leading-icon .icon {
    width: 1.1rem;
    height: 1.1rem;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .account-entry-content {
    min-width: 0;
    display: grid;
    gap: 0.2rem;
    flex: 1;
  }

  .account-entry-label {
    text-align: left;
    font-weight: 600;
    line-height: 1.2;
  }

  .account-entry-subtitle {
    color: var(--oc-text-muted);
    font-size: 0.82rem;
    line-height: 1.3;
    font-weight: 500;
  }

  .account-entry-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: var(--oc-text-muted);
  }

  .account-entry-icon .icon {
    width: 1.1rem;
    height: 1.1rem;
    fill: currentColor;
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


  .account-section-content {
    display: grid;
    gap: 0.75rem;
  }


  /* Reuse shared back button styling for account subpage navigation. */
  ${backButtonStyles}

  .account-header-action-btn {
    margin-inline-start: auto;
    min-height: 2rem;
    height: 2rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #0f6cc6;
    background: #0f6cc6;
    color: #ffffff;
    border-radius: 8px;
    padding: 0 0.75rem;
    font: inherit;
    font-size: 0.88rem;
    font-weight: 600;
    line-height: 1;
    cursor: pointer;
    white-space: nowrap;
  }

  .account-header-action-btn:hover {
    background: #0d5eae;
    border-color: #0d5eae;
  }

  .account-header-action-btn:focus-visible {
    outline: 2px solid #2563eb;
    outline-offset: 2px;
  }

  .connections-body {
    display: grid;
    gap: 0.75rem;
  }

  @media (max-width: 47.99rem) {
    :host(:not([data-app-presentation-embedded])) .account-shell {
      padding:
        var(--oc-space-3)
        calc(var(--oc-space-3) + var(--oc-layout-safe-right))
        calc(var(--oc-space-3) + var(--oc-layout-safe-bottom))
        calc(var(--oc-space-3) + var(--oc-layout-safe-left));
    }

    .account-entry-button {
      padding-inline: var(--oc-space-4);
    }

    .account-entry-subtitle {
      font-size: 0.79rem;
    }
  }

  @media (min-width: 48rem) {
    .account-root-view {
      max-width: 38rem;
    }
  }


  .is-hidden {
    display: none !important;
  }
`;
