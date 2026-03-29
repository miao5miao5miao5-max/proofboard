"use client";

export interface PaginationBarProps {
  current: number;
  total: number;
}

export function PaginationBar({ current, total }: PaginationBarProps) {
  return (
    <div className="flex items-center justify-center gap-2">
      <span className="text-label-md text-outline mr-2">
        {String(current).padStart(2, "0")}/{String(total).padStart(2, "0")}
      </span>
      {Array.from({ length: total }, (_, i) => {
        const step = i + 1;
        let bgColor = "bg-surface-container-high"; // remaining
        if (step < current) {
          bgColor = "bg-secondary"; // completed
        } else if (step === current) {
          bgColor = "bg-primary"; // current
        }
        return (
          <div
            key={step}
            className={`w-8 h-1 rounded-full transition-colors ${bgColor}`}
          />
        );
      })}
    </div>
  );
}
