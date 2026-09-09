import * as React from 'react';
import * as RechartsPrimitive from 'recharts';

import { cn } from '@/lib/utils';

export type ChartConfig = Record<
  string,
  { label?: React.ReactNode; color?: string }
>;

const ChartContext = React.createContext<ChartConfig>({});

export function ChartContainer({
  config,
  className,
  children,
  ...props
}: React.ComponentProps<'div'> & {
  config: ChartConfig;
  children: React.ComponentProps<
    typeof RechartsPrimitive.ResponsiveContainer
  >['children'];
}) {
  const style = Object.fromEntries(
    Object.entries(config).flatMap(([key, item]) =>
      item.color ? [[`--color-${key}`, item.color]] : []
    )
  ) as React.CSSProperties;

  return (
    <ChartContext.Provider value={config}>
      <div
        data-slot="chart"
        className={cn(
          "[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-hidden [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border flex aspect-video justify-center text-xs [&_.recharts-sector]:outline-hidden [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-surface]:outline-hidden",
          className
        )}
        style={style}
        {...props}
      >
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

export const ChartTooltip = RechartsPrimitive.Tooltip;

type TooltipItem = {
  readonly dataKey?: string | number;
  readonly value?: string | number;
  readonly color?: string;
};

export function ChartTooltipContent({
  active,
  label,
  payload,
  className,
  valueFormatter = value => `${value}%`
}: {
  active?: boolean;
  label?: string | number;
  payload?: readonly TooltipItem[];
  className?: string;
  valueFormatter?: (value: string | number) => React.ReactNode;
}) {
  const config = React.useContext(ChartContext);
  if (!active || !payload?.length) return null;

  return (
    <div
      className={cn(
        'grid min-w-32 gap-1.5 rounded-lg border border-border/50 bg-background px-3 py-2 text-xs shadow-xl',
        className
      )}
    >
      <p className="font-medium text-foreground">Day {label}</p>
      {payload.map(item => {
        const key = String(item.dataKey ?? 'value');
        return (
          <div key={key} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-muted-foreground">
              <span
                className="size-2 rounded-sm"
                style={{ backgroundColor: item.color }}
              />
              {config[key]?.label ?? key}
            </span>
            <span className="font-mono font-medium text-foreground">
              {item.value === undefined ? 'N/A' : valueFormatter(item.value)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
