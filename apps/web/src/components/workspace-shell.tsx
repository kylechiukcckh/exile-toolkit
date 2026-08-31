import { isHealthReport, type AnalyticsPageId } from '@exile-toolkit/contracts';
import { workspaceManifest } from '@exile-toolkit/data';
import { workspaceLeagues, type WorkspaceLeague } from '@exile-toolkit/domain';
import {
  BookOpenText,
  Database,
  FileBadge,
  Gem,
  House,
  Info,
  Layers3,
  Menu,
  Rows3,
  ScrollText,
  Search,
  Shield,
  Sprout,
  Sun,
  Trash2,
  X
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';

import { ToolSearchDialog } from '@/components/tool-search-dialog';
import {
  AlertDialog,
  AlertDialogActionButton,
  AlertDialogCancelButton,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet';
import {
  useWorkspaceLocalState,
  type WorkspaceLocalController
} from '@/hooks/use-workspace-local-state';
import { analytics } from '@/lib/analytics';
import { apiBaseUrl } from '@/lib/api-config';
import { cn } from '@/lib/utils';

type ServiceState = 'checking' | 'available' | 'unavailable';

const serviceLabels: Record<ServiceState, string> = {
  checking: 'Checking service',
  available: 'Service available',
  unavailable: 'Service unavailable'
};

const navigation = [
  { label: 'Workspace home', shortLabel: 'Home', path: '/', icon: House },
  { label: 'Regex generator', path: '/tools/regex', icon: ScrollText },
  { label: 'Disenchant calculator', path: '/tools/disenchant', icon: Gem },
  {
    label: 'Crop Rotation calculator',
    path: '/tools/crop-rotation',
    icon: Sprout
  },
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
  const workspace = useWorkspaceLocalState();
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);
  const [toolSearchOpen, setToolSearchOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setMobileNavigationOpen(false);
    const pageId = pageIdForPath(location.pathname);
    analytics.recordPage(pageId);
    if (pageId === 'regex') analytics.recordTool('regex');
    if (pageId === 'disenchant') analytics.recordTool('disenchant');
    if (pageId === 'crop-rotation') analytics.recordTool('crop-rotation');
  }, [location.pathname]);

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if (isEditableTarget(event.target)) return;

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setToolSearchOpen(true);
      } else if (
        (event.ctrlKey || event.metaKey) &&
        event.shiftKey &&
        event.key === '1'
      ) {
        event.preventDefault();
        void navigate('/');
      } else if (
        (event.ctrlKey || event.metaKey) &&
        event.shiftKey &&
        event.key === '2'
      ) {
        event.preventDefault();
        void navigate('/tools/regex');
      } else if (
        (event.ctrlKey || event.metaKey) &&
        event.shiftKey &&
        event.key === '3'
      ) {
        event.preventDefault();
        void navigate('/tools/disenchant');
      } else if (event.key === '/' && location.pathname === '/tools/regex') {
        event.preventDefault();
        document.querySelector<HTMLElement>('[data-tool-search]')?.focus();
      } else if (
        (event.ctrlKey || event.metaKey) &&
        event.shiftKey &&
        event.key.toLowerCase() === 'c'
      ) {
        event.preventDefault();
        window.dispatchEvent(new Event('exile-toolkit:copy-regex'));
      }
    }

    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [location.pathname, navigate]);

  return (
    <div className="min-h-screen bg-background text-foreground md:grid md:grid-cols-[16.5rem_1fr]">
      <div className="ambient-glow" aria-hidden="true" />

      <aside className="relative z-30 hidden border-r border-white/8 bg-stone-950/72 md:block">
        <div className="sticky top-0 flex h-screen flex-col px-4 py-5">
          <Brand />
          <WorkspaceNavigation className="mt-10" />
          <WorkspacePreferences workspace={workspace} />
          <p className="mt-auto px-3 text-xs text-stone-600">
            {workspaceManifest.game}
          </p>
        </div>
      </aside>

      <Sheet open={mobileNavigationOpen} onOpenChange={setMobileNavigationOpen}>
        <ToolSearchDialog
          open={toolSearchOpen}
          onOpenChange={setToolSearchOpen}
        />
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
          <WorkspacePreferences workspace={workspace} />
        </SheetContent>

        <div className="relative z-10 min-w-0">
          <header className="sticky top-0 z-20 border-b border-white/8 bg-background/82 backdrop-blur-xl">
            <div className="grid h-[4.5rem] grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 sm:px-7 lg:px-10">
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
                <GlobalLeagueControl workspace={workspace} />
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setToolSearchOpen(true)}
                aria-label="Search Tools"
                className="hidden sm:inline-flex"
              >
                <Search aria-hidden="true" />
                Search Tools
                <kbd className="rounded border border-white/10 px-1.5 py-0.5 text-[10px] text-stone-400">
                  Ctrl K
                </kbd>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setToolSearchOpen(true)}
                aria-label="Search Tools"
                className="sm:hidden"
              >
                <Search aria-hidden="true" />
              </Button>
              <div className="flex min-w-0 items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    workspace.setTheme(
                      workspace.state.theme === 'dark' ? 'system' : 'dark'
                    )
                  }
                  aria-label="Toggle theme"
                  title={`Theme: ${workspace.state.theme === 'dark' ? 'Dark' : 'System'}`}
                >
                  <Sun aria-hidden="true" />
                </Button>
              </div>
            </div>
          </header>

          <main>
            <Outlet context={{ serviceState, workspace }} />
          </main>
        </div>
      </Sheet>
    </div>
  );
}

