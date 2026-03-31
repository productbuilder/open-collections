export const browserStyles = `
  :host {
    display: block;
    height: 100%;
    min-height: 0;
    box-sizing: border-box;
    --oc-browser-bg-app: #f4efe9;
    --oc-browser-bg-card: #fffdfa;
    --oc-browser-bg-card-soft: #f7f4f1;
    --oc-browser-border: #d9d5d0;
    --oc-browser-border-strong: #c8c1b8;
    --oc-browser-surface-muted: #eeebe7;
    --oc-browser-placeholder-fill: #e8e4de;
    --oc-browser-placeholder-border: #d6d0c7;
    --oc-browser-divider: #e2d8cd;
    --oc-browser-text: #2e2924;
    --oc-browser-text-muted: #6c6258;
    --oc-browser-accent: #756c64;
    --oc-browser-accent-soft: #ece7e1;
    --oc-browser-focus-ring: #91857a;
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

  .header-top {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    min-width: 0;
  }

  .header-copy {
    display: flex;
    flex-direction: column;
    min-width: 0;
    flex: 1;
  }

  .header-top .back-btn {
    flex: 0 0 auto;
    margin-top: -0.1rem;
  }

  .title {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    line-height: 1.2;
  }

  .subtitle {
    margin: 0.25rem 0 0;
    color: var(--oc-browser-text-muted, #6c6258);
    font-size: 0.85rem;
    line-height: 1.25;
    overflow-wrap: anywhere;
  }

  .toggle-bar {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .mode-toggle {
    border: 1px solid var(--oc-browser-border, #d9d5d0);
    border-radius: 999px;
    background: var(--oc-browser-bg-card, #fffdfa);
    color: var(--oc-browser-text, #2e2924);
    font: inherit;
    font-size: 0.8rem;
    line-height: 1;
    padding: 0.38rem 0.7rem;
    cursor: pointer;
  }

  .mode-toggle[data-active="true"] {
    border-color: var(--oc-browser-accent, #756c64);
    background: var(--oc-browser-accent-soft, #ece7e1);
    color: var(--oc-browser-accent, #756c64);
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
