export function renderFoundationPlaceholder({
	title,
	description,
	replacementLabel,
}) {
	return `
    <div class="oc-page">
      <section class="oc-surface oc-placeholder" aria-label="${title} section placeholder">
        <h2 class="oc-placeholder-title">${title}</h2>
        <p class="oc-muted">${description}</p>
        <p class="oc-empty-state">
          Placeholder only. This panel will be replaced by a mounted ${replacementLabel} sub-app.
        </p>
      </section>
    </div>
  `;
}
