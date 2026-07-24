import type { RevenueTrend } from "../types";

interface RevenueTrendChartProps {
  trend: RevenueTrend;
}

export default function RevenueTrendChart({ trend }: RevenueTrendChartProps) {
  return (
    <section className="animate-fade-up rounded-card bg-bg-tertiary p-6 shadow-card lg:col-span-3 xl:p-8">
      <div className="flex flex-col gap-4 xs:flex-row xs:items-end xs:justify-between">
        <div>
          <h2 className="font-man text-lg font-bold text-text-primary xl:text-xl">Revenue Trends</h2>
          <p className="mt-1 text-sm text-text-primary/55">{trend.rangeLabel}</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-accent-primary" />
            <span className="text-xs font-medium text-text-primary/70">{trend.currentLabel}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-text-primary/15" />
            <span className="text-xs font-medium text-text-primary/70">{trend.previousLabel}</span>
          </div>
        </div>
      </div>

      <div className="mt-8 flex h-56 items-end justify-between gap-3 xs:gap-4 md:h-64">
        {trend.points.map((point) => (
          <div key={point.month} className="flex h-full w-full flex-col items-center justify-end gap-3">
            <div className="relative flex h-full w-full items-end justify-center gap-1">
              <div
                className="w-full rounded-full bg-text-primary/10"
                style={{ height: `${point.previousPeriodHeightPct}%` }}
                aria-hidden="true"
              />
              <div
                className="absolute bottom-0 w-full rounded-full bg-accent-primary transition-[height] duration-700 ease-out"
                style={{ height: `${point.currentPeriodHeightPct}%` }}
                title={`${point.month}: ${trend.currentLabel} ${point.currentPeriodValue.toLocaleString()}`}
              />
            </div>
            <span className="text-xs font-medium text-text-primary/50">{point.month}</span>
          </div>
        ))}
      </div>
    </section>
  );
}