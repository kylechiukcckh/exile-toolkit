import type { CuratedDataset, CuratedEntry } from '@exile-toolkit/domain';

const reviewedModifiers = [
  ['burning-ground', 'Area has patches of Burning Ground', 'Ground effects'],
  ['chilled-ground', 'Area has patches of Chilled Ground', 'Ground effects'],
  [
    'desecrated-ground',
    'Area has patches of desecrated ground',
    'Ground effects'
  ],
  ['cannot-be-stunned', 'Monsters cannot be Stunned', 'Monster defenses'],
  ['cannot-be-taunted', 'Monsters cannot be Taunted', 'Monster defenses'],
  ['hexproof', 'Monsters are Hexproof', 'Monster defenses'],
  [
    'cannot-regenerate',
    'Players cannot Regenerate Life, Mana or Energy Shield',
    'Player penalties'
  ],
  [
    'elemental-weakness',
    'Players are Cursed with Elemental Weakness',
    'Player penalties'
  ],
  [
    'vulnerability',
    'Players are Cursed with Vulnerability',
    'Player penalties'
  ],
  [
    'temporal-chains',
    'Players are Cursed with Temporal Chains',
    'Player penalties'
  ]
] as const;

export const mapModifierDataset = {
  id: 'poe1-map-modifiers',
  version: '2026.08.25',
  category: 'map-modifier',
  coverage:
    'Ten reviewed fixed-text map modifiers in three beta groups; numeric and full modifier coverage are later work.',
  entries: reviewedModifiers.map(([id, name, group]) =>
    makeModifierEntry(id, name, group)
  )
} satisfies CuratedDataset;

function makeModifierEntry(
  id: string,
  name: string,
  group: string
): CuratedEntry {
  return {
    id,
    category: 'map-modifier',
    name,
    group,
    provenance: {
      source: {
        name: 'Path of Exile Wiki',
        url: 'https://www.poewiki.net/wiki/List_of_map_mods'
      },
      gameVersion: '3.29',
      verification: 'reviewed',
      license: {
        name: 'CC BY-NC-SA 3.0',
        url: 'https://www.poewiki.net/wiki/Path_of_Exile_Wiki:Copyrights'
      },
      updatedAt: '2026-08-25T00:00:00.000Z'
    }
  };
}
