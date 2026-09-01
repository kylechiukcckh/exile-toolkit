import { Search, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { toolCatalog } from '@/lib/tool-catalog';

export function ToolSearchDialog({
  open,
  onOpenChange
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [query, setQuery] = useState('');
  const [activeToolIndex, setActiveToolIndex] = useState(-1);
  const navigate = useNavigate();
  const filteredTools = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    return toolCatalog.filter(tool =>
      tool.name.toLocaleLowerCase().includes(normalized)
    );
  }, [query]);
  const availableTools = filteredTools.filter(tool => 'path' in tool);

  useEffect(() => {
    setActiveToolIndex(-1);
  }, [query, open]);

  function handleSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (availableTools.length === 0) return;

      event.preventDefault();
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      setActiveToolIndex(current => {
        if (current === -1) {
          return direction === 1 ? 0 : availableTools.length - 1;
        }
        return (
          (current + direction + availableTools.length) % availableTools.length
        );
      });
    } else if (event.key === 'Enter' && activeToolIndex >= 0) {
      const activeTool = availableTools[activeToolIndex];
      if (!activeTool) return;

      event.preventDefault();
      onOpenChange(false);
      void navigate(activeTool.path);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        aria-describedby="tool-search-description"
        className="top-[15vh] w-[min(36rem,calc(100%-2rem))] translate-y-0 gap-0 border-white/10 bg-stone-950 p-4 shadow-2xl sm:max-w-xl"
      >
        <DialogHeader className="flex-row items-start justify-between gap-4 text-left">
          <div>
            <DialogTitle className="font-semibold text-stone-100">
              Search Tools
            </DialogTitle>
            <DialogDescription
              id="tool-search-description"
              className="mt-1 text-sm text-stone-400"
            >
              Available Tools open directly. Roadmap Tools are identified but
              cannot open yet.
            </DialogDescription>
          </div>
          <DialogClose asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Close Tool search"
            >
              <X aria-hidden="true" />
            </Button>
          </DialogClose>
        </DialogHeader>

        <label className="relative mt-4 block">
          <span className="sr-only">Search Tools</span>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400"
            aria-hidden="true"
          />
          <input
            autoFocus
            type="search"
            aria-label="Search Tools"
            value={query}
            onChange={event => setQuery(event.target.value)}
            onKeyDown={handleSearchKeyDown}
            aria-activedescendant={
              activeToolIndex >= 0
                ? `tool-search-${availableTools[activeToolIndex]?.id}`
                : undefined
            }
            className="h-11 w-full rounded-lg border border-white/15 bg-black/30 pl-10 pr-3 text-stone-100 outline-none focus-visible:border-amber-300 focus-visible:ring-2 focus-visible:ring-amber-300/40"
          />
        </label>

        <div className="mt-3 max-h-[50vh] space-y-1 overflow-y-auto">
          {filteredTools.map(tool =>
            'path' in tool ? (
              <Link
                key={tool.name}
                id={`tool-search-${tool.id}`}
                to={tool.path}
                onClick={() => onOpenChange(false)}
                data-active={availableTools[activeToolIndex]?.id === tool.id}
                className="flex items-center justify-between rounded-lg px-3 py-3 text-sm text-stone-200 outline-none hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-amber-300 data-[active=true]:bg-white/10"
              >
                <span>{tool.name}</span>
                <span className="text-xs text-emerald-300">Available</span>
              </Link>
            ) : (
              <div
                key={tool.name}
                className="flex items-center justify-between rounded-lg px-3 py-3 text-sm text-stone-300"
              >
                <span>{tool.name}</span>
                <span className="text-xs text-stone-400">Coming later</span>
              </div>
            )
          )}
        </div>

        <dl className="mt-4 grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 border-t border-white/10 pt-3 text-xs text-stone-400">
          <dt>Open Tool search</dt>
          <dd>Ctrl or Cmd + K</dd>
          <dt>Workspace home / Regex / Disenchant</dt>
          <dd>Ctrl or Cmd + Shift + 1 / 2 / 3</dd>
          <dt>Focus Tool search / copy intended part</dt>
          <dd>/ / Ctrl or Cmd + Shift + C</dd>
        </dl>
      </DialogContent>
    </Dialog>
  );
}
