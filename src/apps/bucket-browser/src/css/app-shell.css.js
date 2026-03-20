export const appShellStyles = `
  :host {
    display: block;
    height: 100%;
    min-height: 0;
    font-family: "Segoe UI", Tahoma, sans-serif;
    color: #0f172a;
  }

  * { box-sizing: border-box; }

  .app-shell {
    min-height: min(100dvh, 100vh);
    display: grid;
    grid-template-rows: auto auto minmax(0, 1fr) auto;
    background: linear-gradient(180deg, #f8fbff 0%, #eef3f8 100%);
  }
`;
