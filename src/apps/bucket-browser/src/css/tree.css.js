export const treeStyles = `
  :host {
    display: block;
    height: 100%;
    color: #0f172a;
  }
  .tree-panel {
    height: 100%;
    min-height: 0;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    gap: 0.7rem;
    padding: 0.75rem 0.5rem 0.75rem 0.75rem;
    align-content: start;
    background: #f8fafc;
  }
  .panel-header {
    padding: 0 0.35rem 0 0.15rem;
  }
  .panel-header h2 {
    margin: 0;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #475569;
  }
  .panel-header p {
    margin: 0.3rem 0 0;
    color: #64748b;
    font-size: 0.8rem;
    line-height: 1.35;
  }
  .tree-scroll {
    min-height: 0;
    overflow: auto;
    padding-right: 0.2rem;
  }
  .tree-node,
  .tree-children {
    display: grid;
  }
  .tree-row {
    display: grid;
    grid-template-columns: 1rem minmax(0, 1fr);
    align-items: center;
    gap: 0.15rem;
    min-height: 1.6rem;
    padding-inline-start: calc(var(--depth, 0) * 0.8rem);
    border-radius: 6px;
    transition: background-color 120ms ease, color 120ms ease;
  }
  .tree-row:hover {
    background: #eef2f7;
  }
  .tree-row.is-active {
    background: #dbeafe;
    color: #1d4ed8;
  }
  .disclosure,
  .tree-select {
    border: 0;
    background: transparent;
    color: inherit;
    cursor: pointer;
    padding: 0;
    margin: 0;
    font: inherit;
  }
  .disclosure {
    display: inline-grid;
    place-items: center;
    inline-size: 1rem;
    block-size: 1rem;
    color: #64748b;
    border-radius: 4px;
  }
  .tree-row:hover .disclosure:not(:disabled),
  .tree-row.is-active .disclosure:not(:disabled) {
    color: currentColor;
  }
  .disclosure:focus-visible,
  .tree-select:focus-visible {
    outline: 1px solid #60a5fa;
    outline-offset: 1px;
    border-radius: 4px;
  }
  .disclosure:disabled {
    cursor: default;
    opacity: 0;
  }
  .tree-select {
    min-width: 0;
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    min-height: 1.6rem;
    padding: 0 0.35rem 0 0.15rem;
    text-align: left;
  }
  .folder-icon,
  .icon {
    display: inline-flex;
    flex: 0 0 auto;
  }
  .icon {
    width: 0.9rem;
    height: 0.9rem;
  }
  .icon-chevron {
    fill: none;
    stroke: currentColor;
    stroke-width: 1.6;
    stroke-linecap: round;
    stroke-linejoin: round;
    transform: rotate(0deg);
    transition: transform 160ms ease;
  }
  .icon-chevron.is-expanded {
    transform: rotate(90deg);
  }
  .icon-folder,
  .icon-workspace {
    fill: none;
    stroke: currentColor;
    stroke-width: 1.15;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .folder-icon {
    color: #ca8a04;
  }
  .tree-row.is-active .folder-icon {
    color: currentColor;
  }
  .tree-label {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.83rem;
    font-weight: 500;
    line-height: 1.2;
  }
  .empty {
    margin: 0;
    padding: 0.35rem 0.15rem;
    color: #64748b;
    font-size: 0.85rem;
  }
  @media (max-width: 960px) {
    .tree-panel {
      padding: 0.75rem 0.4rem 0.75rem 0.6rem;
    }
    .tree-row {
      padding-inline-start: calc(var(--depth, 0) * 0.72rem);
    }
    .tree-label {
      font-size: 0.82rem;
    }
  }
`;
