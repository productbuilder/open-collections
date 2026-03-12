const IMAGE_UPLOAD_ACCEPT = '.jpg,.jpeg,.png,.webp,.gif';

export function renderShell(shadowRoot) {
    shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          color: #111827;
          font-family: "Segoe UI", Tahoma, sans-serif;
        }

        * {
          box-sizing: border-box;
        }

        [hidden] {
          display: none !important;
        }

        .app-shell {
          height: min(100dvh, 100vh);
          min-height: 640px;
          background: #f3f5f8;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
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
          gap: 0.15rem;
        }

        .title {
          margin: 0;
          font-size: 1rem;
          font-weight: 700;
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

        .btn-primary {
          background: #0f6cc6;
          color: #ffffff;
          border-color: #0f6cc6;
        }

        .btn-primary:hover {
          background: #0d5eae;
        }

        .content-grid {
          flex: 1;
          min-height: 0;
          padding: 0.95rem;
          display: grid;
          gap: 0.95rem;
          grid-template-columns: minmax(0, 1fr) 350px;
          align-items: stretch;
          overflow: hidden;
        }

        .panel {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
        }

        .viewport-panel {
          display: grid;
          grid-template-rows: auto 1fr;
          min-height: 0;
          overflow: hidden;
        }

        .panel-header {
          padding: 0.8rem 0.95rem;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.7rem;
        }

        .panel-header-meta {
          display: flex;
          align-items: center;
          gap: 0.55rem;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .panel-title {
          margin: 0;
          font-size: 0.95rem;
        }

        .panel-subtext {
          margin: 0;
          font-size: 0.83rem;
          color: #64748b;
        }

        .asset-wrap {
          padding: 0.9rem;
          overflow: auto;
          min-height: 0;
        }

        .asset-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 0.7rem;
        }

        .asset-card {
          border: 1px solid #dbe3ec;
          border-radius: 9px;
          padding: 0.55rem;
          background: #ffffff;
          display: grid;
          gap: 0.5rem;
          cursor: pointer;
          transition: border-color 120ms ease, box-shadow 120ms ease, background-color 120ms ease;
        }

        .asset-card:hover {
          border-color: #93c5fd;
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
          background: #f8fbff;
        }

        .asset-card:focus-visible {
          outline: 2px solid #2563eb;
          outline-offset: 2px;
        }

        .asset-card.is-selected {
          border-color: #0f6cc6;
          box-shadow: 0 0 0 1px #66a6e8 inset, 0 3px 10px rgba(15, 108, 198, 0.16);
          background: #f5faff;
        }

        .thumb {
          width: 100%;
          height: 125px;
          object-fit: cover;
          border-radius: 7px;
          border: 1px solid #dbe3ec;
          background: #eef2f7;
        }

        .thumb-placeholder {
          width: 100%;
          height: 125px;
          border-radius: 7px;
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

        .badge.ok {
          border-color: #86efac;
          background: #f0fdf4;
          color: #166534;
        }

        .badge.warn {
          border-color: #fed7aa;
          background: #fff7ed;
          color: #9a3412;
        }

        .badge.source-badge {
          border-color: #bfdbfe;
          background: #eff6ff;
          color: #1d4ed8;
        }

        .card-actions {
          display: flex;
          gap: 0.45rem;
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

        .editor-panel {
          display: grid;
          grid-template-rows: auto minmax(0, 1fr);
          min-height: 0;
          overflow: hidden;
        }

        .editor-close-btn {
          display: none;
        }

        .editor-header-meta {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          min-width: 0;
          justify-content: flex-end;
        }

        .editor-context {
          margin: 0;
          font-size: 0.78rem;
          color: #64748b;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 200px;
        }

        .editor-content {
          min-height: 0;
          overflow: auto;
        }

        .editor-wrap {
          padding: 0.95rem;
          display: grid;
          gap: 0.6rem;
          align-content: start;
          min-height: 0;
        }

        .field-row {
          display: grid;
          gap: 0.25rem;
        }

        .field-row > label {
          font-size: 0.8rem;
          color: #475569;
          font-weight: 600;
        }

        input,
        textarea,
        select {
          width: 100%;
          font: inherit;
          font-size: 0.9rem;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 0.45rem 0.55rem;
          background: #ffffff;
          color: #0f172a;
        }

        textarea {
          resize: vertical;
          min-height: 78px;
        }

        .checkbox-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.84rem;
          color: #334155;
          padding-top: 0.2rem;
        }

        .checkbox-row input {
          width: auto;
        }

        dialog {
          width: min(780px, 94vw);
          border: 1px solid #dbe3ec;
          border-radius: 12px;
          padding: 0;
          box-shadow: 0 14px 36px rgba(15, 23, 42, 0.2);
          background: #ffffff;
        }

        dialog::backdrop {
          background: rgba(15, 23, 42, 0.45);
        }

        .dialog-shell {
          display: grid;
          grid-template-rows: auto 1fr;
          max-height: min(82vh, 760px);
        }

        .dialog-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.75rem;
          padding: 0.8rem 0.95rem;
          border-bottom: 1px solid #e2e8f0;
        }

        .dialog-title {
          margin: 0;
          font-size: 0.95rem;
        }

        .dialog-body {
          padding: 0.95rem;
          overflow: auto;
          display: grid;
          gap: 0.7rem;
          align-content: start;
        }

        .dialog-actions {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .provider-layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: 0.7rem;
        }

        .source-manager {
          display: grid;
          gap: 0.7rem;
        }

        .source-list {
          display: grid;
          gap: 0.55rem;
        }

        .source-card {
          border: 1px solid #dbe3ec;
          border-radius: 8px;
          background: #ffffff;
          padding: 0.6rem;
          display: grid;
          gap: 0.45rem;
        }

        .source-card-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 0.6rem;
        }

        .source-card-label {
          margin: 0;
          font-size: 0.88rem;
          font-weight: 700;
        }

        .source-card-actions {
          display: flex;
          gap: 0.4rem;
          flex-wrap: wrap;
        }

        .source-card-actions .btn {
          font-size: 0.78rem;
          padding: 0.25rem 0.45rem;
        }

        .source-card-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .provider-list {
          display: grid;
          gap: 0.5rem;
          align-content: start;
        }

        .provider-card {
          border: 1px solid #dbe3ec;
          border-radius: 8px;
          background: #ffffff;
          padding: 0.6rem;
          text-align: left;
          display: grid;
          gap: 0.2rem;
          cursor: pointer;
        }

        .provider-card.is-selected {
          border-color: #0f6cc6;
          box-shadow: 0 0 0 1px #66a6e8 inset;
          background: #f5faff;
        }

        .provider-card.is-disabled {
          cursor: not-allowed;
          background: #f8fafc;
          color: #64748b;
          border-color: #e2e8f0;
        }

        .provider-card-label-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
        }

        .pill {
          border-radius: 999px;
          border: 1px solid #cbd5e1;
          padding: 0.1rem 0.4rem;
          font-size: 0.72rem;
          color: #475569;
          background: #f8fafc;
        }

        .pill.is-muted {
          color: #64748b;
          border-color: #e2e8f0;
          background: #f8fafc;
        }

        .provider-config {
          display: grid;
          gap: 0.6rem;
          align-content: start;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: #f8fafc;
          padding: 0.7rem;
        }

        .config-section-title {
          margin: 0;
          font-size: 0.83rem;
          color: #334155;
        }

        .storage-help-btn {
          margin-top: 0.5rem;
        }

        .storage-dialog {
          width: min(1080px, 96vw);
        }

        .storage-layout {
          display: grid;
          gap: 0.8rem;
        }

        .storage-section {
          border: 1px solid #dbe3ec;
          border-radius: 8px;
          background: #ffffff;
          padding: 0.75rem;
          display: grid;
          gap: 0.45rem;
        }

        .storage-heading {
          margin: 0;
          font-size: 0.9rem;
          color: #0f172a;
        }

        .storage-list {
          margin: 0;
          padding-left: 1.1rem;
          display: grid;
          gap: 0.3rem;
          color: #334155;
          font-size: 0.86rem;
        }

        .storage-table-wrap {
          overflow: auto;
          border: 1px solid #dbe3ec;
          border-radius: 8px;
          background: #ffffff;
        }

        .storage-table {
          width: 100%;
          min-width: 980px;
          border-collapse: collapse;
          font-size: 0.82rem;
          color: #334155;
        }

        .storage-table th,
        .storage-table td {
          border-bottom: 1px solid #e2e8f0;
          padding: 0.45rem 0.5rem;
          text-align: left;
          vertical-align: top;
        }

        .storage-table th {
          background: #f8fafc;
          color: #0f172a;
          font-weight: 700;
          position: sticky;
          top: 0;
          z-index: 1;
        }

        .storage-table tr:last-child td {
          border-bottom: none;
        }

        .storage-tag {
          display: inline-block;
          padding: 0.08rem 0.38rem;
          border-radius: 999px;
          border: 1px solid #bfdbfe;
          background: #eff6ff;
          color: #1d4ed8;
          font-size: 0.72rem;
          font-weight: 700;
          white-space: nowrap;
        }

        .is-hidden {
          display: none;
        }

        .source-filter {
          width: 220px;
          min-width: 220px;
          max-width: 220px;
        }

        .editor-section {
          border-top: 1px solid #e2e8f0;
          padding-top: 0.6rem;
          display: grid;
          gap: 0.45rem;
        }

        .editor-section-title {
          margin: 0;
          font-size: 0.78rem;
          letter-spacing: 0.03em;
          text-transform: uppercase;
          color: #64748b;
          font-weight: 700;
        }

        .viewport-actions {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          flex-wrap: wrap;
        }

        .drop-overlay {
          position: absolute;
          inset: 0;
          border: 2px dashed #0f6cc6;
          border-radius: 10px;
          background: rgba(15, 108, 198, 0.08);
          display: none;
          align-items: center;
          justify-content: center;
          color: #0f4f8a;
          font-weight: 700;
          pointer-events: none;
          z-index: 4;
        }

        .drop-overlay.is-active {
          display: flex;
        }

        .asset-status-local {
          border-color: #c4b5fd;
          background: #f5f3ff;
          color: #5b21b6;
        }

        .asset-status-pending {
          border-color: #fcd34d;
          background: #fffbeb;
          color: #92400e;
        }

        .asset-status-uploading {
          border-color: #93c5fd;
          background: #eff6ff;
          color: #1d4ed8;
        }

        .asset-status-uploaded {
          border-color: #86efac;
          background: #ecfdf5;
          color: #166534;
        }

        .asset-status-failed {
          border-color: #fecaca;
          background: #fef2f2;
          color: #991b1b;
        }

        .viewer-dialog {
          width: min(980px, 96vw);
        }

        .viewer-layout {
          display: grid;
          gap: 0.8rem;
        }

        .viewer-media-wrap {
          border: 1px solid #dbe3ec;
          border-radius: 8px;
          background: #f8fafc;
          min-height: 280px;
          max-height: 60vh;
          overflow: auto;
          display: grid;
          place-items: center;
          padding: 0.7rem;
        }

        .viewer-image {
          max-width: 100%;
          max-height: 56vh;
          width: auto;
          height: auto;
          border-radius: 7px;
          border: 1px solid #cbd5e1;
          background: #ffffff;
        }

        .viewer-video {
          max-width: 100%;
          max-height: 56vh;
          border-radius: 7px;
          border: 1px solid #cbd5e1;
          background: #0f172a;
        }

        .viewer-details {
          display: grid;
          gap: 0.55rem;
        }

        .viewer-text {
          margin: 0;
          color: #334155;
          font-size: 0.9rem;
          white-space: pre-wrap;
        }

        pre {
          margin: 0;
          padding: 0.75rem;
          border-radius: 8px;
          background: #0f172a;
          color: #dbeafe;
          font-size: 0.8rem;
          max-height: 280px;
          overflow: auto;
          white-space: pre-wrap;
          word-break: break-word;
        }

        @media (max-width: 1080px) {
          .content-grid {
            grid-template-columns: minmax(0, 1fr);
            overflow: auto;
          }
          .editor-panel {
            min-height: 0;
          }
        }

        @media (max-width: 760px) {
          .app-shell {
            border: none;
            border-radius: 0;
            min-height: 100dvh;
          }

          .topbar {
            padding: 0.55rem 0.7rem;
            gap: 0.55rem;
            align-items: center;
          }

          .title {
            font-size: 0.9rem;
          }

          #statusText,
          #workspaceContext,
          #assetCount,
          #sourceFilter,
          #collectionFilter {
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

          .content-grid {
            padding: 0.65rem;
            gap: 0.65rem;
          }

          .viewport-panel.panel {
            border: none;
            background: transparent;
            box-shadow: none;
          }

          .viewport-panel .panel-header {
            border: none;
            background: transparent;
            padding: 0.1rem 0 0.45rem;
            position: sticky;
            top: 0;
            z-index: 2;
          }

          .panel-header-meta {
            width: 100%;
            justify-content: space-between;
            gap: 0.4rem;
            flex-wrap: nowrap;
          }

          .viewport-actions .btn {
            font-size: 0.78rem;
          }

          .asset-wrap {
            padding: 0;
          }

          .asset-grid {
            grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
            gap: 0.55rem;
          }

          .asset-card {
            padding: 0.48rem;
            gap: 0.4rem;
            box-shadow: 0 1px 2px rgba(15, 23, 42, 0.05);
          }

          .thumb,
          .thumb-placeholder {
            height: 108px;
          }

          .card-actions .btn {
            font-size: 0.76rem;
            padding: 0.26rem 0.44rem;
          }

          .editor-panel {
            position: fixed;
            inset: 0;
            z-index: 12;
            border: none;
            border-radius: 0;
            box-shadow: none;
            background: #f3f5f8;
            display: none;
          }

          .editor-panel.is-mobile-editor-open {
            display: grid;
          }

          .editor-panel .panel-header {
            padding: 0.7rem 0.8rem;
            background: #ffffff;
            border-bottom: 1px solid #e2e8f0;
            position: sticky;
            top: 0;
            z-index: 2;
          }

          .editor-context {
            max-width: 160px;
          }

          .editor-panel .panel-subtext {
            display: none;
          }

          .editor-wrap {
            padding: 0.8rem;
          }

          .editor-close-btn {
            display: inline-flex;
          }
        }
      </style>

      <div class="app-shell">
        <open-collections-header id="managerHeader"></open-collections-header>

        <div class="content-grid">
          <open-collections-browser id="collectionBrowser"></open-collections-browser>
          <open-collections-metadata id="metadataEditor"></open-collections-metadata>
        </div>
      </div>
