import { describe, expect, it } from 'vitest';

import {
  validateItemModifierDataset,
  type ItemModifierDataset
} from './item-modifier-dataset';

const dataset = {
  schemaVersion: 1,
  gameVersion: '3.27.0',
  revision: 1,
  equipmentClass: 'amulet',
  sourcePool: 'normal',
  bases: [
    {
      id: 'base-amulet-focused',
      name: 'Focused Amulet',
      equipmentClass: 'amulet',
      requiredLevel: 24,
      tags: ['amulet', 'default'],
      qualityType: 'catalyst',
      magicCapacity: { prefixes: 1, suffixes: 1 },
      rareCapacity: { prefixes: 3, suffixes: 3 },
      ruleIds: ['base-rule-focused-capacity']
    }
  ],
  baseRules: [
    {
      id: 'base-rule-focused-capacity',
      baseId: 'base-amulet-focused',
      sourceText:
        '-1 Prefix Modifier allowed; -2 Suffix Modifiers allowed; Implicit Modifiers Cannot Be Changed; 100% increased Explicit Modifier magnitudes',
      effects: [
        { type: 'prefix-capacity-adjustment', amount: -1 },
        { type: 'suffix-capacity-adjustment', amount: -2 },
        { type: 'explicit-magnitude', percent: 100 },
        { type: 'implicit-modifiers-changeable', changeable: false }
      ]
    }
  ],
  modifiers: [
    {
      id: 'modifier-amulet-life-t1',
      sourceId: 'UpfrontLife8',
      active: true,
      name: 'Vigorous',
      tier: 1,
      sourcePool: 'normal',
      domain: 'item',
      generationType: 'prefix',
      slotType: 'prefix',
      requiredItemLevel: 85,
      families: ['maximum-life'],
      tags: ['life'],
      addedTags: [],
      implicitTags: [],
      spawnWeights: [
        { tag: 'amulet', weight: 1000 },
        { tag: 'default', weight: 0 }
      ],
      generationWeights: [],
      stats: [
        {
          id: 'stat-maximum-life',
          text: '+# to maximum Life',
          rawMin: 70,
          rawMax: 79,
          internalPrecision: 0,
          displayPrecision: 0,
          scalable: true,
          rounding: 'floor'
        }
      ]
    }
  ],
  indexes: {
    modifierIds: { 'modifier-amulet-life-t1': 0 },
    families: { 'maximum-life': [0] },
    statTemplates: { '+# to maximum life': [0] },
    eligibilityTags: { amulet: [0], default: [0] },
    generationTypes: { prefix: [0] },
    slotTypes: { prefix: [0] }
  }
} satisfies ItemModifierDataset;

describe('validateItemModifierDataset', () => {
  it('accepts a reachable Modifier chunk with structured base rules', () => {
    expect(validateItemModifierDataset(dataset)).toEqual({
      valid: true,
      dataset
    });
  });

  it('rejects a Modifier that cannot be reached by its permanent Toolkit ID', () => {
    expect(
      validateItemModifierDataset({
        ...dataset,
        indexes: { ...dataset.indexes, modifierIds: {} }
      })
    ).toEqual({
      valid: false,
      issues: [
        'modifiers[0] must be reachable from indexes.modifierIds by id "modifier-amulet-life-t1"'
      ]
    });
  });

  it('rejects malformed base-rule effects and incomplete lookup indexes', () => {
    expect(
      validateItemModifierDataset({
        ...dataset,
        baseRules: [
          {
            ...dataset.baseRules[0],
            effects: [{ type: 'unknown-effect', amount: 1 }]
          }
        ],
        indexes: { ...dataset.indexes, statTemplates: {} }
      })
    ).toEqual({
      valid: false,
      issues: [
        'baseRules[0].effects[0].type is not supported',
        'indexes.statTemplates must exactly index every Modifier'
      ]
    });
  });
});
