const CARDS = [
  { title: 'Glacier Steps', subtitle: 'Tiered ridgelines with frozen light and long shadows' },
  { title: 'Tide Archive', subtitle: 'Quiet docks, printed maps, and low evening haze' },
  { title: 'Sable Atrium', subtitle: 'Curved glass walkways and suspended gardens' },
  { title: 'Juniper Vault', subtitle: 'Stone halls opening into soft mountain fields' },
  { title: 'Copper Causeway', subtitle: 'Winding bridge spans over reflective water lanes' },
  { title: 'Lumen Terrace', subtitle: 'Vertical courtyards and warm lantern gradients' },
  { title: 'Summit Ledger', subtitle: 'Top-level observatory decks above layered clouds' }
];

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

class CardStackCarouselV3Sandbox extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    this.progress = 0;
    this.targetProgress = 0;

    this.dragging = false;
    this.pointerId = null;
    this.lastPointerY = 0;

    this.cardElements = [];
    this.rafId = null;

    this.update = this.update.bind(this);
    this.onWheel = this.onWheel.bind(this);
    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);
  }

  connectedCallback() {
    this.render();
    this.cacheElements();
    this.createCards();

    this.stage.addEventListener('wheel', this.onWheel, { passive: false });
    this.stage.addEventListener('pointerdown', this.onPointerDown, { passive: false });
    this.stage.addEventListener('pointermove', this.onPointerMove, { passive: false });
    this.stage.addEventListener('pointerup', this.onPointerUp);
    this.stage.addEventListener('pointercancel', this.onPointerUp);
    this.stage.addEventListener('lostpointercapture', this.onPointerUp);

    this.renderCards();
    this.rafId = requestAnimationFrame(this.update);
  }

  disconnectedCallback() {
    this.stage?.removeEventListener('wheel', this.onWheel);
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

  onWheel(event) {
    this.targetProgress -= event.deltaY * 0.001;
    this.targetProgress = clamp(this.targetProgress, 0, 1);
    event.preventDefault();
  }

  onPointerDown(event) {
    if (event.button !== 0 || this.dragging) {
      return;
    }

    this.dragging = true;
    this.pointerId = event.pointerId;
    this.lastPointerY = event.clientY;

    this.stage.setPointerCapture(event.pointerId);
    event.preventDefault();
  }

  onPointerMove(event) {
    if (!this.dragging || event.pointerId !== this.pointerId) {
      return;
    }

    const deltaY = event.clientY - this.lastPointerY;
    this.targetProgress -= deltaY * 0.0018;
    this.targetProgress = clamp(this.targetProgress, 0, 1);
    this.lastPointerY = event.clientY;

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
    this.progress += (this.targetProgress - this.progress) * 0.16;

    if (Math.abs(this.targetProgress - this.progress) < 0.0001) {
      this.progress = this.targetProgress;
    }

    this.renderCards();
    this.rafId = requestAnimationFrame(this.update);
  }

  renderCards() {
    const totalCards = this.cardElements.length;

    this.cardElements.forEach((card, index) => {
      const cardProgress = this.progress * totalCards - index;

      let y = 0;
      let scale = 1;
      let rotateX = 0;
      let opacity = 1;
      let depth = 0;

      if (cardProgress < 0) {
        const below = Math.abs(cardProgress);
        y = below * 130;
        scale = clamp(1 - below * 0.06, 0.74, 1);
        rotateX = clamp(6 - below * 0.7, 1.5, 6);
        opacity = clamp(1 - below * 0.24, 0.2, 1);
        depth = -below * 18;
      } else if (cardProgress < 1) {
        const enter = cardProgress;
        y = -enter * 22;
        scale = 1 - enter * 0.02;
        rotateX = (1 - enter) * 1.8;
        opacity = 1;
        depth = enter * 12;
      } else if (cardProgress < 3) {
        const stackIndex = cardProgress - 1;
        y = -24 - stackIndex * 42;
        scale = 1 - stackIndex * 0.09;
        rotateX = 2.3 + stackIndex * 1.35;
        opacity = 1 - stackIndex * 0.32;
        depth = 12 - stackIndex * 24;
      } else {
        const exit = cardProgress - 3;
        y = -108 - exit * 120;
        scale = 0.82 - exit * 0.05;
        rotateX = 5;
        opacity = clamp(0.35 - exit * 0.45, 0, 1);
        depth = -34 - exit * 8;
      }

      const zIndex = String(Math.round(1000 - Math.abs(cardProgress - 0.6) * 120));

      card.style.transform = `translate3d(0, ${y.toFixed(2)}px, ${depth.toFixed(2)}px) scale(${scale.toFixed(3)}) rotateX(${rotateX.toFixed(2)}deg)`;
      card.style.opacity = opacity.toFixed(3);
      card.style.zIndex = zIndex;
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
          background:
            radial-gradient(circle at 50% 15%, #f5f7fa 0%, #e9edf2 52%, #dde3ea 100%);
        }

        .stage {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: start center;
          padding-top: 10dvh;
          touch-action: none;
          user-select: none;
          perspective: 900px;
          perspective-origin: 50% 10%;
        }

        .stack {
          position: relative;
          width: min(88vw, 26rem);
          height: min(70vh, 33rem);
          transform-style: preserve-3d;
        }

        .card {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 0.7rem;
          border-radius: 1rem;
          border: 1px solid #313944;
          background: rgba(255, 255, 255, 0.98);
          padding: 1.3rem;
          box-shadow:
            0 20px 35px rgba(15, 23, 35, 0.14),
            0 4px 12px rgba(15, 23, 35, 0.09);
          will-change: transform, opacity;
          transform-origin: center top;
          backface-visibility: hidden;
          pointer-events: none;
        }

        .eyebrow {
          margin: 0;
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.09em;
          color: #4a5563;
        }

        h2 {
          margin: 0;
          font-size: 1.54rem;
          line-height: 1.23;
          color: #0f172a;
        }

        .subtitle {
          margin: 0;
          font-size: 0.98rem;
          color: #334155;
          line-height: 1.45;
          max-width: 30ch;
        }
      </style>

      <main class="root">
        <section class="stage" data-role="stage" aria-label="Timeline-driven stacked card carousel">
          <div class="stack" data-role="stack"></div>
        </section>
      </main>
    `;
  }
}

customElements.define('card-stack-carousel-v3-sandbox', CardStackCarouselV3Sandbox);
