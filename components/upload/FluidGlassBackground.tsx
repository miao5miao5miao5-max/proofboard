"use client";

export function FluidGlassBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden"
      style={{ zIndex: 0 }}
    >
      <div className="absolute inset-0 bg-[#f4f6f9]" />

      <div className="canvas-container">
        <div className="ink-blob ink-blue" />
        <div className="ink-blob ink-red" />
        <div className="ink-blob ink-yellow" />
        <div className="ink-blob ink-green" />
      </div>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.42),transparent_42%)]" />
      <div className="pointer-events-none absolute inset-[-8%] bg-white/10 backdrop-blur-[120px] [mask-image:radial-gradient(circle_at_center,black,transparent_72%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.28),rgba(255,255,255,0)_45%,rgba(255,255,255,0.18)_100%)]" />
    </div>
  );
}
