import { type EconomyPriceSnapshotResponse } from '@exile-toolkit/contracts';
import {
  calculateCropRotation,
  cropPairKinds,
  priceSnapshotFreshness,
  referenceCropRotationSettings,
  validateCropRotationInput,
  type CropPairKind,
  type CropRotationInput,
  type CropRotationResult,
  type CropRotationSettings,
  type CropRotationValidationResult,
  type LifeforceColor,
  type LifeforcePrices
} from '@exile-toolkit/domain';
import { RotateCcw, Settings, TriangleAlert, X } from 'lucide-react';
import {
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction
} from 'react';
import { useOutletContext } from 'react-router-dom';

import type { WorkspaceOutletContext } from '@/components/workspace-shell';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { useCropRotationLocalState } from '@/hooks/use-crop-rotation-local-state';
import { loadEconomyPriceSnapshot } from '@/lib/economy-price-snapshot-cache';

const pairLabels: Record<CropPairKind, string> = {
  'yellow-yellow': 'Yellow and Yellow',
  'yellow-blue': 'Yellow and Blue',
  'yellow-purple': 'Yellow and Purple',
  'blue-blue': 'Blue and Blue',
  'blue-purple': 'Blue and Purple',
  'purple-purple': 'Purple and Purple'
};

const pairCodes: Record<CropPairKind, string> = {
  'yellow-yellow': 'YY',
  'yellow-blue': 'YB',
  'yellow-purple': 'YP',
  'blue-blue': 'BB',
  'blue-purple': 'BP',
  'purple-purple': 'PP'
};

const pairColors: Record<
  CropPairKind,
  readonly [LifeforceColor, LifeforceColor]
> = {
  'yellow-yellow': ['yellow', 'yellow'],
  'yellow-blue': ['yellow', 'blue'],
  'yellow-purple': ['yellow', 'purple'],
  'blue-blue': ['blue', 'blue'],
  'blue-purple': ['blue', 'purple'],
  'purple-purple': ['purple', 'purple']
};

const lifeforceIconUrls: Record<LifeforceColor, string> = {
  yellow:
    'https://web.poecdn.com/gen/image/WzI1LDE0LHsiZiI6IjJESXRlbXMvQ3VycmVuY3kvSGFydmVzdC9WaXZpZExpZmVmb3JjZSIsInNjYWxlIjoxfV0/a355b8a5a2/VividLifeforce.png',
  blue: 'https://web.poecdn.com/gen/image/WzI1LDE0LHsiZiI6IjJESXRlbXMvQ3VycmVuY3kvSGFydmVzdC9QcmltYWxMaWZlZm9yY2UiLCJzY2FsZSI6MX1d/c498cdfd7f/PrimalLifeforce.png',
  purple:
    'https://web.poecdn.com/gen/image/WzI1LDE0LHsiZiI6IjJESXRlbXMvQ3VycmVuY3kvSGFydmVzdC9XaWxkTGlmZWZvcmNlIiwic2NhbGUiOjF9XQ/e3d0b372b0/WildLifeforce.png'
};

const settingFields = [
  ['noWiltChancePercent', 'Unchosen crop does not wilt', '%', true],
  ['mapPackSizePercent', 'Map pack size', '%', false],
  ['mapItemQuantityPercent', 'Map item quantity', '%', false],
  [
    'increasedLifeforceQuantityPercent',
    'Increased Lifeforce quantity',
    '%',
    false
  ],
  ['additionalMonsterChancePercent', 'Additional-monster chance', '%', true],
  ['monsterDuplicationChancePercent', 'Monster-duplication chance', '%', true],
  ['tier1To2ChancePercent', 'T1 to T2 transition', '%', true],
  ['tier2To3ChancePercent', 'T2 to T3 transition', '%', true],
  ['tier3To4ChancePercent', 'T3 to T4 transition', '%', true]
] as const;

