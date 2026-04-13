export const flowSteps = [
  {
    id: 'item-type',
    title: 'Choose item type',
    description: 'Pick the type that best matches what you want to create in this collection flow.',
    moreInfo:
      'This selection helps preload fields and examples in later creation screens. You can still adjust details after the flow.',
    selectionKey: 'itemType',
    required: true,
    options: [
      'Thing',
      'Person',
      'Organization',
      'Location',
      'Event',
      'Narrative',
      'Media'
    ]
  },
  {
    id: 'creation-focus',
    title: 'Choose creation focus',
    description: 'Start with the area you have the most confidence in right now.',
    moreInfo:
      'A focus is just your starting point. Open Collections can still support richer context as you continue editing.',
    selectionKey: 'creationFocus',
    required: true,
    options: ['Start with title', 'Start with media', 'Start with location', 'Start with story']
  },
  {
    id: 'next-mode',
    title: 'Choose next mode',
    description: 'Select how guided you want the next creation experience to be.',
    selectionKey: 'nextMode',
    required: true,
    options: ['Quick create', 'Guided create', 'Advanced create']
  },
  {
    id: 'confirm',
    title: 'Confirm setup',
    description: 'Review your selections, then start creating with your preferred setup.',
    required: false,
    options: []
  }
];
