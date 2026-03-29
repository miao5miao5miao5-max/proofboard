"use client";

import { useState } from "react";

export interface CanvasStatsOverlayProps {
  completion: number;
  nodeCount: number;
  masteryLevel: number;
}

export function CanvasStatsOverlay({
  completion,
  nodeCount,
  masteryLevel,
}: CanvasStatsOverlayProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="absolute top-4 left-4 z-10"
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      {expanded ? (
        /* Expanded panel */
        <div className="bg-white rounded-2xl shadow-ghost p-5 min-w-[220px]">
          <h2 className="text-headline-sm text-on-surface mb-4">Canvas</h2>

          <div className="space-y-4">
            {/* Completion */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-label-md uppercase text-outline">Completion</span>
                <span className="text-label-md font-bold text-on-surface">{completion}%</span>
              </div>
              <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${completion}%` }}
                />
              </div>
            </div>

            {/* Concepts */}
            <div className="flex items-center justify-between">
              <span className="text-label-md uppercase text-outline">Concepts</span>
              <span className="text-label-md font-bold text-on-surface">{nodeCount}</span>
            </div>

            {/* Mastery */}
            <div className="flex items-center justify-between">
              <span className="text-label-md uppercase text-outline">Mastery</span>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((level) => (
                  <span
                    key={level}
                    className={`material-symbols-outlined text-base ${
                      level <= masteryLevel ? "text-warning" : "text-outline-variant"
                    }`}
                    style={{
                      fontVariationSettings: level <= masteryLevel ? "'FILL' 1" : "'FILL' 0",
                    }}
                  >
                    star
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Collapsed pill */
        <div className="h-8 px-3 bg-white rounded-full shadow-ghost flex items-center gap-2 cursor-default">
          <span className="text-label-md font-bold text-primary">{completion}%</span>
          <span className="text-outline-variant text-xs">·</span>
          <span className="text-label-md text-outline">{nodeCount} nodes</span>
          <span className="text-outline-variant text-xs">·</span>
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((level) => (
              <span
                key={level}
                className={`material-symbols-outlined text-xs ${
                  level <= masteryLevel ? "text-warning" : "text-outline-variant"
                }`}
                style={{
                  fontVariationSettings: level <= masteryLevel ? "'FILL' 1" : "'FILL' 0",
                  fontSize: "12px",
                }}
              >
                star
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
