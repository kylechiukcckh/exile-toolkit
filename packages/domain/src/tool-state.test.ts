import { describe, expect, it } from 'vitest';

import { decodeRegexToolState, encodeRegexToolState } from './tool-state';

describe('versioned regex Tool state', () => {
  it('round-trips approved category and Curated Selection only', () => {
    const encoded = encodeRegexToolState({
      category: 'map-modifier',
      selectedIds: ['cannot-regenerate', 'vulnerability']
    });

    expect(decodeRegexToolState(encoded)).toEqual({
      valid: true,
      state: {
        category: 'map-modifier',
        selectedIds: ['cannot-regenerate', 'vulnerability']
      }
    });
    expect(encoded).not.toContain('cannot-regenerate');
  });

  it.each([
    ['malformed data', 'not-base64', 'The shared Tool state is malformed.'],
    [
      'unsupported version',
      'eyJ2ZXJzaW9uIjoyLCJjYXRlZ29yeSI6Im1hcCIsInNlbGVjdGVkSWRzIjpbXX0=',
      'Shared Tool state version 2 is not supported.'
    ],
    [
      'oversized data',
      'a'.repeat(2001),
      'The shared Tool state is too large to open safely.'
    ]
  ])('rejects %s', (_name, encoded, message) => {
    expect(decodeRegexToolState(encoded)).toEqual({ valid: false, message });
  });
});
