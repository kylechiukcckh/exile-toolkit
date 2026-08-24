export interface HealthReport {
  readonly service: 'exile-toolkit-api';
  readonly status: 'ok';
  readonly timestamp: string;
}

export function createHealthReport(timestamp: string): HealthReport {
  return {
    service: 'exile-toolkit-api',
    status: 'ok',
    timestamp
  };
}
