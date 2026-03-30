export const browserStyles = `
  :host {
    display: block;
    height: 100%;
    min-height: 0;
    box-sizing: border-box;
    padding: 0;
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
    grid-template-columns: minmax(0, 1fr);
    gap: 0.9rem;
    min-height: 0;
    height: 100%;
  }

  .viewport-layout.is-inspector-open {
    grid-template-columns: minmax(0, 1fr) minmax(260px, 320px);
  }

  .viewport-region {
    min-height: 0;
    height: 100%;
    display: block;
    padding: 0;
  }

  .browser-host {
    min-height: 0;
    height: 100%;
    padding-right: 0;
  }

  .browser-host > * {
    display: block;
    min-height: 0;
  }

  .viewport-inspector {
    min-height: 0;
    overflow: hidden;
    display: none;
  }

  .viewport-layout.is-inspector-open .viewport-inspector {
    display: block;
  }

  .inspector-slot::slotted(*) {
    height: 100%;
    min-height: 0;
  }

  .inspector-toggle {
    border: 1px solid #cbd5e1;
    background: #ffffff;
    color: #0f172a;
    border-radius: 8px;
    padding: 0.42rem 0.7rem;
    cursor: pointer;
    font: inherit;
    font-size: 0.82rem;
    font-weight: 600;
    line-height: 1.2;
  }

  .inspector-toggle:hover {
    border-color: #94a3b8;
    background: #f8fafc;
  }

  @media (max-width: 760px) {
    .viewport-region {
      padding: 0;
      gap: 0.7rem;
    }

    .viewport-layout {
      grid-template-columns: minmax(0, 1fr);
    }

    .viewport-inspector {
      display: none;
    }

    .inspector-toggle {
      display: none;
    }
  }
`;
