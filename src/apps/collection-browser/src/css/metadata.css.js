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
    display: block;
    height: 100%;
    min-height: 0;
    overflow: hidden;
  }

  #metadataSection {
    height: 100%;
  }

  .panel-body {
    min-height: 0;
    overflow: auto;
    padding: 0.2rem 0.05rem;
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
