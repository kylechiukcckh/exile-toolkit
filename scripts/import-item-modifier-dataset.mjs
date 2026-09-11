import {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rename,
  rm,
  stat,
  writeFile
} from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import prettier from 'prettier';
import {
  normalizeModifierStatTemplate,
  validateItemModifierDataset
} from '../packages/domain/src/item-modifier-dataset.ts';

const defaultSourceDirectory = new URL(
  '../packages/data/source/item-modifiers/',
  import.meta.url
);
const defaultOutputDirectory = fileURLToPath(
  new URL('../packages/data/src/generated/item-modifiers/', import.meta.url)
);
const isMainModule =
  process.argv[1] !== undefined &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1]);
const modifierHeaders = [
  'id',
  'sourceId',
  'active',
  'name',
  'tier',
  'sourcePool',
  'domain',
  'generationType',
  'slotType',
  'requiredItemLevel',
  'families',
  'tags',
  'addedTags',
  'implicitTags',
  'spawnWeights',
  'generationWeights',
  'stats'
];

if (isMainModule) await runCli();

async function runCli() {
  const imported = await importItemModifierSnapshot(defaultSourceDirectory);
  const chunk = await renderItemModifierChunk(imported.dataset);
  const manifest = renderItemModifierManifest(imported.manifest);
  const chunkPath = join(defaultOutputDirectory, 'amulet-normal.ts');
  const manifestPath = join(defaultOutputDirectory, 'manifest.json');

  if (process.argv.includes('--check')) {
    const [existingChunk, existingManifest] = await Promise.all([
      readFile(chunkPath, 'utf8'),
      readFile(manifestPath, 'utf8')
    ]);
    if (existingChunk !== chunk || existingManifest !== manifest) {
      throw new Error(
        'Generated Item modifier data is out of date. Run pnpm data:import-item-modifiers.'
      );
    }
    return;
  }

  await writeItemModifierDataset({
    sourceDirectory: defaultSourceDirectory,
    outputDirectory: defaultOutputDirectory
  });
  console.log(`Wrote ${imported.dataset.modifiers.length} Item modifiers.`);
}

export async function importItemModifierSnapshot(sourceDirectory) {
  const sourceUrl = toDirectoryUrl(sourceDirectory);
  const [manifestText, basesText, rulesText, modifiersText] = await Promise.all(
    [
      readFile(new URL('manifest.json', sourceUrl), 'utf8'),
      readFile(new URL('base-types.csv', sourceUrl), 'utf8'),
      readFile(new URL('base-rules.csv', sourceUrl), 'utf8'),
      readFile(new URL('modifiers/normal/amulet.csv', sourceUrl), 'utf8')
    ]
  );
  const manifestSource = JSON.parse(manifestText);
  const bases = parseCsvObjects(basesText, 'base-types.csv', [
    'id',
    'name',
    'equipmentClass',
    'requiredLevel',
    'tags',
    'qualityType',
    'magicCapacity',
    'rareCapacity',
    'ruleIds'
  ]).map(parseBase);
  const baseRules = parseCsvObjects(rulesText, 'base-rules.csv', [
    'id',
    'baseId',
    'sourceText',
    'effects'
  ]).map(parseBaseRule);
  const canonicalModifiers = parseCsvObjects(
    modifiersText,
    'amulet.csv',
    modifierHeaders
  )
    .map(parseModifier)
    .sort(compareIds);
  await validateCrossPoolModifierDefinitions(sourceUrl);
  const canonicalDataset = {
    schemaVersion: manifestSource.schemaVersion,
    gameVersion: manifestSource.gameVersion,
    revision: manifestSource.revision,
    equipmentClass: 'amulet',
    sourcePool: 'normal',
    bases: bases.sort(compareIds),
    baseRules: baseRules.sort(compareIds),
    modifiers: canonicalModifiers,
    indexes: buildIndexes(canonicalModifiers)
  };
  validateImportedSnapshot(canonicalDataset, manifestSource);
  const canonicalValidation = validateItemModifierDataset(canonicalDataset);
  if (!canonicalValidation.valid) {
    throw new Error(
      `Item modifier domain validation failed:\n${canonicalValidation.issues.join('\n')}`
    );
  }
  const modifiers = canonicalModifiers.filter(modifier => modifier.active);
  const dataset = {
    ...canonicalDataset,
    modifiers,
    indexes: buildIndexes(modifiers)
  };
  const validation = validateItemModifierDataset(dataset);
  if (!validation.valid) {
    throw new Error(
      `Item modifier domain validation failed:\n${validation.issues.join('\n')}`
    );
  }
  return {
    dataset,
    manifest: {
      ...manifestSource,
      retiredModifierIds: canonicalModifiers
        .filter(modifier => !modifier.active)
        .map(modifier => modifier.id),
      chunks: { 'amulet/normal': 'amulet-normal.ts' }
    }
  };
}

