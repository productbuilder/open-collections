const PRESENTER_PLACEHOLDER_SECTIONS = [
	{
		title: "Presentation mode",
		description:
			"Future full-screen and guided presentation scenes for audience-facing playback.",
	},
	// {
	// 	title: "Display mode",
	// 	description:
	// 		"Future kiosk and looping display experiences for unattended environments.",
	// },
	// {
	// 	title: "Curated collection presentation",
	// 	description:
	// 		"Future curated narratives built from selected items, groups, and thematic ordering.",
	// },
	// {
	// 	title: "Screen and device settings",
	// 	description:
	// 		"Future viewport, orientation, and device-tuning controls for reliable playback.",
	// },
	// {
	// 	title: "Public exhibit and storytelling flows",
	// 	description:
	// 		"Future publish-ready exhibit flows for public links, stories, and guided tours.",
	// },
];

export function renderPresenterHomeView() {
	const sectionsMarkup = PRESENTER_PLACEHOLDER_SECTIONS.map(
		(section) => `
    <open-collections-empty-state-panel
      class="oc-surface presenter-placeholder-card"
      aria-label="${section.title} placeholder"
      heading-level="2"
      compact
      title="${section.title}"
      description="${section.description}"
      message="Scaffold only. Presenter modules will replace this card in a later step."
    ></open-collections-empty-state-panel>
  `,
	).join("");

	return `
    <main class="oc-app-viewport" aria-labelledby="presenterTitle">
      <section class="oc-page oc-page-intro" aria-labelledby="presenterTitle">
        <open-collections-section-header
          id="presenterTitle"
          heading-level="1"
          title="Collection Presenter"
          description="Collection Presenter is the future presentation surface for turning curated collections into audience-ready experiences inside the shared app shell."
        ></open-collections-section-header>
      </section>

      <section class="oc-page presenter-placeholder-grid" aria-label="Presenter capability scaffolds">
        ${sectionsMarkup}
      </section>
    </main>
  `;
}
