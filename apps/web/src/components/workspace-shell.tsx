import { isHealthReport } from '@exile-toolkit/contracts';
import { mapDataset, workspaceManifest } from '@exile-toolkit/data';
import {
  BookOpenText,
  Database,
  FileBadge,
  House,
  Info,
  Layers3,
  Menu,
  ScrollText,
  Shield,
  X
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

type ServiceState = 'checking' | 'available' | 'unavailable';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api';

const serviceLabels: Record<ServiceState, string> = {
  checking: 'Checking service',
  available: 'Service available',
  unavailable: 'Service unavailable'
};

const navigation = [
  { label: 'Workspace home', shortLabel: 'Home', path: '/', icon: House },
  { label: 'Regex generator', path: '/tools/regex', icon: ScrollText },
  { label: 'About', path: '/about', icon: Info },
  { label: 'Data Sources', path: '/data-sources', icon: Database },
  { label: 'Privacy', path: '/privacy', icon: Shield },
  { label: 'License Notices', path: '/licenses', icon: FileBadge },
  {
    label: 'Non-affiliation',
    path: '/non-affiliation',
    icon: BookOpenText
  }
] as const;

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

export function WorkspaceShell() {
  const serviceState = useServiceState();
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileNavigationOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background text-foreground md:grid md:grid-cols-[16.5rem_1fr]">
      <div className="ambient-glow" aria-hidden="true" />

      <aside className="relative z-30 hidden border-r border-white/8 bg-stone-950/72 md:block">
        <div className="sticky top-0 flex h-screen flex-col px-4 py-5">
          <Brand />
          <WorkspaceNavigation className="mt-10" />
          <div className="mt-auto rounded-xl border border-white/8 bg-white/[0.025] p-3">
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-stone-600">
              Active league
            </p>
            <p className="mt-2 text-sm font-medium text-stone-300">
              Current challenge league
            </p>
            <p className="mt-1 text-xs text-stone-600">
              {workspaceManifest.game}
            </p>
          </div>
        </div>
      </aside>

      <Sheet open={mobileNavigationOpen} onOpenChange={setMobileNavigationOpen}>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="w-[min(19rem,86vw)] gap-0 border-white/10 bg-stone-950 p-5 shadow-2xl md:hidden"
        >
          <SheetTitle className="sr-only">Workspace navigation</SheetTitle>
          <div className="flex items-center justify-between">
            <Brand />
            <SheetClose asChild>
              <Button variant="ghost" size="icon" aria-label="Close navigation">
                <X aria-hidden="true" />
              </Button>
            </SheetClose>
          </div>
          <WorkspaceNavigation
            className="mt-9"
            onNavigate={() => setMobileNavigationOpen(false)}
          />
        </SheetContent>

        <div className="relative z-10 min-w-0">
          <header className="sticky top-0 z-20 border-b border-white/8 bg-background/82 backdrop-blur-xl">
            <div className="flex h-[4.5rem] items-center justify-between gap-4 px-4 sm:px-7 lg:px-10">
              <div className="flex min-w-0 items-center gap-3">
                <SheetTrigger asChild>
                  <Button
                    className="md:hidden"
                    variant="ghost"
                    size="icon"
                    aria-label="Open navigation"
                  >
                    <Menu aria-hidden="true" />
                  </Button>
                </SheetTrigger>
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium uppercase tracking-[0.16em] text-stone-600">
                    {workspaceManifest.game}
                  </p>
                  <p className="truncate text-sm font-medium text-stone-300">
                    Current challenge league
                  </p>
                </div>
              </div>

              <div
                className="grid shrink-0 grid-cols-[auto_1fr] items-center gap-x-2 rounded-xl border border-white/8 bg-white/[0.025] px-3 py-1.5 text-xs text-stone-400"
                role="status"
                aria-live="polite"
              >
                <span
                  className={`status-dot status-dot--${serviceState} row-span-2`}
                  aria-hidden="true"
                />
                <span className="hidden sm:inline">
                  {serviceLabels[serviceState]}
                </span>
                <span className="sm:hidden">
                  {serviceState === 'available'
                    ? 'Available'
                    : serviceState === 'unavailable'
                      ? 'Unavailable'
                      : 'Checking'}
                </span>
                <span className="text-[10px] text-amber-200/65">
                  <span className="sm:hidden">Map data loaded</span>
                  <span className="hidden sm:inline">
                    Map data {mapDataset.version}
                  </span>
                </span>
              </div>
            </div>
          </header>

          <main>
            <Outlet context={{ serviceState }} />
          </main>
        </div>
      </Sheet>
    </div>
  );
}

function Brand() {
  return (
    <NavLink
      className="flex items-center gap-3"
      to="/"
      aria-label="Exile Toolkit home"
    >
      <span className="grid size-9 place-items-center rounded-lg border border-amber-400/25 bg-amber-400/10 text-amber-300 shadow-[0_0_30px_rgba(245,158,11,0.08)]">
        <Layers3 className="size-4" aria-hidden="true" />
      </span>
      <span>
        <span className="block text-sm font-semibold tracking-wide text-stone-100">
          {workspaceManifest.name}
        </span>
        <span className="block text-[10px] uppercase tracking-[0.22em] text-stone-500">
          Trade workspace
        </span>
      </span>
    </NavLink>
  );
}

function WorkspaceNavigation({
  className,
  onNavigate
}: {
  className?: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className={className} aria-label="Workspace">
      <p className="px-3 text-[10px] font-medium uppercase tracking-[0.2em] text-stone-600">
        Workspace
      </p>
      <ul className="mt-3 space-y-1">
        {navigation.map(item => {
          const Icon = item.icon;
          return (
            <li key={item.path}>
              <NavLink
                to={item.path}
                end={item.path === '/'}
                aria-label={item.label}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                    isActive
                      ? 'bg-amber-300/10 text-amber-200'
                      : 'text-stone-500 hover:bg-white/[0.035] hover:text-stone-200'
                  )
                }
              >
                <Icon className="size-4" aria-hidden="true" />
                {'shortLabel' in item ? item.shortLabel : item.label}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export type WorkspaceOutletContext = {
  serviceState: ServiceState;
};

export { serviceLabels };
