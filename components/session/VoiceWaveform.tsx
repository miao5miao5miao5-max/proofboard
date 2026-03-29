"use client";

export interface VoiceWaveformProps {
  amplitudes: number[];
  isActive: boolean;
}

export function VoiceWaveform({ amplitudes, isActive }: VoiceWaveformProps) {
  // Default amplitudes if none provided
  const displayAmplitudes =
    amplitudes.length > 0 ? amplitudes : [0.3, 0.5, 0.8, 1, 0.7, 0.4, 0.6, 0.9, 0.5, 0.3];

  return (
    <div className="flex items-center justify-center gap-1 h-12">
      {displayAmplitudes.map((amplitude, index) => (
        <div
          key={index}
          className={`
            w-1 rounded-full transition-all duration-150
            ${isActive ? "bg-primary" : "bg-outline-variant"}
          `}
          style={{
            height: `${amplitude * 48}px`,
            animation: isActive
              ? `waveform ${0.8 + index * 0.1}s ease-in-out infinite`
              : "none",
            animationDelay: `${index * 0.05}s`,
          }}
        />
      ))}
    </div>
  );
}
