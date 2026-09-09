import type { HomeFeedSnapshot } from '@exile-toolkit/contracts';
import { ArrowUpRight, Bug, CalendarDays } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export function PatchNotesSection({
  patch
}: {
  patch: HomeFeedSnapshot['patch'];
}) {
  return (
    <section
      id="patch-notes"
      className="border-b border-white/8 bg-black/15 px-5 py-16 sm:px-8 lg:px-12"
    >
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-14">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <Badge className="bg-amber-300 text-stone-950 hover:bg-amber-300">
              {patch.version}
            </Badge>
            <span className="flex items-center gap-2 text-sm text-stone-500">
              <CalendarDays className="size-4" aria-hidden="true" />
              {formatDate(patch.publishedAt)}
            </span>
          </div>
          <h2 className="mt-5 text-3xl font-semibold tracking-tight text-stone-100">
            Latest patch notes
          </h2>
          <p className="mt-3 max-w-2xl leading-7 text-stone-500">
            The newest notes published by Grinding Gear Games.
          </p>
          <div className="mt-8 rounded-xl border border-white/8 bg-white/[0.025]">
            {patch.changes.map((change, index) => (
              <div key={change}>
                <div className="flex gap-4 p-5 sm:p-6">
                  <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-amber-300/[0.07] text-amber-300">
                    <Bug className="size-4" aria-hidden="true" />
                  </span>
                  <p className="text-sm leading-6 text-stone-300">{change}</p>
                </div>
                {index < patch.changes.length - 1 ? <Separator /> : null}
              </div>
            ))}
          </div>
        </div>
        <aside className="h-fit rounded-xl border border-amber-300/10 bg-amber-300/[0.035] p-6">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-amber-300/70">
            Official source
          </p>
          <p className="mt-3 text-sm leading-6 text-stone-400">
            Read the complete notes and follow-up discussion on the Path of
            Exile forum.
          </p>
          <Button asChild variant="outline" className="mt-5 w-full">
            <a href={patch.url} target="_blank" rel="noreferrer">
              Open full patch notes <ArrowUpRight aria-hidden="true" />
            </a>
          </Button>
        </aside>
      </div>
    </section>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date(value));
}
