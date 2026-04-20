const CARD_DATA = [
  {
    title: 'Misty Ridge Reserve',
    category: 'Mountain Retreat',
    description: 'High-altitude cabins with sunrise viewpoints and cedar trails.',
    image: 'linear-gradient(135deg, #7997cb 0%, #5b77a8 42%, #2f425f 100%)'
  },
  {
    title: 'Harbor Twilight Market',
    category: 'Night District',
    description: 'Lantern-lit piers, local food stalls, and live acoustic corners.',
    image: 'linear-gradient(135deg, #6d8dba 0%, #4a6d9f 45%, #273f63 100%)'
  },
  {
    title: 'Golden Steppe Route',
    category: 'Open Plains',
    description: 'Long grass fields with seasonal blooms and distant watch towers.',
    image: 'linear-gradient(135deg, #bba871 0%, #8f7c48 46%, #4d4227 100%)'
  },
  {
    title: 'Echo Caves Traverse',
    category: 'Adventure Trail',
    description: 'Underground passage loops with reflective pools and stone halls.',
    image: 'linear-gradient(135deg, #8ea8bf 0%, #66819a 44%, #334457 100%)'
  },
  {
    title: 'Coral Bay Promenade',
    category: 'Coastal Walk',
    description: 'A boardwalk stretch with sea spray overlooks and reef exhibits.',
    image: 'linear-gradient(135deg, #80c2d6 0%, #57a6c1 48%, #2c6075 100%)'
  },
  {
    title: 'Juniper Valley Camp',
    category: 'Forest Basin',
    description: 'Quiet riverside clearings framed by pines and stargazing decks.',
    image: 'linear-gradient(135deg, #7eb091 0%, #548769 45%, #2a4d3b 100%)'
  },
  {
    title: 'Citadel Riverfront',
    category: 'Historic Quarter',
    description: 'Stone ramparts, water taxis, and restored artisan workshops.',
    image: 'linear-gradient(135deg, #c2917f 0%, #a56753 47%, #5f392c 100%)'
  },
  {
    title: 'Northern Lights Camp',
    category: 'Sky Observatory',
    description: 'Low-light cabins positioned for aurora and meteor shower viewing.',
    image: 'linear-gradient(135deg, #8ba0d4 0%, #6b82be 44%, #3a4d85 100%)'
  },
  {
    title: 'Velvet Dune Passage',
    category: 'Desert Circuit',
    description: 'Wind-carved dunes, canyon slots, and sunset lookout platforms.',
    image: 'linear-gradient(135deg, #d4aa7f 0%, #b88656 46%, #664726 100%)'
  },
  {
    title: 'Orchard Lantern Row',
    category: 'Garden District',
    description: 'Terraced orchards connected by bridges and evening tea kiosks.',
    image: 'linear-gradient(135deg, #ca96ac 0%, #a96b86 44%, #5d374b 100%)'
  }
];

