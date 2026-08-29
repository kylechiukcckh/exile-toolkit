import * as SelectPrimitive from '@radix-ui/react-select';
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

function Select(props: React.ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root data-slot="select" {...props} />;
}

function SelectValue(
  props: React.ComponentProps<typeof SelectPrimitive.Value>
) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />;
}

function SelectTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger>) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      className={cn(
        'flex h-9 w-fit items-center justify-between gap-2 rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm whitespace-nowrap text-stone-200 shadow-sm outline-none transition-colors hover:bg-white/[0.04] focus-visible:ring-2 focus-visible:ring-amber-300/50 disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon className="opacity-50" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

function SelectContent({
  className,
  children,
  position = 'popper',
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        position={position}
        className={cn(
          'relative z-50 max-h-(--radix-select-content-available-height) min-w-32 overflow-x-hidden overflow-y-auto rounded-md border border-white/10 bg-stone-950 text-stone-200 shadow-2xl',
          className
        )}
        {...props}
      >
        <SelectScrollButton direction="up" />
        <SelectPrimitive.Viewport className="p-1">
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollButton direction="down" />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        'relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none select-none focus:bg-amber-300/10 focus:text-amber-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className
      )}
      {...props}
    >
      <span className="absolute right-2 flex size-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="size-4 text-amber-300" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

function SelectScrollButton({ direction }: { direction: 'up' | 'down' }) {
  const Comp =
    direction === 'up'
      ? SelectPrimitive.ScrollUpButton
      : SelectPrimitive.ScrollDownButton;
  const Icon = direction === 'up' ? ChevronUpIcon : ChevronDownIcon;
  return (
    <Comp className="flex cursor-default items-center justify-center py-1">
      <Icon className="size-4" />
    </Comp>
  );
}

export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue };
