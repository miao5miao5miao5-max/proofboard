import { useCallback } from "react";

/**
 * Returns a click handler that spawns a Material Design ink-ripple at the
 * exact cursor position inside any `relative overflow-hidden` element.
 *
 * Usage:
 *   const ripple = useRipple();
 *   <button className="relative overflow-hidden" onClick={ripple}>…</button>
 */
export function useRipple() {
  const createRipple = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const size = Math.max(el.offsetWidth, el.offsetHeight);

    const span = document.createElement("span");
    span.className = "ripple-effect";
    span.style.width = `${size}px`;
    span.style.height = `${size}px`;
    span.style.left = `${e.clientX - rect.left}px`;
    span.style.top = `${e.clientY - rect.top}px`;

    el.appendChild(span);
    // Remove after animation completes (500ms) + small buffer
    setTimeout(() => span.remove(), 620);
  }, []);

  return createRipple;
}