class CardStackCarouselSandbox extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    this.state = {
      activeIndex: 0,
      dragOffset: 0,
      dragging: false
    };

    this.dragSession = {
      pointerId: null,
      startY: 0
    };

    this.snapDistance = 130;
    this.maxVisibleDepth = 5;

    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);
    this.onControlClick = this.onControlClick.bind(this);
  }

  connectedCallback() {
    this.render();
    this.cacheRefs();

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
  }

  cacheRefs() {
    this.stage = this.shadowRoot.querySelector('[data-role="stage"]');
    this.deck = this.shadowRoot.querySelector('[data-role="deck"]');
    this.statusLabel = this.shadowRoot.querySelector('[data-role="status-label"]');
    this.controls = this.shadowRoot.querySelector('[data-role="controls"]');
  }

  onPointerDown(event) {
    if (event.button !== 0 || this.state.dragging) {
      return;
    }

    this.state.dragging = true;
    this.dragSession.pointerId = event.pointerId;
    this.dragSession.startY = event.clientY;
    this.state.dragOffset = 0;

    this.stage.setPointerCapture(event.pointerId);
    event.preventDefault();

    this.paintCards();
  }

  onPointerMove(event) {
    if (!this.state.dragging || event.pointerId !== this.dragSession.pointerId) {
      return;
    }

    const rawDelta = event.clientY - this.dragSession.startY;
    const limitedDelta = Math.max(-this.snapDistance * 1.35, Math.min(this.snapDistance * 1.35, rawDelta));

    const atFirstCard = this.state.activeIndex === 0;
    const atLastCard = this.state.activeIndex === CARD_DATA.length - 1;

    if ((atFirstCard && limitedDelta > 0) || (atLastCard && limitedDelta < 0)) {
      this.state.dragOffset = limitedDelta * 0.28;
    } else {
      this.state.dragOffset = limitedDelta;
    }

    event.preventDefault();
    this.paintCards();
  }

  onPointerUp(event) {
    if (!this.state.dragging || event.pointerId !== this.dragSession.pointerId) {
      return;
    }

    const offset = this.state.dragOffset;
    const progress = Math.abs(offset) / this.snapDistance;

    if (offset <= -this.snapDistance && this.state.activeIndex < CARD_DATA.length - 1) {
      this.state.activeIndex += 1;
    } else if (offset >= this.snapDistance && this.state.activeIndex > 0) {
      this.state.activeIndex -= 1;
    } else if (progress > 0.76) {
      if (offset < 0 && this.state.activeIndex < CARD_DATA.length - 1) {
        this.state.activeIndex += 1;
      }
      if (offset > 0 && this.state.activeIndex > 0) {
        this.state.activeIndex -= 1;
      }
    }

    this.state.dragging = false;
    this.state.dragOffset = 0;
    this.dragSession.pointerId = null;

    if (this.stage.hasPointerCapture(event.pointerId)) {
      this.stage.releasePointerCapture(event.pointerId);
    }

    this.paintCards();
  }

  onControlClick(event) {
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (!action) {
      return;
    }

    if (action === 'prev' && this.state.activeIndex > 0) {
      this.state.activeIndex -= 1;
    }

    if (action === 'next' && this.state.activeIndex < CARD_DATA.length - 1) {
      this.state.activeIndex += 1;
    }

    this.state.dragOffset = 0;
    this.paintCards();
  }

  getCardLayout(index) {
    const relative = index - this.state.activeIndex;
    const offset = this.state.dragOffset;
    const upwardProgress = Math.max(0, Math.min(1, -offset / this.snapDistance));
    const downwardProgress = Math.max(0, Math.min(1, offset / this.snapDistance));

    const depth = Math.abs(relative);
    const depthLimit = this.maxVisibleDepth;
    const hidden = depth > depthLimit;

    let y = relative * 52;
    let scale = Math.max(0.72, 1 - Math.max(0, relative) * 0.05);
    let opacity = Math.max(0, 1 - Math.max(0, relative) * 0.18);

    if (relative === 0) {
      y = offset;
      scale = 1 - upwardProgress * 0.015;
    } else if (relative > 0) {
      y = relative * 52 - upwardProgress * 52;
      scale = Math.max(0.72, 1 - relative * 0.05 + upwardProgress * 0.05);
      opacity = Math.max(0.14, 1 - relative * 0.2 + upwardProgress * 0.2);
    } else {
      // Previous card sits above the focused card and becomes visible when dragging down.
      y = -140 + downwardProgress * 140;
      scale = 0.94 + downwardProgress * 0.06;
      opacity = 0.08 + downwardProgress * 0.92;
    }

    const zIndexBase = 200;
    const zIndex = relative <= 0 ? zIndexBase + 60 - depth : zIndexBase - relative;

    return {
      hidden,
      y,
      scale,
      opacity,
      zIndex,
      relative
    };
  }

  paintCards() {
    this.deck.innerHTML = '';

    const fragment = document.createDocumentFragment();

    CARD_DATA.forEach((card, index) => {
      const layout = this.getCardLayout(index);
      if (layout.hidden) {
        return;
      }

      const cardNode = document.createElement('article');
      cardNode.className = 'deck-card';
      if (layout.relative === 0) {
        cardNode.classList.add('is-active');
      }

      cardNode.style.zIndex = String(layout.zIndex);
      cardNode.style.opacity = layout.opacity.toFixed(3);
      cardNode.style.transform = `translate(-50%, ${layout.y.toFixed(2)}px) scale(${layout.scale.toFixed(3)})`;

      cardNode.innerHTML = `
        <div class="thumb" style="background: ${card.image};"></div>
        <div class="meta">
          <p class="category">${card.category}</p>
          <h2>${card.title}</h2>
          <p class="description">${card.description}</p>
        </div>
      `;

      fragment.appendChild(cardNode);
    });

    this.deck.appendChild(fragment);

    this.statusLabel.textContent = `Card ${this.state.activeIndex + 1} / ${CARD_DATA.length}`;

    const prevButton = this.shadowRoot.querySelector('[data-action="prev"]');
    const nextButton = this.shadowRoot.querySelector('[data-action="next"]');

    prevButton.disabled = this.state.activeIndex === 0;
    nextButton.disabled = this.state.activeIndex === CARD_DATA.length - 1;
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          min-height: 100vh;
          color: #f2f6ff;
        }

        * {
          box-sizing: border-box;
        }

        .sandbox {
          position: relative;
          min-height: 100vh;
          overflow: hidden;
          padding: 1.2rem 1rem 1rem;
          display: flex;
          justify-content: center;
        }

        .backdrop-glow {
          position: absolute;
          width: min(75vh, 28rem);
          aspect-ratio: 1;
          top: -35%;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(142, 176, 255, 0.32) 0%, rgba(142, 176, 255, 0) 68%);
          pointer-events: none;
          filter: blur(2px);
        }

        .stage {
          position: relative;
          width: min(25rem, 100%);
          min-height: 86vh;
          touch-action: none;
          user-select: none;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .deck {
          position: relative;
          width: 100%;
          height: clamp(30rem, 74vh, 42rem);
          margin-top: clamp(0.2rem, 2vh, 1.2rem);
          pointer-events: none;
        }

        .deck-card {
          position: absolute;
          left: 50%;
          top: 0;
          width: 100%;
          border-radius: 1.25rem;
          background: linear-gradient(170deg, rgba(11, 25, 57, 0.95), rgba(8, 17, 40, 0.92));
          border: 1px solid rgba(171, 198, 255, 0.24);
          box-shadow:
            0 26px 50px rgba(2, 8, 26, 0.56),
            0 4px 12px rgba(11, 22, 54, 0.36),
            inset 0 1px 0 rgba(255, 255, 255, 0.12);
          transform-origin: top center;
          transition: transform 240ms cubic-bezier(0.2, 0.82, 0.2, 1), opacity 220ms ease;
          overflow: hidden;
          will-change: transform;
        }

        .deck-card.is-active {
          box-shadow:
            0 34px 58px rgba(4, 10, 32, 0.62),
            0 8px 22px rgba(17, 35, 80, 0.45),
            inset 0 1px 0 rgba(255, 255, 255, 0.17);
        }

        .thumb {
          width: 100%;
          aspect-ratio: 16 / 10;
          border-bottom: 1px solid rgba(186, 205, 255, 0.22);
          position: relative;
        }

        .thumb::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(5, 9, 20, 0.48), rgba(5, 9, 20, 0));
        }

        .meta {
          padding: 0.95rem 1rem 1.1rem;
        }

        .category {
          margin: 0;
          font-size: 0.72rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #bcd0ff;
          font-weight: 600;
        }

        h2 {
          margin: 0.45rem 0 0;
          font-size: 1.2rem;
          line-height: 1.25;
          color: #f5f8ff;
        }

        .description {
          margin: 0.56rem 0 0;
          line-height: 1.45;
          color: #d4def8;
          font-size: 0.9rem;
        }

        .hud {
          position: absolute;
          right: 0;
          left: 0;
          bottom: clamp(0.8rem, 2.4vh, 1.6rem);
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
          border: 1px solid rgba(165, 192, 255, 0.28);
          background: rgba(9, 18, 42, 0.72);
          backdrop-filter: blur(12px);
          padding: 0.4rem;
        }

        .status {
          min-width: 6.5rem;
          text-align: center;
          font-size: 0.83rem;
          color: #d9e5ff;
          font-weight: 600;
        }

        button {
          border: 0;
          color: #f2f6ff;
          border-radius: 999px;
          background: rgba(108, 142, 229, 0.33);
          min-width: 2.5rem;
          height: 2.3rem;
          padding: 0 0.85rem;
          font: inherit;
          font-size: 0.9rem;
          font-weight: 600;
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
        </section>
      </main>
    `;
  }
}

customElements.define('card-stack-carousel-sandbox', CardStackCarouselSandbox);
