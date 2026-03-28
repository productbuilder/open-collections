import { accountShellStyles } from '../css/shell.css.js';

export function renderShell(shadowRoot) {
  shadowRoot.innerHTML = `
    <style>${accountShellStyles}</style>

    <main class="oc-page oc-app-viewport account-shell">
      <section class="account-root-view" id="accountRootView" aria-label="Account areas">
        <button type="button" class="account-entry-button" data-account-entry="connections">
          <span class="account-entry-label">Connections</span>
          <span class="material-icons account-entry-icon" aria-hidden="true">chevron_right</span>
        </button>
        <button type="button" class="account-entry-button" data-account-entry="settings">
          <span class="account-entry-label">Settings</span>
          <span class="material-icons account-entry-icon" aria-hidden="true">chevron_right</span>
        </button>
      </section>

      <section class="oc-surface account-section-content is-hidden" id="connectionsSection" aria-labelledby="connectionsHeading">
        <header class="account-subpage-header">
          <button type="button" class="account-back-button" data-back-to-root aria-label="Back to account">
            ←
          </button>
          <h2 class="connections-heading" id="connectionsHeading">Connections</h2>
        </header>
        <p class="account-description">Set up and maintain source connections for browsing, editing, and publishing collections.</p>
        <p class="status-note" id="accountStatus" data-tone="neutral">No connections yet.</p>
        <div class="connections-body">
          <open-collections-connections-list id="connectionsListPanel"></open-collections-connections-list>
          <open-collections-add-connection-panel id="addConnectionPanel" class="is-hidden"></open-collections-add-connection-panel>
        </div>
      </section>

      <section class="oc-surface account-section-content is-hidden" id="settingsSection" aria-labelledby="settingsHeading">
        <header class="account-subpage-header">
          <button type="button" class="account-back-button" data-back-to-root aria-label="Back to account">
            ←
          </button>
          <h2 class="connections-heading" id="settingsHeading">User settings</h2>
        </header>
        <p class="account-description">This area will host user and account preferences as the account app grows.</p>
        <div class="settings-placeholder">
          <p class="settings-placeholder-title">Settings coming soon</p>
          <p class="settings-placeholder-copy">Future account preferences and profile-level configuration will be managed here.</p>
        </div>
      </section>
    </main>
  `;
}
