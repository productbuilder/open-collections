export const detailsStyles = `
  :host { display: block; height: 100%; }
  .details-panel { display: grid; gap: 0.9rem; padding: 1rem; align-content: start; }
  .panel-header h2 { margin: 0; font-size: 0.95rem; }
  .panel-header p { margin: 0.25rem 0 0; color: #64748b; font-size: 0.82rem; }
  .details-card {
    border: 1px solid #dbe5f0;
    border-radius: 14px;
    background: #ffffff;
    padding: 1rem;
    display: grid;
    gap: 0.75rem;
  }
  h3 { margin: 0; }
  p { margin: 0; color: #475569; }
  dl { margin: 0; display: grid; gap: 0.45rem; }
  dl div { display: grid; gap: 0.15rem; }
  dt { color: #64748b; font-size: 0.78rem; }
  dd { margin: 0; font-weight: 600; }
  .btn {
    border: 1px solid #2563eb;
    background: #2563eb;
    color: #ffffff;
    border-radius: 10px;
    padding: 0.55rem 0.75rem;
    font: inherit;
    font-weight: 700;
  }
  .empty { border: 1px dashed #cbd5e1; border-radius: 14px; padding: 1rem; color: #64748b; }
`;
