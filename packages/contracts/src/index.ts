import type { WorkspaceManifest } from '@exile-toolkit/domain';

export interface HealthReport {
  readonly service: 'exile-toolkit-api';
  readonly status: 'ok';
  readonly timestamp: string;
  readonly workspace: WorkspaceManifest['name'];
}

export function isHealthReport(value: unknown): value is HealthReport {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const report = value as Partial<HealthReport>;
  return (
    report.service === 'exile-toolkit-api' &&
    report.status === 'ok' &&
    typeof report.timestamp === 'string' &&
    report.workspace === 'Exile Toolkit'
  );
}
