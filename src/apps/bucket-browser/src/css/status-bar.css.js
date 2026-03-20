export const statusBarStyles = `
  :host { display: block; }
  .status-bar {
    display: flex;
    gap: 1rem;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    padding: 0.75rem 1.25rem;
    border-top: 1px solid #dbe5f0;
    background: #ffffff;
    color: #334155;
    font-size: 0.82rem;
  }
  .status-bar[data-tone="ok"] { color: #166534; }
  .status-bar[data-tone="warn"] { color: #9a3412; }
`;
