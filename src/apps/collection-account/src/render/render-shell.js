import { accountShellStyles } from '../css/shell.css.js';

export function renderShell(shadowRoot) {
  shadowRoot.innerHTML = `
    <style>${accountShellStyles}</style>

    <main class="account-shell">
      <section class="account-hero" aria-labelledby="accountTitle">
        <h1 class="account-title" id="accountTitle">Account</h1>
        <p class="account-description">Manage account-level connections used across Open Collections workflows.</p>
        <p class="status-note" id="accountStatus" data-tone="neutral">No connections yet.</p>
      </section>

      <section class="connections-surface" aria-labelledby="connectionsHeading">
        <h2 class="connections-heading" id="connectionsHeading">Connections</h2>
        <p class="account-description">Set up and maintain source connections for browsing, editing, and publishing collections.</p>
        <div class="connections-body">
          <open-collections-connections-list id="connectionsListPanel"></open-collections-connections-list>
          <open-collections-add-connection-panel id="addConnectionPanel" class="is-hidden"></open-collections-add-connection-panel>
        </div>
      </section>

      <p class="account-note">More account-level settings can be added here as additional account views.</p>
    </main>
  `;
}
