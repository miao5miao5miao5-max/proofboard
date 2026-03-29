"use client";

export function AmbientGlows() {
  return (
    <div aria-hidden="true" className="pointer-events-none">
      <div className="ambient-glow ambient-glow-primary" />
      <div className="ambient-glow ambient-glow-warning" />
      <div className="ambient-glow ambient-glow-secondary" />
      <div className="ambient-glow ambient-glow-tertiary" />
    </div>
  );
}
