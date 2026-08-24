import type { BuiltInRegexPreset } from '@exile-toolkit/domain';

export const regexPresets = [
  {
    id: 'starter-atlas-maps',
    name: 'Starter Atlas maps',
    description: 'Beach, Dunes, and Mesa from the reviewed beta Dataset.',
    category: 'map',
    entryIds: ['beach-map', 'dunes-map', 'mesa-map'],
    verification: 'reviewed'
  },
  {
    id: 'player-penalty-modifiers',
    name: 'Player penalties',
    description: 'The four reviewed modifiers that directly penalize players.',
    category: 'map-modifier',
    entryIds: [
      'cannot-regenerate',
      'elemental-weakness',
      'vulnerability',
      'temporal-chains'
    ],
    verification: 'reviewed'
  }
] as const satisfies readonly BuiltInRegexPreset[];
