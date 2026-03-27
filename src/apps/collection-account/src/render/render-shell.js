import { accountShellStyles } from '../css/shell.css.js';

export function renderShell(shadowRoot) {
  shadowRoot.innerHTML = `
    <style>${accountShellStyles}</style>

    <main class="oc-page oc-app-viewport account-shell">
      <section class="oc-page-intro" aria-labelledby="accountTitle">
        <h1 class="account-title" id="accountTitle">Account</h1>
        <p class="account-description">Manage account-level areas for Open Collections, starting with connections and future settings.</p>
      </section>

      <section class="account-sections" aria-label="Account sections">
        <button type="button" class="account-section-button is-active" data-section-button="connections" aria-pressed="true">
          Connections
        </button>
        <button type="button" class="account-section-button" data-section-button="settings" aria-pressed="false">
          Settings
        </button>
      </section>

      <section class="oc-surface account-section-content" id="connectionsSection" aria-labelledby="connectionsHeading">
        <h2 class="connections-heading" id="connectionsHeading">Connections</h2>
        <p class="account-description">Set up and maintain source connections for browsing, editing, and publishing collections.</p>
        <p class="status-note" id="accountStatus" data-tone="neutral">No connections yet.</p>
        <div class="connections-body">
          <open-collections-connections-list id="connectionsListPanel"></open-collections-connections-list>
          <open-collections-add-connection-panel id="addConnectionPanel" class="is-hidden"></open-collections-add-connection-panel>
        </div>
      </section>

      <section class="oc-surface account-section-content is-hidden" id="settingsSection" aria-labelledby="settingsHeading">
        <h2 class="connections-heading" id="settingsHeading">User settings</h2>
        <p class="account-description">This area will host user and account preferences as the account app grows.</p>
        <div class="settings-placeholder">
          <p class="settings-placeholder-title">Settings coming soon</p>
          <p class="settings-placeholder-copy">Future account preferences and profile-level configuration will be managed here.</p>
        </div>
      </section>
    </main>
  `;
}
