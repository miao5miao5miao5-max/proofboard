"use client";

import { useState, useEffect } from "react";

export interface CanvasControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onCenter: () => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
}

export function CanvasControls({
  onZoomIn,
  onZoomOut,
  onCenter,
  zoom,
  onZoomChange,
}: CanvasControlsProps) {
  const [inputValue, setInputValue] = useState(String(Math.round(zoom * 100)));

  // Keep input in sync when zoom changes externally
  useEffect(() => {
    setInputValue(String(Math.round(zoom * 100)));
  }, [zoom]);

  function commitZoom() {
    const parsed = parseInt(inputValue, 10);
    if (!isNaN(parsed) && parsed >= 10 && parsed <= 200) {
      onZoomChange(parsed / 100);
    } else {
      // Reset to current zoom if invalid
      setInputValue(String(Math.round(zoom * 100)));
    }
  }

  return (
    <div className="fixed bottom-8 right-8 z-10 flex items-center gap-0.5 bg-white rounded-full px-1.5 py-1.5 shadow-ghost">
      {/* Zoom In */}
      <button
        onClick={onZoomIn}
        className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all btn-scale"
        aria-label="Zoom in"
      >
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
      </button>

      <div className="h-px w-4 bg-outline-variant/30 mx-0.5" />

      {/* Zoom Out */}
      <button
        onClick={onZoomOut}
        className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all btn-scale"
        aria-label="Zoom out"
      >
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>remove</span>
      </button>

      <div className="h-px w-4 bg-outline-variant/30 mx-0.5" />

      {/* Zoom % input */}
      <div className="flex items-center gap-0.5 px-1">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={commitZoom}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.currentTarget.blur();
            }
          }}
          className="w-[34px] text-center text-[11px] font-semibold text-on-surface bg-transparent outline-none focus:bg-surface-container-low rounded-md px-0.5 py-0.5 leading-none"
          aria-label="Zoom level"
        />
        <span className="text-[11px] font-semibold text-on-surface-variant leading-none">%</span>
      </div>

      <div className="h-px w-4 bg-outline-variant/30 mx-0.5" />

      {/* Center */}
      <button
        onClick={onCenter}
        className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all btn-scale"
        aria-label="Center view"
      >
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>center_focus_strong</span>
      </button>
    </div>
  );
}
