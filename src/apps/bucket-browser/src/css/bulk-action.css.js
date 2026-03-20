export const bulkActionStyles = `
  :host { display: block; }
  .bulk-action-bar {
    display: none;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.75rem 1.25rem;
    background: #0f172a;
    color: #ffffff;
    flex-wrap: wrap;
  }
  .bulk-action-bar.is-visible { display: flex; }
  .bulk-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }
  .btn {
    border: 1px solid rgba(255,255,255,0.26);
    background: transparent;
    color: #ffffff;
    border-radius: 10px;
    padding: 0.45rem 0.65rem;
    font: inherit;
    font-weight: 600;
  }
  .btn-primary { background: #2563eb; border-color: #2563eb; }
`;
