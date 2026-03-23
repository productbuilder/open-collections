import { backButtonStyles } from '../components/back-button.js';

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
    flex-direction: row;
    align-items: center;
  }

  .panel-titlebar-main {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.55rem;
    min-width: 0;
    flex: 1 1 auto;
    width: 100%;
  }

  .panel-heading-copy {
    display: grid;
    gap: 0.2rem;
    min-width: 0;
    flex: 1 1 auto;
    justify-items: start;
    text-align: center;
  }

  .panel-title-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.45rem;
    <!-- min-width: 0; -->
    flex-wrap: wrap;
  }

  .panel-title {
    margin: 0;
    font-size: 0.95rem;
    color: #111827;
    min-width: 0;
    flex: 0 1 auto;
    overflow-wrap: anywhere;
    text-align: center;
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
    text-align: center;
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
  }

  .panel-titlebar-actions {
    justify-content: end;
    width: 100%;
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

  ${backButtonStyles}

  @media (max-width: 760px) {


    .panel-titlebar,
    .panel-toolbar-row {
      gap: 0.55rem;
    }

    .panel-titlebar {
      padding: 0.1rem 0 0.5rem;
      align-items: center;
    }

    .panel-toolbar-row {
      padding-bottom: 0.5rem;
      flex-wrap: wrap;
      align-items: center;
    }

    .panel-titlebar-main {
      gap: 0.45rem;
      flex: 1 1 auto;
      min-width: 0;
      justify-content: center;
    }

    .panel-title-row {
      align-items: center;
      justify-content: center;
      row-gap: 0.3rem;
    }

    .panel-title {
      flex: 0 1 auto;
    }

    .panel-subtext {
      font-size: 0.78rem;
    }

    .panel-toolbar-main,
    .panel-titlebar-actions {
      align-items: center;
    }

    .panel-toolbar-main {
      flex: 1 1 auto;
      min-width: 0;
    }

    .panel-toolbar-actions,
    .panel-titlebar-actions {
      width: auto;
      max-width: 100%;
    }

    .panel-titlebar-actions {
      align-self: center;
    }

    .panel-toolbar-actions {
      margin-left: auto;
      justify-content: flex-end;
      align-self: center;
    }
  }
`;
