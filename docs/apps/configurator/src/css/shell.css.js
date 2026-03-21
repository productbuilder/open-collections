export const configuratorShellStyles = `
  :host {
    display: block;
    color: #111827;
    font-family: "Segoe UI", Tahoma, sans-serif;
    background: #eef2f7;
  }

  * {
    box-sizing: border-box;
  }

  .app-shell {
    width: 100%;
    height: min(100dvh, 100vh);
    min-height: 680px;
    background: #eef2f7;
    overflow: hidden;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
  }

  .workspace {
    width: 100%;
    margin-inline: auto;
    min-height: 0;
    display: grid;
    overflow: hidden;
  }

  .workspace > open-pane-layout {
    min-height: 0;
    height: 100%;
    display: block;
  }

  open-configurator-section-browser {
    min-height: 0;
    height: 100%;
    padding: 0.9rem;
    overflow: hidden;
  }

  open-configurator-inspector {
    display: block;
    min-height: 0;
    height: 100%;
    border-left: 1px solid #dbe3ec;
    background: #ffffff;
    overflow: hidden;
  }

  .btn {
    border: 1px solid #cbd5e1;
    background: #ffffff;
    color: #0f172a;
    border-radius: 8px;
    padding: 0.38rem 0.62rem;
    font: inherit;
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
  }

  .btn:hover {
    background: #f8fafc;
  }

  .btn-primary {
    border-color: #0f6cc6;
    background: #0f6cc6;
    color: #ffffff;
  }

  .btn-primary:hover {
    background: #0d5eae;
  }

  .config-dialog {
    width: min(700px, 94vw);
    border: 1px solid #dbe3ec;
    border-radius: 12px;
    padding: 0;
    background: #ffffff;
    box-shadow: 0 14px 36px rgba(15, 23, 42, 0.22);
  }

  .config-dialog::backdrop {
    background: rgba(15, 23, 42, 0.45);
  }

  .dialog-shell {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr) auto;
    max-height: min(84vh, 760px);
  }

  .dialog-header {
    padding: 0.75rem 0.85rem;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.6rem;
  }

  .dialog-title {
    margin: 0;
    font-size: 0.95rem;
    color: #0f172a;
  }

  .dialog-body {
    padding: 0.85rem;
    overflow: auto;
    display: grid;
    gap: 0.7rem;
    align-content: start;
  }

  .dialog-subtext {
    margin: 0;
    font-size: 0.84rem;
    color: #475569;
  }

  .field-row {
    display: grid;
    gap: 0.28rem;
  }

  .field-row > label {
    font-size: 0.8rem;
    color: #475569;
    font-weight: 600;
  }

  .field-row > input {
    width: 100%;
    border: 1px solid #cbd5e1;
    background: #ffffff;
    color: #0f172a;
    border-radius: 8px;
    padding: 0.42rem 0.55rem;
    font: inherit;
    font-size: 0.88rem;
  }

  .dialog-actions {
    padding: 0.7rem 0.85rem;
    border-top: 1px solid #e2e8f0;
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .pick-list {
    display: grid;
    gap: 0.45rem;
  }

  .pick-item {
    width: 100%;
    border: 1px solid #dbe3ec;
    background: #ffffff;
    border-radius: 8px;
    padding: 0.5rem 0.6rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.7rem;
    cursor: pointer;
    text-align: left;
    font: inherit;
  }

  .pick-item:hover {
    border-color: #93c5fd;
    background: #f8fbff;
  }

  .pick-item.is-selected {
    border-color: #0f6cc6;
    box-shadow: 0 0 0 1px #66a6e8 inset;
    background: #eff6ff;
  }

  .pick-label {
    font-size: 0.87rem;
    font-weight: 700;
    color: #0f172a;
  }

  .pick-id {
    font-size: 0.76rem;
    color: #475569;
  }

  .source-role-list {
    display: grid;
    gap: 0.6rem;
  }

  .source-role-card {
    border: 1px solid #dbe3ec;
    border-radius: 8px;
    background: #ffffff;
    padding: 0.6rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.7rem;
  }

  .source-role-title {
    margin: 0;
    font-size: 0.84rem;
    font-weight: 700;
    color: #0f172a;
  }

  .source-role-meta {
    margin: 0.16rem 0 0;
    font-size: 0.8rem;
    color: #475569;
  }

  .source-role-detail {
    margin: 0.16rem 0 0;
    font-size: 0.75rem;
    color: #64748b;
    line-height: 1.35;
  }

  .empty-state {
    border: 1px dashed #cbd5e1;
    border-radius: 8px;
    padding: 0.8rem;
    color: #64748b;
    background: #f8fafc;
    font-size: 0.85rem;
  }

  @media (max-width: 1080px) {
    .app-shell {
      width: 100%;
    }

    .workspace {
      width: 100%;
    }

    open-configurator-section-browser {
      padding: 0.8rem;
    }
  }

  @media (max-width: 760px) {
    .app-shell {
      min-height: 100dvh;
    }
    open-configurator-section-browser {
      padding: 0.65rem;
    }

    .source-role-card {
      align-items: flex-start;
      flex-direction: column;
    }
  }
`;
