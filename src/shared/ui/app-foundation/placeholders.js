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
        <open-collections-empty-state
          compact
          message="Placeholder only. This panel will be replaced by a mounted ${replacementLabel} sub-app."
        ></open-collections-empty-state>
      </section>
    </div>
  `;
}
