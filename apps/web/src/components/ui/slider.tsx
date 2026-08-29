import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';

import { cn } from '@/lib/utils';

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root>) {
  const values = React.useMemo(
    () =>
      Array.isArray(value)
        ? value
        : Array.isArray(defaultValue)
          ? defaultValue
          : [min, max],
    [defaultValue, max, min, value]
  );

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      min={min}
      max={max}
      {...(defaultValue === undefined ? {} : { defaultValue })}
      {...(value === undefined ? {} : { value })}
      className={cn(
        'relative flex w-full touch-none items-center select-none data-[disabled]:opacity-50',
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className="relative my-1 h-2 w-full grow overflow-hidden rounded-full bg-stone-800"
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className="absolute h-full bg-amber-500"
        />
      </SliderPrimitive.Track>
      {values.map((_, index) => (
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          key={index}
          aria-label={props['aria-label']}
          aria-labelledby={props['aria-labelledby']}
          className="block size-6 shrink-0 rounded-full border border-amber-400 bg-stone-950 shadow-sm outline-none transition-shadow hover:ring-4 hover:ring-amber-300/15 focus-visible:ring-4 focus-visible:ring-amber-300/25 disabled:pointer-events-none disabled:opacity-50"
        />
      ))}
    </SliderPrimitive.Root>
  );
}

export { Slider };
