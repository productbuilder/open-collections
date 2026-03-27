import { appFoundationLayoutStyles } from '../../../../shared/ui/app-foundation/layout.css.js';
import { appRuntimeStyles } from '../../../../shared/ui/app-runtime/styles.css.js';

export const appShellStyles = `
  ${appFoundationLayoutStyles}
  ${appRuntimeStyles}

  :host {
    display: block;
    width: 100%;
    height: 100%;
    min-height: 100dvh;
    --oc-shell-mobile-tabbar-height: 4.5rem;
  }

  .oc-app-nav {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .shell-title {
    margin: 0;
    font-size: 1rem;
  }

  .shell-nav-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.45rem;
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

  .shell-nav-icon {
    width: 1rem;
    height: 1rem;
    display: block;
    flex-shrink: 0;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.9;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .shell-nav-label {
    line-height: 1;
  }

  .shell-nav-btn:focus-visible {
    outline: 2px solid var(--oc-border-accent);
    outline-offset: 2px;
  }

  .shell-nav-btn:hover {
    border-color: #b6c4d2;
    background: #f8fbff;
  }

  .shell-nav-btn[aria-current="page"] {
    border-color: var(--oc-border-accent);
    background: var(--oc-border-accent);
    color: var(--oc-color-white);
  }

  .shell-section-mount {
    min-height: 100%;
    height: 100%;
  }

  .shell-section-mount > * {
    display: block;
    min-height: 100%;
  }


  @media (max-width: 760px) {
    .oc-app-frame {
      display: flex;
      flex-direction: column;
      min-height: 100dvh;
    }

    .oc-app-nav {
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 20;
      border-top: var(--oc-border-width-sm) solid var(--oc-border-default);
      border-bottom: 0;
      padding: 0.4rem 0.6rem calc(0.45rem + env(safe-area-inset-bottom));
      gap: 0.35rem;
      align-items: stretch;
      min-height: var(--oc-shell-mobile-tabbar-height);
      background: var(--oc-bg-surface);
    }

    .shell-nav-btn {
      min-height: 3.2rem;
      border: 0;
      border-radius: var(--oc-radius-md);
      padding: 0.3rem 0.2rem;
      font-size: 0.74rem;
      font-weight: 600;
      display: inline-flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;
      gap: 0.32rem;
    }

    .shell-nav-btn[aria-current="page"] {
      background: #e9f2ff;
      color: var(--oc-border-accent);
    }

    .oc-app-viewport {
      flex: 1 1 auto;
      padding-bottom: calc(
        var(--oc-shell-mobile-tabbar-height) + var(--oc-space-3) + env(safe-area-inset-bottom)
      );
    }
  }
`;
