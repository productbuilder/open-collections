export const treeStyles = `
  :host { display: block; height: 100%; }
  .tree-panel {
    height: 100%;
    min-height: 0;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    gap: 0.85rem;
    padding: 0.9rem 0.75rem 0.9rem 0.9rem;
    align-content: start;
  }
  .panel-header {
    padding-right: 0.35rem;
  }
  .panel-header h2 { margin: 0; font-size: 0.95rem; }
  .panel-header p { margin: 0.3rem 0 0; color: #64748b; font-size: 0.82rem; line-height: 1.35; }
  .tree-scroll {
    min-height: 0;
    overflow: auto;
    padding-right: 0.25rem;
  }
  .tree-node {
    display: grid;
    gap: 0.1rem;
  }
  .tree-row {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: center;
    gap: 0.1rem;
    padding-left: calc(var(--depth, 0) * 0.9rem);
  }
  .disclosure,
  .tree-select {
    border: 0;
    background: transparent;
    color: inherit;
    cursor: pointer;
  }
  .disclosure {
    display: inline-grid;
    place-items: center;
    inline-size: 1.5rem;
    block-size: 1.5rem;
    border-radius: 6px;
    color: #64748b;
    flex: 0 0 auto;
  }
  .disclosure:hover:not(:disabled) {
    background: #e2e8f0;
    color: #334155;
  }
  .disclosure:disabled {
    cursor: default;
    opacity: 0;
  }
  .caret {
    display: inline-block;
    font-size: 0.78rem;
    transform: rotate(0deg);
    transition: transform 160ms ease;
  }
  .caret.is-expanded {
    transform: rotate(90deg);
  }
  .tree-select {
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.35rem 0.45rem;
    border-radius: 8px;
    text-align: left;
    font: inherit;
  }
  .tree-select:hover {
    background: #e2e8f0;
  }
  .tree-select.is-active {
    background: #dbeafe;
    color: #1d4ed8;
  }
  .folder-icon {
    color: #475569;
    flex: 0 0 auto;
  }
  .tree-select.is-active .folder-icon {
    color: currentColor;
  }
  .tree-label {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.92rem;
    font-weight: 500;
  }
  .tree-children {
    display: grid;
    gap: 0.1rem;
  }
  .empty { margin: 0; color: #64748b; }
`;
