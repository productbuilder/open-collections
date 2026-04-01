import { shellStyles } from "../css/shell.css.js";
import { renderCloseIcon } from "../../../../shared/components/icons.js";
import { ENTRY_VIEW_HEADERS } from "../../../../shared/ui/app-foundation/entry-view-header-copy.js";

export function renderShell(shadowRoot) {
	const header = ENTRY_VIEW_HEADERS.collect;
	shadowRoot.innerHTML = `
    <style>${shellStyles}</style>

    <main class="manager-root" aria-label="Collection Manager workspace">
      <section class="entry-view-header-wrap">
        <open-collections-section-header
          id="managerEntryTitle"
          heading-level="1"
          title="${header.title}"
          description="${header.subtitle}"
        ></open-collections-section-header>
      </section>
      <open-collections-header id="managerHeader" hidden></open-collections-header>
      <open-pane-layout id="paneLayout" inspector-placement="right">
        <open-collections-browser id="collectionBrowser" slot="main"></open-collections-browser>
        <open-collections-metadata id="metadataEditor" slot="inspector"></open-collections-metadata>
      </open-pane-layout>

      <open-collections-mobile-flow id="mobileFlow"></open-collections-mobile-flow>
    </main>

    <dialog id="connectionsDialog" class="host-dialog" aria-label="Connections">
      <div class="dialog-shell">
        <div class="dialog-header connections-dialog-header">
          <div class="connections-dialog-heading">
            <h2 class="dialog-title" id="connectionsDialogTitle">Connections</h2>
          </div>
          <button class="icon-btn" data-close="connectionsDialog" type="button" aria-label="Close connections dialog">${renderCloseIcon()}</button>
        </div>
        <div class="dialog-body dialog-panels">
          <p id="connectionsFallbackNote" class="panel-subtext dialog-panel" hidden></p>
          <open-collections-connections-list id="connectionsListPanel" class="dialog-panel"></open-collections-connections-list>
          <open-collections-add-connection-panel id="addConnectionPanel" class="dialog-panel is-hidden"></open-collections-add-connection-panel>
        </div>
      </div>
    </dialog>

    <dialog id="publishDialog" aria-label="Publish collection">
      <div class="dialog-shell">
        <div class="dialog-header">
          <h2 class="dialog-title">Publish collection</h2>
          <button class="btn" data-close="publishDialog" type="button">Close</button>
        </div>
        <div class="dialog-body">
          <div class="field-row"><label for="collectionId">Collection ID</label><input id="collectionId" type="text" /></div>
          <div class="field-row"><label for="collectionTitle">Collection title</label><input id="collectionTitle" type="text" /></div>
          <div class="field-row"><label for="collectionDescription">Collection description</label><textarea id="collectionDescription"></textarea></div>
          <div class="field-row"><label for="collectionLicense">Collection license</label><input id="collectionLicense" type="text" /></div>
          <div class="field-row"><label for="collectionPublisher">Collection publisher</label><input id="collectionPublisher" type="text" /></div>
          <div class="field-row"><label for="collectionLanguage">Collection language</label><input id="collectionLanguage" type="text" /></div>
          <div class="dialog-actions">
            <button class="btn btn-primary" id="generateManifestBtn" type="button">Generate collection.json</button>
            <button class="btn btn-primary" id="publishToSourceBtn" type="button">Publish to assigned connection</button>
            <button class="btn" id="copyManifestBtn" type="button">Copy</button>
            <button class="btn" id="downloadManifestBtn" type="button">Download</button>
            <button class="btn" id="saveLocalDraftBtn" type="button">Save locally</button>
            <button class="btn" id="restoreLocalDraftBtn" type="button">Restore draft</button>
            <button class="btn" id="discardLocalDraftBtn" type="button">Discard draft</button>
          </div>
          <p id="localDraftStatus" class="panel-subtext">Checking local draft storage...</p>
          <pre id="manifestPreview"></pre>
        </div>
      </div>
    </dialog>

    <dialog id="newCollectionDialog" aria-label="Create new collection">
      <div class="dialog-shell">
        <div class="dialog-header">
          <h2 class="dialog-title">Create new collection</h2>
          <button class="btn" data-close="newCollectionDialog" type="button">Close</button>
        </div>
        <div class="dialog-body">
          <div class="field-row"><label for="newCollectionTitle">Title</label><input id="newCollectionTitle" type="text" placeholder="My Collection" /></div>
          <div class="field-row"><label for="newCollectionSlug">ID / Slug</label><input id="newCollectionSlug" type="text" placeholder="my-collection" /></div>
          <div class="field-row"><label for="newCollectionDescription">Description</label><textarea id="newCollectionDescription"></textarea></div>
          <div class="field-row"><label for="newCollectionLicense">License (optional)</label><input id="newCollectionLicense" type="text" /></div>
          <div class="field-row"><label for="newCollectionPublisher">Publisher (optional)</label><input id="newCollectionPublisher" type="text" /></div>
          <div class="field-row"><label for="newCollectionLanguage">Language (optional)</label><input id="newCollectionLanguage" type="text" /></div>
          <div class="dialog-actions">
            <button class="btn btn-primary" id="createCollectionBtn" type="button">Create collection</button>
          </div>
        </div>
      </div>
    </dialog>

    <dialog id="registerDialog" aria-label="Collection registration">
      <div class="dialog-shell">
        <div class="dialog-header">
          <h2 class="dialog-title">Register collection</h2>
          <button class="btn" data-close="registerDialog" type="button">Close</button>
        </div>
        <div class="dialog-body">
          <open-collections-empty-state-panel
            title="Registration workflow"
            description="Collection registration remains a planned follow-up."
            empty-title="Coming soon"
            message="Collection Manager will later register published collections with the registry."
            compact
            surface
          ></open-collections-empty-state-panel>
        </div>
      </div>
    </dialog>

    <dialog id="headerMenuDialog" aria-label="Header menu">
      <div class="dialog-shell">
        <div class="dialog-header">
          <h2 class="dialog-title">More actions</h2>
          <button class="btn" data-close="headerMenuDialog" type="button">Close</button>
        </div>
        <div class="dialog-body">
          <div class="dialog-actions">
            <button class="btn" id="openRegisterFromMenuBtn" type="button">Register collection</button>
          </div>
        </div>
      </div>
    </dialog>

    <dialog id="storageOptionsDialog" class="storage-dialog" aria-label="Storage options guidance">
      <div class="dialog-shell">
        <div class="dialog-header">
          <h2 class="dialog-title">Storage options</h2>
          <button class="btn" data-close="storageOptionsDialog" type="button">Close</button>
        </div>
        <div class="dialog-body storage-layout">
          <section class="storage-section">
            <h3 class="storage-heading">Recommended options for open hosting</h3>
            <ul class="storage-list">
              <li><strong>GitHub</strong>: strong for public manifests, versioning, and easy Collection Manager integration.</li>
              <li><strong>Cloudflare Pages / R2</strong>: excellent static/browser delivery for JSON + media.</li>
              <li><strong>S3-compatible storage</strong>: robust long-term hosting for technical teams and institutions.</li>
              <li><strong>Static website hosting</strong>: simple and dependable for open <code>collection.json</code> publishing.</li>
            </ul>
          </section>

          <section class="storage-section">
            <h3 class="storage-heading">Provider comparison</h3>
            <div class="storage-table-wrap">
              <table class="storage-table" aria-label="Storage provider comparison">
                <thead>
                  <tr>
                    <th>Provider</th>
                    <th>Best use</th>
                    <th>Public hosting quality</th>
                    <th>Browser fetch compatibility</th>
                    <th>Good for media</th>
                    <th>Good for manifests</th>
                    <th>Recommended role</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>GitHub <span class="storage-tag">Recommended</span></td>
                    <td>Open manifests, transparent version history</td>
                    <td>High</td>
                    <td>High</td>
                    <td>Medium</td>
                    <td>High</td>
                    <td>Primary hosting</td>
                  </tr>
                  <tr>
                    <td>Cloudflare Pages / R2 <span class="storage-tag">Recommended</span></td>
                    <td>Public static delivery and scalable media hosting</td>
                    <td>High</td>
                    <td>High</td>
                    <td>High</td>
                    <td>High</td>
                    <td>Primary hosting</td>
                  </tr>
                  <tr>
                    <td>S3-compatible storage <span class="storage-tag">Recommended</span></td>
                    <td>Institutional and technical storage workflows</td>
                    <td>High</td>
                    <td>High</td>
                    <td>High</td>
                    <td>High</td>
                    <td>Primary hosting</td>
                  </tr>
                  <tr>
                    <td>Static website hosting <span class="storage-tag">Recommended</span></td>
                    <td>Simple public hosting for JSON and media files</td>
                    <td>High</td>
                    <td>High</td>
                    <td>Medium</td>
                    <td>High</td>
                    <td>Primary hosting</td>
                  </tr>
                  <tr>
                    <td>OneDrive</td>
                    <td>Internal collaboration and source ingestion</td>
                    <td>Medium</td>
                    <td>Medium</td>
                    <td>Medium</td>
                    <td>Medium</td>
                    <td>Good source</td>
                  </tr>
                  <tr>
                    <td>Dropbox</td>
                    <td>Team file sharing and temporary data exchange</td>
                    <td>Low to medium</td>
                    <td>Medium</td>
                    <td>Medium</td>
                    <td>Medium</td>
                    <td>Import only</td>
                  </tr>
                  <tr>
                    <td>Internet Archive</td>
                    <td>Long-term public archival distribution</td>
                    <td>High</td>
                    <td>Medium</td>
                    <td>High</td>
                    <td>Medium</td>
                    <td>Specialized archive</td>
                  </tr>
                  <tr>
                    <td>Wikimedia Commons</td>
                    <td>Open media publication under supported licenses</td>
                    <td>High</td>
                    <td>Medium</td>
                    <td>High</td>
                    <td>Low to medium</td>
                    <td>Specialized archive</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section class="storage-section">
            <h3 class="storage-heading">Cloud drives in browser-first workflows</h3>
            <p class="panel-subtext">OneDrive and Dropbox are useful source systems, but they are usually weaker as final public hosting for browser-first manifest delivery.</p>
            <p class="panel-subtext">Use them for collaboration/import, then publish to GitHub, Cloudflare, S3-compatible storage, or static hosting for stable public access.</p>
          </section>

          <section class="storage-section">
            <h3 class="storage-heading">Quick recommendations by scenario</h3>
            <ul class="storage-list">
              <li><strong>Small heritage organizations</strong> -> GitHub</li>
              <li><strong>Technical teams or institutions</strong> -> S3-compatible storage or Cloudflare R2</li>
              <li><strong>Files already in OneDrive</strong> -> import from drive, then publish to stronger public hosting</li>
              <li><strong>Archival public preservation</strong> -> Internet Archive or Wikimedia Commons where appropriate</li>
            </ul>
          </section>

          <p class="panel-subtext">
            Learn more: <a href="/docs/storage-options">/docs/storage-options</a> (placeholder; full guide TBD).
          </p>
        </div>
      </div>
    </dialog>

    <open-collections-asset-viewer id="assetViewer"></open-collections-asset-viewer>
  `;
}
