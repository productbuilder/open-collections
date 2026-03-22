export const panelShellStyles = `
  :host {
    display: block;
    height: 100%;
    min-height: 0;
  }

  * {
    box-sizing: border-box;
  }

  .panel-shell {
    display: grid;
    grid-template-rows: auto auto minmax(0, 1fr);
    height: 100%;
    min-height: 0;
    overflow: hidden;
  }

  .panel-titlebar,
  .panel-toolbar-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.7rem;
    min-width: 0;
  }

  .panel-titlebar {
    padding: 0.1rem 0 0.35rem;
  }

  .panel-titlebar-main {
    display: flex;
    align-items: flex-start;
    gap: 0.55rem;
    min-width: 0;
    flex: 1 1 auto;
  }

  .panel-heading-copy {
    display: grid;
    gap: 0.2rem;
    min-width: 0;
    flex: 1 1 auto;
  }

  .panel-title-row {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    min-width: 0;
    flex-wrap: wrap;
  }

  .panel-title {
    margin: 0;
    font-size: 0.95rem;
    color: #111827;
    min-width: 0;
    flex: 1 1 auto;
    overflow-wrap: anywhere;
  }

  .panel-status-chip {
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    border: 1px solid #cbd5e1;
    padding: 0.1rem 0.5rem;
    font-size: 0.72rem;
    line-height: 1.2;
    font-weight: 700;
    color: #334155;
    background: #f8fafc;
    white-space: nowrap;
  }

  .panel-status-chip[data-tone="ok"] {
    color: #166534;
    border-color: #86efac;
    background: #f0fdf4;
  }

  .panel-status-chip[data-tone="warn"] {
    color: #9a3412;
    border-color: #fdba74;
    background: #fff7ed;
  }

  .panel-subtext {
    margin: 0;
    font-size: 0.83rem;
    color: #64748b;
    min-width: 0;
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

  .panel-titlebar-actions,
  .panel-toolbar-main,
  .panel-toolbar-actions {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    flex-wrap: wrap;
    min-width: 0;
  }

  .panel-titlebar-actions,
  .panel-toolbar-actions {
    justify-content: flex-end;
    flex: 0 0 auto;
  }

  .panel-toolbar-row {
    align-items: center;
    padding: 0 0 0.65rem;
  }

  .panel-toolbar-main {
    flex: 1 1 auto;
  }

  .panel-content {
    display: flex;
    min-height: 0;
    height: 100%;
    overflow: hidden;
  }

  .panel-content > slot {
    display: block;
    width: 100%;
    height: 100%;
    min-height: 0;
  }

  ::slotted(*) {
    display: block;
    width: 100%;
    height: 100%;
    min-height: 0;
  }

  .is-hidden {
    display: none;
  }

  @media (max-width: 760px) {
    .panel-titlebar,
    .panel-toolbar-row {
      gap: 0.55rem;
    }

    .panel-titlebar {
      padding: 0.1rem 0 0.25rem;
      flex-wrap: wrap;
      align-items: stretch;
    }

    .panel-toolbar-row {
      padding-bottom: 0.5rem;
      flex-direction: column;
      align-items: stretch;
    }

    .panel-titlebar-main {
      gap: 0.45rem;
      width: 100%;
      flex: 1 1 100%;
    }

    .panel-title-row {
      align-items: flex-start;
      row-gap: 0.3rem;
    }

    .panel-subtext {
      font-size: 0.78rem;
    }

    .panel-toolbar-main,
    .panel-toolbar-actions,
    .panel-titlebar-actions {
      width: 100%;
    }

    .panel-toolbar-main,
    .panel-toolbar-actions,
    .panel-titlebar-actions,
    .panel-titlebar-main {
      flex: 1 1 100%;
    }

    .panel-toolbar-main,
    .panel-titlebar-actions {
      align-items: flex-start;
    }

    .panel-toolbar-actions,
    .panel-titlebar-actions {
      justify-content: flex-start;
    }
  }
`;
