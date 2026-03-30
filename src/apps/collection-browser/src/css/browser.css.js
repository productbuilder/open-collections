export const browserStyles = `
  :host {
    display: block;
    height: 100%;
    min-height: 0;
    box-sizing: border-box;
  }

  * {
    box-sizing: border-box;
  }

  .root {
    height: 100%;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  .header {
    padding: 0.75rem 0;
    font-size: 1rem;
    font-weight: 600;
    line-height: 1.2;
  }

  .scroll-container {
    flex: 1;
    overflow-y: auto;
    min-height: 0;
  }

  oc-grid {
    display: block;
  }

  oc-card-collections,
  oc-card-collection,
  oc-card-item {
    display: block;
  }
`;
