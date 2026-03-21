export const configuratorSectionBrowserStyles = `
  :host {
    display: block;
    height: 100%;
    min-height: 0;
  }

  * {
    box-sizing: border-box;
  }

  open-panel-shell {
    display: block;
    height: 100%;
    min-height: 0;
  }

  .content-wrap {
    height: 100%;
    min-height: 0;
    overflow: auto;
    overscroll-behavior: contain;
  }

  .actions-wrap {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    flex-wrap: wrap;
  }

  .btn {
    border: 1px solid #cbd5e1;
    background: #ffffff;
    color: #0f172a;
    border-radius: 8px;
    padding: 0.36rem 0.62rem;
    cursor: pointer;
    font: inherit;
    font-size: 0.8rem;
    font-weight: 600;
  }

  .btn.small {
    padding: 0.28rem 0.48rem;
    font-size: 0.78rem;
  }

  .btn:disabled {
    opacity: 0.45;
    cursor: default;
  }

  .btn.danger {
    border-color: #fecaca;
    color: #991b1b;
    background: #fff1f2;
  }

  .btn-primary {
    background: #0f6cc6;
    color: #ffffff;
    border-color: #0f6cc6;
  }

  .context-actions {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    flex-wrap: wrap;
    justify-content: flex-end;
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

  .table-wrap {
    border: 1px solid #dbe3ec;
    border-radius: 8px;
    overflow: auto;
    background: #ffffff;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.84rem;
    color: #334155;
  }

  th,
  td {
    border-bottom: 1px solid #e2e8f0;
    padding: 0.45rem 0.5rem;
    text-align: left;
    vertical-align: top;
  }

  th {
    background: #f8fafc;
    color: #0f172a;
    font-weight: 700;
  }

  tr:last-child td {
    border-bottom: none;
  }

  tr.is-selected td {
    background: #f1f7ff;
  }

  tbody tr {
    cursor: pointer;
  }

  .row-warn {
    font-size: 0.72rem;
    color: #991b1b;
    border-radius: 999px;
    border: 1px solid #fecaca;
    background: #fef2f2;
    padding: 0.1rem 0.38rem;
    font-weight: 700;
  }

  .cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 0.7rem;
  }

  .card {
    border: 1px solid #dbe3ec;
    border-radius: 8px;
    background: #ffffff;
    padding: 0.65rem;
    display: grid;
    gap: 0.42rem;
    cursor: pointer;
  }

  .card:hover {
    background: #f8fbff;
    border-color: #bfdbfe;
  }

  .card.is-selected {
    border-color: #0f6cc6;
    box-shadow: 0 0 0 1px #9bc6ee inset;
    background: #f1f7ff;
  }

  .card-title {
    margin: 0;
    font-size: 0.9rem;
    font-weight: 700;
    color: #0f172a;
  }

  .card-meta {
    margin: 0;
    font-size: 0.8rem;
    color: #64748b;
  }

  .card-warn {
    margin: 0;
    font-size: 0.74rem;
    color: #991b1b;
    font-weight: 700;
  }

  .section-nav-list {
    display: grid;
    gap: 0.6rem;
    align-content: start;
  }

  .section-nav-btn {
    width: 100%;
    border: 1px solid #dbe3ec;
    border-radius: 10px;
    background: #ffffff;
    padding: 0.62rem 0.68rem;
    text-align: left;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.7rem;
    cursor: pointer;
    font: inherit;
  }

  .section-nav-btn:hover {
    border-color: #bfdbfe;
    background: #f8fbff;
  }

  .section-nav-btn.is-selected {
    border-color: #0f6cc6;
    box-shadow: 0 0 0 1px #9bc6ee inset;
    background: #eff6ff;
  }

  .section-nav-main {
    display: grid;
    gap: 0.2rem;
    min-width: 0;
  }

  .section-nav-title {
    font-size: 0.88rem;
    color: #0f172a;
    line-height: 1.25;
  }

  .section-nav-meta {
    font-size: 0.78rem;
    color: #64748b;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: min(56vw, 700px);
  }

  .section-nav-badges {
    display: inline-flex;
    align-items: center;
    gap: 0.34rem;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .section-count {
    font-size: 0.72rem;
    color: #334155;
    border: 1px solid #cbd5e1;
    background: #f8fafc;
    border-radius: 999px;
    padding: 0.1rem 0.4rem;
    font-weight: 700;
  }

  .section-warn {
    font-size: 0.72rem;
    color: #991b1b;
    border: 1px solid #fecaca;
    background: #fef2f2;
    border-radius: 999px;
    padding: 0.1rem 0.4rem;
    font-weight: 700;
  }

  .overview-grid {
    display: grid;
    gap: 0.65rem;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  }

  .overview-card {
    border: 1px solid #dbe3ec;
    border-radius: 8px;
    background: #ffffff;
    padding: 0.65rem;
    display: grid;
    gap: 0.25rem;
  }

  .overview-label {
    margin: 0;
    font-size: 0.78rem;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .overview-value {
    margin: 0;
    font-size: 1.05rem;
    font-weight: 700;
    color: #0f172a;
  }

  .warning-box {
    border: 1px solid #fecaca;
    border-radius: 8px;
    background: #fef2f2;
    color: #7f1d1d;
    padding: 0.55rem 0.6rem;
    margin: 0 0 0.6rem;
    font-size: 0.8rem;
  }

  .warning-box strong {
    display: block;
    margin: 0 0 0.25rem;
    font-size: 0.82rem;
  }

  .warning-box ul {
    margin: 0;
    padding-left: 1rem;
    display: grid;
    gap: 0.12rem;
  }

  .json-wrap {
    border: 1px solid #dbe3ec;
    border-radius: 8px;
    background: #ffffff;
    overflow: hidden;
  }

  .json-title {
    margin: 0;
    padding: 0.45rem 0.55rem;
    border-bottom: 1px solid #e2e8f0;
    font-size: 0.78rem;
    color: #334155;
    font-weight: 700;
  }

  pre {
    margin: 0;
    padding: 0.7rem;
    max-height: 45vh;
    overflow: auto;
    background: #0f172a;
    color: #dbeafe;
    font-size: 0.78rem;
    line-height: 1.36;
  }
`;
