export const panelShellStyles = `
  :host {
    display: block;
    min-height: 0;
  }

  * {
    box-sizing: border-box;
  }

  .panel-shell {
    display: grid;
    grid-template-rows: auto auto 1fr;
    height: 100%;
    min-height: 0;
    overflow: hidden;
  }

  .panel-header {
    padding: 0.1rem 0 0.35rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.7rem;
  }

  .panel-heading-left {
    display: flex;
    align-items: baseline;
    gap: 0.55rem;
    min-width: 0;
  }

  .panel-title {
    margin: 0;
    font-size: 0.95rem;
    color: #111827;
  }

  .panel-subtext {
    margin: 0;
    font-size: 0.83rem;
    color: #64748b;
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

  .header-actions,
  .toolbar {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    flex-wrap: wrap;
  }

  .toolbar {
    padding: 0 0 0.65rem;
  }

  .body {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    min-height: 0;
    overflow: hidden;
  }

  .is-hidden {
    display: none;
  }

  @media (max-width: 760px) {
    .panel-header {
      padding: 0.1rem 0 0.25rem;
      position: sticky;
      top: 0;
      z-index: 2;
      background: transparent;
    }

    .toolbar {
      padding-bottom: 0.5rem;
    }

    .panel-subtext {
      display: none;
    }
  }
`;