export function CropRotationPage() {
  const { workspace } = useOutletContext<WorkspaceOutletContext>();
  const activeLeague = workspace.state.activeLeague;
  const { counts, settings, issues, setCounts, setSettings } =
    useCropRotationLocalState();
  const [priceResponse, setPriceResponse] =
    useState<EconomyPriceSnapshotResponse>();
  const [priceLoading, setPriceLoading] = useState(true);
  const [result, setResult] = useState<CropRotationResult>();
  const [calculationInput, setCalculationInput] = useState<CropRotationInput>();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;
    setPriceLoading(true);
    setPriceResponse(undefined);
    void loadEconomyPriceSnapshot(activeLeague).then(response => {
      if (!cancelled) {
        setPriceResponse(response);
        setPriceLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [activeLeague]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const pairs = useMemo(
    () =>
      cropPairKinds.flatMap(pair =>
        Array.from({ length: counts[pair] }, () => pair)
      ),
    [counts]
  );
  const freshness = priceResponse
    ? priceSnapshotFreshness(
        new Date(priceResponse.snapshot.retrievedAt).getTime(),
        now
      )
    : undefined;
  const validation = priceResponse
    ? validateCropRotationInput({
        pairs,
        settings,
        lifeforcePrices: priceResponse.snapshot.lifeforcePrices
      })
    : undefined;
  const canCalculate =
    pairs.length >= 3 &&
    pairs.length <= 5 &&
    freshness !== 'expired' &&
    validation?.valid === true;
  const calculationIsOutdated = Boolean(
    result &&
    calculationInput &&
    (!priceResponse ||
      configurationKey(
        pairs,
        settings,
        priceResponse.snapshot.lifeforcePrices
      ) !==
        configurationKey(
          calculationInput.pairs,
          calculationInput.settings,
          calculationInput.lifeforcePrices
        ))
  );

  function changePair(pair: CropPairKind, amount: number) {
    setCounts(current => {
      const total = Object.values(current).reduce(
        (sum, count) => sum + count,
        0
      );
      if (amount > 0 && total >= 5) return current;
      return { ...current, [pair]: Math.max(0, current[pair] + amount) };
    });
  }

  function calculate() {
    if (!canCalculate || !priceResponse) return;
    const input: CropRotationInput = {
      pairs,
      settings,
      lifeforcePrices: priceResponse.snapshot.lifeforcePrices
    };
    setCalculationInput(input);
    setResult(calculateCropRotation(input));
  }

  function changeWitherOutcome(stepId: string, didNotWither: boolean) {
    if (!result || !calculationInput) return;
    const outcomeIds = new Set(result.appliedDidNotWitherStepIds);
    if (didNotWither) outcomeIds.add(stepId);
    else outcomeIds.delete(stepId);
    setResult(
      calculateCropRotation({
        ...calculationInput,
        didNotWitherStepIds: [...outcomeIds]
      })
    );
  }

  function resetCalculation() {
    setCounts(
      Object.fromEntries(cropPairKinds.map(pair => [pair, 0])) as Record<
        CropPairKind,
        number
      >
    );
    setCalculationInput(undefined);
    setResult(undefined);
  }

  return (
    <article className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-12 lg:py-10">
      <header className="max-w-3xl">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-amber-300/70">
          Harvest
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.035em] text-stone-50 sm:text-5xl">
          Crop Rotation calculator
        </h1>
        <p className="mt-4 text-sm leading-6 text-stone-400">
          Enter the Crop pairs visible in the Sacred Grove, then calculate one
          expected-value Rotation path using a timestamped Lifeforce Price
          snapshot.
        </p>
      </header>

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(24rem,1.1fr)]">
        <section className="rounded-xl border border-white/8 bg-white/[0.025] p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-medium text-stone-100">
                Which Crop pairs spawned?
              </h2>
              <p className="mt-2 text-sm text-stone-500">
                Add each pair you see. Order does not matter.
              </p>
            </div>
            <AdvancedSettingsPopover
              settings={settings}
              setSettings={setSettings}
              validation={validation}
            />
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {cropPairKinds.map(pair => (
              <Tooltip key={pair}>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    aria-label={`Add ${pairLabels[pair]} Crop pair`}
                    disabled={pairs.length >= 5}
                    onClick={() => changePair(pair, 1)}
                    className="h-20 flex-col gap-1.5 border-white/10 bg-black/15 hover:border-emerald-300/30 hover:bg-emerald-300/[0.05]"
                  >
                    <PairIcons pair={pair} />
                    <span className="text-[0.65rem] tracking-widest text-stone-500">
                      {pairCodes[pair]}
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Add {pairLabels[pair]} Crop pair
                </TooltipContent>
              </Tooltip>
            ))}
          </div>

          <div className="mt-5 rounded-lg border border-dashed border-white/12 bg-black/15 p-3">
            <div className="mb-3 flex items-center justify-between gap-3 px-1 text-xs text-stone-500">
              <span>Starting crop set</span>
              <span>{pairs.length} of 5 Crop pairs</span>
            </div>
            {pairs.length === 0 ? (
              <p className="py-4 text-center text-sm text-stone-600">
                No Crop pairs added yet
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {pairs.map((pair, index) => (
                  <button
                    key={`${pair}-${index}`}
                    type="button"
                    aria-label={`Remove one ${pairLabels[pair]} Crop pair`}
                    onClick={() => changePair(pair, -1)}
                    className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-3 text-stone-300 outline-none transition-colors hover:border-red-300/30 hover:bg-red-300/[0.06] focus-visible:ring-2 focus-visible:ring-amber-300/50"
                  >
                    <PairIcons pair={pair} />
                    <X className="size-3.5 text-stone-500" aria-hidden="true" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button type="button" onClick={calculate} disabled={!canCalculate}>
              {calculationIsOutdated ? 'Recalculate' : 'Calculate'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={resetCalculation}
              disabled={pairs.length === 0 && !result}
            >
              <RotateCcw aria-hidden="true" />
              Reset calculation
            </Button>
            <PriceState
              response={priceResponse}
              loading={priceLoading}
              freshness={freshness}
              now={now}
            />
          </div>
          {issues.length > 0 ? (
            <p role="alert" className="mt-3 text-xs text-amber-200/70">
              {issues.join(' ')}
            </p>
          ) : null}
        </section>

        <section className="rounded-xl border border-white/8 bg-white/[0.025] p-5">
          {calculationIsOutdated ? (
            <div
              role="status"
              className="mb-5 rounded-lg border border-amber-300/20 bg-amber-300/[0.06] p-3 text-sm text-amber-100/80"
            >
              This calculation is outdated. Recalculate to use the current Crop
              pairs and Advanced settings.
            </div>
          ) : null}
          {result ? (
            <RotationResultView
              result={result}
              onWitherOutcomeChange={changeWitherOutcome}
            />
          ) : (
            <div className="grid min-h-72 place-items-center text-center">
              <div>
                <h2 className="text-lg font-medium text-stone-200">
                  Awaiting calculation
                </h2>
                <p className="mt-2 max-w-sm text-sm leading-6 text-stone-500">
                  Add at least three Crop pairs and press Calculate. Input
                  changes never replace a result automatically.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </article>
  );
}

function AdvancedSettingsPopover({
  settings,
  setSettings,
  validation
}: {
  settings: CropRotationSettings;
  setSettings: Dispatch<SetStateAction<CropRotationSettings>>;
  validation: CropRotationValidationResult | undefined;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Settings aria-hidden="true" />
          Advanced
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 max-w-[calc(100vw-2rem)] p-0">
        <div className="border-b border-white/8 px-5 py-4">
          <h3 className="font-medium text-stone-100">Advanced settings</h3>
          <p className="mt-1 text-xs leading-5 text-stone-500">
            Cropbot reference setup. Edit the map and Atlas configuration here.
            This is not a recommendation.
          </p>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          {settingFields.map(([key, label, suffix, bounded]) => (
            <label key={key} className="text-xs text-stone-400">
              <span className="mb-1.5 block">{label}</span>
              <span className="flex items-center gap-2">
                <input
                  className="h-9 min-w-0 flex-1 rounded-md border border-white/10 bg-black/25 px-3 text-sm text-stone-100 outline-none focus-visible:ring-2 focus-visible:ring-amber-300/40"
                  type="number"
                  min={0}
                  max={bounded ? 100 : undefined}
                  step="any"
                  value={settings[key]}
                  onChange={event =>
                    setSettings(current => ({
                      ...current,
                      [key]: event.target.valueAsNumber
                    }))
                  }
                />
                <span>{suffix}</span>
              </span>
            </label>
          ))}
          <label className="flex items-center gap-3 text-sm text-stone-300 sm:col-span-2">
            <input
              type="checkbox"
              checked={settings.doublingScarab}
              onChange={event =>
                setSettings(current => ({
                  ...current,
                  doublingScarab: event.target.checked
                }))
              }
            />
            Doubling Scarab enabled
          </label>
          {validation && !validation.valid ? (
            <p role="alert" className="text-xs text-red-300 sm:col-span-2">
              {validation.issues.join(' ')}
            </p>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            onClick={() => setSettings(referenceCropRotationSettings)}
            className="sm:col-span-2"
          >
            <RotateCcw aria-hidden="true" />
            Restore reference setup
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function RotationResultView({
  result,
  onWitherOutcomeChange
}: {
  result: CropRotationResult;
  onWitherOutcomeChange: (stepId: string, didNotWither: boolean) => void;
}) {
  const outcomeCount = result.appliedDidNotWitherStepIds.length;

  return (
    <>
      <h2 className="text-xl font-medium text-stone-100">Rotation path</h2>
      <p className="mt-2 text-sm text-stone-500">
        {outcomeCount === 0
          ? 'This projection assumes all unchosen crops wither.'
          : `${outcomeCount} ${outcomeCount === 1 ? 'crop did' : 'crops did'} not wither. The remaining path has been recalculated.`}
      </p>
      <dl className="mt-5 grid gap-3 sm:grid-cols-2">
        <ResultValue
          accessibleLabel="Expected Chaos value"
          label="Expected Chaos value"
          value={result.expectedChaosValue.toFixed(1)}
        />
        {(['yellow', 'blue', 'purple'] as const).map(color => (
          <ResultValue
            key={color}
            accessibleLabel={`Expected ${capitalize(color)} Lifeforce`}
            label={
              <span className="flex items-center gap-1.5">
                Expected <LifeforceIcon color={color} /> Lifeforce
              </span>
            }
            value={result.expectedLifeforce[color].toFixed(0)}
          />
        ))}
      </dl>
      <ol className="mt-6 space-y-3">
        {result.steps.map((step, index) => (
          <li
            key={step.id}
            data-testid="rotation-step"
            data-step-id={step.id}
            aria-label={rotationStepLabel(step, index)}
            className="rounded-lg border border-white/8 bg-black/15 p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-widest text-stone-600">
                  Step {index + 1}
                </p>
                <p className="mt-1 flex items-center gap-1.5 font-medium text-stone-100">
                  Harvest <LifeforceIcon color={step.harvestColor} />
                </p>
                {step.kind === 'paired' ? (
                  <>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-stone-500">
                      From <PairIcons pair={step.sourcePair} /> Crop pair
                    </p>
                    <label className="mt-3 flex w-fit items-center gap-2 text-sm text-stone-300">
                      <input
                        type="checkbox"
                        aria-label={`Step ${index + 1} Did not wither`}
                        checked={step.didNotWither}
                        onChange={event =>
                          onWitherOutcomeChange(step.id, event.target.checked)
                        }
                      />
                      Did not wither
                    </label>
                  </>
                ) : (
                  <p className="mt-1 text-sm font-medium text-emerald-300">
                    Surviving crop
                  </p>
                )}
              </div>
              <span className="text-right text-sm text-amber-200">
                {step.expectedRemainingChaosValue.toFixed(1)} Chaos remaining
              </span>
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-6 rounded-lg border border-amber-300/20 bg-amber-300/[0.06] p-4 text-sm leading-6 text-amber-100/80">
        <TriangleAlert className="mr-2 inline size-4" aria-hidden="true" />
        Visible seed counts and tiers are not modeled. When matching or
        same-color crops differ in game, choose the visibly stronger crop.
      </div>
      <details className="mt-4 text-sm text-stone-400">
        <summary className="cursor-pointer font-medium text-stone-300">
          Assumptions and sources
        </summary>
        <div className="mt-3 space-y-2 leading-6">
          <p>
            T16 transitions use 25%, 20%, and 3%. Evidence for T2 to T3
            conflicts, and the measured T3 to T4 range is about 2% to 5.5%.
          </p>
          <p>
            Crop Rotation calculation adapted from Cropbot by masonk. Source:{' '}
            <a
              className="text-amber-200 underline"
              href="https://github.com/masonk/cropbot"
            >
              github.com/masonk/cropbot
            </a>
            .
          </p>
          <p>
            Mechanics evidence:{' '}
            <a
              className="text-amber-200 underline"
              href="https://forgottenarbiter.github.io/Poe-Harvest-Mechanics/"
            >
              Forgotten Arbiter Harvest mechanics analysis
            </a>
            .
          </p>
        </div>
      </details>
    </>
  );
}

function ResultValue({
  label,
  value,
  accessibleLabel
}: {
  label: ReactNode;
  value: string;
  accessibleLabel?: string;
}) {
  return (
    <div
      role={accessibleLabel ? 'group' : undefined}
      aria-label={accessibleLabel}
      className="rounded-lg border border-white/8 bg-black/15 p-3"
    >
      <dt className="text-xs text-stone-500">{label}</dt>
      <dd className="mt-1 text-lg font-medium text-stone-100">{value}</dd>
    </div>
  );
}

function PairIcons({ pair }: { pair: CropPairKind }) {
  return (
    <span
      className="inline-flex items-center gap-1"
      role="img"
      aria-label={pairLabels[pair]}
    >
      {pairColors[pair].map((color, index) => (
        <LifeforceIcon key={`${color}-${index}`} color={color} decorative />
      ))}
    </span>
  );
}

function LifeforceIcon({
  color,
  decorative = false
}: {
  color: LifeforceColor;
  decorative?: boolean;
}) {
  return (
    <img
      className="size-6 shrink-0 object-contain"
      src={lifeforceIconUrls[color]}
      alt={decorative ? '' : `${capitalize(color)} Lifeforce`}
      aria-hidden={decorative || undefined}
      referrerPolicy="no-referrer"
    />
  );
}

function PriceState({
  response,
  loading,
  freshness,
  now
}: {
  response: EconomyPriceSnapshotResponse | undefined;
  loading: boolean;
  freshness: ReturnType<typeof priceSnapshotFreshness> | undefined;
  now: number;
}) {
  if (loading)
    return <span className="text-xs text-stone-500">Loading prices</span>;
  if (!response || !freshness)
    return <span className="text-xs text-red-300">Prices unavailable</span>;
  if (freshness === 'expired')
    return <span className="text-xs text-red-300">Prices expired</span>;
  const minutes = Math.max(
    0,
    Math.floor(
      (now - new Date(response.snapshot.retrievedAt).getTime()) / 60_000
    )
  );
  return (
    <span
      className={
        freshness === 'stale'
          ? 'text-xs text-amber-200'
          : 'text-xs text-stone-500'
      }
    >
      {freshness === 'stale' ? 'Stale' : 'Fresh'} poe.ninja snapshot, {minutes}m
      old
    </span>
  );
}

function capitalize(color: LifeforceColor) {
  return `${color.charAt(0).toUpperCase()}${color.slice(1)}`;
}

function configurationKey(
  pairs: readonly CropPairKind[],
  settings: CropRotationSettings,
  lifeforcePrices: LifeforcePrices
) {
  return JSON.stringify({ pairs, settings, lifeforcePrices });
}

function rotationStepLabel(
  step: CropRotationResult['steps'][number],
  index: number
) {
  const prefix = `Step ${index + 1}: Harvest ${capitalize(step.harvestColor)}`;
  return step.kind === 'paired'
    ? `${prefix} from ${pairLabels[step.sourcePair]} Crop pair`
    : `${prefix} Surviving crop`;
}
