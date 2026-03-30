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
    gap: 0.75rem;
  }

  .header {
    display: block;
    padding: 0.5rem 0 0;
  }

  .title {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    line-height: 1.2;
  }

  .subtitle {
    margin: 0.25rem 0 0;
    color: var(--oc-color-text-muted, #5f6368);
    font-size: 0.85rem;
    line-height: 1.25;
  }

  .toggle-bar {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .mode-toggle {
    border: 1px solid var(--oc-color-border, #d6d9dd);
    border-radius: 999px;
    background: #fff;
    color: var(--oc-color-text, #202124);
    font: inherit;
    font-size: 0.8rem;
    line-height: 1;
    padding: 0.38rem 0.7rem;
    cursor: pointer;
  }

  .mode-toggle[data-active="true"] {
    border-color: var(--oc-color-primary, #1a73e8);
    color: var(--oc-color-primary, #1a73e8);
    font-weight: 600;
  }

  .scroll-container-wrapper {
    flex: 1;
    min-height: 0;
  }

  .scroll-container {
    height: 100%;
    overflow-y: auto;
    min-height: 0;
  }

  .grid-host {
    min-height: 0;
  }

  oc-grid {
    display: block;
  }

  .browse-cell {
    display: block;
    min-width: 0;
  }

  .browse-cell > oc-card-collections,
  .browse-cell > oc-card-collection,
  .browse-cell > oc-card-item {
    display: block;
  }
`;
