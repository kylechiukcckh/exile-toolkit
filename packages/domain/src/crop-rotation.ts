import type { LifeforceColor, LifeforcePrices } from './economy-pricing';

export const cropPairKinds = [
  'yellow-yellow',
  'yellow-blue',
  'yellow-purple',
  'blue-blue',
  'blue-purple',
  'purple-purple'
] as const;

export type CropPairKind = (typeof cropPairKinds)[number];

export interface CropRotationSettings {
  readonly noWiltChancePercent: number;
  readonly mapPackSizePercent: number;
  readonly mapItemQuantityPercent: number;
  readonly increasedLifeforceQuantityPercent: number;
  readonly additionalMonsterChancePercent: number;
  readonly monsterDuplicationChancePercent: number;
  readonly doublingScarab: boolean;
  readonly tier1To2ChancePercent: number;
  readonly tier2To3ChancePercent: number;
  readonly tier3To4ChancePercent: number;
}

export const referenceCropRotationSettings: CropRotationSettings = {
  noWiltChancePercent: 60,
  mapPackSizePercent: 65,
  mapItemQuantityPercent: 212,
  increasedLifeforceQuantityPercent: 18,
  additionalMonsterChancePercent: 10,
  monsterDuplicationChancePercent: 6,
  doublingScarab: true,
  tier1To2ChancePercent: 25,
  tier2To3ChancePercent: 20,
  tier3To4ChancePercent: 3
};

export interface CropRotationInput {
  readonly pairs: readonly CropPairKind[];
  readonly settings: CropRotationSettings;
  readonly lifeforcePrices: LifeforcePrices;
}

export interface CropRotationStep {
  readonly id: string;
  readonly kind: 'paired';
  readonly sourcePair: CropPairKind;
  readonly harvestColor: LifeforceColor;
  readonly unchosenColor: LifeforceColor;
  readonly expectedRemainingChaosValue: number;
  readonly expectedRemainingLifeforce: Readonly<Record<LifeforceColor, number>>;
}

export interface CropRotationResult {
  readonly steps: readonly CropRotationStep[];
  readonly expectedChaosValue: number;
  readonly expectedLifeforce: Readonly<Record<LifeforceColor, number>>;
  readonly assumptionsVersion: 't16-cropbot-reference-v1';
}

export type CropRotationValidationResult =
  | { readonly valid: true }
  | { readonly valid: false; readonly issues: readonly string[] };

const colors = ['yellow', 'blue', 'purple'] as const;
const pairColors: Readonly<Record<CropPairKind, readonly [number, number]>> = {
  'yellow-yellow': [0, 0],
  'yellow-blue': [0, 1],
  'yellow-purple': [0, 2],
  'blue-blue': [1, 1],
  'blue-purple': [1, 2],
  'purple-purple': [2, 2]
};

interface CalculationState {
  readonly pairs: readonly number[];
  readonly singles: readonly number[];
  readonly upgrades: readonly number[];
}

interface Choice {
  readonly kind: 'paired' | 'single';
  readonly index: number;
  readonly harvestColor: number;
  readonly unchosenColor: number;
}

interface PolicyResult {
  readonly chaos: number;
  readonly lifeforce: readonly [number, number, number];
  readonly choice?: Choice;
}

