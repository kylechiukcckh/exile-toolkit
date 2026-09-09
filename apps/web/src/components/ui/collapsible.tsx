import * as CollapsiblePrimitive from '@radix-ui/react-collapsible';
import * as React from 'react';

import { cn } from '@/lib/utils';

export const Collapsible = CollapsiblePrimitive.Root;
export const CollapsibleTrigger = CollapsiblePrimitive.Trigger;

export function CollapsibleContent({
  className,
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.Content>) {
  return (
    <CollapsiblePrimitive.Content
      className={cn('collapsible-content overflow-hidden', className)}
      {...props}
    />
  );
}
