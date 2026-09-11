export type EquipmentClass = 'amulet';
export type ModifierSourcePool =
  | 'normal'
  | 'influenced'
  | 'delve'
  | 'drop-only'
  | 'essence'
  | 'crafted'
  | 'veiled'
  | 'implicit'
  | 'corruption'
  | 'enchantment';
export type ModifierGenerationType =
  'prefix' | 'suffix' | 'implicit' | 'enchantment';
export type ModifierSlotType =
  'prefix' | 'suffix' | 'implicit' | 'enchantment' | 'none';

export interface AffixCapacity {
  readonly prefixes: number;
  readonly suffixes: number;
}

export interface ItemBaseType {
  readonly id: string;
  readonly name: string;
  readonly equipmentClass: EquipmentClass;
  readonly requiredLevel: number;
  readonly tags: readonly string[];
  readonly qualityType: 'catalyst' | 'ordinary' | 'none';
  readonly magicCapacity: AffixCapacity;
  readonly rareCapacity: AffixCapacity;
  readonly ruleIds: readonly string[];
}

export type ItemBaseRuleEffect =
  | { readonly type: 'prefix-capacity-adjustment'; readonly amount: number }
  | { readonly type: 'suffix-capacity-adjustment'; readonly amount: number }
  | {
      readonly type: 'explicit-magnitude';
      readonly percent: number;
      readonly slot?: 'prefix' | 'suffix' | 'all';
    }
  | {
      readonly type: 'implicit-modifiers-changeable';
      readonly changeable: boolean;
    };

export interface ItemBaseRule {
  readonly id: string;
  readonly baseId: string;
  readonly sourceText: string;
  readonly effects: readonly ItemBaseRuleEffect[];
}

export interface ModifierWeight {
  readonly tag: string;
  readonly weight: number;
}

export interface ItemModifierStat {
  readonly id: string;
  readonly text: string;
  readonly rawMin: number;
  readonly rawMax: number;
  readonly internalPrecision: number;
  readonly displayPrecision: number;
  readonly scalable: boolean;
  readonly rounding: 'floor';
}

export interface ItemModifier {
  readonly id: string;
  readonly sourceId?: string;
  readonly active: boolean;
  readonly name: string;
  readonly tier: number | null;
  readonly sourcePool: ModifierSourcePool;
  readonly domain: 'item';
  readonly generationType: ModifierGenerationType;
  readonly slotType: ModifierSlotType;
  readonly requiredItemLevel: number;
  readonly families: readonly string[];
  readonly tags: readonly string[];
  readonly addedTags: readonly string[];
  readonly implicitTags: readonly string[];
  readonly spawnWeights: readonly ModifierWeight[];
  readonly generationWeights: readonly ModifierWeight[];
  readonly stats: readonly ItemModifierStat[];
}

export interface ItemModifierIndexes {
  readonly modifierIds: Readonly<Record<string, number>>;
  readonly families: Readonly<Record<string, readonly number[]>>;
  readonly statTemplates: Readonly<Record<string, readonly number[]>>;
  readonly eligibilityTags: Readonly<Record<string, readonly number[]>>;
  readonly generationTypes: Readonly<Record<string, readonly number[]>>;
  readonly slotTypes: Readonly<Record<string, readonly number[]>>;
}

export interface ItemModifierDataset {
  readonly schemaVersion: 1;
  readonly gameVersion: string;
  readonly revision: number;
  readonly equipmentClass: EquipmentClass;
  readonly sourcePool: ModifierSourcePool;
  readonly bases: readonly ItemBaseType[];
  readonly baseRules: readonly ItemBaseRule[];
  readonly modifiers: readonly ItemModifier[];
  readonly indexes: ItemModifierIndexes;
}

export type ItemModifierDatasetValidationResult =
  | { readonly valid: true; readonly dataset: ItemModifierDataset }
  | { readonly valid: false; readonly issues: readonly string[] };

export function normalizeModifierStatTemplate(template: string): string {
  return template.trim().replace(/\s+/g, ' ').toLowerCase();
}

