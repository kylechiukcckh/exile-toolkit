import { describe, expect, it } from 'vitest';

import {
  calculateCropRotation,
  calculateCropYieldTable,
  cropPairKinds,
  referenceCropRotationSettings,
  validateCropRotationInput
} from './crop-rotation';

const prices = {
  yellow: { chaosPerLifeforce: 0.03 },
  blue: { chaosPerLifeforce: 0.04 },
  purple: { chaosPerLifeforce: 0.05 }
} as const;

describe('Crop Rotation calculation', () => {
  it('accepts all six pair kinds, duplicates, and only three to five pairs', () => {
    expect(cropPairKinds).toEqual([
      'yellow-yellow',
      'yellow-blue',
      'yellow-purple',
      'blue-blue',
      'blue-purple',
      'purple-purple'
    ]);
    expect(
      validateCropRotationInput({
        pairs: ['yellow-blue', 'yellow-blue', 'purple-purple'],
        settings: referenceCropRotationSettings,
        lifeforcePrices: prices
      })
    ).toEqual({ valid: true });
    expect(
      validateCropRotationInput({
        pairs: ['yellow-blue', 'purple-purple'],
        settings: referenceCropRotationSettings,
        lifeforcePrices: prices
      })
    ).toMatchObject({ valid: false });
    expect(
      validateCropRotationInput({
        pairs: Array(6).fill('yellow-blue'),
        settings: referenceCropRotationSettings,
        lifeforcePrices: prices
      })
    ).toMatchObject({ valid: false });
  });

  it('rejects nonfinite, out-of-range, and negative settings', () => {
    expect(
      validateCropRotationInput({
        pairs: ['yellow-blue', 'blue-purple', 'yellow-purple'],
        settings: {
          ...referenceCropRotationSettings,
          noWiltChancePercent: 101,
          mapPackSizePercent: -1,
          mapItemQuantityPercent: Number.NaN
        },
        lifeforcePrices: prices
      })
    ).toMatchObject({ valid: false, issues: expect.any(Array) });
  });

  it('matches the permitted Cropbot reference yield fixture', () => {
    const table = calculateCropYieldTable(referenceCropRotationSettings);

    expect(table[0]).toBeCloseTo(27.75341184, 8);
    expect(table[1]).toBeCloseTo(112.50043728, 8);
  });

  it('returns a deterministic semantic all-wither path', () => {
    const input = {
      pairs: ['yellow-blue', 'yellow-blue', 'blue-purple'] as const,
      settings: referenceCropRotationSettings,
      lifeforcePrices: prices
    };

    const first = calculateCropRotation(input);
    const second = calculateCropRotation(input);

    expect(second).toEqual(first);
    expect(first.steps).toHaveLength(3);
    expect(first.steps.every(step => step.kind === 'paired')).toBe(true);
    expect(first.steps.map(step => step.sourcePair)).toEqual(
      expect.arrayContaining([...input.pairs])
    );
    expect(new Set(first.steps.map(step => step.id)).size).toBe(3);
    expect(first.expectedChaosValue).toBeGreaterThan(0);
    expect(first.expectedLifeforce.yellow).toBeGreaterThanOrEqual(0);
    expect(first.expectedLifeforce.blue).toBeGreaterThanOrEqual(0);
    expect(first.expectedLifeforce.purple).toBeGreaterThanOrEqual(0);
  });

  it('preserves value under color symmetry', () => {
    const symmetricPrices = {
      yellow: { chaosPerLifeforce: 0.04 },
      blue: { chaosPerLifeforce: 0.04 },
      purple: { chaosPerLifeforce: 0.04 }
    } as const;
    const first = calculateCropRotation({
      pairs: ['yellow-yellow', 'yellow-blue', 'blue-purple'],
      settings: referenceCropRotationSettings,
      lifeforcePrices: symmetricPrices
    });
    const rotated = calculateCropRotation({
      pairs: ['blue-blue', 'blue-purple', 'yellow-purple'],
      settings: referenceCropRotationSettings,
      lifeforcePrices: symmetricPrices
    });

    expect(rotated.expectedChaosValue).toBeCloseTo(first.expectedChaosValue, 8);
  });
});