async function validateCrossPoolModifierDefinitions(sourceUrl) {
  const modifierRoot = new URL('modifiers/', sourceUrl);
  const pools = await readdir(modifierRoot, { withFileTypes: true });
  const definitions = new Map();
  for (const pool of pools.filter(entry => entry.isDirectory())) {
    const poolUrl = new URL(`${pool.name}/`, modifierRoot);
    const files = await readdir(poolUrl, { withFileTypes: true });
    for (const file of files.filter(
      entry => entry.isFile() && entry.name.endsWith('.csv')
    )) {
      const text = await readFile(new URL(file.name, poolUrl), 'utf8');
      const modifiers = parseCsvObjects(text, file.name, modifierHeaders).map(
        parseModifier
      );
      for (const modifier of modifiers) {
        const sharedDefinition = JSON.stringify(
          Object.fromEntries(
            Object.entries(modifier).filter(([key]) => key !== 'sourcePool')
          )
        );
        const previous = definitions.get(modifier.id);
        if (previous?.pool === modifier.sourcePool)
          throw new Error(`duplicate permanent Toolkit ID ${modifier.id}`);
        if (previous && previous.definition !== sharedDefinition)
          throw new Error(
            `${modifier.id} has conflicting definitions across source pools`
          );
        definitions.set(modifier.id, {
          definition: sharedDefinition,
          pool: modifier.sourcePool
        });
      }
    }
  }
}

export async function writeItemModifierDataset({
  sourceDirectory,
  outputDirectory
}) {
  const imported = await importItemModifierSnapshot(sourceDirectory);
  const chunk = await renderItemModifierChunk(imported.dataset);
  const manifest = renderItemModifierManifest(imported.manifest);
  const target = resolve(outputDirectory);
  const parent = dirname(target);
  if (target === parent)
    throw new Error('Output directory must not be a filesystem root');
  await mkdir(parent, { recursive: true });
  const staging = await mkdtemp(join(parent, `.${basename(target)}-staging-`));
  const backup = `${staging}-previous`;
  let movedPrevious = false;
  try {
    await Promise.all([
      writeFile(join(staging, 'amulet-normal.ts'), chunk),
      writeFile(join(staging, 'manifest.json'), manifest)
    ]);
    if (await exists(target)) {
      await rename(target, backup);
      movedPrevious = true;
    }
    await rename(staging, target);
    if (movedPrevious) await rm(backup, { recursive: true });
  } catch (error) {
    if (!(await exists(target)) && movedPrevious) await rename(backup, target);
    if (await exists(staging)) await rm(staging, { recursive: true });
    throw error;
  }
}

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch (error) {
    if (error && error.code === 'ENOENT') return false;
    throw error;
  }
}

export async function renderItemModifierChunk(dataset) {
  return prettier.format(
    `// Generated by scripts/import-item-modifier-dataset.mjs. Do not edit.\nimport type { ItemModifierDataset } from '@exile-toolkit/domain';\n\nexport const itemModifierDataset = ${JSON.stringify(dataset, null, 2)} satisfies ItemModifierDataset;\n`,
    {
      parser: 'typescript',
      arrowParens: 'avoid',
      singleQuote: true,
      trailingComma: 'none'
    }
  );
}

