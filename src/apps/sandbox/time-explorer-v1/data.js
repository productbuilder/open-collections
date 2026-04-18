export const stories = [
  {
    id: 'all',
    title: 'All',
    summary: 'View every item across the timeline.',
    accent: '#6c7a99'
  },
  {
    id: 'routes',
    title: 'Trade Routes',
    summary: 'How exchange corridors shifted over time.',
    accent: '#1f7a8c'
  },
  {
    id: 'technology',
    title: 'Urban Technology',
    summary: 'Infrastructure and tools reshaping city life.',
    accent: '#7c4dff'
  },
  {
    id: 'memory',
    title: 'Public Memory',
    summary: 'Sites where civic memory and storytelling changed.',
    accent: '#c05621'
  }
];

export const items = [
  {
    id: 'harbor-ledger',
    title: 'Harbor Ledger House',
    year: 1854,
    latLike: 22,
    lonLike: 16,
    storyIds: ['routes'],
    description: 'A customs office that became a key point for tracking coastal trade shipments.',
    imageLabel: 'Ink drawing of harbor ledgers'
  },
  {
    id: 'canal-cut',
    title: 'Canal Cut Milestone',
    year: 1871,
    latLike: 35,
    lonLike: 29,
    storyIds: ['routes'],
    description: 'An engineering cut reduced travel distance and concentrated nearby market activity.',
    imageLabel: 'Canal excavation scene'
  },
  {
    id: 'signal-yard',
    title: 'Signal Yard Tower',
    year: 1898,
    latLike: 58,
    lonLike: 24,
    storyIds: ['routes', 'technology'],
    description: 'Telegraph relays synchronized departures and arrivals for long-distance cargo rail.',
    imageLabel: 'Signal tower with telegraph lines'
  },
  {
    id: 'east-power',
    title: 'East Power Station',
    year: 1912,
    latLike: 64,
    lonLike: 47,
    storyIds: ['technology'],
    description: 'One of the first electric generation hubs supporting industrial expansion nearby.',
    imageLabel: 'Brick power station facade'
  },
  {
    id: 'market-clock',
    title: 'Market Clock Square',
    year: 1925,
    latLike: 44,
    lonLike: 52,
    storyIds: ['memory'],
    description: 'Public speeches and wartime vigils made this square a recurring civic reference point.',
    imageLabel: 'Clock tower over crowded square'
  },
  {
    id: 'tram-loop',
    title: 'Tram Loop Junction',
    year: 1938,
    latLike: 30,
    lonLike: 61,
    storyIds: ['technology'],
    description: 'A newly connected tram loop expanded access to the northern district.',
    imageLabel: 'Historic tram turning loop'
  },
  {
    id: 'victory-arch',
    title: 'Victory Arch Site',
    year: 1947,
    latLike: 48,
    lonLike: 40,
    storyIds: ['memory'],
    description: 'The temporary arch became a long-lasting annual gathering location.',
    imageLabel: 'Ceremonial arch with banners'
  },
  {
    id: 'container-pier',
    title: 'Container Pier 3',
    year: 1961,
    latLike: 18,
    lonLike: 37,
    storyIds: ['routes', 'technology'],
    description: 'Standardized container handling accelerated throughput at the edge of the bay.',
    imageLabel: 'Cranes and stacked containers'
  },
  {
    id: 'memorial-garden',
    title: 'Memorial Garden Opening',
    year: 1974,
    latLike: 53,
    lonLike: 70,
    storyIds: ['memory'],
    description: 'A redesigned park introduced plaques and walking routes for public remembrance.',
    imageLabel: 'Garden path with plaques'
  },
  {
    id: 'fiber-exchange',
    title: 'Fiber Exchange Node',
    year: 1989,
    latLike: 68,
    lonLike: 33,
    storyIds: ['technology'],
    description: 'A data exchange node bridged municipal institutions and shipping systems.',
    imageLabel: 'Server racks with patch panels'
  },
  {
    id: 'river-festival',
    title: 'River Festival Route',
    year: 1998,
    latLike: 40,
    lonLike: 78,
    storyIds: ['memory'],
    description: 'Festival parades linked historic markers into a yearly public story path.',
    imageLabel: 'Riverfront lantern parade'
  },
  {
    id: 'logistics-grid',
    title: 'Regional Logistics Grid',
    year: 2008,
    latLike: 26,
    lonLike: 50,
    storyIds: ['routes', 'technology'],
    description: 'Intermodal software and routing hubs connected inland warehousing to coastal ports.',
    imageLabel: 'Digital logistics dashboard'
  },
  {
    id: 'museum-annex',
    title: 'Museum Annex Expansion',
    year: 2015,
    latLike: 60,
    lonLike: 60,
    storyIds: ['memory'],
    description: 'An annex curated rotating exhibits focused on local industrial heritage.',
    imageLabel: 'Modern museum annex interior'
  },
  {
    id: 'tidal-lab',
    title: 'Tidal Mobility Lab',
    year: 2020,
    latLike: 73,
    lonLike: 44,
    storyIds: ['technology', 'routes'],
    description: 'Prototype ferries and sensors tested adaptive routing during changing tides.',
    imageLabel: 'Prototype ferry at dock'
  }
];
