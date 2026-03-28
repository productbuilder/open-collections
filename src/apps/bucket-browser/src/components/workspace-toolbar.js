import { toolbarStyles } from "../css/toolbar.css.js";

class PbWorkspaceToolbarElement extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.model = {
			workspaces: [],
			activeWorkspaceId: "",
			activePath: "/",
			currentViewMode: "grid",
			searchQuery: "",
			filters: { availability: "all", kind: "all" },
		};
	}

	connectedCallback() {
		this.render();
		this.bindEvents();
	}

	update(model = {}) {
		this.model = {
			...this.model,
			...model,
			filters: { ...this.model.filters, ...(model.filters || {}) },
		};
		if (this.isConnected) {
			this.render();
			this.bindEvents();
		}
	}

	bindEvents() {
		this.shadowRoot
			.getElementById("workspaceSelect")
			?.addEventListener("change", (event) => {
				this.dispatch("workspace-change", {
					workspaceId: event.target.value,
				});
			});
		this.shadowRoot
			.getElementById("viewModeSelect")
			?.addEventListener("change", (event) => {
				this.dispatch("view-mode-change", { mode: event.target.value });
			});
		this.shadowRoot
			.getElementById("searchInput")
			?.addEventListener("input", (event) => {
				this.dispatch("search-change", { query: event.target.value });
			});
		this.shadowRoot
			.getElementById("availabilityFilter")
			?.addEventListener("change", (event) => {
				this.dispatch("filters-change", {
					availability: event.target.value,
				});
			});
		this.shadowRoot
			.getElementById("kindFilter")
			?.addEventListener("change", (event) => {
				this.dispatch("filters-change", { kind: event.target.value });
			});
		this.shadowRoot
			.getElementById("toggleTreeBtn")
			?.addEventListener("click", () => {
				this.dispatch("toggle-mobile-tree");
			});
		this.shadowRoot
			.getElementById("toggleDetailsBtn")
			?.addEventListener("click", () => {
				this.dispatch("toggle-mobile-details");
			});
	}

	dispatch(name, detail = {}) {
		this.dispatchEvent(
			new CustomEvent(name, { detail, bubbles: true, composed: true }),
		);
	}

	render() {
		const workspaceOptions = this.model.workspaces
			.map(
				(workspace) => `
      <option value="${workspace.id}" ${workspace.id === this.model.activeWorkspaceId ? "selected" : ""}>${workspace.name}</option>
    `,
			)
			.join("");

		this.shadowRoot.innerHTML = `
      <style>${toolbarStyles}</style>
      <header class="toolbar">
        <div class="toolbar-group toolbar-brand">
          <button id="toggleTreeBtn" class="btn btn-ghost" type="button">Folders</button>
          <div>
            <h1>Shared Bucket Browser</h1>
            <p>${this.model.activePath || "/"} · reusable workspace shell</p>
          </div>
        </div>
        <div class="toolbar-group toolbar-controls">
          <label>
            <span>Workspace</span>
            <select id="workspaceSelect">${workspaceOptions}</select>
          </label>
          <label>
            <span>Search</span>
            <input id="searchInput" type="search" value="${this.model.searchQuery}" placeholder="Filter visible assets" />
          </label>
          <label>
            <span>Availability</span>
            <select id="availabilityFilter">
              <option value="all" ${this.model.filters.availability === "all" ? "selected" : ""}>All states</option>
              <option value="local only" ${this.model.filters.availability === "local only" ? "selected" : ""}>Local only</option>
              <option value="remote only" ${this.model.filters.availability === "remote only" ? "selected" : ""}>Remote only</option>
              <option value="local + remote" ${this.model.filters.availability === "local + remote" ? "selected" : ""}>Local + remote</option>
            </select>
          </label>
          <label>
            <span>Type</span>
            <select id="kindFilter">
              <option value="all" ${this.model.filters.kind === "all" ? "selected" : ""}>All types</option>
              <option value="image" ${this.model.filters.kind === "image" ? "selected" : ""}>Images</option>
              <option value="document" ${this.model.filters.kind === "document" ? "selected" : ""}>Documents</option>
              <option value="video" ${this.model.filters.kind === "video" ? "selected" : ""}>Video</option>
            </select>
          </label>
          <label>
            <span>View</span>
            <select id="viewModeSelect">
              <option value="grid" ${this.model.currentViewMode === "grid" ? "selected" : ""}>Grid</option>
              <option value="list" ${this.model.currentViewMode === "list" ? "selected" : ""}>List</option>
            </select>
          </label>
          <button id="toggleDetailsBtn" class="btn" type="button">Details</button>
        </div>
      </header>
    `;
	}
}

if (!customElements.get("pb-workspace-toolbar")) {
	customElements.define("pb-workspace-toolbar", PbWorkspaceToolbarElement);
}
