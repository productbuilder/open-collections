import { appFoundationLayoutStyles } from '../../../shared/ui/app-foundation/layout.css.js';
import { renderFoundationPlaceholder } from '../../../shared/ui/app-foundation/placeholders.js';

const presenterStyles = `
  ${appFoundationLayoutStyles}

  :host {
    display: block;
    min-height: 100vh;
  }

  .presenter-title {
    margin: 0;
    font-size: clamp(1.35rem, 2.8vw, 1.9rem);
  }
`;

class OpenCollectionPresenterElement extends HTMLElement {
  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
    this.render();
  }

  render() {
    this.shadow.innerHTML = `
      <style>${presenterStyles}</style>
      <main class="oc-app-viewport">
        <section class="oc-page oc-page-intro" aria-labelledby="presenterTitle">
          <h1 class="presenter-title" id="presenterTitle">Collection Presenter</h1>
          <p class="oc-muted">Build audience-ready collection experiences from published manifests and curated item sets.</p>
        </section>
        ${renderFoundationPlaceholder({
          title: 'Presenter canvas',
          description: 'Presentation layouts, themes, and storytelling blocks will be mounted here.',
          replacementLabel: 'collection-presenter view modules',
        })}
      </main>
    `;
  }
}

if (!customElements.get('open-collection-presenter')) {
  customElements.define('open-collection-presenter', OpenCollectionPresenterElement);
}

export { OpenCollectionPresenterElement };
