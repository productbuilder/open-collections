function renderPlaceholderPanel({ title, description, replacementLabel }) {
  return `
    <section class="shell-panel" aria-label="${title} section placeholder">
      <h2>${title}</h2>
      <p>${description}</p>
      <p class="shell-panel-note">
        Placeholder only. This panel will be replaced by a mounted ${replacementLabel} sub-app.
      </p>
    </section>
  `;
}

// Mount seam: each function is an explicit replacement point for a future sub-app embed.
export function renderBrowseView() {
  return renderPlaceholderPanel({
    title: 'Browse',
    description: 'Read and browse collections from connected manifest sources.',
    replacementLabel: 'collection-browser',
  });
}

export function renderCollectView() {
  return renderPlaceholderPanel({
    title: 'Collect',
    description: 'Create, edit, and publish collections and assets.',
    replacementLabel: 'collection-manager',
  });
}

export function renderPresentView() {
  return renderPlaceholderPanel({
    title: 'Present',
    description: 'Present curated views and experiences built from collections.',
    replacementLabel: 'collection-presenter',
  });
}

export function renderAccountView() {
  return renderPlaceholderPanel({
    title: 'Account',
    description: 'Manage profile, workspace settings, and account-level preferences.',
    replacementLabel: 'account',
  });
}

export const SHELL_VIEW_RENDERERS = {
  browse: renderBrowseView,
  collect: renderCollectView,
  present: renderPresentView,
  account: renderAccountView,
};