<dialog id="providerDialog" aria-label="Host manager">
        <div class="dialog-shell">
          <div class="dialog-header">
            <h2 class="dialog-title">Host manager</h2>
            <button class="btn" data-close="providerDialog" type="button">Close</button>
          </div>
          <div class="dialog-body">
            <div class="source-manager">
              <div>
                <p class="config-section-title">Connected hosts</p>
                <div id="sourceList" class="source-list"></div>
                <button class="btn storage-help-btn" id="openStorageOptionsBtn" type="button">Storage options</button>
              </div>
              <div class="provider-layout">
                <div>
                <p class="config-section-title">Add storage host</p>
                <div id="providerCatalog" class="provider-list"></div>
              </div>
              <div id="providerConfig" class="provider-config">
                <p id="providerConfigTitle" class="config-section-title">Host configuration</p>

                <div id="githubConfig" class="is-hidden">
                  <div class="field-row"><label for="githubToken">GitHub token (PAT)</label><input id="githubToken" type="password" /></div>
                  <div class="field-row"><label for="githubOwner">Repository owner</label><input id="githubOwner" type="text" /></div>
                  <div class="field-row"><label for="githubRepo">Repository name</label><input id="githubRepo" type="text" /></div>
                  <div class="field-row"><label for="githubBranch">Branch</label><input id="githubBranch" type="text" value="main" /></div>
                  <div class="field-row"><label for="githubPath">Folder path (optional)</label><input id="githubPath" type="text" placeholder="media/" /></div>
                </div>

                <div id="publicUrlConfig" class="is-hidden">
                  <div class="field-row"><label for="publicUrlInput">Manifest URL</label><input id="publicUrlInput" type="text" placeholder="https://example.org/collection.json" /></div>
                </div>

                <div id="gdriveConfig" class="is-hidden">
                  <div class="field-row">
                    <label for="gdriveSourceMode">Google Drive source mode</label>
                    <select id="gdriveSourceMode">
                      <option value="auth-manifest-file">Authenticated manifest file (Drive API)</option>
                      <option value="public-manifest-url">Public shared manifest URL</option>
                    </select>
                  </div>

                  <div id="gdriveAuthConfig">
                    <p class="panel-subtext">Connect your Google account to access Drive files.</p>
                    <p class="panel-subtext">Authenticated Google Drive sources are currently read-only.</p>
                    <div class="field-row"><label for="gdriveClientIdInput">Google OAuth Client ID</label><input id="gdriveClientIdInput" type="text" placeholder="YOUR_CLIENT_ID.apps.googleusercontent.com" /></div>
                    <div class="field-row"><label for="gdriveFileIdInput">Drive file ID (collection.json)</label><input id="gdriveFileIdInput" type="text" placeholder="1diFAVD17-_b7O22fYRLqB7dqWv0cgWNi" /></div>
                    <div class="dialog-actions">
                      <button class="btn" id="gdriveConnectAuthBtn" type="button">Connect Google Drive</button>
                    </div>
                    <div class="field-row"><label for="gdriveAccessTokenInput">Access token (session only, optional override)</label><input id="gdriveAccessTokenInput" type="password" placeholder="Automatically filled after Google auth" /></div>
                    <p id="gdriveAuthStatus" class="panel-subtext">Disconnected.</p>
                  </div>

                  <div id="gdrivePublicConfig" class="is-hidden">
                    <div class="field-row"><label for="gdriveUrlInput">Google Drive shared file URL</label><input id="gdriveUrlInput" type="text" placeholder="https://drive.google.com/file/d/FILE_ID/view" /></div>
                    <p class="panel-subtext">Paste a public Google Drive file link to a shared <code>collection.json</code> manifest.</p>
                    <p class="panel-subtext">The file must be shared as Anyone with the link -> Viewer.</p>
                  </div>
                </div>

                <div id="localConfig" class="is-hidden">
                  <div class="field-row"><label for="localPathInput">Collection path</label><input id="localPathInput" type="text" /></div>
                </div>

                <div id="placeholderConfig" class="is-hidden">
                  <div class="empty">This provider is planned and not yet available in this MVP.</div>
                </div>

                <div class="dialog-actions">
                  <button class="btn btn-primary" id="connectBtn" type="button">Add host</button>
                </div>
              </div>
            </div>
            </div>
            <p id="connectionStatus" class="panel-subtext">Not connected.</p>
            <pre id="capabilities">{}</pre>
          </div>
        </div>
      </dialog>

      <dialog id="sourcePickerDialog" aria-label="Select host">
        <div class="dialog-shell">
          <div class="dialog-header">
            <h2 class="dialog-title">Select host</h2>
            <button class="btn" data-close="sourcePickerDialog" type="button">Close</button>
          </div>
          <div id="sourcePickerList" class="dialog-body"></div>
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
              <button class="btn btn-primary" id="publishToSourceBtn" type="button">Upload to GitHub</button>
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
            <div class="empty">
              Collection registration will be added here.
              Collection Manager will later register published collections with the registry.
            </div>
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
              <button class="btn" id="openSourcePickerFromMenuBtn" type="button">Switch host</button>
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
                      <td>Google Drive</td>
                      <td>Collaboration and import source for existing files</td>
                      <td>Medium</td>
                      <td>Medium</td>
                      <td>Medium</td>
                      <td>Medium</td>
                      <td>Good source</td>
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
              <p class="panel-subtext">Google Drive, OneDrive, and Dropbox are useful source systems, but they are usually weaker as final public hosting for browser-first manifest delivery.</p>
              <p class="panel-subtext">Use them for collaboration/import, then publish to GitHub, Cloudflare, S3-compatible storage, or static hosting for stable public access.</p>
            </section>

            <section class="storage-section">
              <h3 class="storage-heading">Quick recommendations by scenario</h3>
              <ul class="storage-list">
                <li><strong>Small heritage organizations</strong> -> GitHub</li>
                <li><strong>Technical teams or institutions</strong> -> S3-compatible storage or Cloudflare R2</li>
                <li><strong>Files already in Google Drive or OneDrive</strong> -> import from drive, then publish to stronger public hosting</li>
                <li><strong>Archival public preservation</strong> -> Internet Archive or Wikimedia Commons where appropriate</li>
              </ul>
            </section>

            <p class="panel-subtext">
              Learn more: <a href="/docs/storage-options">/docs/storage-options</a> (placeholder; full guide TBD).
            </p>
          </div>
        </div>
      </dialog>

      <dialog id="assetViewerDialog" class="viewer-dialog" aria-label="Asset viewer">
        <div class="dialog-shell">
          <div class="dialog-header">
            <h2 id="viewerTitle" class="dialog-title">Asset viewer</h2>
            <button class="btn" id="closeViewerBtn" type="button">Close</button>
          </div>
          <div class="dialog-body viewer-layout">
            <div id="viewerMedia" class="viewer-media-wrap"></div>
            <div class="viewer-details">
              <p id="viewerDescription" class="viewer-text"></p>
              <div id="viewerBadges" class="badge-row"></div>
              <div class="dialog-actions">
                <a id="viewerOpenOriginal" class="btn" href="#" target="_blank" rel="noreferrer noopener">Open original</a>
              </div>
            </div>
          </div>
        </div>
      </dialog>
    `;
}

