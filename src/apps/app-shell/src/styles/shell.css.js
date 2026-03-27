import { appFoundationLayoutStyles } from '../../../../shared/ui/app-foundation/layout.css.js';

export const appShellStyles = `
  ${appFoundationLayoutStyles}

  :host {
    display: block;
    width: 100%;
    height: 100%;
    min-height: 100dvh;
  }

  .oc-app-nav {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .shell-title {
    margin: 0;
    font-size: 1rem;
  }

  .shell-subtitle {
    margin: 0.3rem 0 0;
    color: var(--oc-text-muted);
    font-size: 0.9rem;
  }

  .shell-nav-btn {
    border: var(--oc-border-width-sm) solid var(--oc-border-strong);
    border-radius: var(--oc-radius-sm);
    background: var(--oc-bg-surface);
    color: var(--oc-text-primary);
    font: inherit;
    font-size: 0.84rem;
    font-weight: 600;
    padding: 0.45rem 0.55rem;
    cursor: pointer;
  }

  .shell-nav-btn:focus-visible {
    outline: 2px solid var(--oc-border-accent);
    outline-offset: 2px;
  }

  .shell-nav-btn:hover {
    border-color: #b6c4d2;
    background: #f8fbff;
  }

  .shell-nav-btn[aria-pressed="true"] {
    border-color: var(--oc-border-accent);
    background: var(--oc-border-accent);
    color: var(--oc-color-white);
  }


  @media (max-width: 760px) {
    .oc-app-frame {
      grid-template-rows: auto minmax(0, 1fr) var(--oc-layout-nav-height);
    }

    .oc-app-nav {
      position: sticky;
      bottom: 0;
      z-index: 20;
      border-top: var(--oc-border-width-sm) solid var(--oc-border-default);
      border-bottom: 0;
      padding: 0.5rem 0.6rem calc(0.5rem + env(safe-area-inset-bottom));
      gap: 0.35rem;
      align-items: stretch;
      min-height: var(--oc-layout-nav-height);
    }

    .shell-nav-btn {
      min-height: 2.35rem;
      padding: 0.35rem 0.25rem;
      font-size: 0.8rem;
    }
  }
`;
