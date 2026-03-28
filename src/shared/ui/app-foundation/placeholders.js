export function renderFoundationPlaceholder({
	title,
	description,
	replacementLabel,
}) {
	return `
    <div class="oc-page">
      <open-collections-empty-state-panel
        class="oc-surface oc-placeholder"
        title="${title}"
        description="${description}"
        heading-level="2"
        compact
        message="Placeholder only. This panel will be replaced by a mounted ${replacementLabel} sub-app."
      ></open-collections-empty-state-panel>
    </div>
  `;
}
