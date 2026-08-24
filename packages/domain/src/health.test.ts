import { describe, expect, it } from 'vitest';

import { createHealthReport } from './health';

describe('health report', () => {
  it('reports a healthy Exile Toolkit service through its public contract', () => {
    expect(createHealthReport('2026-08-25T12:00:00.000Z')).toEqual({
      service: 'exile-toolkit-api',
      status: 'ok',
      timestamp: '2026-08-25T12:00:00.000Z'
    });
  });
});
