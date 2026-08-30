import type { VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-md border px-2 py-0.5 text-xs font-semibold whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-2 focus-visible:ring-amber-300/50 [&>svg]:pointer-events-none [&>svg]:size-3',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-amber-400 text-stone-950',
        secondary: 'border-transparent bg-white/7 text-stone-300',
        destructive: 'border-transparent bg-red-500/60 text-white',
        outline: 'border-white/10 bg-stone-950 text-stone-200',
        orange: 'border-orange-900 bg-orange-950 text-orange-400',
        amber: 'border-amber-900 bg-amber-950 text-amber-400',
        yellow: 'border-yellow-900 bg-yellow-950 text-yellow-400',
        green: 'border-green-900 bg-green-950 text-green-400',
        blue: 'border-blue-900 bg-blue-950 text-blue-300',
        red: 'border-red-900 bg-red-950 text-red-400',
        purple: 'border-purple-800 bg-purple-950 text-purple-300'
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  }
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'span';

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
