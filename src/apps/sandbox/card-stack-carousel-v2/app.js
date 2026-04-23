const CARDS = [
  { title: 'North Ridge', subtitle: 'Cloudline paths and alpine cabins' },
  { title: 'Harbor Lane', subtitle: 'Evening markets and lantern piers' },
  { title: 'Stone Quarter', subtitle: 'Historic arches and river walks' },
  { title: 'Juniper Field', subtitle: 'Quiet valley camp and stargazing decks' },
  { title: 'Cobalt Coast', subtitle: 'Cliff trails and open sea viewpoints' },
  { title: 'Amber Dunes', subtitle: 'Wind-swept ridges and sunset lookouts' },
  { title: 'Orchid Terrace', subtitle: 'Garden lanes and elevated bridges' }
];

class CardStackCarouselV2Sandbox extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    this.position = 0;
    this.velocity = 0;
    this.dragging = false;
    this.lastY = 0;
    this.pointerId = null;

    this.cardElements = [];
    this.rafId = null;

    this.update = this.update.bind(this);
    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);
  }

  connectedCallback() {
    this.render();
    this.cacheElements();
    this.createCards();

    this.stage.addEventListener('pointerdown', this.onPointerDown, { passive: false });
    this.stage.addEventListener('pointermove', this.onPointerMove, { passive: false });
    this.stage.addEventListener('pointerup', this.onPointerUp);
    this.stage.addEventListener('pointercancel', this.onPointerUp);
    this.stage.addEventListener('lostpointercapture', this.onPointerUp);

    this.renderCards();
    this.rafId = requestAnimationFrame(this.update);
  }

  disconnectedCallback() {
    this.stage?.removeEventListener('pointerdown', this.onPointerDown);
    this.stage?.removeEventListener('pointermove', this.onPointerMove);
    this.stage?.removeEventListener('pointerup', this.onPointerUp);
    this.stage?.removeEventListener('pointercancel', this.onPointerUp);
    this.stage?.removeEventListener('lostpointercapture', this.onPointerUp);

    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  cacheElements() {
    this.stage = this.shadowRoot.querySelector('[data-role="stage"]');
    this.stack = this.shadowRoot.querySelector('[data-role="stack"]');
  }

  createCards() {
    const fragment = document.createDocumentFragment();

    this.cardElements = CARDS.map((card, index) => {
      const node = document.createElement('article');
      node.className = 'card';
      node.innerHTML = `
        <p class="eyebrow">Card ${index + 1}</p>
        <h2>${card.title}</h2>
        <p class="subtitle">${card.subtitle}</p>
      `;
      fragment.appendChild(node);
      return node;
    });

    this.stack.appendChild(fragment);
  }

  onPointerDown(event) {
    if (event.button !== 0 || this.dragging) {
      return;
    }

    this.dragging = true;
    this.pointerId = event.pointerId;
    this.lastY = event.clientY;
    this.velocity = 0;

    this.stage.setPointerCapture(event.pointerId);
    event.preventDefault();
  }

  onPointerMove(event) {
    if (!this.dragging || event.pointerId !== this.pointerId) {
      return;
    }

    const deltaY = event.clientY - this.lastY;
    this.position -= deltaY * 0.01;
    this.velocity = -deltaY * 0.01;
    this.lastY = event.clientY;

    event.preventDefault();
  }

  onPointerUp(event) {
    if (!this.dragging || event.pointerId !== this.pointerId) {
      return;
    }

    this.dragging = false;

    if (this.stage.hasPointerCapture(event.pointerId)) {
      this.stage.releasePointerCapture(event.pointerId);
    }

    this.pointerId = null;
  }

  update() {
    if (!this.dragging) {
      this.velocity *= 0.95;
      this.position += this.velocity;
    }

    this.renderCards();
    this.rafId = requestAnimationFrame(this.update);
  }

  renderCards() {
    this.cardElements.forEach((card, index) => {
      const relative = index - this.position;
      const distance = Math.abs(relative);
      const y = relative * 120;
      const scale = Math.max(0, 1 - distance * 0.05);
      const opacity = Math.max(0, 1 - distance * 0.2);
      const zIndex = Math.round(100 - distance * 10);

      card.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0) scale(${scale.toFixed(3)})`;
      card.style.opacity = opacity.toFixed(3);
      card.style.zIndex = String(zIndex);
    });
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          height: 100dvh;
          min-height: 100dvh;
          color: #20242b;
        }

        * {
          box-sizing: border-box;
        }

        .root {
          position: fixed;
          inset: 0;
          overflow: hidden;
          background: #eceff3;
        }

        .stage {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          touch-action: none;
          user-select: none;
        }

        .stack {
          position: relative;
          width: min(88vw, 25rem);
          height: min(68vh, 31rem);
        }

        .card {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 0.7rem;
          border-radius: 1rem;
          border: 1px solid #353c46;
          background: #ffffff;
          padding: 1.3rem;
          box-shadow:
            0 18px 34px rgba(16, 24, 37, 0.12),
            0 3px 10px rgba(16, 24, 37, 0.08);
          will-change: transform, opacity;
          transform-origin: center center;
          transition: none;
          pointer-events: none;
        }

        .eyebrow {
          margin: 0;
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #4a5563;
        }

        h2 {
          margin: 0;
          font-size: 1.5rem;
          line-height: 1.25;
          color: #111827;
        }

        .subtitle {
          margin: 0;
          font-size: 0.98rem;
          color: #334155;
          line-height: 1.45;
        }
      </style>

      <main class="root">
        <section class="stage" data-role="stage" aria-label="Physics-based vertical card carousel">
          <div class="stack" data-role="stack"></div>
        </section>
      </main>
    `;
  }
}

customElements.define('card-stack-carousel-v2-sandbox', CardStackCarouselV2Sandbox);
