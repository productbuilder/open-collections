export const viewToggleStyles = `
  :host {
    display: inline-flex;
  }

  .toggle-shell {
    display: inline-flex;
    min-width: 0;
  }

  .toggle {
    display: inline-flex;
    align-items: center;
    border: 1px solid #cbd5e1;
    border-radius: 10px;
    overflow: hidden;
    background: #ffffff;
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
  }

  .option {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    min-width: 2.5rem;
    height: 2.25rem;
    min-height: 2.25rem;
    padding: 0.35rem 0.55rem;
    border: none;
    border-right: 1px solid #e2e8f0;
    background: transparent;
    color: #475569;
    cursor: pointer;
    transition: background-color 140ms ease, box-shadow 140ms ease, color 140ms ease, opacity 140ms ease, border-color 140ms ease;
  }

  .option:last-child {
    border-right: none;
  }

  .option:hover {
    background: rgba(148, 163, 184, 0.12);
  }

  .option:focus-visible {
    outline: 2px solid #94a3b8;
    outline-offset: -2px;
    position: relative;
    z-index: 1;
  }

  .option.is-active {
    background: rgba(148, 163, 184, 0.16);
    box-shadow: inset 0 0 0 1px rgba(100, 116, 139, 0.18);
    color: #0f172a;
  }

  .icon {
    font-family: 'Material Icons';
    font-size: 1.15rem;
    line-height: 1;
    font-style: normal;
    font-weight: 400;
    letter-spacing: normal;
    text-transform: none;
    display: inline-block;
    white-space: nowrap;
    word-wrap: normal;
    direction: ltr;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
    -moz-osx-font-smoothing: grayscale;
    font-feature-settings: 'liga';
    opacity: 0.78;
  }

  .option.is-active .icon {
    font-weight: 700;
    opacity: 1;
  }

  .is-mobile .toggle {
    border: none;
    border-radius: 0;
    overflow: visible;
    background: transparent;
    box-shadow: none;
  }

  .is-mobile .option {
    width: 2rem;
    min-width: 2rem;
    height: 2rem;
    min-height: 2rem;
    padding: 0;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    background: transparent;
  }

  .is-mobile .option:hover,
  .is-mobile .option.is-active {
    background: transparent;
    box-shadow: none;
  }

  .is-mobile .option .icon {
    opacity: 0.92;
  }
`;
