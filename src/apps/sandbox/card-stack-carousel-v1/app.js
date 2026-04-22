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

    this.state = {
      position: 0,
      phase: 'idle'
    };

    this.dragSession = {
      pointerId: null,
      startY: 0,
      startPosition: 0,
      lastY: 0,
      lastTimestamp: 0,
      velocityPxPerMs: 0
    };

    this.motion = {
      rafId: null,
      mode: 'idle',
      velocityCardsPerSec: 0,
      snapTarget: 0,
      lastFrameTs: 0
    };

    this.cardNodes = [];
    this.snapDistance = 130;
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

  withEdgeResistance(position) {
    if (position < 0) {
      return position * 0.25;
    }

    if (position > this.maxIndex) {
      return this.maxIndex + (position - this.maxIndex) * 0.25;
    }

    return position;
  }

  stopMotion() {
    if (this.motion.rafId) {
      cancelAnimationFrame(this.motion.rafId);
      this.motion.rafId = null;
    }

    this.motion.mode = 'idle';
    this.motion.velocityCardsPerSec = 0;
    this.motion.lastFrameTs = 0;
    this.state.phase = this.dragSession.pointerId === null ? 'idle' : 'drag';
  }

  startMotion(mode, options = {}) {
    if (this.motion.rafId) {
      cancelAnimationFrame(this.motion.rafId);
      this.motion.rafId = null;
    }

    this.motion.mode = mode;
    this.motion.velocityCardsPerSec = options.velocity ?? 0;
    this.motion.snapTarget = options.snapTarget ?? Math.round(this.clampPosition(this.state.position));
    this.motion.lastFrameTs = 0;
    this.state.phase = mode;
    this.motion.rafId = requestAnimationFrame(this.stepMotion);
  }

  onPointerDown(event) {
    if (event.button !== 0 || this.state.phase === 'drag') {
      return;
    }

    this.stopMotion();

    this.state.phase = 'drag';
    this.dragSession.pointerId = event.pointerId;
    this.dragSession.startY = event.clientY;
    this.dragSession.startPosition = this.state.position;
    this.dragSession.lastY = event.clientY;
    this.dragSession.lastTimestamp = event.timeStamp;
    this.dragSession.velocityPxPerMs = 0;

    this.stage.setPointerCapture(event.pointerId);
    event.preventDefault();
    this.paintCards();
  }

  onPointerMove(event) {
    if (this.state.phase !== 'drag' || event.pointerId !== this.dragSession.pointerId) {
      return;
    }

    const rawDelta = event.clientY - this.dragSession.startY;
    const nextPosition = this.dragSession.startPosition - rawDelta / this.snapDistance;
    this.state.position = this.withEdgeResistance(nextPosition);

    const dt = Math.max(1, event.timeStamp - this.dragSession.lastTimestamp);
    const dy = event.clientY - this.dragSession.lastY;
    const instantVelocity = dy / dt;

    this.dragSession.velocityPxPerMs = this.dragSession.velocityPxPerMs * 0.15 + instantVelocity * 0.85;
    this.dragSession.lastY = event.clientY;
    this.dragSession.lastTimestamp = event.timeStamp;

    event.preventDefault();
    this.paintCards();
  }

  onPointerUp(event) {
    if (this.state.phase !== 'drag' || event.pointerId !== this.dragSession.pointerId) {
      return;
    }

    this.dragSession.pointerId = null;

    if (this.stage.hasPointerCapture(event.pointerId)) {
      this.stage.releasePointerCapture(event.pointerId);
    }

    const velocityCardsPerSec = (-this.dragSession.velocityPxPerMs * 1000) / this.snapDistance;
    if (Math.abs(velocityCardsPerSec) < 0.02) {
      this.startMotion('snap', {
        velocity: 0,
        snapTarget: Math.round(this.clampPosition(this.state.position))
      });
      return;
    }

    this.startMotion('momentum', { velocity: velocityCardsPerSec });
  }

  beginSnap() {
    this.startMotion('snap', {
      velocity: this.motion.velocityCardsPerSec,
      snapTarget: Math.round(this.clampPosition(this.state.position))
    });
  }

  stepMotion(timestamp) {
    if (!this.motion.lastFrameTs) {
      this.motion.lastFrameTs = timestamp;
    }

    const dtSec = Math.min(0.05, (timestamp - this.motion.lastFrameTs) / 1000);
    this.motion.lastFrameTs = timestamp;

    if (this.motion.mode === 'momentum') {
      this.state.position += this.motion.velocityCardsPerSec * dtSec;

      const frictionPerSecond = 0.14;
      this.motion.velocityCardsPerSec *= Math.pow(frictionPerSecond, dtSec);

      if (this.state.position < 0 || this.state.position > this.maxIndex) {
        const nearestBound = this.state.position < 0 ? 0 : this.maxIndex;
        const overscroll = nearestBound - this.state.position;
        this.motion.velocityCardsPerSec += overscroll * 22 * dtSec;
        this.motion.velocityCardsPerSec *= Math.pow(0.5, dtSec * 60);
      }

      if (Math.abs(this.motion.velocityCardsPerSec) <= 0.04) {
        this.beginSnap();
        return;
      }

      this.paintCards();
      this.motion.rafId = requestAnimationFrame(this.stepMotion);
      return;
    }

    if (this.motion.mode === 'snap') {
      const distance = this.motion.snapTarget - this.state.position;
      this.motion.velocityCardsPerSec += distance * 30 * dtSec;
      this.motion.velocityCardsPerSec *= Math.pow(0.6, dtSec * 60);
      this.state.position += this.motion.velocityCardsPerSec * dtSec;

      const nearTarget = Math.abs(distance) < 0.002;
      const nearStill = Math.abs(this.motion.velocityCardsPerSec) < 0.02;

      if (nearTarget && nearStill) {
        this.state.position = this.motion.snapTarget;
        this.stopMotion();
        this.paintCards();
        return;
      }

      this.paintCards();
      this.motion.rafId = requestAnimationFrame(this.stepMotion);
    }
  }

  onControlClick(event) {
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (!action) {
      return;
    }

    const activeIndex = Math.round(this.clampPosition(this.state.position));

    if (action === 'prev' && activeIndex > 0) {
      this.startMotion('snap', {
        velocity: 0,
        snapTarget: activeIndex - 1
      });
    }

    if (action === 'next' && activeIndex < this.maxIndex) {
      this.startMotion('snap', {
        velocity: 0,
        snapTarget: activeIndex + 1
      });
    }
  }

  getCardLayout(index) {
    const relative = index - this.state.position;
    const depth = Math.abs(relative);
    const hidden = depth > this.maxVisibleDepth + 0.6;

    let y = relative * 52;
    let scale = Math.max(0.72, 1 - Math.max(0, relative) * 0.05);
    let opacity = Math.max(0.06, 1 - Math.max(0, relative) * 0.18);

    if (relative < 0) {
      const reveal = Math.min(1, Math.abs(relative));
      y = -140 * (1 - reveal);
      scale = 0.94 + 0.06 * reveal;
      opacity = 0.1 + 0.9 * reveal;
    }

    const zIndexBase = 200;
    const zIndex = relative <= 0 ? zIndexBase + 60 - depth : zIndexBase - relative;

    return {
      hidden,
      y,
      scale,
      opacity,
      zIndex
    };
  }

  paintCards() {
    const activeIndex = Math.round(this.clampPosition(this.state.position));

    this.cardNodes.forEach((cardNode, index) => {
      const layout = this.getCardLayout(index);

      if (layout.hidden) {
        cardNode.style.display = 'none';
        return;
      }

      cardNode.style.display = '';
      cardNode.classList.toggle('is-active', activeIndex === index);
      cardNode.style.zIndex = String(Math.round(layout.zIndex));
      cardNode.style.opacity = layout.opacity.toFixed(3);
      cardNode.style.transform = `translate(-50%, ${layout.y.toFixed(2)}px) scale(${layout.scale.toFixed(3)})`;
    });

    this.statusLabel.textContent = `Card ${activeIndex + 1} / ${CARD_DATA.length}`;
    this.prevButton.disabled = activeIndex === 0;
    this.nextButton.disabled = activeIndex === this.maxIndex;

    this.debugLabel.textContent = [
      `index ${activeIndex}`,
      `offset ${(this.state.position - activeIndex).toFixed(2)}`,
      `vel ${this.motion.velocityCardsPerSec.toFixed(2)}`,
      `phase ${this.state.phase}`
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

        .sandbox {
          position: relative;
          height: 100%;
          overflow: hidden;
          padding: 1rem 1rem calc(0.9rem + env(safe-area-inset-bottom));
          display: flex;
          justify-content: center;
          background: #e7eaef;
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
          position: relative;
          width: min(25rem, 100%);
          height: 100%;
          touch-action: none;
          user-select: none;
          display: grid;
          grid-template-rows: minmax(0, 1fr) auto auto;
          gap: clamp(0.45rem, 1.8vh, 0.95rem);
          align-items: end;
        }

        .deck {
          position: relative;
          width: 100%;
          min-height: 0;
          pointer-events: none;
        }

        .deck-card {
          position: absolute;
          left: 50%;
          top: 0;
          width: 100%;
          border-radius: 1.25rem;
          background: #ffffff;
          border: 1px solid #1f2937;
          box-shadow:
            0 18px 34px rgba(22, 34, 49, 0.16),
            0 3px 10px rgba(22, 34, 49, 0.1);
          transform-origin: top center;
          overflow: hidden;
          will-change: transform, opacity;
          backface-visibility: hidden;
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

        .hud {
          display: flex;
          justify-content: center;
          pointer-events: none;
          padding-bottom: max(0.2rem, env(safe-area-inset-bottom));
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
          justify-self: center;
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

      <main class="sandbox">
        <div class="backdrop-glow"></div>
        <section class="stage" data-role="stage" aria-label="Vertical card stack carousel prototype">
          <div class="deck" data-role="deck"></div>

          <div class="hud">
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
