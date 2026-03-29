"use client";

import { useEffect, useRef } from "react";

interface MagneticDotGridProps {
  zoom?: number;
}

// ─── Constants ──────────────────────────────────────────────────────────────
const DOT_SPACING     = 30;
const INFLUENCE_RADIUS_BASE = 120;
const DEFAULT_RADIUS   = 1;
const MAX_RADIUS       = 4;
const MAX_REPEL_OFFSET = 4;
const LERP_FACTOR      = 0.12;

// Default dot color: near-white, very low alpha to keep the grid airy.
const DR = 255, DG = 255, DB = 255, DA = 0.18;
// Accent color: cool environment blue, slightly more visible on interaction.
const AR = 167, AG = 205, AB = 255, AA = 0.38;

// ─── Types ───────────────────────────────────────────────────────────────────
interface Dot {
  bx: number; by: number;      // base (grid) position
  r: number;                   // current radius
  ox: number; oy: number;      // current offset (repel)
  cr: number; cg: number; cb: number; ca: number; // current colour channels
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// ─── Component ───────────────────────────────────────────────────────────────
/**
 * Full-coverage HTML5 Canvas dot grid that magnetically reacts to the cursor.
 * Uses window-level mousemove so it works even when the cursor is over React
 * Flow nodes (which capture their own pointer events).
 */
export function MagneticDotGrid({ zoom = 1 }: MagneticDotGridProps) {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef     = useRef<{ x: number; y: number } | null>(null);
  const dotsRef      = useRef<Dot[]>([]);
  const rafRef       = useRef<number | null>(null);
  const zoomRef      = useRef(zoom);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // ── Build dot grid ──────────────────────────────────
    function buildGrid() {
      const w = canvas!.width;
      const h = canvas!.height;

      // Start half a spacing in so dots are centred in the cell
      const offsetX = (w % DOT_SPACING) / 2;
      const offsetY = (h % DOT_SPACING) / 2;

      const dots: Dot[] = [];
      for (let y = offsetY; y < h + DOT_SPACING; y += DOT_SPACING) {
        for (let x = offsetX; x < w + DOT_SPACING; x += DOT_SPACING) {
          dots.push({
            bx: x, by: y,
            r: DEFAULT_RADIUS,
            ox: 0, oy: 0,
            cr: DR, cg: DG, cb: DB, ca: DA,
          });
        }
      }
      dotsRef.current = dots;
    }

    // ── Resize handler ──────────────────────────────────
    function resize() {
      const rect = container!.getBoundingClientRect();
      canvas!.width  = rect.width;
      canvas!.height = rect.height;
      buildGrid();
    }

    resize();

    // ── Animation loop ──────────────────────────────────
    function animate() {
      const mouse = mouseRef.current;
      const currentZoom = zoomRef.current;
      const influenceRadius = INFLUENCE_RADIUS_BASE * currentZoom;
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);

      for (const dot of dotsRef.current) {
        let targetR   = DEFAULT_RADIUS;
        let targetOX  = 0;
        let targetOY  = 0;
        let targetCR  = DR;
        let targetCG  = DG;
        let targetCB  = DB;
        let targetCA  = DA;

        if (mouse) {
          const dx = dot.bx - mouse.x;
          const dy = dot.by - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < influenceRadius) {
            const influence = 1 - dist / influenceRadius; // [0,1]

            // Radius growth
            targetR = DEFAULT_RADIUS + influence * (MAX_RADIUS - DEFAULT_RADIUS);

            // Repel offset (push dot away from cursor)
            if (dist > 0.01) {
              const nx = dx / dist;
              const ny = dy / dist;
              targetOX = nx * influence * MAX_REPEL_OFFSET;
              targetOY = ny * influence * MAX_REPEL_OFFSET;
            }

            // Colour interpolation
            targetCR = lerp(DR, AR, influence);
            targetCG = lerp(DG, AG, influence);
            targetCB = lerp(DB, AB, influence);
            targetCA = lerp(DA, AA, influence);
          }
        }

        // Lerp toward targets — creates the spring-like decay
        dot.r  = lerp(dot.r,  targetR,  LERP_FACTOR);
        dot.ox = lerp(dot.ox, targetOX, LERP_FACTOR);
        dot.oy = lerp(dot.oy, targetOY, LERP_FACTOR);
        dot.cr = lerp(dot.cr, targetCR, LERP_FACTOR);
        dot.cg = lerp(dot.cg, targetCG, LERP_FACTOR);
        dot.cb = lerp(dot.cb, targetCB, LERP_FACTOR);
        dot.ca = lerp(dot.ca, targetCA, LERP_FACTOR);

        // Skip near-invisible dots for perf
        if (dot.r < 0.08) continue;

        ctx!.beginPath();
        ctx!.arc(
          dot.bx + dot.ox,
          dot.by + dot.oy,
          Math.max(0.1, dot.r),
          0,
          Math.PI * 2
        );
        ctx!.fillStyle = `rgba(${dot.cr | 0},${dot.cg | 0},${dot.cb | 0},${dot.ca.toFixed(3)})`;
        ctx!.fill();
      }

      rafRef.current = requestAnimationFrame(animate);
    }

    // ── Window-level mouse tracking ─────────────────────
    // Using window so ReactFlow's own pointer capture doesn't block us.
    function onMouseMove(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      // Only activate within canvas bounds
      if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
        mouseRef.current = { x, y };
      } else {
        mouseRef.current = null;
      }
    }

    window.addEventListener("mousemove", onMouseMove, { passive: true });

    // ── ResizeObserver ──────────────────────────────────
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("mousemove", onMouseMove);
      ro.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none"
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        style={{ display: "block", width: "100%", height: "100%" }}
      />
    </div>
  );
}
