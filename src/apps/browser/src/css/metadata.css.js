export const metadataStyles = `
  :host {
    display: block;
    min-height: 0;
    height: 100%;
  }

  [hidden] {
    display: none !important;
  }

  * {
    box-sizing: border-box;
  }

  .metadata-panel {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    height: 100%;
    min-height: 0;
    overflow: hidden;
    background: #ffffff;
    border-left: 1px solid #e2e8f0;
  }

  .panel-header {
    padding: 0.8rem 0.95rem;
    border-bottom: 1px solid #e2e8f0;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.7rem;
  }

  .header-meta {
    display: grid;
    gap: 0.15rem;
    align-content: start;
    min-width: 0;
  }

  .panel-title {
    margin: 0;
    font-size: 0.95rem;
    color: #111827;
  }

  .panel-context {
    margin: 0;
    font-size: 0.78rem;
    color: #64748b;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .header-actions {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.5rem;
  }

  .panel-body {
    min-height: 0;
    overflow: auto;
    padding: 0.95rem;
    display: grid;
    gap: 0.85rem;
    align-content: start;
  }

  .metadata-list {
    display: grid;
    gap: 0.75rem;
    margin: 0;
  }

  .metadata-row {
    display: grid;
    gap: 0.22rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid #edf2f7;
  }

  .metadata-row:last-child {
    padding-bottom: 0;
    border-bottom: none;
  }

  .metadata-row dt,
  .metadata-row dd {
    margin: 0;
  }

  .metadata-row dt {
    font-size: 0.74rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #64748b;
  }

  .metadata-row dd {
    font-size: 0.84rem;
    color: #334155;
    line-height: 1.45;
    word-break: break-word;
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

  .empty {
    border: 1px dashed #cbd5e1;
    border-radius: 8px;
    padding: 1rem;
    text-align: center;
    color: #64748b;
    background: #f8fafc;
    font-size: 0.9rem;
  }

  .close-btn {
    display: none;
  }

  @media (max-width: 760px) {
    :host {
      height: auto;
    }

    .metadata-panel {
      position: fixed;
      inset: 0;
      z-index: 12;
      border: none;
      background: #f3f5f8;
      display: none;
    }

    .metadata-panel.is-mobile-open {
      display: grid;
    }

    .panel-header {
      padding: 0.7rem 0.8rem;
      background: #ffffff;
      border-bottom: 1px solid #e2e8f0;
      position: sticky;
      top: 0;
      z-index: 2;
    }

    .panel-context {
      max-width: 180px;
    }

    .panel-body {
      padding: 0.8rem;
    }

    .close-btn {
      display: inline-flex;
    }

    .btn {
      padding: 0.3rem 0.52rem;
      font-size: 0.77rem;
      border-radius: 7px;
    }
  }
`;
