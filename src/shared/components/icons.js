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
