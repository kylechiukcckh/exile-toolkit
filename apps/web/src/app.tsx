import { isHealthReport } from '@exile-toolkit/contracts';
import { workspaceManifest } from '@exile-toolkit/data';
import {
  Activity,
  ArrowRight,
  Boxes,
  CircleDotDashed,
  Layers3,
  ShieldCheck
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';

type ServiceState = 'checking' | 'available' | 'unavailable';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api';

function useServiceState(): ServiceState {
  const [state, setState] = useState<ServiceState>('checking');

  useEffect(() => {
    const controller = new AbortController();

    async function checkService() {
      try {
        const response = await fetch(`${apiBaseUrl}/health`, {
          headers: { accept: 'application/json' },
          signal: controller.signal
        });
        const report: unknown = await response.json();

        if (!response.ok || !isHealthReport(report)) {
          throw new Error('The health response was invalid');
        }

        setState('available');
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          setState('unavailable');
        }
      }
    }

    void checkService();
    return () => controller.abort();
  }, []);

  return state;
}

const serviceLabels: Record<ServiceState, string> = {
  checking: 'Checking service',
  available: 'Service available',
  unavailable: 'Service unavailable'
};

export function App() {
  const serviceState = useServiceState();

  function showRoadmap() {
    document.getElementById('roadmap')?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <div className="min-h-screen overflow-hidden bg-background text-foreground">
      <div className="ambient-glow" aria-hidden="true" />
      <header className="relative z-10 border-b border-white/8 bg-background/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <a
            className="flex items-center gap-3"
            href="/"
            aria-label="Exile Toolkit home"
          >
            <span className="grid size-9 place-items-center rounded-lg border border-amber-400/25 bg-amber-400/10 text-amber-300 shadow-[0_0_30px_rgba(245,158,11,0.08)]">
              <Layers3 className="size-4" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-sm font-semibold tracking-wide text-stone-100">
                Exile Toolkit
              </span>
              <span className="block text-[10px] uppercase tracking-[0.22em] text-stone-500">
                Trade workspace
              </span>
            </span>
          </a>

          <div
            className="flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.025] px-3 py-1.5 text-xs text-stone-400"
            role="status"
            aria-live="polite"
          >
            <span
              className={`status-dot status-dot--${serviceState}`}
              aria-hidden="true"
            />
            {serviceLabels[serviceState]}
          </div>
        </div>
      </header>

      <main className="relative z-10">
        <section className="mx-auto grid min-h-[calc(100vh-73px)] max-w-7xl items-center gap-14 px-5 py-20 sm:px-8 lg:grid-cols-[1.18fr_0.82fr] lg:py-24">
          <div>
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-amber-300/15 bg-amber-300/[0.06] px-3 py-1.5 text-xs font-medium text-amber-200/80">
              <CircleDotDashed className="size-3.5" aria-hidden="true" />
              {workspaceManifest.game} · Current challenge league
            </div>
            <h1 className="max-w-3xl text-balance text-5xl font-semibold leading-[0.98] tracking-[-0.045em] text-stone-50 sm:text-6xl lg:text-7xl">
              {workspaceManifest.name}
            </h1>
            <p className="mt-6 max-w-2xl text-pretty text-lg leading-8 text-stone-400 sm:text-xl">
              One focused workspace for the trade-league checks that usually
              scatter across a dozen tabs.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Button
                size="lg"
                onClick={showRoadmap}
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

          <div className="relative">
            <div
              className="absolute -inset-8 rounded-full bg-amber-500/[0.035] blur-3xl"
              aria-hidden="true"
            />
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-stone-950/70 shadow-2xl shadow-black/40">
              <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
                <div className="flex items-center gap-2 text-sm font-medium text-stone-200">
                  <Activity
                    className="size-4 text-emerald-400"
                    aria-hidden="true"
                  />
                  Workspace health
                </div>
                <span className="rounded bg-white/5 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-stone-500">
                  Preview
                </span>
              </div>
              <dl className="divide-y divide-white/6 px-5">
                <HealthRow label="Web shell" value="Ready" tone="good" />
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
                  value="Configured in the next ticket"
                  tone="muted"
                />
              </dl>
            </div>
          </div>
        </section>

        <section
          id="roadmap"
          className="border-t border-white/8 bg-black/15 px-5 py-20 sm:px-8"
        >
          <div className="mx-auto max-w-7xl">
            <div className="mb-10 flex max-w-2xl items-start gap-4">
              <span className="mt-1 grid size-9 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.035] text-stone-400">
                <Boxes className="size-4" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-amber-300/70">
                  Foundation
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-100">
                  A small shell with firm boundaries
                </h2>
                <p className="mt-3 leading-7 text-stone-500">
                  Parsing and calculation stay independent of the interface. The
                  Worker owns upstream access. Every future tool enters through
                  the same tested workspace.
                </p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <RoadmapCard
                title="Regex generator"
                detail="Maps and map modifiers first"
                state="Next"
              />
              <RoadmapCard
                title="Economy tools"
                detail="Cached, sourced market snapshots"
                state="Planned"
              />
              <RoadmapCard
                title="Data provenance"
                detail="Versioned and reviewable records"
                state="Built in"
              />
            </div>
          </div>
        </section>
      </main>
    </div>
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

function RoadmapCard({
  title,
  detail,
  state
}: {
  title: string;
  detail: string;
  state: string;
}) {
  return (
    <article className="rounded-xl border border-white/8 bg-white/[0.025] p-5 transition-colors hover:border-white/15 hover:bg-white/[0.04]">
      <div className="mb-8 flex items-center justify-between">
        <ShieldCheck className="size-4 text-stone-600" aria-hidden="true" />
        <span className="text-[10px] font-medium uppercase tracking-widest text-stone-600">
          {state}
        </span>
      </div>
      <h3 className="font-medium text-stone-200">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-stone-500">{detail}</p>
    </article>
  );
}
