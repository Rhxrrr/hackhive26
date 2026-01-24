"use client";

import { cn } from "@/lib/utils";

const SEGMENTS = 25;

export interface TunnelLoadingBarProps {
  progress: number;
  progressPrev: number;
  step: string;
  title?: string;
  subtitle?: string;
  className?: string;
}

export function TunnelLoadingBar({
  progress,
  progressPrev,
  step,
  title = "Analysis",
  subtitle = "Voice Call QA",
  className,
}: TunnelLoadingBarProps) {
  // Ease-out: fast start, slow toward 100% — reduces mechanical/fidgety feel
  const eased = 100 * (1 - Math.pow(1 - progress / 100, 2));
  const easedPrev = 100 * (1 - Math.pow(1 - progressPrev / 100, 2));
  const delta = Math.max(0, Math.round(eased - easedPrev));
  const showDelta = delta >= 3;
  const filledCount = (eased / 100) * SEGMENTS;
  const fullSegments = Math.floor(filledCount);
  const isTransition = filledCount > fullSegments && fullSegments < SEGMENTS;

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-black/90 px-6 py-6 font-mono",
        className
      )}
    >
      <div className="flex flex-col gap-3">
        <p className="text-xs text-muted-foreground">{subtitle}</p>
        <p className="text-lg font-semibold text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{step}</p>

        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold tabular-nums text-foreground">
            {Math.round(eased)}%
          </span>
          {showDelta && (
            <span className="text-xs text-muted-foreground">
              ↗ {delta}% since you last checked
            </span>
          )}
        </div>

        {/* Segmented progress bar: white (done) → light grey (transition) → dark grey (unfilled) */}
        <div className="flex gap-[2px]">
          {Array.from({ length: SEGMENTS }).map((_, i) => {
            const isFilled = i < fullSegments;
            const isLeadingEdge = i === fullSegments && isTransition;
            return (
              <div
                key={i}
                className={cn(
                  "h-2 flex-1 min-w-0 rounded-[1px] transition-colors duration-200 ease-out",
                  isFilled && "bg-foreground",
                  isLeadingEdge && "bg-foreground/50",
                  !isFilled && !isLeadingEdge && "bg-muted/30"
                )}
              />
            );
          })}
        </div>

        {/* Small thin white bar centered below the progress bar */}
        <div className="flex justify-center">
          <div className="h-0.5 w-12 rounded-full bg-foreground/60" />
        </div>
      </div>
    </div>
  );
}
