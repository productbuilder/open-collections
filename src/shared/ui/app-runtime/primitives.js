export function renderRuntimeState({
	title,
	description = "",
	tone = "neutral",
} = {}) {
	return `
    <section class="oc-runtime-state" data-tone="${tone}">
      <h2 class="oc-runtime-state-title">${title || "Status"}</h2>
      <p class="oc-runtime-state-description">${description}</p>
    </section>
  `;
}

export function renderLoaderState({
	title = "Loading…",
	description = "Please wait while we load this section.",
} = {}) {
	return renderRuntimeState({ title, description, tone: "loading" });
}

export function renderEmptyState({
	title = "No content yet",
	description = "There is nothing to show in this section yet.",
} = {}) {
	return renderRuntimeState({ title, description, tone: "neutral" });
}

export function renderErrorState({
	title = "Something went wrong",
	description = "Please retry or switch to standalone mode for diagnostics.",
} = {}) {
	return renderRuntimeState({ title, description, tone: "error" });
}

export function renderSuccessState({
	title = "Done",
	description = "Your changes were applied successfully.",
} = {}) {
	return renderRuntimeState({ title, description, tone: "success" });
}

export function createToastLayer(target = document.body) {
	const host = document.createElement("div");
	host.className = "oc-toast-layer";
	target.append(host);

	return {
		show(message, { tone = "neutral", timeout = 2600 } = {}) {
			const item = document.createElement("div");
			item.className = "oc-toast";
			item.dataset.tone = tone;
			item.textContent = String(message || "");
			host.append(item);

			if (timeout > 0) {
				window.setTimeout(() => item.remove(), timeout);
			}
		},
		destroy() {
			host.remove();
		},
	};
}
