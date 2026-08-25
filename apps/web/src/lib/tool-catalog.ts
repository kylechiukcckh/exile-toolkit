export const toolCatalog = [
  {
    id: 'regex',
    name: 'Regex generator',
    detail: 'Build exact stash searches for maps and dangerous modifiers.',
    searchDetail: 'Maps and map modifiers',
    path: '/tools/regex'
  },
  {
    id: 'disenchant',
    name: 'Disenchant calculator',
    detail: 'Compare dust efficiency against current market prices.',
    path: '/tools/disenchant'
  },
  {
    id: 'clusters',
    name: 'Cluster jewel tool',
    detail: 'Check notable compatibility, position, and acquisition.'
  },
  {
    id: 'scarab-ev',
    name: 'Scarab expected value',
    detail: 'Rank vendor combinations with sourced probability data.'
  },
  {
    id: 'warrants',
    name: 'Warrant price checker',
    detail: 'Parse warrant modifiers and compare supported combinations.'
  }
] as const;

export type ToolCatalogEntry = (typeof toolCatalog)[number];
