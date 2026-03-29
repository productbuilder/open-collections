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

  .account-description,
  .account-note,
  .status-note {
    margin: 0;
    color: var(--oc-text-muted);
  }

  .connections-explainer {
    margin-bottom: var(--oc-space-3);
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

  .connections-body {
    display: grid;
    gap: 0.75rem;
  }

  #connectionsAddBtn {
    border: 2px dotted color-mix(in srgb, var(--oc-border-strong) 60%, #60a5fa 40%);
    border-radius: calc(var(--oc-radius-md) + 2px);
    background: linear-gradient(
      180deg,
      color-mix(in srgb, var(--oc-bg-surface) 90%, #eff6ff 10%) 0%,
      var(--oc-bg-surface) 100%
    );
    --oc-border-subtle: transparent;
  }

  @media (max-width: 47.99rem) {
    :host(:not([data-app-presentation-embedded])) .account-shell {
      padding:
        var(--oc-space-3)
        calc(var(--oc-space-3) + var(--oc-layout-safe-right))
        calc(var(--oc-space-3) + var(--oc-layout-safe-bottom))
        calc(var(--oc-space-3) + var(--oc-layout-safe-left));
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
