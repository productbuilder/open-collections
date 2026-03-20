export const viewportStyles = `
  :host { display: block; height: 100%; }
  .viewport-panel { display: grid; gap: 1rem; padding: 1rem; align-content: start; }
  .viewport-header {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: start;
  }
  h2 { margin: 0; font-size: 1rem; }
  p { margin: 0.25rem 0 0; color: #64748b; font-size: 0.84rem; }
  .mode-chip {
    display: inline-flex;
    border: 1px solid #bfdbfe;
    background: #eff6ff;
    color: #1d4ed8;
    border-radius: 999px;
    padding: 0.2rem 0.6rem;
    font-size: 0.76rem;
    font-weight: 700;
    text-transform: uppercase;
  }
  .renderer-host { min-height: 0; }
`;
