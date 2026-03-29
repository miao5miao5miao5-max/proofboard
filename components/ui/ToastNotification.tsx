"use client";

import { useEffect, useState } from "react";

export interface ToastNotificationProps {
  message: string;
  /** Auto-dismiss after this many ms (default 2000) */
  duration?: number;
  onDone?: () => void;
}

export function ToastNotification({
  message,
  duration = 2000,
  onDone,
}: ToastNotificationProps) {
  const [phase, setPhase] = useState<"in" | "visible" | "out">("in");

  useEffect(() => {
    // Small rAF so the "in" class is applied after mount
    const rAF = requestAnimationFrame(() => setPhase("visible"));

    const hideTimer = setTimeout(() => {
      setPhase("out");
      setTimeout(() => onDone?.(), 320);
    }, duration);

    return () => {
      cancelAnimationFrame(rAF);
      clearTimeout(hideTimer);
    };
  }, [duration, onDone]);

  return (
    <div
      className={`fixed top-6 left-1/2 pointer-events-none ${
        phase === "in"  ? "toast-in"  :
        phase === "out" ? "toast-out" : ""
      }`}
      style={{ zIndex: 10000 }}
      role="status"
      aria-live="polite"
    >
      <div
        className="bg-[#111118] text-white rounded-full px-5 py-2.5 text-sm font-semibold shadow-lg whitespace-nowrap"
        style={{ transform: "translateX(-50%)" }}
      >
        {message}
      </div>
    </div>
  );
}
