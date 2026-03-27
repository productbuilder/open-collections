export const appShellStyles = `
  :host {
    display: block;
    width: 100%;
    height: 100%;
    min-height: 100dvh;
    color-scheme: light;
    font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
    --shell-bg: #f4f6f8;
    --shell-surface: #ffffff;
    --shell-border: #d3dbe3;
    --shell-text: #142334;
    --shell-muted: #5e738a;
    --shell-accent: #0f6cc6;
    --shell-nav-height: 64px;
  }

  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  .shell {
    min-height: 100dvh;
    display: grid;
    grid-template-rows: auto auto minmax(0, 1fr);
    background: var(--shell-bg);
    color: var(--shell-text);
  }

  .shell-header {
    padding: 0.85rem 1rem 0.5rem;
    border-bottom: 1px solid var(--shell-border);
    background: var(--shell-surface);
  }

  .shell-title {
    margin: 0;
    font-size: 1rem;
  }

  .shell-subtitle {
    margin: 0.3rem 0 0;
    color: var(--shell-muted);
    font-size: 0.9rem;
  }

  .shell-nav {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.45rem;
    padding: 0.6rem 1rem;
    border-bottom: 1px solid var(--shell-border);
    background: var(--shell-surface);
  }

  .shell-nav-btn {
    border: 1px solid var(--shell-border);
    border-radius: 8px;
    background: #ffffff;
    color: var(--shell-text);
    font: inherit;
    font-size: 0.84rem;
    font-weight: 600;
    padding: 0.45rem 0.55rem;
    cursor: pointer;
  }

  .shell-nav-btn:focus-visible {
    outline: 2px solid var(--shell-accent);
    outline-offset: 2px;
  }

  .shell-nav-btn:hover {
    border-color: #b6c4d2;
    background: #f8fbff;
  }

  .shell-nav-btn[aria-pressed="true"] {
    border-color: var(--shell-accent);
    background: var(--shell-accent);
    color: #ffffff;
  }

  .shell-viewport {
    min-height: 0;
    overflow: auto;
    padding: 1rem;
  }

  .shell-panel {
    max-width: 720px;
    margin: 0 auto;
    background: var(--shell-surface);
    border: 1px solid var(--shell-border);
    border-radius: 12px;
    padding: 1rem;
  }

  .shell-panel h2 {
    margin: 0;
    font-size: 1.15rem;
  }

  .shell-panel p {
    margin: 0.65rem 0 0;
    color: var(--shell-muted);
    line-height: 1.5;
  }

  .shell-panel-note {
    margin-top: 0.9rem;
    padding: 0.7rem 0.8rem;
    border: 1px dashed var(--shell-border);
    border-radius: 8px;
    background: #f8fbff;
    color: var(--shell-text);
    font-size: 0.92rem;
  }

  @media (max-width: 760px) {
    .shell {
      grid-template-rows: auto minmax(0, 1fr) var(--shell-nav-height);
    }

    .shell-nav {
      position: sticky;
      bottom: 0;
      z-index: 20;
      border-top: 1px solid var(--shell-border);
      border-bottom: 0;
      padding: 0.5rem 0.6rem calc(0.5rem + env(safe-area-inset-bottom));
      gap: 0.35rem;
      align-items: stretch;
      min-height: var(--shell-nav-height);
    }

    .shell-nav-btn {
      min-height: 2.35rem;
      padding: 0.35rem 0.25rem;
      font-size: 0.8rem;
    }

    .shell-viewport {
      padding: 0.85rem 0.75rem calc(0.85rem + env(safe-area-inset-bottom));
    }
  }
`;
