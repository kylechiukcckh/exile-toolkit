import { type EconomyPriceSnapshotResponse } from '@exile-toolkit/contracts';
import {
  calculateCropRotation,
  cropPairKinds,
  priceSnapshotFreshness,
  referenceCropRotationSettings,
  validateCropRotationInput,
  type CropPairKind,
  type CropRotationResult,
  type CropRotationSettings,
  type LifeforceColor
} from '@exile-toolkit/domain';
import { Minus, Plus, RotateCcw, TriangleAlert } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';

import type { WorkspaceOutletContext } from '@/components/workspace-shell';
import { Button } from '@/components/ui/button';
import { loadEconomyPriceSnapshot } from '@/lib/economy-price-snapshot-cache';

const pairLabels: Record<CropPairKind, string> = {
  'yellow-yellow': 'Yellow and Yellow',
  'yellow-blue': 'Yellow and Blue',
  'yellow-purple': 'Yellow and Purple',
  'blue-blue': 'Blue and Blue',
  'blue-purple': 'Blue and Purple',
  'purple-purple': 'Purple and Purple'
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
  const [counts, setCounts] = useState<Record<CropPairKind, number>>(
    () =>
      Object.fromEntries(cropPairKinds.map(pair => [pair, 0])) as Record<
        CropPairKind,
        number
      >
  );
  const [settings, setSettings] = useState<CropRotationSettings>(
    referenceCropRotationSettings
  );
  const [priceResponse, setPriceResponse] =
    useState<EconomyPriceSnapshotResponse>();
  const [priceLoading, setPriceLoading] = useState(true);
  const [result, setResult] = useState<CropRotationResult>();
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
    () => cropPairKinds.flatMap(pair => Array(counts[pair]).fill(pair)),
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
    setResult(
      calculateCropRotation({
        pairs,
        settings,
        lifeforcePrices: priceResponse.snapshot.lifeforcePrices
      })
    );
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
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-medium text-stone-100">
              Starting crop set
            </h2>
            <span className="text-sm text-stone-400">
              {pairs.length} of 5 Crop pairs
            </span>
          </div>
          <p className="mt-2 text-sm text-stone-500">
            Add three to five pairs. Duplicate color combinations are allowed.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {cropPairKinds.map(pair => (
              <div
                key={pair}
                className="flex items-center justify-between rounded-lg border border-white/8 bg-black/15 p-3"
              >
                <span className="text-sm font-medium text-stone-200">
                  {pairLabels[pair]}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    aria-label={`Remove ${pairLabels[pair]} Crop pair`}
                    disabled={counts[pair] === 0}
                    onClick={() => changePair(pair, -1)}
                  >
                    <Minus aria-hidden="true" />
                  </Button>
                  <output
                    className="min-w-6 text-center text-sm tabular-nums text-stone-100"
                    aria-label={`${pairLabels[pair]} count`}
                  >
                    {counts[pair]}
                  </output>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    aria-label={`Add ${pairLabels[pair]} Crop pair`}
                    disabled={pairs.length >= 5}
                    onClick={() => changePair(pair, 1)}
                  >
                    <Plus aria-hidden="true" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <details className="mt-5 rounded-lg border border-white/8 bg-black/15 p-4">
            <summary className="cursor-pointer text-sm font-medium text-stone-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/40">
              Advanced settings
            </summary>
            <p className="mt-3 text-xs leading-5 text-stone-500">
              Cropbot reference setup. These values describe one editable map
              and Atlas configuration, not a recommendation.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {settingFields.map(([key, label, suffix, bounded]) => (
                <label key={key} className="text-xs text-stone-400">
                  <span className="mb-1.5 block">{label}</span>
                  <span className="flex items-center gap-2">
                    <input
                      className="h-9 min-w-0 flex-1 rounded-md border border-white/10 bg-black/25 px-3 text-sm text-stone-100 outline-none"
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
              <label className="flex items-center gap-3 text-sm text-stone-300">
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
            </div>
            {validation && !validation.valid ? (
              <p role="alert" className="mt-4 text-xs text-red-300">
                {validation.issues.join(' ')}
              </p>
            ) : null}
          </details>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button type="button" onClick={calculate} disabled={!canCalculate}>
              Calculate
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setSettings(referenceCropRotationSettings)}
            >
              <RotateCcw aria-hidden="true" />
              Restore reference setup
            </Button>
            <PriceState
              response={priceResponse}
              loading={priceLoading}
              freshness={freshness}
              now={now}
            />
          </div>
        </section>

        <section className="rounded-xl border border-white/8 bg-white/[0.025] p-5">
          {result ? (
            <RotationResultView result={result} />
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

function RotationResultView({ result }: { result: CropRotationResult }) {
  return (
    <>
      <h2 className="text-xl font-medium text-stone-100">Rotation path</h2>
      <p className="mt-2 text-sm text-stone-500">
        This projection assumes all unchosen crops wither.
      </p>
      <dl className="mt-5 grid gap-3 sm:grid-cols-2">
        <ResultValue
          label="Expected Chaos value"
          value={result.expectedChaosValue.toFixed(1)}
        />
        {(['yellow', 'blue', 'purple'] as const).map(color => (
          <ResultValue
            key={color}
            label={`Expected ${capitalize(color)} Lifeforce`}
            value={result.expectedLifeforce[color].toFixed(0)}
          />
        ))}
      </dl>
      <ol className="mt-6 space-y-3">
        {result.steps.map((step, index) => (
          <li
            key={step.id}
            data-testid="rotation-step"
            className="rounded-lg border border-white/8 bg-black/15 p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-widest text-stone-600">
                  Step {index + 1}
                </p>
                <p className="mt-1 font-medium text-stone-100">
                  Harvest {capitalize(step.harvestColor)}
                </p>
                <p className="mt-1 text-sm text-stone-500">
                  From {pairLabels[step.sourcePair]} Crop pair
                </p>
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

function ResultValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/8 bg-black/15 p-3">
      <dt className="text-xs text-stone-500">{label}</dt>
      <dd className="mt-1 text-lg font-medium text-stone-100">{value}</dd>
    </div>
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
