export function renderChevronDownIcon(className = "icon icon-chevron") {
	return `
    <svg class="${className}" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d="M4.25 6.25 8 10l3.75-3.75" />
    </svg>
  `;
}

export function renderMoreVertIcon(className = "icon icon-more-vert") {
	return `
    <svg class="${className}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="5" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="12" cy="19" r="1.8" />
    </svg>
  `;
}

export function renderTrashIcon(className = "icon icon-trash") {
	return `
    <svg class="${className}" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d="M3.5 4.75h9" />
      <path d="M6.25 2.75h3.5" />
      <path d="M5 4.75v7a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-7" />
      <path d="M6.75 6.5v4" />
      <path d="M9.25 6.5v4" />
    </svg>
  `;
}

export function renderCloseIcon(className = "icon icon-close") {
	return `
    <svg class="${className}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M18.3 5.71 12 12l6.3 6.29-1.41 1.41L10.59 13.41 4.29 19.7 2.88 18.29 9.17 12 2.88 5.71 4.29 4.3l6.3 6.29 6.29-6.29z" />
    </svg>
  `;
}

export function renderInfoIcon(className = "icon icon-info") {
	return `
    <svg class="${className}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 10v6" />
      <circle cx="12" cy="7" r="1" />
    </svg>
  `;
}


export function renderLinkIcon(className = "icon icon-link") {
	return `
    <svg class="${className}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M10.59 13.41a1 1 0 0 0 1.41 1.41l4.24-4.24a3 3 0 1 0-4.24-4.24L9.88 8.46a1 1 0 1 0 1.41 1.41l2.12-2.12a1 1 0 1 1 1.41 1.41L10.59 13.41z" />
      <path d="M13.41 10.59a1 1 0 1 0-1.41-1.41l-4.24 4.24a3 3 0 0 0 4.24 4.24l2.12-2.12a1 1 0 0 0-1.41-1.41l-2.12 2.12a1 1 0 1 1-1.41-1.41l4.24-4.24z" />
    </svg>
  `;
}


export function renderFolderIcon(className = "icon icon-folder") {
	return `
    <svg class="${className}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M10 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-8l-2-2z" />
    </svg>
  `;
}

export function renderProfileIcon(className = "icon icon-profile") {
	return `
    <svg class="${className}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="8" r="3.25" />
      <path d="M5.5 18.5a6.5 6.5 0 0 1 13 0" />
    </svg>
  `;
}

export function renderGridViewIcon(className = "icon icon-grid-view") {
	return `
    <svg class="${className}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect x="4" y="4" width="6" height="6" rx="0.8" />
      <rect x="14" y="4" width="6" height="6" rx="0.8" />
      <rect x="4" y="14" width="6" height="6" rx="0.8" />
      <rect x="14" y="14" width="6" height="6" rx="0.8" />
    </svg>
  `;
}

export function renderViewListIcon(className = "icon icon-view-list") {
	return `
    <svg class="${className}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M8 6h12" />
      <path d="M8 12h12" />
      <path d="M8 18h12" />
      <circle cx="5" cy="6" r="1" />
      <circle cx="5" cy="12" r="1" />
      <circle cx="5" cy="18" r="1" />
    </svg>
  `;
}

export function renderDeselectIcon(className = "icon icon-deselect") {
	return `
    <svg class="${className}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M8.5 12.5 11 15l5-6" />
      <path d="M6 6l12 12" />
    </svg>
  `;
}
