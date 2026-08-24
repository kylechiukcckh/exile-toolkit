import {
  Activity,
  ArrowRight,
  Boxes,
  CircleDotDashed,
  Gem,
  Network,
  PackageSearch,
  ScrollText,
  ShieldCheck
} from 'lucide-react';
import { useOutletContext } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import {
  serviceLabels,
  type WorkspaceOutletContext
} from '@/components/workspace-shell';

const tools = [
  {
    name: 'Regex generator',
    detail: 'Build exact stash searches for maps and dangerous modifiers.',
    icon: ScrollText
  },
  {
    name: 'Disenchant calculator',
    detail: 'Compare dust efficiency against current market prices.',
    icon: Gem
  },
  {
    name: 'Cluster jewel tool',
    detail: 'Check notable compatibility, position, and acquisition.',
    icon: Network
  },
  {
    name: 'Scarab expected value',
    detail: 'Rank vendor combinations with sourced probability data.',
    icon: Boxes
  },
  {
    name: 'Warrant price checker',
    detail: 'Parse warrant modifiers and compare supported combinations.',
    icon: PackageSearch
  }
] as const;

export function HomePage() {
  const { serviceState } = useOutletContext<WorkspaceOutletContext>();

  function showTools() {
    document.getElementById('tools')?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <>
      <section className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:px-12 lg:py-24">
        <div>
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-amber-300/15 bg-amber-300/[0.06] px-3 py-1.5 text-xs font-medium text-amber-200/80">
            <CircleDotDashed className="size-3.5" aria-hidden="true" />
            Workspace foundation
          </div>
          <h1 className="max-w-3xl text-balance text-5xl font-semibold leading-[0.98] tracking-[-0.045em] text-stone-50 sm:text-6xl">
            Exile Toolkit
          </h1>
          <p className="mt-6 max-w-2xl text-pretty text-lg leading-8 text-stone-400 sm:text-xl">
            One focused workspace for the trade-league checks that usually
            scatter across a dozen tabs.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Button
              size="lg"
              onClick={showTools}
              className="bg-amber-300 text-stone-950 hover:bg-amber-200"
            >
              Explore the roadmap
              <ArrowRight aria-hidden="true" />
            </Button>
            <span className="text-sm text-stone-500">
              First tool: map regex generation
            </span>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-stone-950/70 shadow-2xl shadow-black/40">
          <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
            <div className="flex items-center gap-2 text-sm font-medium text-stone-200">
              <Activity
                className="size-4 text-emerald-400"
                aria-hidden="true"
              />
              Workspace health
            </div>
            <span className="rounded bg-white/5 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-stone-500">
              Beta
            </span>
          </div>
          <dl className="divide-y divide-white/6 px-5">
            <HealthRow label="Web workspace" value="Ready" tone="good" />
            <HealthRow
              label="Worker API"
              value={serviceLabels[serviceState]}
              tone={
                serviceState === 'available'
                  ? 'good'
                  : serviceState === 'unavailable'
                    ? 'bad'
                    : 'muted'
              }
            />
            <HealthRow
              label="Active league"
              value="Current challenge league"
              tone="muted"
            />
          </dl>
        </div>
      </section>

      <section
        id="tools"
        className="border-t border-white/8 bg-black/15 px-5 py-16 sm:px-8 lg:px-12"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-9 max-w-2xl">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-amber-300/70">
              Tool roadmap
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-100">
              One workspace, five focused workflows
            </h2>
            <p className="mt-3 leading-7 text-stone-500">
              The cards describe planned scope only. A tool becomes interactive
              after its data and main workflow pass review.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {tools.map(tool => (
              <ToolCard key={tool.name} {...tool} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function HealthRow({
  label,
  value,
  tone
}: {
  label: string;
  value: string;
  tone: 'bad' | 'good' | 'muted';
}) {
  return (
    <div className="flex items-center justify-between gap-6 py-4 text-sm">
      <dt className="text-stone-500">{label}</dt>
      <dd
        className={`text-right font-medium health-value health-value--${tone}`}
      >
        {value}
      </dd>
    </div>
  );
}

function ToolCard({ name, detail, icon: Icon }: (typeof tools)[number]) {
  return (
    <article
      aria-label={name}
      className="rounded-xl border border-white/8 bg-white/[0.025] p-5"
    >
      <div className="mb-8 flex items-center justify-between">
        <span className="grid size-9 place-items-center rounded-lg bg-white/[0.04] text-stone-500">
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <span className="rounded-full border border-white/8 px-2.5 py-1 text-[10px] font-medium uppercase tracking-widest text-stone-600">
          Coming later
        </span>
      </div>
      <h3 className="font-medium text-stone-200">{name}</h3>
      <p className="mt-2 text-sm leading-6 text-stone-500">{detail}</p>
      <div className="mt-5 flex items-center gap-2 text-xs text-stone-700">
        <ShieldCheck className="size-3.5" aria-hidden="true" />
        No simulated results
      </div>
    </article>
  );
}
