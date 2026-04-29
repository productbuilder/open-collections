const DEMO_CARDS = [
  { id: 'hv-01', title: 'Raadhuis Hilversum', description: 'Dudok architecture and civic center', year: 1931, lng: 5.1704, lat: 52.2235, category: 'Architecture' },
  { id: 'hv-02', title: 'Media Park Studio Zone', description: 'Broadcast and media production area', year: 1988, lng: 5.1788, lat: 52.2342, category: 'Media' },
  { id: 'hv-03', title: 'Corversbos Edge', description: 'Forest transition and walking routes', year: 1976, lng: 5.1641, lat: 52.2112, category: 'Nature' },
  { id: 'hv-04', title: 'Nederlands Instituut voor Beeld & Geluid', description: 'Archive and exhibition for audiovisual culture', year: 2006, lng: 5.1808, lat: 52.2366, category: 'Museum' },
  { id: 'hv-05', title: 'Hilversum Station Plaza', description: 'Transport node and city entry', year: 1925, lng: 5.1765, lat: 52.2264, category: 'Transit' },
  { id: 'hv-06', title: 'Anna\'s Hoeve', description: 'Landscape restoration and recreation', year: 2018, lng: 5.1902, lat: 52.2348, category: 'Nature' },
  { id: 'hv-07', title: 'Old Industrial Strip', description: 'Adaptive reuse workspaces near ring road', year: 1964, lng: 5.1874, lat: 52.219, category: 'Industry' }
]

class OcSearchBar extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() { this.render(); }

  render() {
    this.shadowRoot.innerHTML = `<style>
      :host{display:block}.shell{background:rgba(247,250,252,.72);backdrop-filter:blur(8px);border:1px solid rgba(110,126,146,.35);border-radius:16px;padding:.6rem .75rem}
      input{width:100%;border:none;background:rgba(255,255,255,.88);border-radius:10px;padding:.72rem .8rem;font:500 .95rem/1.2 inherit;outline:none}
    </style><div class="shell"><input type="search" placeholder="Search place, category, text…" /></div>`;
    const input = this.shadowRoot.querySelector('input');
    input.value = this.getAttribute('value') || '';
    input.addEventListener('input', () => this.dispatchEvent(new CustomEvent('oc-search-query-change', { detail: { query: input.value }, bubbles: true, composed: true })));
  }
}
customElements.define('oc-search-bar', OcSearchBar);

class OcTimelineBar extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: 'open' }); }
  connectedCallback() { this.render(); }
  render() {
    const min = this.getAttribute('min') || '1900';
    const max = this.getAttribute('max') || '2025';
    this.shadowRoot.innerHTML = `<style>
      :host{display:block}.shell{background:rgba(247,250,252,.72);backdrop-filter:blur(8px);border:1px solid rgba(110,126,146,.35);border-radius:16px;padding:.35rem .75rem .6rem;color:#1f2e3c}
      .label{font-size:.75rem;font-weight:650;opacity:.82;margin:.2rem 0 .35rem}
    </style><div class="shell"><div class="label">Time range</div><oc-time-range-slider min="${min}" max="${max}" start="${min}" end="${max}"></oc-time-range-slider></div>`;
    this.shadowRoot.querySelector('oc-time-range-slider')?.addEventListener('oc-time-range-change', (event) => {
      this.dispatchEvent(new CustomEvent('oc-timeline-range-change', { detail: { start: event.detail.start, end: event.detail.end }, bubbles: true, composed: true }));
    });
  }
}
customElements.define('oc-timeline-bar', OcTimelineBar);

