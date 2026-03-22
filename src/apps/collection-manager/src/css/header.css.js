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
    min-width: 0;
  }

  .title {
    margin: 0;
    font-size: 1rem;
    font-weight: 700;
    color: #111827;
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

  .icon-btn {
    border: 0;
    background: transparent;
    color: #475569;
    border-radius: 999px;
    width: 2.25rem;
    height: 2.25rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: 0;
  }

  .icon-btn:hover {
    background: #f8fafc;
    color: #0f172a;
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
