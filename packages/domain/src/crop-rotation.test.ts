import { describe, expect, it } from 'vitest';

import {
  calculateCropRotation,
  calculateCropYieldTable,
  cropPairKinds,
  referenceCropRotationSettings,
  validateCropRotationSettings,
  validateCropRotationInput
} from './crop-rotation';

const prices = {
  yellow: { chaosPerLifeforce: 0.03 },
  blue: { chaosPerLifeforce: 0.04 },
  purple: { chaosPerLifeforce: 0.05 }
} as const;

describe('Crop Rotation calculation', () => {
  it('rejects malformed Advanced settings independently of other inputs', () => {
    expect(
      validateCropRotationSettings({
        ...referenceCropRotationSettings,
        tier3To4ChancePercent: Number.NaN
      })
    ).toEqual({
      valid: false,
      issues: ['tier3To4ChancePercent must be between 0 and 100']
    });
    expect(validateCropRotationSettings({ doublingScarab: true }).valid).toBe(
      false
    );
  });

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
    expect(
      first.steps
        .filter(step => step.kind === 'paired')
        .map(step => step.sourcePair)
    ).toEqual(expect.arrayContaining([...input.pairs]));
    expect(new Set(first.steps.map(step => step.id)).size).toBe(3);
    expect(first.expectedChaosValue).toBeGreaterThan(0);
    expect(first.expectedLifeforce.yellow).toBeGreaterThanOrEqual(0);
    expect(first.expectedLifeforce.blue).toBeGreaterThanOrEqual(0);
    expect(first.expectedLifeforce.purple).toBeGreaterThanOrEqual(0);
  });

  it('uses the Cropbot last-wins rule for equal-value moves', () => {
    const result = calculateCropRotation({
      pairs: ['yellow-yellow', 'blue-purple', 'yellow-blue'],
      settings: referenceCropRotationSettings,
      lifeforcePrices: {
        yellow: { chaosPerLifeforce: 0.02 },
        blue: { chaosPerLifeforce: 0.01 },
        purple: { chaosPerLifeforce: 0.01 }
      }
    });

    expect(
      result.steps.map(step =>
        step.kind === 'paired'
          ? [step.harvestColor, step.sourcePair]
          : [step.harvestColor, 'surviving']
      )
    ).toEqual([
      ['blue', 'blue-purple'],
      ['blue', 'yellow-blue'],
      ['yellow', 'yellow-yellow']
    ]);
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

  it('keeps unresolved outcomes probability-weighted', () => {
    const input = {
      pairs: ['yellow-blue', 'yellow-purple', 'blue-purple'] as const,
      settings: referenceCropRotationSettings,
      lifeforcePrices: prices
    };
    const neverSurvives = calculateCropRotation({
      ...input,
      settings: { ...input.settings, noWiltChancePercent: 0 }
    });
    const alwaysSurvives = calculateCropRotation({
      ...input,
      settings: { ...input.settings, noWiltChancePercent: 100 }
    });

    expect(alwaysSurvives.expectedChaosValue).toBeGreaterThan(
      neverSurvives.expectedChaosValue
    );
    expect(alwaysSurvives.expectedLifeforce).not.toEqual(
      neverSurvives.expectedLifeforce
    );
  });

  it.each(cropPairKinds)(
    'maps a %s Did not wither outcome to one Surviving crop',
    pair => {
      const input = {
        pairs: [pair, pair, pair],
        settings: referenceCropRotationSettings,
        lifeforcePrices: prices
      } as const;
      const initial = calculateCropRotation(input);
      const pairedStep = initial.steps.find(step => step.kind === 'paired')!;
      const branched = calculateCropRotation({
        ...input,
        didNotWitherStepIds: [pairedStep.id]
      });
      const retainedStep = branched.steps.find(
        step => step.id === pairedStep.id
      );
      const survivor = branched.steps.find(
        step => step.kind === 'surviving' && step.sourceStepId === pairedStep.id
      );

      expect(retainedStep).toMatchObject({
        kind: 'paired',
        didNotWither: true
      });
      expect(survivor).toMatchObject({
        kind: 'surviving',
        harvestColor: pairedStep.unchosenColor,
        sourceStepId: pairedStep.id
      });
      expect(
        branched.steps.filter(step => step.kind === 'surviving')
      ).toHaveLength(1);
      expect(branched.steps).toHaveLength(4);
      expect(branched.expectedChaosValue).toBeGreaterThan(
        initial.expectedChaosValue
      );
    }
  );

  it.each([
    ['yellow-blue', 'yellow', 'blue'],
    ['yellow-purple', 'yellow', 'purple'],
    ['blue-purple', 'blue', 'purple']
  ] as const)(
    'covers both harvest directions for a %s Crop pair',
    (pair, firstColor, secondColor) => {
      const mappings = [firstColor, secondColor].map(highValueColor => {
        const directionalPrices = {
          yellow: {
            chaosPerLifeforce: highValueColor === 'yellow' ? 10 : 0.001
          },
          blue: { chaosPerLifeforce: highValueColor === 'blue' ? 10 : 0.001 },
          purple: {
            chaosPerLifeforce: highValueColor === 'purple' ? 10 : 0.001
          }
        };
        const input = {
          pairs: [pair, pair, pair],
          settings: referenceCropRotationSettings,
          lifeforcePrices: directionalPrices
        } as const;
        const initial = calculateCropRotation(input);
        const pairedStep = initial.steps.find(step => step.kind === 'paired')!;
        const branched = calculateCropRotation({
          ...input,
          didNotWitherStepIds: [pairedStep.id]
        });

        expect(
          branched.steps.some(
            step =>
              step.kind === 'surviving' &&
              step.harvestColor === pairedStep.unchosenColor
          )
        ).toBe(true);
        return `${pairedStep.harvestColor}:${pairedStep.unchosenColor}`;
      });

      expect(new Set(mappings)).toEqual(
        new Set([
          `${firstColor}:${secondColor}`,
          `${secondColor}:${firstColor}`
        ])
      );
    }
  );

  it('retains the common prefix and discards an invalidated suffix outcome', () => {
    const input = {
      pairs: ['yellow-blue', 'yellow-purple', 'blue-purple'] as const,
      settings: referenceCropRotationSettings,
      lifeforcePrices: prices
    };
    const initial = calculateCropRotation(input);
    const pairedSteps = initial.steps.filter(step => step.kind === 'paired');
    const laterBranch = calculateCropRotation({
      ...input,
      didNotWitherStepIds: [pairedSteps[1]!.id]
    });
    const earlierBranch = calculateCropRotation({
      ...input,
      didNotWitherStepIds: [pairedSteps[0]!.id, pairedSteps[1]!.id]
    });

    expect(laterBranch.appliedDidNotWitherStepIds).toEqual([
      pairedSteps[1]!.id
    ]);
    expect(earlierBranch.steps[0]!.id).toBe(initial.steps[0]!.id);
    expect(earlierBranch.appliedDidNotWitherStepIds).toEqual([
      pairedSteps[0]!.id
    ]);
    expect(earlierBranch.steps.slice(1).map(step => step.id)).not.toEqual(
      laterBranch.steps.slice(1).map(step => step.id)
    );
  });

  it('consumes five pairs and five Surviving crops in at most ten steps', () => {
    const baseInput = {
      pairs: [
        'yellow-blue',
        'yellow-purple',
        'blue-purple',
        'yellow-yellow',
        'purple-purple'
      ] as const,
      settings: referenceCropRotationSettings,
      lifeforcePrices: prices
    };
    let outcomeIds: string[] = [];
    let result = calculateCropRotation(baseInput);

    for (let pairedCount = 0; pairedCount < 5; pairedCount += 1) {
      const nextPairedStep = result.steps.find(
        step => step.kind === 'paired' && !step.didNotWither
      )!;
      result = calculateCropRotation({
        ...baseInput,
        didNotWitherStepIds: [...outcomeIds, nextPairedStep.id]
      });
      outcomeIds = [...result.appliedDidNotWitherStepIds];
    }

    expect(result.appliedDidNotWitherStepIds).toHaveLength(5);
    expect(result.steps.filter(step => step.kind === 'paired')).toHaveLength(5);
    expect(result.steps.filter(step => step.kind === 'surviving')).toHaveLength(
      5
    );
    expect(result.steps).toHaveLength(10);
    expect(new Set(result.steps.map(step => step.id)).size).toBe(10);
  });
});
