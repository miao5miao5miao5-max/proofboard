"use client";

import { useEffect, useRef, useState } from "react";

const STATUS_MESSAGES = [
  "Scanning slide structure...",
  "Extracting key concepts with AI...",
  "Analyzing diagrams and charts...",
  "Assembling your knowledge canvas...",
];

const GOOGLE_COLORS = ["#4285F4", "#EA4335", "#FBBC05", "#34A853"];

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return "0, 0, 0";
  return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
}

export function ExtractionLoader() {
  const containerRef        = useRef<HTMLDivElement>(null);
  const sourceCardRef       = useRef<HTMLDivElement>(null);
  const particleLayerRef    = useRef<HTMLDivElement>(null);

  const [statusIndex,   setStatusIndex]   = useState(0);
  const [statusVisible, setStatusVisible] = useState(true);

  // ── Status text stepper: cycle every 3s with 0.4s fade ──────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      setStatusVisible(false);
      const fadeTimer = setTimeout(() => {
        setStatusIndex((i) => (i + 1) % STATUS_MESSAGES.length);
        setStatusVisible(true);
      }, 400);
      return () => clearTimeout(fadeTimer);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // ── Particle system ──────────────────────────────────────────────────────
  useEffect(() => {
    const spawnBatch = () => {
      if (!sourceCardRef.current || !particleLayerRef.current || !containerRef.current) return;

      const sourceRect    = sourceCardRef.current.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();

      const count = 1 + Math.floor(Math.random() * 3); // 1-3 per batch

      for (let p = 0; p < count; p++) {
        // 1. Color
        const color = GOOGLE_COLORS[Math.floor(Math.random() * GOOGLE_COLORS.length)];

        // 2. Size: 4-10px
        const size = 4 + Math.random() * 6;

        // 3. Start position: right edge of source card, random Y within card height
        const startX = sourceRect.right  - containerRect.left;
        const startY = sourceRect.top    - containerRect.top
                     + Math.random()     * sourceRect.height;

        // 4. Flight path (quadratic Bezier control point)
        const deltaX     = 150 + Math.random() * 200;
        const deltaY     = -80 + Math.random() * 160;
        const peakHeight = -50 - Math.random() * 150;          // negative = upward arc
        const P1_X       = deltaX * (0.4 + Math.random() * 0.2);
        const P1_Y       = 2 * peakHeight - deltaY / 2;

        // 5. Generate 30 keyframes via quadratic Bezier formula
        const keyframes: Keyframe[] = [];
        for (let i = 0; i <= 30; i++) {
          const t    = i / 30;
          const invT = 1 - t;
          const x    = invT * invT * 0 + 2 * invT * t * P1_X + t * t * deltaX;
          const y    = invT * invT * 0 + 2 * invT * t * P1_Y + t * t * deltaY;

          // 6. Scale/opacity lifecycle (decoupled from position)
          // Max opacity capped at 0.6 to keep particles soft on the light bg
          let scale:   number;
          let opacity: number;
          if (t < 0.2) {
            const prog = t / 0.2;
            scale   = 0.5 + prog * 1.2;   // 0.5 → 1.7  (birth)
            opacity = prog * 0.6;          // 0   → 0.6
          } else if (t <= 0.8) {
            scale   = 1.7;                 // cruise
            opacity = 0.6;
          } else {
            const prog = (t - 0.8) / 0.2;
            scale   = 1.7 - prog * 1.5;   // 1.7 → 0.2  (decay)
            opacity = 0.6 * (1 - prog);    // 0.6 → 0
          }

          keyframes.push({
            transform: `translate(${x}px, ${y}px) scale(${scale})`,
            opacity,
          });
        }

        // Create DOM element
        const el = document.createElement("div");
        el.style.cssText = [
          "position:absolute",
          `left:${startX}px`,
          `top:${startY}px`,
          `width:${size}px`,
          `height:${size}px`,
          "border-radius:50%",
          `background:${color}`,
          `box-shadow:0 0 ${size * 2}px rgba(${hexToRgb(color)}, 0.35)`,
          "pointer-events:none",
          "transform-origin:center",
          "will-change:transform,opacity",
        ].join(";");
        particleLayerRef.current.appendChild(el);

        // 7. Animate via Web Animations API
        const animation = el.animate(keyframes, {
          duration: 1200 + Math.random() * 800,
          easing:   "linear",
          fill:     "forwards",
        });
        animation.onfinish = () => el.remove();
      }
    };

    const interval = setInterval(spawnBatch, 150);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Scoped animation styles */}
      <style>{`
        @keyframes extraction-scan {
          0%   { top: 0%;   }
          100% { top: 95%;  }
        }
        .extraction-scan-line {
          animation: extraction-scan 2s ease-in-out alternate infinite;
        }

        @keyframes extraction-shimmer {
          0%   { background-position:  200% 0; }
          100% { background-position: -200% 0; }
        }
        .extraction-shimmer {
          background: linear-gradient(90deg, #e8e8f0 25%, #f3f3f8 50%, #e8e8f0 75%);
          background-size: 200% 100%;
          animation: extraction-shimmer 2s infinite linear;
        }
      `}</style>

      <div
        ref={containerRef}
        className="relative bg-white border border-[#e8e8f0] rounded-2xl shadow-lg flex flex-col items-center justify-center gap-6 p-8"
        style={{ width: 480, height: 320 }}
      >
        {/* Particle layer — z-20 so particles render above the z-10 skeleton content */}
        <div
          ref={particleLayerRef}
          className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none z-20"
        />

        {/* Content row */}
        <div className="relative z-10 flex items-center gap-8 w-full">

          {/* LEFT — source document card */}
          <div
            ref={sourceCardRef}
            className="relative overflow-hidden shrink-0 rounded-lg shadow-md border-2 border-[#e8e8f0]"
            style={{
              width: 140,
              height: 180,
              background: "linear-gradient(135deg, #f5f5f0, #eaeae5)",
            }}
          >
            {/* Slide content lines */}
            <div className="flex flex-col gap-3 p-4 pt-6">
              <div className="h-2 rounded bg-[#d0d0d8]" style={{ width: "75%" }} />
              <div className="h-2 rounded bg-[#d0d0d8] w-full" />
              <div className="h-2 rounded bg-[#d0d0d8]" style={{ width: "83%" }} />
            </div>

            {/* Scanning line */}
            <div
              className="extraction-scan-line absolute left-0 right-0"
              style={{
                height: 2,
                background: "#4f8ef7",
                boxShadow: "0 0 12px 3px rgba(79,142,247,0.5)",
              }}
            />
          </div>

          {/* RIGHT — skeleton knowledge card */}
          <div className="flex flex-col gap-3 flex-1">
            {/* Title line — taller */}
            <div className="extraction-shimmer rounded-lg" style={{ height: 22, width: "70%" }} />
            {/* Full-width body line */}
            <div className="extraction-shimmer rounded-lg h-3 w-full" />
            {/* Medium body line */}
            <div className="extraction-shimmer rounded-lg h-3" style={{ width: "85%" }} />
            {/* Short body line */}
            <div className="extraction-shimmer rounded-lg h-3" style={{ width: "50%" }} />
          </div>
        </div>

        {/* BOTTOM — cycling status text */}
        <p
          className="relative z-10 text-[#5a5c70] text-sm font-medium tracking-wide"
          style={{
            opacity:    statusVisible ? 1 : 0,
            transition: "opacity 0.4s ease",
          }}
        >
          {STATUS_MESSAGES[statusIndex]}
        </p>
      </div>
    </>
  );
}
