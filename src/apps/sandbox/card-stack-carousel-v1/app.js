const CARD_DATA = [
  {
    title: 'Misty Ridge Reserve',
    category: 'Mountain Retreat',
    description: 'High-altitude cabins with sunrise viewpoints and cedar trails.',
    image: 'linear-gradient(135deg, #bcd0ee 0%, #9ab3da 42%, #728fbe 100%)'
  },
  {
    title: 'Harbor Twilight Market',
    category: 'Night District',
    description: 'Lantern-lit piers, local food stalls, and live acoustic corners.',
    image: 'linear-gradient(135deg, #bdd5ee 0%, #95b9de 45%, #7097c2 100%)'
  },
  {
    title: 'Golden Steppe Route',
    category: 'Open Plains',
    description: 'Long grass fields with seasonal blooms and distant watch towers.',
    image: 'linear-gradient(135deg, #ebdcbd 0%, #d3be96 46%, #b29968 100%)'
  },
  {
    title: 'Echo Caves Traverse',
    category: 'Adventure Trail',
    description: 'Underground passage loops with reflective pools and stone halls.',
    image: 'linear-gradient(135deg, #c7d5e2 0%, #a8bfd2 44%, #839db8 100%)'
  },
  {
    title: 'Coral Bay Promenade',
    category: 'Coastal Walk',
    description: 'A boardwalk stretch with sea spray overlooks and reef exhibits.',
    image: 'linear-gradient(135deg, #c1e3ec 0%, #8cc9da 48%, #65adc2 100%)'
  },
  {
    title: 'Juniper Valley Camp',
    category: 'Forest Basin',
    description: 'Quiet riverside clearings framed by pines and stargazing decks.',
    image: 'linear-gradient(135deg, #c6e0ce 0%, #9cc4ac 45%, #79a289 100%)'
  },
  {
    title: 'Citadel Riverfront',
    category: 'Historic Quarter',
    description: 'Stone ramparts, water taxis, and restored artisan workshops.',
    image: 'linear-gradient(135deg, #e8cdbf 0%, #d6ac98 47%, #bf8e78 100%)'
  },
  {
    title: 'Northern Lights Camp',
    category: 'Sky Observatory',
    description: 'Low-light cabins positioned for aurora and meteor shower viewing.',
    image: 'linear-gradient(135deg, #d0d9ee 0%, #b5c2e4 44%, #92a7d1 100%)'
  },
  {
    title: 'Velvet Dune Passage',
    category: 'Desert Circuit',
    description: 'Wind-carved dunes, canyon slots, and sunset lookout platforms.',
    image: 'linear-gradient(135deg, #edd8c2 0%, #ddb993 46%, #c49567 100%)'
  },
  {
    title: 'Orchard Lantern Row',
    category: 'Garden District',
    description: 'Terraced orchards connected by bridges and evening tea kiosks.',
    image: 'linear-gradient(135deg, #e6cad8 0%, #d8adc0 44%, #be8da5 100%)'
  }
];

