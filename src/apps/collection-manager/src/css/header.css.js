import { themeTokenStyles } from './theme.css.js';

export const headerStyles = `
  ${themeTokenStyles}

  :host {
    display: block;
  }

  .topbar {
    background: var(--oc-header-bg);
    border-bottom: var(--oc-border-width-sm) solid var(--oc-header-border);
    padding: 0.85rem 1rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  .brand {
    min-width: 0;
  }

  .title {
    margin: 0;
    font-size: 1rem;
    font-weight: 700;
    color: var(--oc-header-title);
  }

  .status {
    margin: 0;
    font-size: 0.85rem;
    color: var(--oc-header-subtitle);
  }

  .top-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .btn {
    border: var(--oc-border-width-sm) solid var(--oc-border-control);
    background: var(--oc-bg-panel);
    color: var(--oc-text-primary);
    border-radius: var(--oc-radius-control);
    padding: 0.42rem 0.7rem;
    cursor: pointer;
    font: inherit;
    font-size: 0.88rem;
    font-weight: 600;
  }

  .btn:hover {
    background: var(--oc-bg-subtle);
  }

  .icon-btn {
    border: 0;
    background: transparent;
    color: var(--oc-color-slate-600);
    border-radius: var(--oc-radius-pill);
    width: 2.25rem;
    height: 2.25rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: 0;
  }

  .icon-btn:hover {
    background: var(--oc-bg-subtle);
    color: var(--oc-text-primary);
  }

  .btn-connection {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    white-space: nowrap;
  }

  .icon {
    width: 0.95rem;
    height: 0.95rem;
    display: inline-flex;
    flex: 0 0 auto;
  }

  .icon-chevron {
    fill: none;
    stroke: currentColor;
    stroke-width: 1.6;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .icon-more-vert {
    fill: currentColor;
  }

  @media (max-width: 760px) {
    .topbar {
      padding: 0.55rem 0.7rem;
      gap: 0.55rem;
      align-items: center;
    }

    .title {
      font-size: 0.9rem;
    }

    #statusText,
    #workspaceContext {
      display: none;
    }

    .top-actions {
      flex-wrap: wrap;
      justify-content: flex-end;
      margin-left: auto;
      row-gap: 0.35rem;
    }

    .btn {
      padding: 0.3rem 0.52rem;
      font-size: 0.77rem;
      border-radius: 7px;
    }

    .icon-btn {
      width: 2rem;
      height: 2rem;
    }
  }
`;
