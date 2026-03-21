export const viewToggleStyles = `
  :host {
    display: inline-flex;
  }

  .toggle {
    display: inline-flex;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    overflow: hidden;
    background: #ffffff;
  }

  .option {
    border: none;
    border-right: 1px solid #cbd5e1;
    background: transparent;
    color: #0f172a;
    padding: 0.35rem 0.65rem;
    font: inherit;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
  }

  .option:last-child {
    border-right: none;
  }

  .option.is-active {
    background: #0f6cc6;
    color: #ffffff;
  }
`;