export function validateItemModifierDataset(
  input: unknown
): ItemModifierDatasetValidationResult {
  const issues: string[] = [];
  if (!isRecord(input))
    return { valid: false, issues: ['dataset must be an object'] };

  if (input.schemaVersion !== 1) issues.push('schemaVersion must be 1');
  requireString(input.gameVersion, 'gameVersion', issues);
  if (!Number.isSafeInteger(input.revision) || (input.revision as number) < 1)
    issues.push('revision must be a positive integer');
  if (input.equipmentClass !== 'amulet')
    issues.push('equipmentClass must be amulet');
  if (!isSourcePool(input.sourcePool))
    issues.push('sourcePool is not supported');
  validateBases(input.bases, issues);
  validateRules(input.baseRules, input.bases, issues);
  validateModifiers(input.modifiers, input.sourcePool, issues);
  validateIndexes(input.indexes, input.modifiers, issues);

  return issues.length === 0
    ? { valid: true, dataset: input as unknown as ItemModifierDataset }
    : { valid: false, issues };
}

function validateBases(value: unknown, issues: string[]) {
  if (!Array.isArray(value) || value.length === 0) {
    issues.push('bases must be a non-empty array');
    return;
  }
  const ids = new Set<string>();
  value.forEach((base, index) => {
    const path = `bases[${index}]`;
    if (!isRecord(base)) return issues.push(`${path} must be an object`);
    requirePermanentId(base.id, `${path}.id`, ids, issues);
    requireString(base.name, `${path}.name`, issues);
    if (base.equipmentClass !== 'amulet')
      issues.push(`${path}.equipmentClass must be amulet`);
    requireNonNegativeInteger(
      base.requiredLevel,
      `${path}.requiredLevel`,
      issues
    );
    requireStrings(base.tags, `${path}.tags`, issues, true);
    if (!['catalyst', 'ordinary', 'none'].includes(String(base.qualityType)))
      issues.push(`${path}.qualityType is not supported`);
    validateCapacity(base.magicCapacity, `${path}.magicCapacity`, issues);
    validateCapacity(base.rareCapacity, `${path}.rareCapacity`, issues);
    requireStrings(base.ruleIds, `${path}.ruleIds`, issues);
  });
}

function validateRules(value: unknown, bases: unknown, issues: string[]) {
  if (!Array.isArray(value)) return issues.push('baseRules must be an array');
  const baseIds = new Set(
    Array.isArray(bases)
      ? bases
          .filter(isRecord)
          .map(base => base.id)
          .filter((id): id is string => typeof id === 'string')
      : []
  );
  const ruleIds = new Set<string>();
  value.forEach((rule, index) => {
    const path = `baseRules[${index}]`;
    if (!isRecord(rule)) return issues.push(`${path} must be an object`);
    requirePermanentId(rule.id, `${path}.id`, ruleIds, issues);
    if (typeof rule.baseId !== 'string' || !baseIds.has(rule.baseId))
      issues.push(`${path}.baseId must reference a base`);
    requireString(rule.sourceText, `${path}.sourceText`, issues);
    if (!Array.isArray(rule.effects) || rule.effects.length === 0) {
      issues.push(`${path}.effects must be a non-empty array`);
    } else {
      rule.effects.forEach((effect, effectIndex) =>
        validateRuleEffect(effect, `${path}.effects[${effectIndex}]`, issues)
      );
    }
  });
}

function validateRuleEffect(value: unknown, path: string, issues: string[]) {
  if (!isRecord(value)) {
    issues.push(`${path} must be an object`);
    return;
  }
  if (
    value.type === 'prefix-capacity-adjustment' ||
    value.type === 'suffix-capacity-adjustment'
  ) {
    if (!Number.isSafeInteger(value.amount))
      issues.push(`${path}.amount must be an integer`);
    return;
  }
  if (value.type === 'explicit-magnitude') {
    if (!Number.isFinite(value.percent))
      issues.push(`${path}.percent must be a finite number`);
    if (
      value.slot !== undefined &&
      !['prefix', 'suffix', 'all'].includes(String(value.slot))
    )
      issues.push(`${path}.slot is not supported`);
    return;
  }
  if (value.type === 'implicit-modifiers-changeable') {
    if (typeof value.changeable !== 'boolean')
      issues.push(`${path}.changeable must be boolean`);
    return;
  }
  issues.push(`${path}.type is not supported`);
}

