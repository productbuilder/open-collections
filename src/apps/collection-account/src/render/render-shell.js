import { accountShellStyles } from "../css/shell.css.js";
import { sourceManagerStyles } from "../../../collection-manager/src/css/source-manager.css.js";
import { renderBackButton } from "../../../../shared/components/back-button.js";

export function renderShell(shadowRoot) {
	shadowRoot.innerHTML = `

		<style>
			${accountShellStyles}
			${sourceManagerStyles}
		</style>

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

			<section class="account-section-content is-hidden" id="connectionsSection" aria-labelledby="connectionsHeading">
				<open-collections-section-panel
					title="Connections"
					heading-level="2"
					id="connectionsHeading"
				>
					${renderBackButton({
						id: "accountBackBtn",
						label: "Back to account",
						className: "back-btn",
						slot: "leading",
					})}
					<p class="account-description">Set up and maintain source connections for browsing, editing, and publishing collections.</p>
					<p class="status-note" id="accountStatus" data-tone="neutral">No connections yet.</p>

					<div class="connections-body">
						<open-collections-connections-list id="connectionsListPanel"></open-collections-connections-list>
						<open-collections-add-connection-panel id="addConnectionPanel" class="is-hidden"></open-collections-add-connection-panel>
					</div>
				</open-collections-section-panel>
			</section>

			<section class="oc-surface account-section-content is-hidden" id="settingsSection" aria-labelledby="settingsHeading">
				<open-collections-empty-state-panel
					title="User settings"
					heading-level="2"
					id="settingsHeading"
					empty-title="Settings coming soon"
					message="Future account preferences and profile-level configuration will be managed here."
				>
					${renderBackButton({
						id: "settingsBackBtn",
						label: "Back to account",
						className: "back-btn",
						slot: "leading",
					})}
					<p class="account-description">This area will host user and account preferences as the account app grows.</p>
				</open-collections-empty-state-panel>
			</section>
		</main>
	`;
}
