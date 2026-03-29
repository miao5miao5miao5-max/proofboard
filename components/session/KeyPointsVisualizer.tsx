"use client";

import { cn } from "@/lib/utils";

interface KeyPointsVisualizerProps {
  keyPoints: string[];
  activeIndex: number;
  completedIndices: number[];
}

export function KeyPointsVisualizer({ keyPoints, activeIndex, completedIndices }: KeyPointsVisualizerProps) {
  if (keyPoints.length === 0) {
    return (
      <p className="w-full min-w-0 break-words whitespace-normal text-body-md text-outline">
        Key points will appear here once a concept is selected.
      </p>
    );
  }

  return (
    <div className="flex h-full min-w-0 flex-col">
      {/* Progress indicator */}
      <div className="mb-3 flex w-full min-w-0 shrink-0 items-center gap-2">
        <div className="flex min-w-0 flex-1 overflow-hidden rounded-full bg-surface-container-high">
          {keyPoints.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 transition-colors duration-300 ${
                completedIndices.includes(i)
                  ? "bg-secondary"
                  : i === activeIndex
                    ? "bg-blue-400 animate-pulse"
                    : "bg-outline-variant"
              }`}
            />
          ))}
        </div>
        <span className="shrink-0 text-label-sm text-outline">
          {completedIndices.length}/{keyPoints.length}
        </span>
      </div>

      {/* Key points cards - auto-driven by AI feedback */}
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pr-1">
        <div className="space-y-3">
        {keyPoints.map((point, i) => {
          const isCompleted = completedIndices.includes(i);
          const isActive = i === activeIndex && !isCompleted;

          return (
            <div
              key={i}
              className={cn(
                "relative w-full min-w-0 max-w-full rounded-[22px] p-4 transition-all duration-300",
                isCompleted
                  ? "glass-success-surface"
                  : isActive
                    ? "glass-focus-surface scale-[1.01]"
                    : "glass-panel-subtle"
              )}
            >
              {/* Connection line to next card */}
              {i < keyPoints.length - 1 && (
                <div
                  className={`
                    absolute left-8 top-full w-0.5 h-4 transition-colors duration-300
                    ${isCompleted ? "bg-secondary" : "bg-outline-variant/30"}
                  `}
                />
              )}

              {/* Header row */}
              <div className="flex items-start gap-3">
                {/* Status indicator */}
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-300",
                    isCompleted
                      ? "bg-secondary text-white [filter:drop-shadow(0_8px_16px_rgba(31,38,135,0.04))]"
                      : isActive
                        ? "bg-[linear-gradient(180deg,#4f8ef7,#2563eb)] text-white scale-110 [filter:drop-shadow(0_10px_18px_rgba(31,38,135,0.06))]"
                        : "glass-pill-elevated text-outline"
                  )}
                >
                  {isCompleted ? (
                    <span className="text-sm">✓</span>
                  ) : (
                    <span className="text-sm font-bold">{i + 1}</span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "break-words whitespace-normal text-body-md leading-relaxed transition-all duration-300",
                      isCompleted
                        ? "text-on-secondary-container"
                        : isActive
                          ? "font-medium text-slate-800"
                          : "text-on-surface"
                    )}
                  >
                    {point}
                  </p>
                </div>

                {/* Status indicator */}
                {isActive && (
                  <span className="material-symbols-outlined text-primary text-lg animate-pulse">
                    mic
                  </span>
                )}
              </div>

              {/* Active indicator */}
              {isActive && (
                <div className="mt-3 flex items-center gap-2 border-t border-blue-200/80 pt-3">
                  <div className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                  <p className="text-label-sm text-blue-600">
                    Currently explaining...
                  </p>
                </div>
              )}
            </div>
          );
        })}
        </div>
      </div>
    </div>
  );
}
