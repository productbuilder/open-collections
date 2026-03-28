export const browserStyles = `
  :host {
    display: block;
    height: 100%;
    min-height: 0;
    overflow: hidden;
    padding: 0.95rem;
    color: #111827;
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

  .viewport-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(260px, 320px);
    gap: 0.9rem;
    min-height: 0;
    height: 100%;
  }

  .viewport-region {
    min-height: 0;
    height: 100%;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    gap: 0.85rem;
    padding: 0.95rem;
    overflow: hidden;
  }

  .viewport-summary {
    display: grid;
    gap: 0.2rem;
    padding: 0 0.1rem;
  }

  .viewport-title {
    margin: 0;
    font-size: 0.95rem;
    color: #111827;
  }

  .viewport-subtitle {
    margin: 0;
    font-size: 0.83rem;
    color: #64748b;
  }

  .browser-host {
    min-height: 0;
    overflow: auto;
    overscroll-behavior: contain;
    padding-right: 0.1rem;
  }

  .viewport-inspector {
    min-height: 0;
    overflow: hidden;
  }

  .inspector-slot::slotted(*) {
    height: 100%;
    min-height: 0;
  }

  @media (max-width: 760px) {
    :host {
      padding: 0;
    }

    .viewport-region {
      padding: 0.8rem;
      gap: 0.7rem;
    }

    .viewport-layout {
      grid-template-columns: minmax(0, 1fr);
    }

    .viewport-inspector {
      display: none;
    }
  }
`;
