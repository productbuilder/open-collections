export const toolbarStyles = `
  :host { display: block; }
  .toolbar {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: end;
    padding: 1rem 1.25rem;
    background: #ffffff;
    border-bottom: 1px solid #dbe5f0;
    flex-wrap: wrap;
  }
  .toolbar-group { display: flex; gap: 0.75rem; align-items: end; flex-wrap: wrap; }
  .toolbar-brand h1 { margin: 0; font-size: 1.1rem; }
  .toolbar-brand p { margin: 0.2rem 0 0; color: #64748b; font-size: 0.88rem; }
  .toolbar-controls label {
    display: grid;
    gap: 0.25rem;
    min-width: 120px;
    font-size: 0.78rem;
    color: #475569;
    font-weight: 600;
  }
  select, input {
    border: 1px solid #cbd5e1;
    border-radius: 10px;
    padding: 0.45rem 0.6rem;
    font: inherit;
    background: #ffffff;
  }
  .btn {
    border: 1px solid #cbd5e1;
    background: #ffffff;
    color: #0f172a;
    border-radius: 10px;
    padding: 0.5rem 0.75rem;
    font: inherit;
    font-weight: 600;
    cursor: pointer;
  }
  .btn-ghost { background: #eff6ff; }
`;
