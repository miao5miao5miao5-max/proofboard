"use client";

export interface LiveTranscriptProps {
  lines: string[];
  activeLine: string;
}

export function LiveTranscript({ lines, activeLine }: LiveTranscriptProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-ghost flex-1 overflow-hidden flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-primary text-xl">
          mic
        </span>
        <h3 className="text-headline-sm text-on-surface">Live Transcript</h3>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3">
        {/* Previous lines */}
        {lines.map((line, index) => (
          <p
            key={index}
            className="text-body-md text-on-surface-variant leading-relaxed"
          >
            {line}
          </p>
        ))}

        {/* Active line with pulse animation */}
        {activeLine && (
          <p className="text-body-md text-on-surface leading-relaxed animate-pulse">
            {activeLine}
            <span className="inline-block w-0.5 h-4 bg-primary ml-1 animate-pulse" />
          </p>
        )}
      </div>
    </div>
  );
}
