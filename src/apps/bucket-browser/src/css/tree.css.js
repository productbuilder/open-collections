export const treeStyles = `
  :host { display: block; height: 100%; }
  .tree-panel { display: grid; gap: 0.9rem; padding: 1rem; align-content: start; }
  .panel-header h2 { margin: 0; font-size: 0.95rem; }
  .panel-header p { margin: 0.25rem 0 0; color: #64748b; font-size: 0.82rem; }
  .tree-list { display: grid; gap: 0.35rem; }
  .tree-node {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    width: 100%;
    padding: 0.55rem 0.7rem;
    padding-left: calc(0.7rem + (var(--depth, 0) * 0.8rem));
    border: 1px solid #dbe5f0;
    border-radius: 10px;
    background: #ffffff;
    cursor: pointer;
    text-align: left;
  }
  .tree-node.is-active { border-color: #2563eb; background: #eff6ff; }
  .tree-kind { color: #64748b; }
  .tree-label { font-weight: 600; }
  .empty { margin: 0; color: #64748b; }
`;
