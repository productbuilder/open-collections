import { primitiveStyles } from "./primitives.css.js";

export const browserStyles = `
  ${primitiveStyles}

  :host {
    display: block;
    box-sizing: border-box;
    height: 100%;
    min-height: 0;
    overflow: hidden;
    padding: var(--oc-space-4);
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
  }

  .manager-mode-toggle {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    flex-wrap: wrap;
    padding-bottom: var(--oc-space-1);
  }

  .mode-toggle {
    border: var(--oc-border-width-sm) solid var(--oc-border-control);
    border-radius: var(--oc-radius-pill);
    background: var(--oc-bg-panel);
    color: var(--oc-text-secondary);
    font: inherit;
    font-size: 0.78rem;
    line-height: 1;
    padding: 0.34rem 0.62rem;
    cursor: pointer;
  }

  .mode-toggle[data-active="true"] {
    border-color: var(--oc-border-accent);
    color: var(--oc-color-blue-800);
    font-weight: 700;
  }

  .asset-wrap {
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
    min-height: 0;
    width: 100%;
    padding: 0;
    overflow: hidden;
  }

  .scroll-container {
    flex: 1 1 auto;
    height: 100%;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
    touch-action: pan-y;
  }

  .scroll-container > * {
    display: block;
    min-width: 0;
  }

  .grid-host {
    min-height: 0;
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
