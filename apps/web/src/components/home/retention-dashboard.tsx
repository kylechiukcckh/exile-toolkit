import type { HomeFeedSnapshot } from '@exile-toolkit/contracts';
import {
  ArrowUpRight,
  ChevronDown,
  Minus,
  TrendingDown,
  TrendingUp
} from 'lucide-react';
import { useState } from 'react';
import { CartesianGrid, Legend, Line, LineChart, XAxis, YAxis } from 'recharts';

import { Button } from '@/components/ui/button';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig
} from '@/components/ui/chart';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import { Switch } from '@/components/ui/switch';

type Retention = HomeFeedSnapshot['retention'];

export function RetentionDashboard({
  retention,
  retrievedAt
}: {
  retention: Retention;
  retrievedAt: string;
}) {
  const [showPlayers, setShowPlayers] = useState(false);
  const [tableOpen, setTableOpen] = useState(false);
  const summary = buildRetentionSummary(retention);

  return (
    <section className="px-5 py-16 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-amber-300/70">
              League health
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-stone-100">
              {retention.league} player retention
            </h2>
            <p className="mt-3 leading-7 text-stone-500">
              Daily Steam concurrent players as a percentage of launch day. This
              is concurrency, not a count of unique players.
            </p>
          </div>
          <div className="flex self-end flex-col items-end gap-2">
            <Button asChild variant="ghost" className="w-fit text-stone-400">
              <a href={retention.sourceUrl} target="_blank" rel="noreferrer">
                View source data <ArrowUpRight aria-hidden="true" />
              </a>
            </Button>
            <label className="flex cursor-pointer items-center gap-3 text-sm text-stone-400">
              <span>Percentage</span>
              <Switch
                checked={showPlayers}
                onCheckedChange={setShowPlayers}
                aria-label="Show actual player counts"
              />
              <span>Players</span>
            </label>
          </div>
        </div>

        <div className="mt-9 grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <RetentionChart retention={retention} showPlayers={showPlayers} />
          <RetentionMetrics summary={summary} />
        </div>

        <RetentionTable
          retention={retention}
          showPlayers={showPlayers}
          open={tableOpen}
          onOpenChange={setTableOpen}
        />

        <p className="mt-4 text-xs leading-5 text-stone-600">
          Initial history comes from the SteamDB export. New daily readings come
          from the Steam Web API. Refreshed {formatDate(retrievedAt)}.
        </p>
      </div>
    </section>
  );
}

function RetentionChart({
  retention,
  showPlayers
}: {
  retention: Retention;
  showPlayers: boolean;
}) {
  const { days, league, series } = retention;
  const latestDay = days.at(-1) ?? series[0]?.values.length ?? 0;
  const latestValue =
    (showPlayers ? series[0]?.players : series[0]?.values)?.at(-1) ?? 0;
  const colors = [
    '#fcd34d',
    '#60a5fa',
    '#a78bfa',
    '#34d399',
    '#f87171',
    '#22d3ee',
    '#fb923c',
    '#e879f9',
    '#a3e635',
    '#94a3b8'
  ];
  const chartConfig = Object.fromEntries(
    series.map((item, index) => [
      `league${index}`,
      { label: item.league, color: colors[index] ?? '#a8a29e' }
    ])
  ) satisfies ChartConfig;
  const longestSeries = Math.max(...series.map(item => item.values.length));
  const chartData = Array.from({ length: longestSeries }, (_, index) =>
    Object.fromEntries([
      ['day', index + 1],
      ...series.map((item, seriesIndex) => [
        `league${seriesIndex}`,
        (showPlayers ? item.players : item.values)[index]
      ])
    ])
  );

  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.025] p-4 sm:p-6">
      <div className="mb-5">
        <p className="text-sm font-medium text-stone-200">
          Day 1 to day {latestDay}
        </p>
        <p className="mt-1 text-xs text-stone-500">
          {showPlayers ? 'Daily peak concurrent players' : 'Launch day = 100%'}
        </p>
      </div>
      <ChartContainer
        config={chartConfig}
        className="h-[280px] w-full aspect-auto"
        role="img"
        aria-label={`${league} concurrent player retention from day 1 to day ${latestDay}, ending at ${latestValue}${showPlayers ? ' players' : ' percent'}`}
      >
        <LineChart
          accessibilityLayer
          data={chartData}
          margin={{ left: 4, right: 12 }}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="day"
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            minTickGap={28}
            tickFormatter={value => `Day ${value}`}
          />
          <YAxis
            domain={showPlayers ? ['auto', 'auto'] : [0, 100]}
            {...(showPlayers ? {} : { ticks: [0, 25, 50, 75, 100] })}
            tickLine={false}
            axisLine={false}
            tickFormatter={value =>
              showPlayers ? compactNumber(Number(value)) : `${value}%`
            }
            width={showPlayers ? 58 : 42}
          />
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                valueFormatter={value =>
                  showPlayers ? Number(value).toLocaleString() : `${value}%`
                }
              />
            }
          />
          <Legend verticalAlign="bottom" height={36} />
          {series.map((item, index) => (
            <Line
              key={item.league}
              dataKey={`league${index}`}
              name={item.league}
              type="monotone"
              stroke={`var(--color-league${index})`}
              strokeWidth={index === 0 ? 3 : 1.5}
              strokeOpacity={index === 0 ? 1 : 0.65}
              dot={false}
              activeDot={{ r: index === 0 ? 4 : 3 }}
              connectNulls={false}
            />
          ))}
        </LineChart>
      </ChartContainer>
    </div>
  );
}