export function validateCropRotationInput(
  input: CropRotationInput
): CropRotationValidationResult {
  const issues: string[] = [];
  if (input.pairs.length < 3 || input.pairs.length > 5) {
    issues.push('Starting crop set must contain three to five Crop pairs');
  }
  input.pairs.forEach((pair, index) => {
    if (!cropPairKinds.includes(pair))
      issues.push(`pairs[${index}] is invalid`);
  });

  const boundedSettings = [
    'noWiltChancePercent',
    'additionalMonsterChancePercent',
    'monsterDuplicationChancePercent',
    'tier1To2ChancePercent',
    'tier2To3ChancePercent',
    'tier3To4ChancePercent'
  ] as const;
  for (const key of boundedSettings) {
    const value = input.settings[key];
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      issues.push(`${key} must be between 0 and 100`);
    }
  }
  const nonnegativeSettings = [
    'mapPackSizePercent',
    'mapItemQuantityPercent',
    'increasedLifeforceQuantityPercent'
  ] as const;
  for (const key of nonnegativeSettings) {
    const value = input.settings[key];
    if (!Number.isFinite(value) || value < 0) {
      issues.push(`${key} must be a finite nonnegative number`);
    }
  }
  if (typeof input.settings.doublingScarab !== 'boolean') {
    issues.push('doublingScarab must be a boolean');
  }
  for (const color of colors) {
    const price = input.lifeforcePrices[color]?.chaosPerLifeforce;
    if (!Number.isFinite(price) || price <= 0) {
      issues.push(`${color} Lifeforce price must be finite and positive`);
    }
  }
  return issues.length > 0 ? { valid: false, issues } : { valid: true };
}

export function calculateCropYieldTable(
  settings: CropRotationSettings
): readonly number[] {
  const doubling = settings.doublingScarab ? 2 : 1;
  const packSize = 1 + settings.mapPackSizePercent / 100;
  const duplication = 1 + settings.monsterDuplicationChancePercent / 100;
  const additional = 1 + settings.additionalMonsterChancePercent / 100;
  const dropMultiplier =
    doubling *
    (1 +
      settings.mapItemQuantityPercent / 200 +
      settings.increasedLifeforceQuantityPercent / 100);
  const seeds = 23;
  const tierYields = [
    0.02 * 7 * dropMultiplier * seeds * packSize * duplication * additional,
    0.1 * 18.5 * dropMultiplier * seeds * packSize * duplication * additional,
    47 * dropMultiplier * seeds * packSize * duplication * additional,
    235 * dropMultiplier * seeds * duplication
  ];
  const transitions = [
    settings.tier1To2ChancePercent / 100,
    settings.tier2To3ChancePercent / 100,
    settings.tier3To4ChancePercent / 100
  ];
  let distribution = [1, 0, 0, 0];
  const yields: number[] = [];
  for (let upgrade = 0; upgrade <= 10; upgrade += 1) {
    yields.push(
      distribution.reduce(
        (total, probability, tier) =>
          total + probability * (tierYields[tier] ?? 0),
        0
      )
    );
    distribution = [
      distribution[0]! * (1 - transitions[0]!),
      distribution[0]! * transitions[0]! +
        distribution[1]! * (1 - transitions[1]!),
      distribution[1]! * transitions[1]! +
        distribution[2]! * (1 - transitions[2]!),
      distribution[2]! * transitions[2]! + distribution[3]!
    ];
  }
  return yields;
}

