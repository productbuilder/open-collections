import { primitiveStyles } from "./primitives.css.js";

export const browserStyles = `
  ${primitiveStyles}

  :host {
    display: block;
    box-sizing: border-box;
    height: 100%;
    min-height: 0;
    overflow: hidden;
    padding: var(--oc-space-4);
  }

  * {
    box-sizing: border-box;
  }

  .viewport-panel {
    display: grid;
    grid-template-rows: minmax(0, 1fr);
    height: 100%;
    min-height: 0;
    overflow: hidden;
    background: transparent;
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-primary:disabled {
    background: var(--oc-color-slate-300);
    border-color: var(--oc-color-slate-300);
    color: var(--oc-color-slate-600);
  }

  .viewport-actions {
    display: flex;
    align-items: center;
    justify-content: start;
    gap: 0.45rem;
    flex-wrap: wrap;
    min-width: 0;
  }

  .viewport-title-actions {
    justify-content: end;
  }

  .viewport-toolbar-main {
    align-items: center;
  }

  .viewport-toolbar-actions {
    justify-content: flex-end;
  }

  .selection-status {
    font-size: 0.82rem;
    font-weight: 700;
    color: var(--oc-text-primary);
    line-height: 1;
  }

  .viewport-actions .btn {
    min-height: 2.25rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.22rem;
  }

  .delete-action-btn {
    color: #b42318;
    border: var(--oc-border-width-sm) solid transparent;
  }

  .delete-action-btn:hover {
    color: #912018;
    background: rgba(180, 35, 24, 0.1);
  }

  .delete-action-btn .delete-icon {
    width: 1rem;
    height: 1rem;
  }

  .icon {
    font-family: 'Material Icons';
    font-size: 1.1rem;
    line-height: 1;
    font-style: normal;
    font-weight: 400;
    letter-spacing: normal;
    text-transform: none;
    display: inline-block;
    white-space: nowrap;
    word-wrap: normal;
    direction: ltr;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
    -moz-osx-font-smoothing: grayscale;
    font-feature-settings: 'liga';
  }

  .is-hidden {
    display: none;
  }

  .asset-wrap {
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
    height: 100%;
    min-height: 0;
    width: 100%;
    padding: 0;
    overflow: hidden;
    position: relative;
    overscroll-behavior: contain;
  }

  .browser-host {
    display: flex;
    flex: 1 1 auto;
    min-height: 0;
    width: 100%;
    overflow: auto;
    overscroll-behavior: contain;
  }

  .browser-host > * {
    flex: 1 1 auto;
    min-width: 0;
    min-height: 0;
  }

  .onboarding-panel {
    margin: auto;
    width: min(34rem, 100%);
  }

  .onboarding-empty-callout {
    margin: 0;
  }

  .onboarding-actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--oc-space-2);
  }

  .drop-overlay {
    position: absolute;
    inset: 0;
    border: 2px dashed var(--oc-border-accent);
    border-radius: var(--oc-radius-panel);
    background: rgba(15, 108, 198, 0.08);
    display: none;
    align-items: center;
    justify-content: center;
    color: var(--oc-color-blue-800);
    font-weight: 700;
    pointer-events: none;
    z-index: 4;
  }

  .drop-overlay.is-active {
    display: flex;
  }




  @media (max-width: 760px) {
    :host {
      padding: var(--oc-space-3);
    }

    .viewport-toolbar-main,
    .viewport-toolbar-actions {
      gap: 0.4rem;
    }

    .viewport-title-actions,
    .viewport-toolbar-actions {
      align-items: center;
      width: auto;
      flex: 0 0 auto;
    }

    .viewport-toolbar-main {
      width: auto;
      flex: 1 1 auto;
      min-width: 0;
    }

    .viewport-title-actions {
      justify-content: end;
    }

    .viewport-toolbar-actions {
      justify-content: flex-end;
      margin-left: auto;
    }

    .btn {
      padding: 0.3rem 0.52rem;
      font-size: 0.77rem;
      border-radius: 7px;
    }

    .viewport-actions .btn {
      min-height: 2rem;
    }

    .viewport-title-actions > .btn,
    .viewport-toolbar-actions > .btn {
      width: auto;
      max-width: 100%;
      flex: 0 0 auto;
    }

    .asset-wrap {
      padding: 0;
    }

  }
`;
