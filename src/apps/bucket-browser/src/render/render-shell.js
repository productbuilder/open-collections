import { appShellStyles } from "../css/app-shell.css.js";

export function renderShell(shadowRoot) {
	shadowRoot.innerHTML = `
    <style>${appShellStyles}</style>
    <div class="app-shell">
      <pb-workspace-toolbar id="workspaceToolbar"></pb-workspace-toolbar>
      <pb-bulk-action-bar id="bulkActionBar"></pb-bulk-action-bar>
      <pb-workspace-layout id="workspaceLayout" mobile-tree-open="false" mobile-details-open="false">
        <pb-workspace-tree id="workspaceTree" slot="tree"></pb-workspace-tree>
        <pb-workspace-browser-viewport id="workspaceViewport" slot="main"></pb-workspace-browser-viewport>
        <pb-bucket-details-panel id="detailsPanel" slot="details"></pb-bucket-details-panel>
      </pb-workspace-layout>
      <pb-workspace-status-bar id="statusBar"></pb-workspace-status-bar>
      <pb-bucket-preview-viewer id="previewViewer"></pb-bucket-preview-viewer>
    </div>
  `;
}
