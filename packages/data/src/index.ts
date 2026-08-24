import type { WorkspaceManifest } from '@exile-toolkit/domain';

export { mapDataset } from './map-dataset';
export { mapModifierDataset } from './map-modifier-dataset';

export const workspaceManifest = {
  game: 'Path of Exile 1',
  leagueScope: 'current-challenge',
  name: 'Exile Toolkit'
} satisfies WorkspaceManifest;
