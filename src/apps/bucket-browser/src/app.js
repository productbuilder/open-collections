import './components/workspace-layout.js';
import './components/workspace-toolbar.js';
import './components/workspace-tree.js';
import './components/workspace-browser-viewport.js';
import './components/bucket-card-grid.js';
import './components/bucket-row-list.js';
import './components/bucket-details-panel.js';
import './components/bucket-preview-viewer.js';
import './components/bulk-action-bar.js';
import './components/workspace-status-bar.js';
import { renderShell } from './render/render-shell.js';
import { createInitialState } from './state/initial-state.js';
import { createWorkspaceService } from './services/workspace-service.js';
import {
  buildViewModel,
  createExpandedPaths,
  ensureExpandedPath,
  ensureFocusState,
  resolveActiveWorkspace,
  toggleSelection,
} from './controllers/browser-controller.js';

class PbWorkspaceBrowserElement extends HTMLElement {
  constructor() {
    super();
    this.state = createInitialState();
    this.service = createWorkspaceService();
    this.attachShadow({ mode: 'open' });
    renderShell(this.shadowRoot);
    this.cacheDom();
  }

  connectedCallback() {
    this.bindEvents();
    this.bootstrap().catch((error) => {
      this.setStatus(`Failed to load workspace scaffold: ${error.message}`, 'warn');
      this.renderApp();
    });
  }

  cacheDom() {
    this.dom = {
      toolbar: this.shadowRoot.getElementById('workspaceToolbar'),
      tree: this.shadowRoot.getElementById('workspaceTree'),
      viewport: this.shadowRoot.getElementById('workspaceViewport'),
      details: this.shadowRoot.getElementById('detailsPanel'),
      preview: this.shadowRoot.getElementById('previewViewer'),
      bulkActionBar: this.shadowRoot.getElementById('bulkActionBar'),
      statusBar: this.shadowRoot.getElementById('statusBar'),
      layout: this.shadowRoot.getElementById('workspaceLayout'),
    };
  }

  bindEvents() {
    this.shadowRoot.addEventListener('workspace-change', (event) => {
      this.loadWorkspace(event.detail.workspaceId);
    });
    this.shadowRoot.addEventListener('path-change', (event) => {
      this.state.activePath = event.detail.path;
      this.state.expandedPaths = Array.from(new Set([
        ...this.state.expandedPaths,
        ...ensureExpandedPath(this.state.expandedPaths, this.state.treeNodes, event.detail.path),
      ]));
      this.state.mobileTreeOpen = false;
      this.ensureFocusedVisibleAsset();
      this.setStatus(`Browsing ${this.state.activePath}`, 'neutral');
      this.renderApp();
    });
    this.shadowRoot.addEventListener('tree-toggle', (event) => {
      const path = event.detail.path;
      const expanded = new Set(this.state.expandedPaths);
      if (expanded.has(path)) {
        expanded.delete(path);
      } else {
        ensureExpandedPath(this.state.expandedPaths, this.state.treeNodes, path).forEach((ancestorPath) => {
          expanded.add(ancestorPath);
        });
      }
      this.state.expandedPaths = [...expanded];
      this.renderApp();
    });
    this.shadowRoot.addEventListener('view-mode-change', (event) => {
      this.state.currentViewMode = event.detail.mode === 'list' ? 'list' : 'grid';
      this.renderApp();
    });
    this.shadowRoot.addEventListener('search-change', (event) => {
      this.state.searchQuery = event.detail.query || '';
      this.ensureFocusedVisibleAsset();
      this.renderApp();
    });
    this.shadowRoot.addEventListener('filters-change', (event) => {
      this.state.filters = { ...this.state.filters, ...event.detail };
      this.ensureFocusedVisibleAsset();
      this.renderApp();
    });
    this.shadowRoot.addEventListener('asset-focus', (event) => {
      this.state.focusedAssetId = event.detail.assetId;
      this.state.mobileDetailsOpen = true;
      this.renderApp();
    });
    this.shadowRoot.addEventListener('asset-selection-toggle', (event) => {
      this.state.selectedAssetIds = toggleSelection(this.state.selectedAssetIds, event.detail.assetId);
      this.renderApp();
    });
    this.shadowRoot.addEventListener('selection-clear', () => {
      this.state.selectedAssetIds = [];
      this.setStatus('Selection cleared.', 'neutral');
      this.renderApp();
    });
    this.shadowRoot.addEventListener('asset-preview', (event) => {
      this.state.previewAssetId = event.detail.assetId;
      this.state.mobileDetailsOpen = true;
      this.renderApp();
    });
    this.shadowRoot.addEventListener('preview-close', () => {
      this.state.previewAssetId = null;
      this.renderApp();
    });
    this.shadowRoot.addEventListener('toggle-mobile-tree', () => {
      this.state.mobileTreeOpen = !this.state.mobileTreeOpen;
      this.renderApp();
    });
    this.shadowRoot.addEventListener('toggle-mobile-details', () => {
      this.state.mobileDetailsOpen = !this.state.mobileDetailsOpen;
      this.renderApp();
    });
    this.shadowRoot.addEventListener('bulk-action', async (event) => {
      const result = await this.service.performBulkAction(event.detail.actionId, this.state.selectedAssetIds);
      this.setStatus(result.message, 'ok');
      this.renderApp();
    });
  }