class OcCardStackMapExplorer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.state = { query: '', timeRange: { start: null, end: null }, mapBounds: null, activeCardId: null, activeLocation: null, activeTime: null, visibleCardIds: [] };
  }

  connectedCallback() { this.render(); this.bind(); this.applyFilters(); }

  bind() {
    this.shadowRoot.querySelector('oc-search-bar')?.addEventListener('oc-search-query-change', (e) => { this.state.query = (e.detail.query || '').trim().toLowerCase(); this.applyFilters(); });
    this.shadowRoot.querySelector('oc-timeline-bar')?.addEventListener('oc-timeline-range-change', (e) => { this.state.timeRange = { start: Number(e.detail.start), end: Number(e.detail.end) }; this.applyFilters(); });
    this.shadowRoot.querySelector('#carousel')?.addEventListener('oc-card-carousel-active-index-change', (e) => {
      const record = this.visibleRecords[e.detail.index];
      if (!record) return;
      this.state.activeCardId = record.id;
      this.state.activeLocation = { lng: record.lng, lat: record.lat };
      this.state.activeTime = record.year;
      console.info('TODO: wire oc-map focus/highlight for active card', this.state.activeLocation, this.state.activeTime);
    });
    this.shadowRoot.querySelector('#map')?.addEventListener('oc-map-move', (e) => { this.state.mapBounds = e.detail?.bounds ?? null; });
  }

  applyFilters() {
    const { query, timeRange } = this.state;
    this.visibleRecords = DEMO_CARDS.filter((record) => {
      const text = `${record.title} ${record.description} ${record.category}`.toLowerCase();
      const matchesQuery = !query || text.includes(query);
      const matchesTime = (!timeRange.start || record.year >= timeRange.start) && (!timeRange.end || record.year <= timeRange.end);
      return matchesQuery && matchesTime;
    });
    this.state.visibleCardIds = this.visibleRecords.map((item) => item.id);
    this.renderCards();
  }

  renderCards() {
    const carousel = this.shadowRoot.querySelector('#carousel');
    if (!carousel) return;
    carousel.innerHTML = this.visibleRecords.map((record) => `<article class="demo-card" data-id="${record.id}"><h3>${record.title}</h3><p>${record.description}</p><footer><span>${record.year}</span><span>${record.category}</span><span>${record.lat.toFixed(3)}, ${record.lng.toFixed(3)}</span></footer></article>`).join('');
    carousel.assignSlotsToChildren?.();
    carousel.setup?.();
  }

  render() {
    this.shadowRoot.innerHTML = `<style>
      :host{display:block}.sandbox-map-explorer{position:relative;height:100vh;width:100%;overflow:visible}
      .map-background{position:fixed;inset:0;width:100vw;height:100vh;z-index:0;pointer-events:auto}
      .top-card-zone,.bottom-control-zone{position:fixed;left:0;right:0;z-index:10;pointer-events:none}
      .top-card-zone{top:0;padding-top:max(12px,env(safe-area-inset-top))}
      #carousel{display:block;pointer-events:none}
      .bottom-control-zone{bottom:0;padding:0 12px calc(10px + env(safe-area-inset-bottom));display:grid;gap:10px}
      oc-search-bar,oc-timeline-bar{pointer-events:auto}
      .demo-card{height:100%;box-sizing:border-box;background:rgba(255,255,255,.82);backdrop-filter:blur(8px);border:1px solid rgba(125,136,152,.38);border-radius:14px;padding:1rem 1rem .8rem;color:#1b2734;display:grid;gap:.5rem;box-shadow:0 8px 24px rgba(21,32,46,.12)}
      .demo-card h3{font-size:1.05rem;margin:0}.demo-card p{margin:0;font-size:.88rem;line-height:1.3;opacity:.87}
      .demo-card footer{display:flex;gap:.55rem;flex-wrap:wrap;font-size:.73rem;font-weight:600;opacity:.84}
      .demo-card footer span{background:rgba(222,229,238,.8);border-radius:999px;padding:.2rem .5rem}
    </style><main class="sandbox-map-explorer"><oc-map id="map" class="map-background" style-url="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json" center-lng="5.1766" center-lat="52.2292" zoom="12.5" pitch="70" bearing="15" max-zoom="18" max-pitch="85" hash></oc-map><section class="top-card-zone"><oc-card-carousel id="carousel" scroll-vh-per-card="100" max-visible-cards="30" scroll-mode="wheel-snap" stack-height="30"></oc-card-carousel></section><section class="bottom-control-zone"><oc-timeline-bar min="1920" max="2025"></oc-timeline-bar><oc-search-bar></oc-search-bar></section></main>`;
  }
}

customElements.define('oc-card-stack-map-explorer', OcCardStackMapExplorer);