function validateModifiers(
  value: unknown,
  sourcePool: unknown,
  issues: string[]
) {
  if (!Array.isArray(value) || value.length === 0)
    return issues.push('modifiers must be a non-empty array');
  const ids = new Set<string>();
  value.forEach((modifier, index) => {
    const path = `modifiers[${index}]`;
    if (!isRecord(modifier)) return issues.push(`${path} must be an object`);
    requirePermanentId(modifier.id, `${path}.id`, ids, issues);
    if (modifier.sourceId !== undefined)
      requireString(modifier.sourceId, `${path}.sourceId`, issues);
    if (typeof modifier.active !== 'boolean')
      issues.push(`${path}.active must be boolean`);
    requireString(modifier.name, `${path}.name`, issues);
    if (
      modifier.tier !== null &&
      (!Number.isSafeInteger(modifier.tier) || (modifier.tier as number) < 1)
    )
      issues.push(`${path}.tier must be null or a positive integer`);
    if (modifier.sourcePool !== sourcePool)
      issues.push(`${path}.sourcePool must match the chunk`);
    if (modifier.domain !== 'item') issues.push(`${path}.domain must be item`);
    if (
      !['prefix', 'suffix', 'implicit', 'enchantment'].includes(
        String(modifier.generationType)
      )
    )
      issues.push(`${path}.generationType is not supported`);
    if (
      !['prefix', 'suffix', 'implicit', 'enchantment', 'none'].includes(
        String(modifier.slotType)
      )
    )
      issues.push(`${path}.slotType is not supported`);
    requireNonNegativeInteger(
      modifier.requiredItemLevel,
      `${path}.requiredItemLevel`,
      issues
    );
    for (const key of [
      'families',
      'tags',
      'addedTags',
      'implicitTags'
    ] as const)
      requireStrings(modifier[key], `${path}.${key}`, issues);
    validateWeights(
      modifier.spawnWeights,
      `${path}.spawnWeights`,
      issues,
      true
    );
    validateWeights(
      modifier.generationWeights,
      `${path}.generationWeights`,
      issues,
      false
    );
    validateStats(modifier.stats, `${path}.stats`, issues);
  });
}

function validateIndexes(
  indexes: unknown,
  modifiers: unknown,
  issues: string[]
) {
  if (!isRecord(indexes)) return issues.push('indexes must be an object');
  for (const key of [
    'modifierIds',
    'families',
    'statTemplates',
    'eligibilityTags',
    'generationTypes',
    'slotTypes'
  ])
    if (!isRecord(indexes[key]))
      issues.push(`indexes.${key} must be an object`);
  if (!Array.isArray(modifiers) || !isRecord(indexes.modifierIds)) return;
  const modifierIds = indexes.modifierIds;
  modifiers.forEach((modifier, index) => {
    if (
      isRecord(modifier) &&
      typeof modifier.id === 'string' &&
      modifierIds[modifier.id] !== index
    )
      issues.push(
        `${`modifiers[${index}]`} must be reachable from indexes.modifierIds by id "${modifier.id}"`
      );
  });
  validateLookupIndex(
    indexes.families,
    modifiers,
    modifier =>
      isRecord(modifier) && Array.isArray(modifier.families)
        ? modifier.families
        : [],
    'families',
    issues
  );
  validateLookupIndex(
    indexes.statTemplates,
    modifiers,
    modifier =>
      isRecord(modifier) && Array.isArray(modifier.stats)
        ? modifier.stats
            .filter(isRecord)
            .map(stat => stat.text)
            .filter((text): text is string => typeof text === 'string')
            .map(normalizeModifierStatTemplate)
        : [],
    'statTemplates',
    issues
  );
  validateLookupIndex(
    indexes.eligibilityTags,
    modifiers,
    modifier =>
      isRecord(modifier) && Array.isArray(modifier.spawnWeights)
        ? modifier.spawnWeights
            .filter(isRecord)
            .map(weight => weight.tag)
            .filter((tag): tag is string => typeof tag === 'string')
        : [],
    'eligibilityTags',
    issues
  );
  validateLookupIndex(
    indexes.generationTypes,
    modifiers,
    modifier =>
      isRecord(modifier) && typeof modifier.generationType === 'string'
        ? [modifier.generationType]
        : [],
    'generationTypes',
    issues
  );
  validateLookupIndex(
    indexes.slotTypes,
    modifiers,
    modifier =>
      isRecord(modifier) && typeof modifier.slotType === 'string'
        ? [modifier.slotType]
        : [],
    'slotTypes',
    issues
  );
}

