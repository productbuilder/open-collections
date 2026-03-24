import { themeTokenStyles } from './theme.css.js';
import { primitiveStyles } from './primitives.css.js';

export const browserStyles = `
  ${themeTokenStyles}
  ${primitiveStyles}

  :host {
    display: block;
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
    background: var(--oc-bg-panel);
    border: var(--oc-border-width-sm) solid var(--oc-border-panel);
    border-radius: var(--oc-radius-panel);
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
    background: var(--oc-color-blue-50);
    border: var(--oc-border-width-sm) solid var(--oc-color-blue-200);
    border-radius: var(--oc-radius-pill);
    padding: 0.2rem 0.55rem;
  }

  .btn-danger {
    border-color: #dc2626;
    color: #ffffff;
    background: #dc2626;
  }

  .btn-danger:hover {
    background: #b91c1c;
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
    padding: 0 0 0.35rem;
    overflow: hidden;
    position: relative;
    overscroll-behavior: contain;
  }

  .browser-host {
    display: flex;
    flex: 1 1 auto;
    min-height: 0;
    height: 100%;
    width: 100%;
    padding-bottom: 0.2rem;
    overflow: auto;
    overscroll-behavior: contain;
  }

  .browser-host > * {
    flex: 1 1 auto;
    min-width: 0;
    min-height: 0;
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

    .btn,
    .oc-btn {
      padding: 0.3rem 0.52rem;
      font-size: 0.77rem;
      border-radius: 7px;
    }

    .viewport-title-actions > .btn,
    .viewport-toolbar-actions > .btn {
      width: auto;
      max-width: 100%;
      flex: 0 0 auto;
    }

    .asset-wrap {
      padding: 0 0 0.25rem;
    }

    .browser-host {
      padding-bottom: 0;
    }
  }
`;
