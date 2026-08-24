import { describe, expect, it } from 'vitest';

import { sanitizeWorkspaceLocalState } from './workspace-state';

describe('sanitizeWorkspaceLocalState', () => {
  it('keeps preferences, favorites, and explicitly Saved calculations', () => {
    const result = sanitizeWorkspaceLocalState({
      theme: 'system',
      density: 'comfortable',
      favorites: ['regex'],
      savedCalculations: [
        {
          id: 'saved-1',
          name: 'My calculation',
          category: 'map',
          selectedIds: ['custom-1'],
          customEntries: [
            { id: 'custom-1', name: 'Pasted map text', category: 'map' }
          ]
        }
      ],
      history: []
    });

    expect(result.state).toMatchObject({
      theme: 'system',
      density: 'comfortable',
      favorites: ['regex']
    });
    expect(result.state.savedCalculations[0]?.customEntries[0]?.name).toBe(
      'Pasted map text'
    );
  });

  it('bounds history at 20 and never accepts Custom text in history', () => {
    const history = Array.from({ length: 25 }, (_, index) => ({
      id: `history-${index}`,
      category: 'map',
      selectedIds: ['beach-map'],
      customEntries: [{ id: 'private', name: 'pasted private text' }]
    }));

    const result = sanitizeWorkspaceLocalState({ history });

    expect(result.state.history).toHaveLength(20);
    expect(JSON.stringify(result.state.history)).not.toContain(
      'pasted private text'
    );
  });

  it('bounds nested selections and Custom entries before retaining them', () => {
    const selectedIds = Array.from(
      { length: 250 },
      (_, index) => `map-${index}`
    );
    const customEntries = Array.from({ length: 250 }, (_, index) => ({
      id: `custom-${index}`,
      name: `Custom ${index}`,
      category: 'map'
    }));

    const result = sanitizeWorkspaceLocalState({
      savedCalculations: [
        {
          id: 'saved-1',
          name: 'Large calculation',
          category: 'map',
          selectedIds,
          customEntries
        }
      ],
      history: [{ id: 'history-1', category: 'map', selectedIds }]
    });

    expect(result.state.savedCalculations[0]?.selectedIds).toHaveLength(200);
    expect(result.state.savedCalculations[0]?.customEntries).toHaveLength(200);
    expect(result.state.history[0]?.selectedIds).toHaveLength(200);
  });
});
