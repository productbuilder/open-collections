export const browserStyles = `
  :host {
    display: block;
    height: 100%;
    min-height: 0;
    overflow: hidden;
    padding: 0.95rem;
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
    border: none;
    box-shadow: none;
  }

  .btn {
    border: 1px solid #cbd5e1;
    background: #ffffff;
    color: #0f172a;
    border-radius: 8px;
    padding: 0.42rem 0.7rem;
    cursor: pointer;
    font: inherit;
    font-size: 0.88rem;
    font-weight: 600;
  }

  .btn:hover {
    background: #f8fafc;
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-primary {
    border-color: #0f6cc6;
    background: #0f6cc6;
    color: #ffffff;
  }

  .btn-primary:hover {
    background: #0b5aa6;
  }

  .btn-primary:disabled {
    background: #cbd5e1;
    border-color: #cbd5e1;
    color: #475569;
  }

  .viewport-actions {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    flex-wrap: wrap;
    min-width: 0;
  }

  .viewport-title-actions {
    justify-content: flex-end;
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
    color: #0f172a;
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    border-radius: 999px;
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
    border: 2px dashed #0f6cc6;
    border-radius: 10px;
    background: rgba(15, 108, 198, 0.08);
    display: none;
    align-items: center;
    justify-content: center;
    color: #0f4f8a;
    font-weight: 700;
    pointer-events: none;
    z-index: 4;
  }

  .drop-overlay.is-active {
    display: flex;
  }

  @media (max-width: 760px) {
    :host {
      padding: 0.7rem 0.7rem 0.8rem;
    }

    .viewport-toolbar-main,
    .viewport-toolbar-actions {
      gap: 0.4rem;
    }

    .viewport-title-actions,
    .viewport-toolbar-actions {
      align-items: flex-start;
      width: auto;
      flex: 0 0 auto;
    }

    .viewport-toolbar-main {
      width: auto;
      flex: 1 1 auto;
      min-width: 0;
    }

    .viewport-title-actions {
      justify-content: flex-start;
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