function renderItemModifierManifest(manifest) {
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

function parseBase(row, index) {
  return {
    id: required(row.id, `base-types.csv row ${index + 2} id`),
    name: required(row.name, `base-types.csv row ${index + 2} name`),
    equipmentClass: row.equipmentClass,
    requiredLevel: integer(row.requiredLevel),
    tags: json(row.tags),
    qualityType: row.qualityType,
    magicCapacity: json(row.magicCapacity),
    rareCapacity: json(row.rareCapacity),
    ruleIds: json(row.ruleIds)
  };
}

function parseBaseRule(row, index) {
  return {
    id: required(row.id, `base-rules.csv row ${index + 2} id`),
    baseId: required(row.baseId, `base-rules.csv row ${index + 2} baseId`),
    sourceText: required(
      row.sourceText,
      `base-rules.csv row ${index + 2} sourceText`
    ),
    effects: json(row.effects)
  };
}

function parseModifier(row, index) {
  const modifier = {
    id: required(row.id, `amulet.csv row ${index + 2} id`),
    active: boolean(row.active),
    name: required(row.name, `amulet.csv row ${index + 2} name`),
    tier: row.tier === '' ? null : integer(row.tier),
    sourcePool: row.sourcePool,
    domain: row.domain,
    generationType: row.generationType,
    slotType: row.slotType,
    requiredItemLevel: integer(row.requiredItemLevel),
    families: json(row.families),
    tags: json(row.tags),
    addedTags: json(row.addedTags),
    implicitTags: json(row.implicitTags),
    spawnWeights: json(row.spawnWeights),
    generationWeights: json(row.generationWeights),
    stats: json(row.stats)
  };
  return row.sourceId === ''
    ? modifier
    : { ...modifier, sourceId: row.sourceId };
}

function buildIndexes(modifiers) {
  const indexes = {
    modifierIds: {},
    families: {},
    statTemplates: {},
    eligibilityTags: {},
    generationTypes: {},
    slotTypes: {}
  };
  modifiers.forEach((modifier, index) => {
    indexes.modifierIds[modifier.id] = index;
    addIndexes(indexes.families, modifier.families, index);
    addIndexes(
      indexes.statTemplates,
      modifier.stats.map(stat => normalizeModifierStatTemplate(stat.text)),
      index
    );
    addIndexes(
      indexes.eligibilityTags,
      modifier.spawnWeights.map(weight => weight.tag),
      index
    );
    addIndexes(indexes.generationTypes, [modifier.generationType], index);
    addIndexes(indexes.slotTypes, [modifier.slotType], index);
  });
  return indexes;
}

function addIndexes(target, keys, index) {
  for (const key of new Set(keys)) (target[key] ??= []).push(index);
}

function validateImportedSnapshot(dataset, manifest) {
  const issues = [];
  if (manifest.schemaVersion !== 1) issues.push('schemaVersion must be 1');
  if (!manifest.gameVersion) issues.push('gameVersion is required');
  if (!Number.isSafeInteger(manifest.revision) || manifest.revision < 1)
    issues.push('revision must be a positive integer');
  if (!manifest.preparedAt || !manifest.reviewer || !manifest.coverage)
    issues.push('preparedAt, reviewer, and coverage are required');
  if (!Array.isArray(manifest.sources) || manifest.sources.length === 0)
    issues.push('sources must be a non-empty array');
  else
    manifest.sources.forEach((source, index) => {
      for (const field of ['name', 'license', 'attribution'])
        if (
          !source ||
          typeof source[field] !== 'string' ||
          !source[field].trim()
        )
          issues.push(`sources[${index}].${field} must be a non-empty string`);
      for (const field of ['url', 'licenseUrl'])
        if (!source || !isUrl(source[field]))
          issues.push(`sources[${index}].${field} must be a valid URL`);
    });
  if (!Array.isArray(manifest.disagreements))
    issues.push('disagreements must be an array');
  const baseIds = new Set(dataset.bases.map(base => base.id));
  const ruleIds = new Set(dataset.baseRules.map(rule => rule.id));
  for (const base of dataset.bases)
    for (const ruleId of base.ruleIds)
      if (!ruleIds.has(ruleId))
        issues.push(`base ${base.id} references missing rule ${ruleId}`);
  for (const rule of dataset.baseRules)
    if (!baseIds.has(rule.baseId))
      issues.push(`rule ${rule.id} references missing base ${rule.baseId}`);
  for (const collection of [
    dataset.bases,
    dataset.baseRules,
    dataset.modifiers
  ]) {
    const seen = new Set();
    for (const record of collection) {
      if (seen.has(record.id))
        issues.push(`duplicate permanent Toolkit ID ${record.id}`);
      seen.add(record.id);
    }
  }
  if (issues.length > 0)
    throw new Error(
      `Item modifier source validation failed:\n${issues.join('\n')}`
    );
}

function parseCsvObjects(text, filename, expectedHeaders) {
  const rows = parseCsv(text.trim());
  const headers = rows.shift();
  if (!headers || headers.length === 0)
    throw new Error('CSV header is required');
  const unknown = headers.filter(header => !expectedHeaders.includes(header));
  const missing = expectedHeaders.filter(header => !headers.includes(header));
  if (unknown.length > 0)
    throw new Error(`${filename} has unknown column "${unknown[0]}"`);
  if (missing.length > 0)
    throw new Error(`${filename} is missing required column "${missing[0]}"`);
  return rows.map((values, rowIndex) => {
    if (values.length !== headers.length)
      throw new Error(
        `CSV row ${rowIndex + 2} has ${values.length} fields; expected ${headers.length}`
      );
    return Object.fromEntries(
      headers.map((header, index) => [header, values[index]])
    );
  });
}

function isUrl(value) {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted && character === '"' && text[index + 1] === '"') {
      field += '"';
      index += 1;
    } else if (character === '"') quoted = !quoted;
    else if (character === ',' && !quoted) {
      row.push(field);
      field = '';
    } else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && text[index + 1] === '\n') index += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else field += character;
  }
  row.push(field);
  rows.push(row);
  if (quoted) throw new Error('CSV contains an unterminated quoted field');
  return rows;
}

function toDirectoryUrl(value) {
  if (value instanceof URL) return value;
  return pathToFileURL(`${resolve(value)}${value.endsWith('/') ? '' : '/'}`);
}

function compareIds(left, right) {
  return left.id.localeCompare(right.id, 'en');
}

function required(value, path) {
  if (typeof value !== 'string' || value.trim() === '')
    throw new Error(`${path} must be a non-empty string`);
  return value;
}

function integer(value) {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed))
    throw new Error(`Expected integer, received ${value}`);
  return parsed;
}

function boolean(value) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new Error(`Expected boolean, received ${value}`);
}

function json(value) {
  return JSON.parse(value);
}