function RetentionMetrics({ summary }: { summary: RetentionSummary }) {
  return (
    <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
      <Metric
        label={`Latest, day ${summary.latestDay}`}
        value={formatPercent(summary.latestValue)}
        detail="Of launch-day concurrency"
        difference={summary.latestValue - 100}
      />
      <Metric
        label="Previous league"
        value={formatDifference(summary.latestValue, summary.previous?.value)}
        difference={differenceBetween(
          summary.latestValue,
          summary.previous?.value
        )}
        detail={comparisonDetail(
          summary.latestValue,
          summary.previous,
          summary.latestDay
        )}
      />
      <Metric
        label={`${summary.benchmark?.kind ?? 'Historical'} retention`}
        value={formatDifference(summary.latestValue, summary.benchmark?.value)}
        difference={differenceBetween(
          summary.latestValue,
          summary.benchmark?.value
        )}
        detail={comparisonDetail(
          summary.latestValue,
          summary.benchmark,
          summary.latestDay
        )}
      />
    </div>
  );
}

function RetentionTable({
  retention,
  showPlayers,
  open,
  onOpenChange
}: {
  retention: Retention;
  showPlayers: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Collapsible
      open={open}
      onOpenChange={onOpenChange}
      className="mt-4 overflow-hidden rounded-xl border border-white/8 bg-white/[0.025]"
    >
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-auto w-full justify-between rounded-none px-5 py-4 text-stone-300"
        >
          League comparison data
          <ChevronDown
            className={`transition-transform ${open ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="border-t border-white/8">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">
              Retention across recent leagues
            </caption>
            <thead className="border-b border-white/8 text-left text-xs uppercase tracking-wider text-stone-500">
              <tr>
                <th className="px-5 py-4 font-medium">League</th>
                {[7, 14, 28].map(day => (
                  <th key={day} className="px-5 py-4 text-right font-medium">
                    Day {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {retention.series.map(item => (
                <tr
                  key={item.league}
                  className="border-b border-white/8 last:border-0"
                >
                  <td className="px-5 py-4 font-medium text-stone-200">
                    {item.league}
                  </td>
                  {[6, 13, 27].map(index => (
                    <RetentionCell
                      key={index}
                      value={(showPlayers ? item.players : item.values)[index]}
                      showPlayers={showPlayers}
                    />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function Metric({
  label,
  value,
  detail,
  difference
}: {
  label: string;
  value: string;
  detail: string;
  difference: number | undefined;
}) {
  const isHigher = difference !== undefined && difference > 0;
  const isLower = difference !== undefined && difference < 0;
  const TrendIcon = isHigher ? TrendingUp : isLower ? TrendingDown : Minus;
  const color = isHigher
    ? 'text-emerald-400'
    : isLower
      ? 'text-red-400'
      : 'text-stone-400';
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.025] p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-stone-500">
          {label}
        </p>
        <TrendIcon className={`size-4 ${color}`} aria-hidden="true" />
      </div>
      <p className={`mt-3 text-3xl font-semibold tracking-tight ${color}`}>
        {value}
      </p>
      <p className="mt-1 text-xs text-stone-500">{detail}</p>
    </div>
  );
}

function RetentionCell({
  value,
  showPlayers
}: {
  value: number | undefined;
  showPlayers: boolean;
}) {
  return (
    <td className="px-5 py-4 text-right tabular-nums text-stone-400">
      {value === undefined
        ? 'N/A'
        : showPlayers
          ? value.toLocaleString()
          : `${value.toFixed(1)}%`}
    </td>
  );
}

interface RetentionSummary {
  latestDay: number;
  latestValue: number;
  previous?: { league: string; value: number };
  benchmark?: { league: string; value: number; kind: 'Best' | 'Worst' };
}

function buildRetentionSummary(retention: Retention): RetentionSummary {
  const latestDay = retention.days.at(-1) ?? retention.values.length;
  const latestValue = retention.values.at(-1) ?? 0;
  const index = latestDay - 1;
  const previousSeries = retention.series[1];
  const previousValue = previousSeries?.values[index];
  const historical = retention.series.slice(1).flatMap(item => {
    const value = item.values[index];
    return value === undefined ? [] : [{ league: item.league, value }];
  });
  const best = historical.reduce<(typeof historical)[number] | undefined>(
    (result, item) => (!result || item.value > result.value ? item : result),
    undefined
  );
  const worst = historical.reduce<(typeof historical)[number] | undefined>(
    (result, item) => (!result || item.value < result.value ? item : result),
    undefined
  );
  const benchmark =
    best && worst && latestValue - worst.value < best.value - latestValue
      ? { ...worst, kind: 'Worst' as const }
      : best
        ? { ...best, kind: 'Best' as const }
        : undefined;
  return {
    latestDay,
    latestValue,
    ...(previousSeries && previousValue !== undefined
      ? { previous: { league: previousSeries.league, value: previousValue } }
      : {}),
    ...(benchmark ? { benchmark } : {})
  };
}

function comparisonDetail(
  current: number,
  comparison: { league: string; value: number } | undefined,
  day: number
) {
  if (!comparison) return 'Not available at this day';
  const direction =
    current === comparison.value
      ? 'Equal to'
      : current > comparison.value
        ? 'Above'
        : 'Below';
  return `${direction} ${comparison.league} on day ${day}`;
}

function formatDifference(current: number, comparison: number | undefined) {
  if (comparison === undefined) return 'N/A';
  const difference = current - comparison;
  return `${difference > 0 ? '+' : ''}${difference.toFixed(1)}%`;
}

function differenceBetween(current: number, comparison: number | undefined) {
  return comparison === undefined ? undefined : current - comparison;
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

function compactNumber(value: number) {
  return new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date(value));
}
