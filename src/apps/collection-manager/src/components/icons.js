export function renderChevronDownIcon(className = 'icon icon-chevron') {
  return `
    <svg class="${className}" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d="M4.25 6.25 8 10l3.75-3.75" />
    </svg>
  `;
}

export function renderTrashIcon(className = 'icon icon-trash') {
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