function WorkspacePreferences({
  workspace
}: {
  workspace: WorkspaceLocalController;
}) {
  return (
    <section className="mt-8 rounded-xl border border-white/8 bg-white/[0.025] p-3">
      <h2 className="text-[10px] font-medium uppercase tracking-[0.18em] text-stone-600">
        Local workspace
      </h2>
      <div className="mt-3 grid grid-cols-1 gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() =>
            workspace.setDensity(
              workspace.state.density === 'compact' ? 'comfortable' : 'compact'
            )
          }
          aria-label="Toggle density"
        >
          <Rows3 aria-hidden="true" />
          {workspace.state.density === 'compact' ? 'Compact' : 'Comfortable'}
        </Button>
      </div>
      {workspace.issues.length > 0 ? (
        <p role="alert" className="mt-3 text-xs leading-5 text-amber-200/70">
          {workspace.issues.join(' ')}
        </p>
      ) : null}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-2 w-full text-stone-500"
          >
            <Trash2 aria-hidden="true" />
            Clear local data
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogTitle>Clear local data</AlertDialogTitle>
          <AlertDialogDescription>
            Removes preferences, favorites, Tool setups, history, presets,
            Custom entries, and Saved calculations. Curated entries stay
            available.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancelButton>Cancel</AlertDialogCancelButton>
            <AlertDialogActionButton onClick={workspace.clearLocalData}>
              Confirm clear
            </AlertDialogActionButton>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

function GlobalLeagueControl({
  workspace
}: {
  workspace: WorkspaceLocalController;
}) {
  return (
    <label className="min-w-0">
      <span className="sr-only">Active league</span>
      <select
        aria-label="Active league"
        className="h-9 max-w-[10.5rem] rounded-md border border-white/10 bg-black/20 px-2 text-sm font-medium text-stone-200 outline-none sm:max-w-none"
        value={workspace.state.activeLeague}
        onChange={event =>
          workspace.setActiveLeague(event.target.value as WorkspaceLeague)
        }
      >
        {workspaceLeagues.map(league => (
          <option key={league} value={league}>
            {league}
          </option>
        ))}
      </select>
    </label>
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
  workspace: WorkspaceLocalController;
};

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  if (
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  ) {
    return true;
  }
  return target instanceof HTMLInputElement && !target.readOnly;
}

function pageIdForPath(pathname: string): AnalyticsPageId {
  const pageIds = {
    '/': 'home',
    '/tools/regex': 'regex',
    '/tools/disenchant': 'disenchant',
    '/tools/crop-rotation': 'crop-rotation',
    '/about': 'about',
    '/data-sources': 'data-sources',
    '/privacy': 'privacy',
    '/licenses': 'licenses',
    '/non-affiliation': 'non-affiliation'
  } as const satisfies Record<string, AnalyticsPageId>;
  return pageIds[pathname as keyof typeof pageIds] ?? 'not-found';
}

export { serviceLabels };
