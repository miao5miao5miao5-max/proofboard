"use client";

export interface WatermarkDecorProps {
  text: string;
}

export function WatermarkDecor({ text }: WatermarkDecorProps) {
  return (
    <div
      className="fixed bottom-12 right-12 text-[120px] font-black tracking-tighter text-surface-container-high/50 pointer-events-none select-none z-0"
      aria-hidden="true"
    >
      {text}
    </div>
  );
}
