"use client";

interface GlassStatePanelProps {
  icon: string;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}

export function GlassStatePanel({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: GlassStatePanelProps) {
  return (
    <div className="glass-panel-base glass-panel-float relative overflow-hidden rounded-[32px] px-10 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.42),transparent_42%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-white/75" />
      <div className="pointer-events-none absolute inset-y-[-20%] left-[-18%] w-[38%] rotate-12 bg-[linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,0.3),rgba(255,255,255,0))] opacity-70 glass-sheen" />

      <div className="relative z-10 flex max-w-xl flex-col items-center text-center">
        <div className="glass-pill-elevated mb-5 flex h-16 w-16 items-center justify-center rounded-[22px]">
          <span className="material-symbols-outlined text-[34px] text-primary">
            {icon}
          </span>
        </div>

        <h2 className="text-headline-lg text-on-surface">{title}</h2>
        <p className="mt-3 max-w-md text-body-md leading-7 text-on-surface-variant">
          {description}
        </p>

        <button
          onClick={onAction}
          className="glass-btn-primary mt-7 rounded-full px-6 py-3 text-body-md font-semibold text-[#1a2433] transition-all duration-200"
        >
          {actionLabel}
        </button>
      </div>
    </div>
  );
}
