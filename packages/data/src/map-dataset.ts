import type { CuratedDataset, CuratedEntry } from '@exile-toolkit/domain';

const datasetVersion = '2026.08.25';
const gameVersion = '3.29';
const reviewedAt = '2026-08-25T00:00:00.000Z';
const wikiLicense = {
  name: 'CC BY-NC-SA 3.0',
  url: 'https://www.poewiki.net/wiki/Path_of_Exile_Wiki:Copyrights'
} as const;

const reviewedMaps = [
  ['beach-map', 'Beach Map', 'Beach_Map'],
  ['cemetery-map', 'Cemetery Map', 'Cemetery_Map'],
  ['city-square-map', 'City Square Map', 'City_Square_Map'],
  ['dunes-map', 'Dunes Map', 'Dunes_Map'],
  ['glacier-map', 'Glacier Map', 'Glacier_Map'],
  ['jungle-valley-map', 'Jungle Valley Map', 'Jungle_Valley_Map'],
  ['mesa-map', 'Mesa Map', 'Mesa_Map'],
  ['strand-map', 'Strand Map', 'Strand_Map'],
  ['toxic-sewer-map', 'Toxic Sewer Map', 'Toxic_Sewer_Map'],
  ['underground-sea-map', 'Underground Sea Map', 'Underground_Sea_Map'],
  ['volcano-map', 'Volcano Map', 'Volcano_Map'],
  ['waste-pool-map', 'Waste Pool Map', 'Waste_Pool_Map']
] as const;

export const mapDataset = {
  id: 'poe1-maps',
  version: datasetVersion,
  category: 'map',
  coverage:
    'Twelve reviewed Path of Exile 1 map base types for the first beta workflow; this is not full Atlas coverage.',
  entries: reviewedMaps.map(([id, name, wikiPage]) =>
    makeMapEntry(id, name, wikiPage)
  )
} satisfies CuratedDataset;

function makeMapEntry(
  id: string,
  name: string,
  wikiPage: string
): CuratedEntry {
  return {
    id,
    category: 'map',
    name,
    provenance: {
      source: {
        name: 'Path of Exile Wiki',
        url: `https://www.poewiki.net/wiki/${wikiPage}`
      },
      gameVersion,
      verification: 'reviewed',
      license: wikiLicense,
      updatedAt: reviewedAt
    }
  };
}