class CardStackCarouselSandbox extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    this.position = 0;
    this.velocity = 0;
    this.phase = 'idle';

    this.dragSession = {
      pointerId: null,
      lastY: 0,
      dragVelocity: 0
    };

    this.motion = {
      rafId: null,
      snapTarget: 0
    };

    this.cardNodes = [];
    this.maxVisibleDepth = 5;

    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);
    this.onControlClick = this.onControlClick.bind(this);
    this.stepMotion = this.stepMotion.bind(this);
  }

  connectedCallback() {
    this.render();
    this.cacheRefs();
    this.buildCards();

    this.stage.addEventListener('pointerdown', this.onPointerDown, { passive: false });
    this.stage.addEventListener('pointermove', this.onPointerMove, { passive: false });
    this.stage.addEventListener('pointerup', this.onPointerUp);
    this.stage.addEventListener('pointercancel', this.onPointerUp);
    this.stage.addEventListener('lostpointercapture', this.onPointerUp);
    this.controls.addEventListener('click', this.onControlClick);

    this.paintCards();
  }

  disconnectedCallback() {
    this.stage?.removeEventListener('pointerdown', this.onPointerDown);
    this.stage?.removeEventListener('pointermove', this.onPointerMove);
    this.stage?.removeEventListener('pointerup', this.onPointerUp);
    this.stage?.removeEventListener('pointercancel', this.onPointerUp);
    this.stage?.removeEventListener('lostpointercapture', this.onPointerUp);
    this.controls?.removeEventListener('click', this.onControlClick);
    this.stopMotion();
  }

  cacheRefs() {
    this.stage = this.shadowRoot.querySelector('[data-role="stage"]');
    this.deck = this.shadowRoot.querySelector('[data-role="deck"]');
    this.statusLabel = this.shadowRoot.querySelector('[data-role="status-label"]');
    this.controls = this.shadowRoot.querySelector('[data-role="controls"]');
    this.debugLabel = this.shadowRoot.querySelector('[data-role="debug"]');
    this.prevButton = this.shadowRoot.querySelector('[data-action="prev"]');
    this.nextButton = this.shadowRoot.querySelector('[data-action="next"]');
  }

  buildCards() {
    const fragment = document.createDocumentFragment();

    this.cardNodes = CARD_DATA.map((card) => {
      const cardNode = document.createElement('article');
      cardNode.className = 'deck-card';
      cardNode.innerHTML = `
        <div class="thumb" style="background: ${card.image};"></div>
        <div class="meta">
          <p class="category">${card.category}</p>
          <h2>${card.title}</h2>
          <p class="description">${card.description}</p>
        </div>
      `;
      fragment.appendChild(cardNode);
      return cardNode;
    });

    this.deck.appendChild(fragment);
  }

  get maxIndex() {
    return CARD_DATA.length - 1;
  }

  clampPosition(position) {
    return Math.max(0, Math.min(this.maxIndex, position));
  }

  stopMotion() {
    if (this.motion.rafId) {
      cancelAnimationFrame(this.motion.rafId);
      this.motion.rafId = null;
    }
    this.phase = this.dragSession.pointerId === null ? 'idle' : 'drag';
  }

  onPointerDown(event) {
    if (event.button !== 0 || this.phase === 'drag') {
      return;
    }

    this.stopMotion();

    this.phase = 'drag';
    this.dragSession.pointerId = event.pointerId;
    this.dragSession.lastY = event.clientY;
    this.dragSession.dragVelocity = 0;
    this.velocity = 0;

    this.stage.setPointerCapture(event.pointerId);
    event.preventDefault();
    this.paintCards();
  }

  onPointerMove(event) {
    if (this.phase !== 'drag' || event.pointerId !== this.dragSession.pointerId) {
      return;
    }

    const deltaY = event.clientY - this.dragSession.lastY;
    this.position -= deltaY * 0.01;
    this.position = this.clampPosition(this.position);
    const instantVelocity = -deltaY * 0.01;
    this.dragSession.dragVelocity = this.dragSession.dragVelocity * 0.75 + instantVelocity * 0.25;
    this.dragSession.lastY = event.clientY;

    event.preventDefault();
    this.paintCards();
  }

  onPointerUp(event) {
    if (this.phase !== 'drag' || event.pointerId !== this.dragSession.pointerId) {
      return;
    }

    this.dragSession.pointerId = null;

    if (this.stage.hasPointerCapture(event.pointerId)) {
      this.stage.releasePointerCapture(event.pointerId);
    }

    this.velocity = this.dragSession.dragVelocity;
    if (Math.abs(this.velocity) < 0.001) {
      this.snapToNearest();
      return;
    }

    this.phase = 'momentum';
    this.motion.rafId = requestAnimationFrame(this.stepMotion);
  }

  snapToNearest() {
    this.stopMotion();
    this.phase = 'snap';
    this.motion.snapTarget = Math.round(this.clampPosition(this.position));
    this.motion.rafId = requestAnimationFrame(this.stepMotion);
  }

  stepMotion() {
    if (this.phase === 'momentum') {
      this.velocity *= 0.95;
      this.position += this.velocity;
      this.position = this.clampPosition(this.position);
      this.paintCards();

      if (Math.abs(this.velocity) > 0.001) {
        this.motion.rafId = requestAnimationFrame(this.stepMotion);
      } else {
        this.snapToNearest();
      }
      return;
    }

    if (this.phase === 'snap') {
      const distance = this.motion.snapTarget - this.position;
      this.position += distance * 0.18;
      this.position = this.clampPosition(this.position);
      this.paintCards();

      if (Math.abs(distance) <= 0.001) {
        this.position = this.motion.snapTarget;
        this.phase = 'idle';
        this.stopMotion();
        this.paintCards();
      } else {
        this.motion.rafId = requestAnimationFrame(this.stepMotion);
      }
    }
  }

  onControlClick(event) {
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (!action) {
      return;
    }

    const activeIndex = Math.round(this.clampPosition(this.position));

    if (action === 'prev' && activeIndex > 0) {
      this.motion.snapTarget = activeIndex - 1;
      this.phase = 'snap';
      this.stopMotion();
      this.phase = 'snap';
      this.motion.rafId = requestAnimationFrame(this.stepMotion);
    }

    if (action === 'next' && activeIndex < this.maxIndex) {
      this.motion.snapTarget = activeIndex + 1;
      this.phase = 'snap';
      this.stopMotion();
      this.phase = 'snap';
      this.motion.rafId = requestAnimationFrame(this.stepMotion);
    }
  }

  getCardLayout(index) {
    const relative = index - this.position;
    const depth = Math.abs(relative);
    const hidden = depth > this.maxVisibleDepth + 0.6;
    const y = relative * 110;
    const scale = Math.max(0.5, 1 - Math.abs(relative) * 0.05);
    const opacity = Math.max(0, 1 - Math.abs(relative) * 0.25);
    const zIndex = 100 - Math.abs(relative);

    return {
      hidden,
      y,
      scale,
      opacity,
      zIndex
    };
  }

  paintCards() {
    const activeIndex = Math.round(this.clampPosition(this.position));
    const isDragging = this.phase === 'drag';
    const isSnapping = this.phase === 'snap';

    this.cardNodes.forEach((cardNode, index) => {
      const layout = this.getCardLayout(index);

      if (layout.hidden) {
        cardNode.style.display = 'none';
        return;
      }

      cardNode.style.display = '';
      cardNode.classList.toggle('is-active', activeIndex === index);
      cardNode.classList.toggle('dragging', isDragging);
      cardNode.classList.toggle('snapping', isSnapping);
      cardNode.style.zIndex = String(Math.round(layout.zIndex));
      cardNode.style.opacity = layout.opacity.toFixed(3);
      cardNode.style.transform = `translateY(${layout.y.toFixed(2)}px) scale(${layout.scale.toFixed(3)})`;
    });

    this.statusLabel.textContent = `Card ${activeIndex + 1} / ${CARD_DATA.length}`;
    this.prevButton.disabled = activeIndex === 0;
    this.nextButton.disabled = activeIndex === this.maxIndex;

    this.debugLabel.textContent = [
      `index ${activeIndex}`,
      `offset ${(this.position - activeIndex).toFixed(2)}`,
      `vel ${this.velocity.toFixed(3)}`,
      `phase ${this.phase}`
    ].join(' · ');
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          height: 100dvh;
          min-height: 100dvh;
          color: #1e2932;
        }

        * {
          box-sizing: border-box;
        }

        .carousel-root {
          position: fixed;
          inset: 0;
          background: #f2f2f2;
          overflow: hidden;
        }

        .backdrop-glow {
          position: absolute;
          width: min(75vh, 28rem);
          aspect-ratio: 1;
          top: -35%;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.75) 0%, rgba(255, 255, 255, 0) 70%);
          pointer-events: none;
          filter: blur(1px);
        }

        .stage {
          position: absolute;
          inset: 0;
          touch-action: none;
          user-select: none;
        }

        .stack {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 90%;
          max-width: 420px;
        }

        .deck {
          position: relative;
          width: 100%;
          min-height: 24rem;
          pointer-events: none;
        }

        .deck-card {
          position: absolute;
          inset: 0;
          width: 100%;
          border-radius: 1.25rem;
          background: #ffffff;
          border: 1px solid #1f2937;
          box-shadow:
            0 18px 34px rgba(22, 34, 49, 0.16),
            0 3px 10px rgba(22, 34, 49, 0.1);
          transform-origin: center center;
          overflow: hidden;
          will-change: transform, opacity;
          backface-visibility: hidden;
          transition: none;
        }

        .deck-card.dragging {
          transition: none;
        }

        .deck-card.snapping {
          transition: transform 220ms ease-out, opacity 220ms ease-out;
        }

        .deck-card.is-active {
          box-shadow:
            0 24px 40px rgba(20, 32, 48, 0.18),
            0 6px 14px rgba(20, 32, 48, 0.12);
        }

        .thumb {
          width: 100%;
          aspect-ratio: 16 / 10;
          border-bottom: 1px solid #26313f;
          position: relative;
        }

        .thumb::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(12, 18, 30, 0.2), rgba(12, 18, 30, 0));
        }

        .meta {
          padding: 0.95rem 1rem 1.1rem;
        }

        .category {
          margin: 0;
          font-size: 0.72rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #334155;
          font-weight: 700;
        }

        h2 {
          margin: 0.45rem 0 0;
          font-size: 1.2rem;
          line-height: 1.25;
          color: #0f172a;
        }

        .description {
          margin: 0.56rem 0 0;
          line-height: 1.45;
          color: #1f2937;
          font-size: 0.9rem;
        }

        .controls {
          position: fixed;
          bottom: 20px;
          left: 0;
          right: 0;
          display: flex;
          justify-content: center;
          pointer-events: none;
        }

        .hud-inner {
          pointer-events: auto;
          display: flex;
          align-items: center;
          gap: 0.7rem;
          border-radius: 999px;
          border: 1px solid #3c4b5f;
          background: rgba(255, 255, 255, 0.94);
          padding: 0.4rem;
        }

        .status {
          min-width: 6.5rem;
          text-align: center;
          font-size: 0.83rem;
          color: #1e293b;
          font-weight: 700;
        }

        .debug {
          position: fixed;
          top: 16px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 0.71rem;
          font-weight: 600;
          color: #334155;
          opacity: 0.8;
          background: rgba(255, 255, 255, 0.55);
          border: 1px solid rgba(51, 65, 85, 0.25);
          border-radius: 999px;
          padding: 0.2rem 0.55rem;
          backdrop-filter: blur(2px);
          pointer-events: none;
        }

        button {
          border: 1px solid #334155;
          color: #0f172a;
          border-radius: 999px;
          background: #f8fafc;
          min-width: 2.5rem;
          height: 2.3rem;
          padding: 0 0.85rem;
          font: inherit;
          font-size: 0.9rem;
          font-weight: 700;
          cursor: pointer;
          transition: opacity 160ms ease, transform 120ms ease;
        }

        button:active {
          transform: scale(0.97);
        }

        button:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }
      </style>

      <main class="carousel-root">
        <div class="backdrop-glow"></div>
        <section class="stage" data-role="stage" aria-label="Vertical card stack carousel prototype">
          <div class="stack">
            <div class="deck" data-role="deck"></div>
          </div>

          <div class="controls">
            <div class="hud-inner" data-role="controls">
              <button type="button" data-action="prev" aria-label="Show previous card">Prev</button>
              <div class="status" data-role="status-label"></div>
              <button type="button" data-action="next" aria-label="Show next card">Next</button>
            </div>
          </div>

          <div class="debug" data-role="debug"></div>
        </section>
      </main>
    `;
  }
}

customElements.define('card-stack-carousel-sandbox', CardStackCarouselSandbox);
