export const headerStyles = `
  :host {
    display: block;
  }

  .topbar {
    background: #ffffff;
    border-bottom: 1px solid #e5e7eb;
    padding: 0.85rem 1rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  .brand {
    display: grid;
    gap: 0.4rem;
  }

  .title {
    margin: 0;
    font-size: 1rem;
    font-weight: 700;
    color: #111827;
  }

  .working-status-wrap {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    flex-wrap: wrap;
  }

  .working-status-chip {
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    border: 1px solid #cbd5e1;
    padding: 0.1rem 0.5rem;
    font-size: 0.72rem;
    line-height: 1.2;
    font-weight: 700;
    color: #334155;
    background: #f8fafc;
  }

  .working-status-chip[data-tone="ok"] {
    color: #166534;
    border-color: #86efac;
    background: #f0fdf4;
  }

  .working-status-chip[data-tone="warn"] {
    color: #9a3412;
    border-color: #fdba74;
    background: #fff7ed;
  }

  .working-status-detail {
    margin: 0;
    font-size: 0.82rem;
    color: #64748b;
  }

  .status {
    margin: 0;
    font-size: 0.85rem;
    color: #64748b;
  }

  .top-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .btn {
    border: 1px solid #cbd5e1;
    background: #ffffff;
    color: #0f172a;
    border-radius: 8px;
    padding: 0.42rem 0.7rem;
    cursor: pointer;
    font: inherit;
    font-size: 0.88rem;
    font-weight: 600;
  }

  .btn:hover {
    background: #f8fafc;
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

    .working-status-detail,
    #statusText,
    #workspaceContext {
      display: none;
    }

    .top-actions {
      flex-wrap: nowrap;
      margin-left: auto;
    }

    .btn {
      padding: 0.3rem 0.52rem;
      font-size: 0.77rem;
      border-radius: 7px;
    }
  }
`;
