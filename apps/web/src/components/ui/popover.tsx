import * as PopoverPrimitive from '@radix-ui/react-popover';

import { cn } from '@/lib/utils';

function Popover(props: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

function PopoverTrigger(
  props: React.ComponentProps<typeof PopoverPrimitive.Trigger>
) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
}

function PopoverContent({
  className,
  align = 'center',
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        data-slot="popover-content"
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'z-50 max-h-[calc(var(--radix-popover-content-available-height)-0.5rem)] w-72 origin-(--radix-popover-content-transform-origin) overflow-y-auto rounded-md border border-white/10 bg-stone-950 p-4 text-stone-100 shadow-2xl shadow-black/60 outline-none',
          className
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
}

export { Popover, PopoverContent, PopoverTrigger };
