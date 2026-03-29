"use client";

import { useEffect, useState } from "react";

export interface GlassToastProps {
  message: string;
  duration?: number;
  onDone?: () => void;
}

export function GlassToast({ message, duration = 3000, onDone }: GlassToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // rAF so the enter transition fires after mount
    const frame = requestAnimationFrame(() => setVisible(true));
    const hide = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDone?.(), 300);
    }, duration);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(hide);
    };
  }, [duration, onDone]);

  return (
    <div
      className={`fixed top-6 right-6 z-[10000] transition-all duration-300 ease-out pointer-events-none ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="bg-white border border-white/50 shadow-md rounded-xl px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
        {message}
      </div>
    </div>
  );
}
