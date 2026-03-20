export const cardGridStyles = `
  :host { display: block; }
  .card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 0.9rem;
  }
  .asset-card {
    border: 1px solid #dbe5f0;
    border-radius: 16px;
    background: #ffffff;
    overflow: hidden;
    cursor: pointer;
  }
  .asset-card.is-focused { border-color: #2563eb; box-shadow: 0 0 0 1px #93c5fd inset; }
  .asset-thumb {
    min-height: 124px;
    display: grid;
    place-items: center;
    background: linear-gradient(135deg, #dbeafe, #eff6ff);
    font-size: 1.8rem;
    font-weight: 700;
    color: #1d4ed8;
  }
  .asset-content { padding: 0.9rem; display: grid; gap: 0.65rem; }
  .asset-title-row { display: flex; gap: 0.75rem; align-items: start; justify-content: space-between; }
  .asset-title-row h3 { margin: 0; font-size: 0.96rem; }
  p { margin: 0; color: #475569; font-size: 0.84rem; }
  dl { margin: 0; display: grid; gap: 0.35rem; }
  dl div { display: flex; justify-content: space-between; gap: 0.75rem; font-size: 0.8rem; }
  dt { color: #64748b; }
  dd { margin: 0; font-weight: 600; }
  .btn {
    border: 1px solid #cbd5e1;
    background: #ffffff;
    border-radius: 10px;
    padding: 0.45rem 0.65rem;
    font: inherit;
    font-weight: 600;
  }
  .empty { border: 1px dashed #cbd5e1; border-radius: 14px; padding: 1rem; color: #64748b; }
`;
