import {
  referenceCropRotationSettings,
  type CropPairKind
} from '@exile-toolkit/domain';
import { describe, expect, it } from 'vitest';

import {
  cropRotationToolStateDefaults,
  sanitizeCropRotationToolState
} from './use-crop-rotation-local-state';

describe('Crop Rotation local Tool state', () => {
  it('accepts pair counts and valid Advanced settings', () => {
    const counts = {
      ...cropRotationToolStateDefaults.counts,
      'yellow-purple': 2
    } satisfies Record<CropPairKind, number>;

    expect(
      sanitizeCropRotationToolState({
        version: 1,
        counts,
        settings: {
          ...referenceCropRotationSettings,
          mapPackSizePercent: 70
        }
      })
    ).toEqual({
      version: 1,
      counts,
      settings: {
        ...referenceCropRotationSettings,
        mapPackSizePercent: 70
      }
    });
  });

  it.each([
    null,
    { version: 2 },
    {
      version: 1,
      counts: { ...cropRotationToolStateDefaults.counts, 'yellow-yellow': 6 },
      settings: referenceCropRotationSettings
    },
    {
      version: 1,
      counts: cropRotationToolStateDefaults.counts,
      settings: {
        ...referenceCropRotationSettings,
        tier3To4ChancePercent: Number.NaN
      }
    }
  ])('falls back safely for invalid persisted state %#', value => {
    expect(sanitizeCropRotationToolState(value)).toEqual(
      cropRotationToolStateDefaults
    );
  });
});