  async bootstrap() {
    this.state.workspaces = await this.service.listWorkspaces();
    const firstWorkspaceId = this.state.workspaces[0]?.id || null;
    if (firstWorkspaceId) {
      await this.loadWorkspace(firstWorkspaceId);
      return;
    }
    this.setStatus('No workspaces available.', 'warn');
    this.renderApp();
  }

  async loadWorkspace(workspaceId) {
    if (!workspaceId) {
      return;
    }
    const { workspace, treeNodes, assets } = await this.service.loadWorkspace(workspaceId);
    this.state.activeWorkspaceId = workspace?.id || null;
    this.state.treeNodes = treeNodes;
    this.state.assets = assets;
    this.state.activePath = treeNodes.find((node) => node.path === '/')?.path || treeNodes[0]?.path || '/';
    this.state.expandedPaths = createExpandedPaths(treeNodes, this.state.activePath);
    this.state.selectedAssetIds = [];
    this.state.focusedAssetId = assets[0]?.id || null;
    this.state.previewAssetId = null;
    this.state.mobileTreeOpen = false;
    this.state.mobileDetailsOpen = false;
    ensureFocusState(this.state);
    this.ensureFocusedVisibleAsset();
    this.setStatus(`Loaded ${workspace?.name || 'workspace'} scaffold from workspace service.`, 'ok');
    this.renderApp();
  }

  ensureFocusedVisibleAsset() {
    const viewModel = buildViewModel(this.state);
    const visibleIds = new Set(viewModel.visibleAssets.map((asset) => asset.id));
    if (!visibleIds.has(this.state.focusedAssetId)) {
      this.state.focusedAssetId = viewModel.visibleAssets[0]?.id || null;
    }
    if (this.state.previewAssetId && !visibleIds.has(this.state.previewAssetId)) {
      this.state.previewAssetId = null;
    }
    this.state.selectedAssetIds = this.state.selectedAssetIds.filter((assetId) => visibleIds.has(assetId));
  }

  setStatus(text, tone = 'neutral') {
    this.state.status = { text, tone };
  }

  renderApp() {
    const viewModel = buildViewModel(this.state);
    const activeWorkspace = resolveActiveWorkspace(this.state);
    this.dom.toolbar.update({
      workspaces: this.state.workspaces,
      activeWorkspaceId: this.state.activeWorkspaceId,
      activePath: this.state.activePath,
      currentViewMode: this.state.currentViewMode,
      searchQuery: this.state.searchQuery,
      filters: this.state.filters,
    });
    this.dom.tree.update({
      treeNodes: this.state.treeNodes,
      activePath: this.state.activePath,
      expandedPaths: this.state.expandedPaths,
    });
    this.dom.viewport.update({
      assets: viewModel.visibleAssets,
      focusedAssetId: this.state.focusedAssetId,
      selectedAssetIds: this.state.selectedAssetIds,
      currentViewMode: this.state.currentViewMode,
      activePath: this.state.activePath,
    });
    this.dom.details.update({
      asset: viewModel.focusedAsset,
      selectionCount: viewModel.selectionCount,
      mobileOpen: this.state.mobileDetailsOpen,
    });
    this.dom.preview.update({ asset: viewModel.previewAsset });
    this.dom.bulkActionBar.update({ selectedCount: viewModel.selectionCount });
    this.dom.statusBar.update({
      status: this.state.status,
      activeWorkspaceName: activeWorkspace?.name || 'No workspace',
      activePath: this.state.activePath,
      selectionCount: viewModel.selectionCount,
    });
    this.dom.layout.setAttribute('mobile-tree-open', this.state.mobileTreeOpen ? 'true' : 'false');
    this.dom.layout.setAttribute('mobile-details-open', this.state.mobileDetailsOpen ? 'true' : 'false');
  }
}

if (!customElements.get('pb-workspace-browser')) {
  customElements.define('pb-workspace-browser', PbWorkspaceBrowserElement);
}
