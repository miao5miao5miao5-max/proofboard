"use client";

import { useEffect, useRef } from "react";

const COLORS = ["#4f8ef7", "#34d399", "#a78bfa", "#FBBC05", "#EA4335"];
const PARTICLE_COUNT = 42;
const DURATION_MS    = 1200;
const GRAVITY        = 0.22;

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  rotation: number; rotSpeed: number;
  color: string;
  w: number; h: number;
  opacity: number;
  isCircle: boolean;
}

export interface ConfettiEffectProps {
  onDone?: () => void;
}

export function ConfettiEffect({ onDone }: ConfettiEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    const cx = canvas.width  / 2;
    const cy = canvas.height / 2;

    const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, () => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 9;
      const size  = 6 + Math.random() * 8;
      return {
        x: cx, y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 5, // slight upward bias
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 12,
        color:    COLORS[Math.floor(Math.random() * COLORS.length)],
        w: size, h: size * (0.4 + Math.random() * 0.4),
        opacity: 1,
        isCircle: Math.random() > 0.55,
      };
    });

    const startTime = performance.now();
    let raf: number;

    function draw(now: number) {
      const elapsed  = now - startTime;
      const progress = Math.min(elapsed / DURATION_MS, 1);

      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);

      for (const p of particles) {
        p.vy      += GRAVITY;
        p.x       += p.vx;
        p.y       += p.vy;
        p.rotation += p.rotSpeed;
        p.opacity  = Math.max(0, 1 - progress * 1.15);

        ctx!.save();
        ctx!.globalAlpha = p.opacity;
        ctx!.translate(p.x, p.y);
        ctx!.rotate((p.rotation * Math.PI) / 180);
        ctx!.fillStyle = p.color;

        if (p.isCircle) {
          ctx!.beginPath();
          ctx!.arc(0, 0, p.w / 2, 0, Math.PI * 2);
          ctx!.fill();
        } else {
          ctx!.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        }

        ctx!.restore();
      }

      if (progress < 1) {
        raf = requestAnimationFrame(draw);
      } else {
        onDone?.();
      }
    }

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [onDone]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 9999 }}
      aria-hidden="true"
    />
  );
}
