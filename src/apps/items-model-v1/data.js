export const scenes = [
  {
    id: 'title',
    title: 'Items, Structure, and Interfaces',
    kicker: 'Scene 1 · Framing',
    lead:
      'The same item model can drive storytelling, Present templates, Browser exploration, and website renderers.',
    bullets: [
      'Start with items, then add structure only when needed.',
      'Views unlock from data shape, not from custom one-off pages.',
      'Prototype target: concept deck + reusable presentation app skeleton.'
    ],
    visual: {
      type: 'pillars',
      items: ['Items first', 'Structure as needed', 'Interfaces emerge']
    }
  },
  {
    id: 'core-item',
    title: 'Everything starts as an item',
    kicker: 'Scene 2 · Core item model',
    lead: 'Before maps, timelines, or networks, there is a single item with identity and descriptive basics.',
    visual: {
      type: 'item-card',
      item: {
        title: 'Harbor Signal Tower Blueprint',
        description: 'Digitized architectural drawing from municipal planning records.',
        what: 'Drawing / Infrastructure record'
      }
    }
  },
  {
    id: 'dimensions',
    title: 'Five dimensions define usable structure',
    kicker: 'Scene 3 · Dimensions',
    lead: 'Each additional dimension strengthens queryability and unlocks interface behavior.',
    visual: {
      type: 'dimensions',
      rows: [
        ['what', 'classification / identity'],
        ['where', 'location'],
        ['when', 'time'],
        ['who', 'actors / relations'],
        ['why', 'context']
      ]
    }
  },
  {
    id: 'emergent-interfaces',
    title: 'Interfaces emerge from structure',
    kicker: 'Scene 4 · Views unlocked',
    lead: 'Collection/detail is baseline. New dimensions progressively unlock map, timeline, network, and narrative interfaces.',
    visual: {
      type: 'interfaces',
      rows: [
        ['Base', 'classification', 'collection / detail'],
        ['+ where', 'location', 'map'],
        ['+ when', 'time', 'timeline'],
        ['+ who', 'actors / relations', 'network'],
        ['+ why', 'context', 'narrative']
      ]
    }
  },
  {
    id: 'distinctions',
    title: 'Keep model layers distinct',
    kicker: 'Scene 5 · Distinction',
    lead: 'Classification defines what the thing is. Media and annotations add representation and explanation without replacing identity.',
    visual: {
      type: 'layers',
      layers: [
        ['Classification', 'Defines the item: category, type, identity.'],
        ['Media', 'Represents the item: image, audio, document, 3D.'],
        ['Annotations', 'Overlays interpretation: notes, regions, callouts.']
      ]
    }
  },
  {
    id: 'adoption',
    title: 'Progressive adoption keeps entry simple',
    kicker: 'Scene 6 · Adoption model',
    lead: 'Use the full model when needed, but start lightweight and still get immediate value.',
    visual: {
      type: 'levels',
      steps: [
        ['Level 1', 'Minimal item', 'title, description, classification'],
        ['Level 2', 'Spatial / temporal', 'add location and time'],
        ['Level 3', 'Relational', 'add actors and relationships'],
        ['Level 4', 'Contextual', 'add interpretive context and rationale'],
        ['Level 5', 'Full model', 'combine all dimensions + media + annotations']
      ]
    }
  },
  {
    id: 'json-example',
    title: 'Example item JSON (full model)',
    kicker: 'Scene 7 · Data example',
    lead: 'This object can power Present templates, Browser views, and website storytelling from one source model.',
    visual: {
      type: 'json',
      object: {
        id: 'item-harbor-signal-tower-1908',
        title: 'Harbor Signal Tower, East Pier',
        description: 'Blueprint and maintenance notes for the 1908 steel signal tower installation.',
        classification: {
          type: 'infrastructure-record',
          taxonomy: ['architecture', 'maritime', 'engineering']
        },
        media: [
          { type: 'image', role: 'scan', src: 'media/tower-blueprint-front.tif' },
          { type: 'document', role: 'transcript', src: 'media/maintenance-log.pdf' }
        ],
        location: {
          label: 'East Pier, North Harbor',
          lat: 47.6034,
          lng: -122.3411
        },
        time: {
          created: '1908-04-17',
          ranges: [{ start: '1908-04-17', end: '1911-09-03', label: 'initial service window' }]
        },
        actors: [
          { id: 'org-port-authority', role: 'commissioning body' },
          { id: 'person-elena-vasquez', role: 'chief engineer' }
        ],
        relations: [
          { type: 'part-of', target: 'collection-maritime-infrastructure' },
          { type: 'references', target: 'item-harbor-expansion-plan-1906' }
        ],
        context: {
          summary: 'Built during a harbor modernization phase tied to increased cargo traffic.',
          themes: ['industrial growth', 'public works']
        },
        annotations: [
          {
            id: 'note-01',
            type: 'region-note',
            target: '#sheet-a|x:412,y:228,w:142,h:96',
            text: 'Reinforcement detail added after storm damage review.'
          }
        ]
      }
    }
  },
  {
    id: 'closing',
    title: 'Items first. Structure later. Interfaces automatically.',
    kicker: 'Scene 8 · Principle',
    lead: 'Model richness and practical adoption can coexist. This v1 prototype is a bridge toward Present templates and website renderers.',
    bullets: [
      'Items are durable source units.',
      'Structure can be optional and incremental.',
      'Interface capabilities follow from structure.'
    ],
    visual: {
      type: 'pillars',
      items: ['Concept presentation', 'Website storytelling', 'Present-ready trajectory']
    }
  }
];
