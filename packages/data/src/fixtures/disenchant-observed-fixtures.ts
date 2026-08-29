// Keep these acceptance values literal. The importer must not regenerate them.
// The ilvl 84 values come from the pinned local reference implementation and
// make the fixture fail if its output is merely relabeled as ilvl 85.
export const observedDisenchantFixtures = [
  {
    name: 'Original Sin',
    baseType: 'Amethyst Ring',
    category: 'accessory',
    itemLevel: 85,
    quality: 0,
    observedDustValue: 2_963_336,
    referenceItemLevel84DustValue: 2_822_225
  },
  {
    name: 'Original Sin',
    baseType: 'Amethyst Ring',
    category: 'accessory',
    itemLevel: 85,
    quality: 20,
    observedDustValue: 4_148_671,
    referenceItemLevel84DustValue: 3_951_115
  },
  {
    name: 'Reefbane',
    baseType: 'Fishing Rod',
    category: 'weapon',
    itemLevel: 85,
    quality: 20,
    observedDustValue: 3_128_307,
    referenceItemLevel84DustValue: 2_979_340
  },
  {
    name: 'The Squire',
    baseType: 'Elegant Round Shield',
    category: 'armour',
    itemLevel: 85,
    quality: 20,
    observedDustValue: 2_825_046,
    referenceItemLevel84DustValue: 2_690_520
  },
  {
    name: 'Skin of the Lords',
    baseType: 'Simple Robe',
    category: 'armour',
    itemLevel: 85,
    quality: 0,
    observedDustValue: 34_808,
    referenceItemLevel84DustValue: 33_150
  }
] as const;
