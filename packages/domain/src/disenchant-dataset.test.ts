import { describe, expect, it } from 'vitest';

import {
  calculateDisenchantDust,
  validateDisenchantDataset,
  type DisenchantCandidate,
  type DisenchantDataset
} from './disenchant-dataset';

const provenance = {
  source: {
    name: 'Observed fixture source',
    url: 'https://example.com/source'
  },
  gameVersion: '3.29',
  verification: 'reviewed',
  license: {
    name: 'MIT',
    url: 'https://example.com/license'
  },
  updatedAt: '2026-08-29T00:00:00.000Z'
} as const;

function candidate(
  overrides: Partial<DisenchantCandidate> = {}
): DisenchantCandidate {
  const baseDust = overrides.baseDust ?? 10;
  const quality = overrides.quality ?? 20;

  return {
    id: 'alpha--iron-hat',
    name: 'Alpha',
    baseType: 'Iron Hat',
    category: 'armour',
    baseDust,
    dustValue: calculateDisenchantDust(baseDust, 85, quality),
    itemLevel: 85,
    quality,
    provenance,
    ...overrides
  };
}

function dataset(entries: readonly DisenchantCandidate[]): DisenchantDataset {
  return {
    id: 'test-disenchant-dataset',
    version: '2026.08.29',
    coverage: 'Test fixtures only.',
    entries
  };
}

describe('validateDisenchantDataset', () => {
  it('rejects duplicate unique and variant identities even when ids differ', () => {
    const first = candidate();
    const duplicateIdentity = candidate({ id: 'another-id' });

    expect(
      validateDisenchantDataset(dataset([first, duplicateIdentity]))
    ).toMatchObject({
      valid: false,
      issues: [
        'entries contains duplicate name and base type "Alpha" / "Iron Hat"'
      ]
    });
  });

  it('rejects entries outside deterministic id order', () => {
    const alpha = candidate();
    const zulu = candidate({
      id: 'zulu--iron-boots',
      name: 'Zulu',
      baseType: 'Iron Boots'
    });

    expect(validateDisenchantDataset(dataset([zulu, alpha]))).toMatchObject({
      valid: false,
      issues: ['entries must be sorted by id in ascending ordinal order']
    });
  });

  it('reports missing fields, non-positive Dust values, and malformed Provenance', () => {
    const invalidCandidate = {
      ...candidate(),
      name: '',
      baseDust: 0,
      dustValue: 0,
      provenance: {
        ...provenance,
        source: { name: '', url: 'not-a-url' },
        license: undefined
      }
    };

    expect(
      validateDisenchantDataset({
        ...dataset([]),
        entries: [invalidCandidate]
      })
    ).toMatchObject({
      valid: false,
      issues: expect.arrayContaining([
        'entries[0].name must be a non-empty string',
        'entries[0].baseDust must be a positive number',
        'entries[0].dustValue must be a positive integer',
        'entries[0].provenance.source.name must be a non-empty string',
        'entries[0].provenance.source.url must be an HTTP URL',
        'entries[0].provenance.license must be an object'
      ])
    });
  });
});
