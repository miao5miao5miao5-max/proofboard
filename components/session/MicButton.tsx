"use client";

import { cn } from "@/lib/utils";

export interface MicButtonProps {
  isListening: boolean;
  onToggle: () => void;
}

export function MicButton({ isListening, onToggle }: MicButtonProps) {
  return (
    <div className="relative">
      {/* Animated ping backdrop (existing behaviour) */}
      {isListening && (
        <div
          className="absolute inset-0 rounded-full bg-error opacity-20 animate-ping pointer-events-none"
          aria-hidden="true"
        />
      )}

      {/* Main button */}
      <button
        onClick={onToggle}
        className={cn(
          "btn-scale relative flex h-24 w-24 items-center justify-center rounded-full transition-all duration-200",
          isListening
            ? "glass-btn-primary-live mic-ring-pulse"
            : "glass-btn-primary"
        )}
        aria-label={isListening ? "Stop recording" : "Start recording"}
      >
        <span
          className={`
            material-symbols-outlined text-[34px]
            ${isListening ? "text-white" : "text-primary"}
          `}
          style={{
            fontVariationSettings: isListening ? "'FILL' 1" : "'FILL' 0",
          }}
        >
          {isListening ? "mic" : "mic_none"}
        </span>
      </button>
    </div>
  );
}
