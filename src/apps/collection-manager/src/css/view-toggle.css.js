import { themeTokenStyles } from "./theme.css.js";

export const viewToggleStyles = `
  ${themeTokenStyles}

  :host {
    display: inline-flex;
  }

  .toggle-shell {
    display: inline-flex;
    min-width: 0;
  }

  .toggle {
    display: inline-flex;
    min-width: 0;
    align-items: center;
    border: var(--oc-border-width-sm) solid var(--oc-border-control);
    border-radius: var(--oc-radius-panel);
    overflow: hidden;
    background: var(--oc-bg-panel);
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
    border-right: var(--oc-border-width-sm) solid var(--oc-border-subtle);
    background: transparent;
    color: var(--oc-color-slate-600);
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
    color: var(--oc-text-primary);
  }

  .icon {
    width: 1.15rem;
    height: 1.15rem;
    display: block;
    opacity: 0.78;
  }

  .icon :where(path, rect, line, circle) {
    fill: none;
    stroke: currentColor;
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .option.is-active .icon {
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
    border: var(--oc-border-width-sm) solid var(--oc-border-control);
    border-radius: var(--oc-radius-control);
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