export function calculateCropRotation(
  input: CropRotationInput
): CropRotationResult {
  const validation = validateCropRotationInput(input);
  if (!validation.valid) throw new Error(validation.issues.join('; '));

  const yields = calculateCropYieldTable(input.settings);
  const priceValues = colors.map(
    color => input.lifeforcePrices[color].chaosPerLifeforce
  );
  const initial: CalculationState = {
    pairs: cropPairKinds.map(
      kind => input.pairs.filter(pair => pair === kind).length
    ),
    singles: [0, 0, 0],
    upgrades: [0, 0, 0]
  };
  const memo = new Map<string, PolicyResult>();

  function solve(state: CalculationState): PolicyResult {
    const key = stateKey(state);
    const cached = memo.get(key);
    if (cached) return cached;
    const choices = availableChoices(state);
    if (choices.length === 0) {
      const terminal: PolicyResult = { chaos: 0, lifeforce: [0, 0, 0] };
      memo.set(key, terminal);
      return terminal;
    }

    let best: PolicyResult | undefined;
    for (const choice of choices) {
      const immediate = yields[state.upgrades[choice.harvestColor]!] ?? 0;
      const wither = solve(applyChoice(state, choice, false));
      let future = wither;
      if (choice.kind === 'paired') {
        const survives = solve(applyChoice(state, choice, true));
        const surviveChance = input.settings.noWiltChancePercent / 100;
        future = combinePolicyResults(
          wither,
          1 - surviveChance,
          survives,
          surviveChance
        );
      }
      const lifeforce = [...future.lifeforce] as [number, number, number];
      lifeforce[choice.harvestColor] =
        lifeforce[choice.harvestColor]! + immediate;
      const candidate: PolicyResult = {
        choice,
        lifeforce,
        chaos: future.chaos + immediate * priceValues[choice.harvestColor]!
      };
      if (!best || candidate.chaos > best.chaos + 1e-9) best = candidate;
    }
    memo.set(key, best!);
    return best!;
  }

  const policy = solve(initial);
  const steps: CropRotationStep[] = [];
  let projectedState = initial;
  while (projectedState.pairs.some(count => count > 0)) {
    const current = solve(projectedState);
    const choice = current.choice;
    if (!choice || choice.kind !== 'paired') break;
    const sourcePair = cropPairKinds[choice.index]!;
    steps.push({
      id: `paired:${stateKey(projectedState)}:${choice.index}:${choice.harvestColor}`,
      kind: 'paired',
      sourcePair,
      harvestColor: colors[choice.harvestColor]!,
      unchosenColor: colors[choice.unchosenColor]!,
      expectedRemainingChaosValue: current.chaos,
      expectedRemainingLifeforce: toColorRecord(current.lifeforce)
    });
    projectedState = applyChoice(projectedState, choice, false);
  }

  return {
    steps,
    expectedChaosValue: policy.chaos,
    expectedLifeforce: toColorRecord(policy.lifeforce),
    assumptionsVersion: 't16-cropbot-reference-v1'
  };
}

function availableChoices(state: CalculationState): Choice[] {
  const choices: Choice[] = [];
  state.pairs.forEach((count, index) => {
    if (count <= 0) return;
    const [first, second] = pairColors[cropPairKinds[index]!]!;
    choices.push({
      kind: 'paired',
      index,
      harvestColor: first,
      unchosenColor: second
    });
    if (second !== first) {
      choices.push({
        kind: 'paired',
        index,
        harvestColor: second,
        unchosenColor: first
      });
    }
  });
  state.singles.forEach((count, color) => {
    if (count > 0) {
      choices.push({
        kind: 'single',
        index: color,
        harvestColor: color,
        unchosenColor: color
      });
    }
  });
  return choices;
}

function applyChoice(
  state: CalculationState,
  choice: Choice,
  survives: boolean
): CalculationState {
  const pairs = [...state.pairs];
  const singles = [...state.singles];
  if (choice.kind === 'paired') {
    pairs[choice.index] = pairs[choice.index]! - 1;
    if (survives) {
      singles[choice.unchosenColor] = singles[choice.unchosenColor]! + 1;
    }
  } else {
    singles[choice.index] = singles[choice.index]! - 1;
  }
  const upgrades = state.upgrades.map((count, color) =>
    color === choice.harvestColor ? count : count + 1
  );
  return { pairs, singles, upgrades };
}

function combinePolicyResults(
  left: PolicyResult,
  leftWeight: number,
  right: PolicyResult,
  rightWeight: number
): PolicyResult {
  return {
    chaos: left.chaos * leftWeight + right.chaos * rightWeight,
    lifeforce: [0, 1, 2].map(
      color =>
        left.lifeforce[color]! * leftWeight +
        right.lifeforce[color]! * rightWeight
    ) as [number, number, number]
  };
}

function stateKey(state: CalculationState) {
  return `${state.pairs.join(',')}|${state.singles.join(',')}|${state.upgrades.join(',')}`;
}

function toColorRecord(values: readonly number[]) {
  return {
    yellow: values[0] ?? 0,
    blue: values[1] ?? 0,
    purple: values[2] ?? 0
  };
}
