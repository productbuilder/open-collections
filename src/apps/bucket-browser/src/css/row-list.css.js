export const rowListStyles = `
  :host { display: block; }
  .row-list-wrap {
    border: 1px solid #dbe5f0;
    border-radius: 14px;
    overflow: auto;
    background: #ffffff;
  }
  table { width: 100%; border-collapse: collapse; }
  th, td { padding: 0.7rem 0.8rem; text-align: left; border-bottom: 1px solid #e2e8f0; }
  th { background: #f8fafc; font-size: 0.8rem; color: #475569; }
  tr.is-focused { background: #eff6ff; }
  .btn {
    border: 1px solid #cbd5e1;
    background: #ffffff;
    border-radius: 8px;
    padding: 0.35rem 0.55rem;
    font: inherit;
  }
  .empty { text-align: center; color: #64748b; }
`;