function validateLookupIndex(
  value: unknown,
  modifiers: readonly unknown[],
  keysForModifier: (modifier: unknown) => readonly unknown[],
  name: string,
  issues: string[]
) {
  if (!isRecord(value)) return;
  const expected: Record<string, number[]> = {};
  modifiers.forEach((modifier, index) => {
    for (const key of new Set(keysForModifier(modifier))) {
      if (typeof key === 'string') (expected[key] ??= []).push(index);
    }
  });
  if (JSON.stringify(value) !== JSON.stringify(expected))
    issues.push(`indexes.${name} must exactly index every Modifier`);
}

function validateCapacity(value: unknown, path: string, issues: string[]) {
  if (!isRecord(value)) return issues.push(`${path} must be an object`);
  requireNonNegativeInteger(value.prefixes, `${path}.prefixes`, issues);
  requireNonNegativeInteger(value.suffixes, `${path}.suffixes`, issues);
}

function validateWeights(
  value: unknown,
  path: string,
  issues: string[],
  required: boolean
) {
  if (!Array.isArray(value) || (required && value.length === 0))
    return issues.push(
      `${path} must be ${required ? 'a non-empty' : 'an'} array`
    );
  value.forEach((weight, index) => {
    if (!isRecord(weight))
      return issues.push(`${path}[${index}] must be an object`);
    requireString(weight.tag, `${path}[${index}].tag`, issues);
    requireNonNegativeInteger(
      weight.weight,
      `${path}[${index}].weight`,
      issues
    );
  });
}

function validateStats(value: unknown, path: string, issues: string[]) {
  if (!Array.isArray(value) || value.length === 0)
    return issues.push(`${path} must be a non-empty array`);
  value.forEach((stat, index) => {
    const itemPath = `${path}[${index}]`;
    if (!isRecord(stat)) return issues.push(`${itemPath} must be an object`);
    requireString(stat.id, `${itemPath}.id`, issues);
    requireString(stat.text, `${itemPath}.text`, issues);
    if (
      typeof stat.rawMin !== 'number' ||
      typeof stat.rawMax !== 'number' ||
      stat.rawMin > stat.rawMax
    )
      issues.push(`${itemPath} must have an ordered numeric raw range`);
    requireNonNegativeInteger(
      stat.internalPrecision,
      `${itemPath}.internalPrecision`,
      issues
    );
    requireNonNegativeInteger(
      stat.displayPrecision,
      `${itemPath}.displayPrecision`,
      issues
    );
    if (typeof stat.scalable !== 'boolean')
      issues.push(`${itemPath}.scalable must be boolean`);
    if (stat.rounding !== 'floor')
      issues.push(`${itemPath}.rounding must be floor`);
  });
}

function requirePermanentId(
  value: unknown,
  path: string,
  ids: Set<string>,
  issues: string[]
) {
  requireString(value, path, issues);
  if (typeof value !== 'string' || value.length === 0) return;
  if (ids.has(value))
    issues.push(`${path} duplicates permanent Toolkit ID "${value}"`);
  ids.add(value);
}

function requireString(value: unknown, path: string, issues: string[]) {
  if (typeof value !== 'string' || value.trim().length === 0)
    issues.push(`${path} must be a non-empty string`);
}

function requireStrings(
  value: unknown,
  path: string,
  issues: string[],
  nonEmpty = false
) {
  if (
    !Array.isArray(value) ||
    (nonEmpty && value.length === 0) ||
    value.some(item => typeof item !== 'string' || !item)
  )
    issues.push(
      `${path} must be ${nonEmpty ? 'a non-empty ' : ''}string array`
    );
}

function requireNonNegativeInteger(
  value: unknown,
  path: string,
  issues: string[]
) {
  if (!Number.isSafeInteger(value) || (value as number) < 0)
    issues.push(`${path} must be a non-negative integer`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isSourcePool(value: unknown): value is ModifierSourcePool {
  return [
    'normal',
    'influenced',
    'delve',
    'drop-only',
    'essence',
    'crafted',
    'veiled',
    'implicit',
    'corruption',
    'enchantment'
  ].includes(String(value));
}
