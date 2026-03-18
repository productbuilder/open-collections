export const browserRendererStyles = `
  :host {
    display: block;
  }

  * {
    box-sizing: border-box;
  }

  .asset-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    grid-auto-rows: 1fr;
    align-items: stretch;
    align-content: start;
    gap: 0.7rem;
  }

  .asset-card {
    border: 1px solid #dbe3ec;
    border-radius: 9px;
    padding: 0.55rem;
    background: #ffffff;
    display: grid;
    grid-template-rows: auto minmax(2.4rem, auto) auto auto;
    align-content: start;
    gap: 0.5rem;
    height: 100%;
    cursor: pointer;
    transition: border-color 120ms ease, box-shadow 120ms ease, background-color 120ms ease;
  }

  .asset-card:hover {
    border-color: #93c5fd;
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
    background: #f8fbff;
  }

  .asset-card.is-selected {
    border-color: #0f6cc6;
    box-shadow: 0 0 0 1px #66a6e8 inset, 0 3px 10px rgba(15, 108, 198, 0.16);
    background: #f5faff;
  }

  .thumb-frame {
    width: 100%;
    height: 125px;
    display: block;
    flex-shrink: 0;
    border-radius: 7px;
    border: 1px solid #dbe3ec;
    overflow: hidden;
    background: #eef2f7;
  }

  .thumb {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
    border: 0;
    border-radius: 0;
    background: transparent;
  }

  .thumb-placeholder {
    width: 100%;
    height: 100%;
    border-radius: 0;
    border: 1px dashed #cbd5e1;
    display: grid;
    place-items: center;
    color: #64748b;
    background: #f8fafc;
    font-size: 0.82rem;
  }

  .card-title {
    margin: 0;
    font-size: 0.88rem;
    font-weight: 700;
    line-height: 1.2;
    min-height: 2.1rem;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .badge-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
  }

  .badge {
    font-size: 0.75rem;
    padding: 0.15rem 0.4rem;
    border-radius: 999px;
    border: 1px solid #cbd5e1;
    color: #475569;
    background: #f8fafc;
  }

  .card-actions {
    display: flex;
    gap: 0.45rem;
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

  .card-actions .btn {
    flex: 1;
  }

  .empty {
    border: 1px dashed #cbd5e1;
    border-radius: 8px;
    padding: 1rem;
    text-align: center;
    color: #64748b;
    background: #f8fafc;
    font-size: 0.9rem;
  }

  .row-table-wrap {
    border: 1px solid #dbe3ec;
    border-radius: 10px;
    overflow: hidden;
    background: #ffffff;
  }

  .row-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.84rem;
  }

  .row-table th,
  .row-table td {
    padding: 0.45rem 0.55rem;
    border-bottom: 1px solid #e2e8f0;
    text-align: left;
    vertical-align: middle;
  }

  .row-table tbody tr {
    cursor: pointer;
  }

  .row-table tbody tr:hover {
    background: #f8fbff;
  }

  .row-table tbody tr.is-selected {
    background: #eef6ff;
  }

  .row-thumb,
  .row-thumb-placeholder {
    width: 40px;
    height: 40px;
    border-radius: 6px;
    display: block;
    object-fit: cover;
    border: 1px solid #dbe3ec;
    background: #eef2f7;
  }

  .row-thumb-placeholder {
    display: grid;
    place-items: center;
    border-style: dashed;
    color: #64748b;
    font-size: 0.6rem;
  }

  @media (max-width: 760px) {
    .asset-grid {
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 0.55rem;
    }

    .thumb-frame {
      height: 108px;
    }

    .row-table {
      font-size: 0.78rem;
    }

    .row-table th,
    .row-table td {
      padding: 0.35rem 0.4rem;
    }
  }
`;
